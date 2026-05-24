#!/usr/bin/env python3
"""
normalize_stats.py

Left-joins every CSV in data/stats/ against area.csv (the reference),
keeping only the country-name column and the starred (*) stat column,
inserting isoCode as column 2, stripping (*) from the stat column name,
and writing results to data/stats/processed/.

A Markdown report is written to scripts/normalize_stats_output.md.

Requirements:
    pip install pandas rapidfuzz
"""

import re
from pathlib import Path
from typing import Optional

import pandas as pd
from rapidfuzz import fuzz
from rapidfuzz import process as fuzz_process

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent.parent
STATS_DIR   = ROOT / "data" / "stats"
OUT_DIR     = STATS_DIR / "processed"
REPORT_PATH = Path(__file__).resolve().parent / "normalize_stats_output.md"

FUZZY_THRESHOLD = 85  # min score (0–100) to accept a fuzzy match

# ── Files to skip entirely (multi-line cell values make them unparseable) ──────
SKIP_FILES = {
    "modify_num_languages.csv",
    "modify_timezones.csv",
    "modify_bordering_countries.csv",
}

# ── Clean files that already carry isoCode (filter by isoCode, not name) ───────
CLEAN_FILES = {
    "area.csv",
    "elevation.csv",
    "life_expectancy.csv",
    "capital_distance_from_equator.csv",
}

# ── Per-file config ────────────────────────────────────────────────────────────
# country_col : column holding the country name (after col-name whitespace strip)
# read_kwargs : extra kwargs forwarded to pd.read_csv
FILE_CONFIG: dict[str, dict] = {
    # Clean files
    "area.csv":                           {"country_col": "countryLabel"},
    "elevation.csv":                      {"country_col": "countryLabel"},
    "life_expectancy.csv":                {"country_col": "countryLabel"},
    "capital_distance_from_equator.csv":  {"country_col": "countryLabel"},
    # Modify files
    "modify_alcohol_per_capita.csv":      {"country_col": "Country"},
    # Data rows have one extra leading rank column vs the header, so index_col=0
    # makes pandas treat that rank as the index and align the named columns correctly.
    "modify_annual_rainfall.csv":         {"country_col": "Country",
                                           "read_kwargs": {"index_col": 0}},
    "modify_co2_per_capita.csv":          {"country_col": "Location"},
    "modify_coastline.csv":               {"country_col": "Location"},
    "modify_corruption_index.csv":        {"country_col": "Nation or Territory"},
    "modify_forest_coverage.csv":         {"country_col": "Location"},
    "modify_gdp.csv":                     {"country_col": "Country/Territory"},
    "modify_gdp_per_capita.csv":          {"country_col": "Country/Territory"},
    "modify_HDI.csv":                     {"country_col": "Country or territory"},
    "modify_internet_speed.csv":          {"country_col": "Country/Territory"},
    "modify_obesity_rate.csv":            {"country_col": "Country"},
    # Row 1 (0-indexed) is a sub-header row; skip it so data aligns with row-0 headers.
    "modify_olympic_medals.csv":          {"country_col": "Team",
                                           "read_kwargs": {"skiprows": [1]}},
    "modify_passport_power.csv":          {"country_col": "Passport issuing country"},
    "modify_population.csv":              {"country_col": "Location"},
    "modify_population_density.csv":      {"country_col": "Location"},
    "modify_temperature.csv":             {"country_col": "Country or region"},
}

# ── Alias map  (normalized source name → normalized area.csv name) ─────────────
# area.csv uses short/common names; Wikipedia-scraped files often use official ones.
ALIASES: dict[str, str] = {
    "china":                                      "people's republic of china",
    "united states of america":                   "united states",
    "usa":                                        "united states",
    "korea, republic of":                         "south korea",
    "korea, south":                               "south korea",
    "korea, democratic people's republic of":     "north korea",
    "korea, dem. rep.":                           "north korea",
    "dprk":                                       "north korea",
    "russian federation":                         "russia",
    "iran, islamic republic of":                  "iran",
    "syrian arab republic":                       "syria",
    "viet nam":                                   "vietnam",
    "bolivia, plurinational state of":            "bolivia",
    "tanzania, united republic of":               "tanzania",
    "czechia":                                    "czech republic",
    "congo, republic of the":                     "republic of the congo",
    "congo, dem. rep.":                           "democratic republic of the congo",
    "congo, democratic republic of the":          "democratic republic of the congo",
    "dr congo":                                   "democratic republic of the congo",
    "democratic republic of congo":               "democratic republic of the congo",
    "côte d'ivoire":                              "ivory coast",
    "cote d'ivoire":                              "ivory coast",
    "cabo verde":                                 "cape verde",
    "republic of north macedonia":                "north macedonia",
    "swaziland":                                  "eswatini",
    "kingdom of eswatini":                        "eswatini",
    "myanmar (burma)":                            "myanmar",
    "burma":                                      "myanmar",
    "lao people's democratic republic":           "laos",
    "lao pdr":                                    "laos",
    "moldova, republic of":                       "moldova",
    "republic of moldova":                        "moldova",
    "state of palestine":                         "palestine",
    "taiwan, province of china":                  "taiwan",
    "venezuela, bolivarian republic of":          "venezuela",
    "micronesia, federated states of":            "federated states of micronesia",
    "micronesia":                                 "federated states of micronesia",
    "east timor":                                 "timor-leste",
    "sao tome and principe":                      "são tomé and príncipe",
    "brunei darussalam":                          "brunei",
    "uae":                                        "united arab emirates",
    "türkiye":                                    "turkey",
    "bahamas":                                    "the bahamas",
    "bahamas, the":                               "the bahamas",
    "gambia":                                     "the gambia",
    "gambia, the":                                "the gambia",
    "gambia, republic of the":                    "the gambia",
    "netherlands":                                "kingdom of the netherlands",
    "curacao":                                    "curaçao",
    "sint maarten (dutch part)":                  "sint maarten",
    "st. vincent and the grenadines":             "saint vincent and the grenadines",
    "st. kitts and nevis":                        "saint kitts and nevis",
    "st. lucia":                                  "saint lucia",
    "trinidad & tobago":                          "trinidad and tobago",
    "antigua & barbuda":                          "antigua and barbuda",
    "guinea bissau":                              "guinea-bissau",
    "bosnia & herzegovina":                       "bosnia and herzegovina",
    "timor leste":                                "timor-leste",
    "são tomé and príncipe":                      "são tomé and príncipe",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def normalize(name: str) -> str:
    """Lowercase and collapse whitespace."""
    if not isinstance(name, str):
        return ""
    return re.sub(r"\s+", " ", name.strip().lower())


def strip_col_whitespace(df: pd.DataFrame) -> pd.DataFrame:
    """Strip leading/trailing whitespace from all column names in-place."""
    df.columns = [str(c).strip() for c in df.columns]
    return df


def find_stat_col(df: pd.DataFrame) -> Optional[str]:
    """Return the first column name ending with (*) ."""
    for col in df.columns:
        if re.search(r"\(\*\)\s*$", str(col)):
            return col
    return None


def clean_col_name(name: str) -> str:
    """Strip (*) suffix and surrounding whitespace from a column name."""
    return re.sub(r"\s*\(\*\)\s*$", "", name).strip()


# ── Reference loading ──────────────────────────────────────────────────────────

def load_reference() -> tuple[dict, set]:
    """
    Load area.csv and return:
        norm_to_iso : {normalized_country_name: isoCode}
        iso_set     : set of all isoCodes
    """
    df = pd.read_csv(STATS_DIR / "area.csv")
    strip_col_whitespace(df)
    norm_to_iso: dict[str, str] = {}
    iso_set: set[str] = set()
    for _, row in df.iterrows():
        n = normalize(str(row["countryLabel"]))
        norm_to_iso[n] = str(row["isoCode"])
        iso_set.add(str(row["isoCode"]))
    return norm_to_iso, iso_set


# ── Country matching ───────────────────────────────────────────────────────────

def match_country(
    name: str,
    norm_to_iso: dict,
    fuzzy_keys: list[str],
) -> tuple[Optional[str], str]:
    """
    Returns (isoCode | None, match_type).
    match_type is one of: 'exact', 'alias', 'fuzzy:<score>', 'none'
    """
    n = normalize(name)
    if not n:
        return None, "none"

    # Pass 1 – exact match
    if n in norm_to_iso:
        return norm_to_iso[n], "exact"

    # Pass 2 – alias lookup
    aliased = ALIASES.get(n)
    if aliased and aliased in norm_to_iso:
        return norm_to_iso[aliased], "alias"

    # Pass 3 – fuzzy match
    result = fuzz_process.extractOne(
        n, fuzzy_keys, scorer=fuzz.WRatio, score_cutoff=FUZZY_THRESHOLD
    )
    if result:
        matched_key, score, _ = result
        return norm_to_iso[matched_key], f"fuzzy:{score:.0f}"

    return None, "none"


def iso_to_area_name(iso: str, norm_to_iso: dict) -> str:
    """Reverse-lookup: isoCode → area.csv country name (for reporting)."""
    for name, code in norm_to_iso.items():
        if code == iso:
            return name
    return "?"


# ── File processing ────────────────────────────────────────────────────────────

def process_file(
    path: Path,
    norm_to_iso: dict,
    iso_set: set,
    fuzzy_keys: list[str],
) -> dict:
    """
    Process one CSV file and write output to OUT_DIR.
    Returns a report dict with keys:
        matched, dropped, fuzzy_matches, alias_matches, dropped_names, error
    """
    fname = path.name
    cfg = FILE_CONFIG.get(fname, {})
    country_col: Optional[str] = cfg.get("country_col")
    read_kwargs: dict = cfg.get("read_kwargs", {})

    report: dict = {
        "matched":       0,
        "dropped":       0,
        "fuzzy_matches": [],   # list of (original_name, area_name, score_str)
        "alias_matches": [],   # list of (original_name, area_name)
        "dropped_names": [],   # unmatched country names
        "error":         None,
    }

    try:
        df = pd.read_csv(path, **read_kwargs)
    except Exception as exc:
        report["error"] = str(exc)
        return report

    strip_col_whitespace(df)

    # ── Clean files: already have isoCode – filter by membership ──────────────
    if fname in CLEAN_FILES:
        stat_col = find_stat_col(df)
        if stat_col is None:
            report["error"] = "No (*) column found"
            return report

        mask        = df["isoCode"].isin(iso_set)
        out_df      = df[mask].copy()
        dropped_df  = df[~mask]

        report["matched"]       = len(out_df)
        report["dropped"]       = len(dropped_df)
        report["dropped_names"] = dropped_df["countryLabel"].tolist()

        stat_clean = clean_col_name(stat_col)
        out_df = out_df[["countryLabel", "isoCode", stat_col]].rename(
            columns={stat_col: stat_clean}
        )
        out_df.to_csv(OUT_DIR / fname, index=False)
        return report

    # ── Modify files: match country names against the reference ───────────────
    if country_col is None:
        report["error"] = "No country_col configured"
        return report

    if country_col not in df.columns:
        report["error"] = (
            f"country_col '{country_col}' not in columns: {list(df.columns)}"
        )
        return report

    stat_col = find_stat_col(df)
    if stat_col is None:
        report["error"] = "No (*) column found"
        return report

    stat_clean = clean_col_name(stat_col)
    seen_iso: set[str] = set()
    rows_out: list[dict] = []

    for _, row in df.iterrows():
        raw_name = str(row[country_col]).strip()
        iso, match_type = match_country(raw_name, norm_to_iso, fuzzy_keys)

        if iso is None:
            report["dropped"] += 1
            report["dropped_names"].append(raw_name)
            continue

        # Deduplicate: skip if we've already emitted this isoCode
        if iso in seen_iso:
            report["dropped"] += 1
            report["dropped_names"].append(f"{raw_name} (duplicate isoCode {iso})")
            continue
        seen_iso.add(iso)

        report["matched"] += 1

        area_name = iso_to_area_name(iso, norm_to_iso)

        if match_type.startswith("fuzzy"):
            score = match_type.split(":")[1]
            report["fuzzy_matches"].append((raw_name, area_name, score))
        elif match_type == "alias":
            report["alias_matches"].append((raw_name, area_name))

        rows_out.append({
            "countryLabel": raw_name,
            "isoCode":      iso,
            stat_clean:     row[stat_col],
        })

    if rows_out:
        pd.DataFrame(rows_out).to_csv(OUT_DIR / fname, index=False)

    return report


# ── Report ─────────────────────────────────────────────────────────────────────

def write_report(results: dict[str, dict], iso_set: set) -> None:
    lines: list[str] = []

    lines.append("# normalize_stats output\n\n")
    lines.append(f"**Reference:** `area.csv` — {len(iso_set)} countries\n\n")
    lines.append("---\n\n")

    # Skipped files
    lines.append("## Skipped files\n\n")
    lines.append("Multi-line cell values make these unparseable automatically.\n\n")
    for f in sorted(SKIP_FILES):
        lines.append(f"- `{f}`\n")
    lines.append("\n")

    # Summary table
    lines.append("## Processed files\n\n")
    lines.append("| File | Matched | Dropped | Fuzzy | Alias |\n")
    lines.append("|------|--------:|--------:|------:|------:|\n")
    for fname, r in results.items():
        if r.get("error"):
            lines.append(f"| `{fname}` | ❌ ERROR | — | — | — |\n")
        else:
            lines.append(
                f"| `{fname}` | {r['matched']} | {r['dropped']} "
                f"| {len(r['fuzzy_matches'])} | {len(r['alias_matches'])} |\n"
            )
    lines.append("\n")

    # Per-file detail
    lines.append("## Per-file detail\n\n")
    for fname, r in results.items():
        lines.append(f"### `{fname}`\n\n")

        if r.get("error"):
            lines.append(f"> **Error:** {r['error']}\n\n")
            continue

        if not r["alias_matches"] and not r["fuzzy_matches"] and not r["dropped_names"]:
            lines.append("All rows matched exactly — nothing to report.\n\n")
            continue

        if r["alias_matches"]:
            lines.append("**Alias matches:**\n\n")
            for orig, area in r["alias_matches"]:
                lines.append(f"- `{orig}` → `{area}`\n")
            lines.append("\n")

        if r["fuzzy_matches"]:
            lines.append("**Fuzzy matches:**\n\n")
            for orig, area, score in r["fuzzy_matches"]:
                lines.append(f"- `{orig}` → `{area}` (score {score})\n")
            lines.append("\n")

        if r["dropped_names"]:
            lines.append("**Dropped (no match):**\n\n")
            for name in r["dropped_names"]:
                lines.append(f"- `{name}`\n")
            lines.append("\n")

    REPORT_PATH.write_text("".join(lines), encoding="utf-8")
    print(f"\nReport written → {REPORT_PATH}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    norm_to_iso, iso_set = load_reference()
    fuzzy_keys = list(norm_to_iso.keys())

    results: dict[str, dict] = {}

    for path in sorted(STATS_DIR.glob("*.csv")):
        fname = path.name

        if fname in SKIP_FILES:
            print(f"  SKIP  {fname}")
            continue

        if fname not in FILE_CONFIG:
            print(f"  ???   {fname}  (no config — skipping)")
            continue

        print(f"  ...   {fname}")
        r = process_file(path, norm_to_iso, iso_set, fuzzy_keys)
        results[fname] = r

        if r.get("error"):
            print(f"  ERROR {fname}: {r['error']}")
        else:
            print(
                f"  OK    {fname}: "
                f"{r['matched']} matched, {r['dropped']} dropped, "
                f"{len(r['fuzzy_matches'])} fuzzy, {len(r['alias_matches'])} alias"
            )

    write_report(results, iso_set)


if __name__ == "__main__":
    main()
