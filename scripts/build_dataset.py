"""
Dataset builder: reads processed CSVs → writes data/dataset.json.

Usage:
    python scripts/build_dataset.py [--input-dir DIR] [--output FILE]
                                    [--stable-timestamp] [--verbose]

Exit codes:
    0 — dataset written (partial success with warnings is still 0)
    1 — fatal error (input directory not found, no output written)
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import tempfile
from datetime import datetime, timezone

# Ensure the project root is on sys.path so this script can be executed both
# as `python scripts/build_dataset.py` and imported as `scripts.build_dataset`.
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

import pandas as pd

from scripts.iso_map import resolve_country
from scripts.stat_definitions import STAT_DEFINITIONS
from scripts.country_pool import COUNTRY_POOL

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(format="%(levelname)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public helpers (tested directly)
# ---------------------------------------------------------------------------

def parse_value(raw: str) -> float | None:
    """
    Parse a string from a processed CSV into a float.

    Returns None for unavailable/missing data:
      - empty string, whitespace-only
      - "—N/a", "N/a", "N/A", or any string that starts with an em-dash
      - strings that cannot be converted after cleaning

    Cleaning steps (applied before parse):
      1. Strip Unicode whitespace (including non-breaking space \u00a0)
      2. Strip trailing/leading percentage signs
      3. Strip comma thousands-separators
    """
    if not isinstance(raw, str):
        # Already a number from pandas (float/int) — shouldn't reach here
        # but guard anyway
        try:
            return float(raw)
        except (TypeError, ValueError):
            return None

    # Normalise whitespace (including \u00a0, \u202f, etc.)
    cleaned = raw.strip()
    cleaned = re.sub(r"[\u00a0\u202f\u2007\u2060\ufeff]", " ", cleaned).strip()

    if not cleaned:
        return None

    # Unavailability markers
    if cleaned.startswith("—") or cleaned.lower() in ("n/a", "—n/a", "-n/a", "na", "n.a."):
        return None
    # em-dash prefix
    if "\u2014" in cleaned and not any(c.isdigit() for c in cleaned):
        return None

    # Strip percentage signs
    cleaned = cleaned.rstrip("%")

    # Strip comma thousands-separators
    cleaned = cleaned.replace(",", "")

    try:
        return float(cleaned)
    except ValueError:
        return None


def compute_ranks(entries: list[dict], direction: str) -> list[dict]:
    """
    Compute 1-based ranks for a list of entry dicts in-place.

    Each dict must have keys: id, value, available.
    Adds: rank (int | None), tied (bool), zero_value (bool).

    - available=False entries get rank=None, tied=False, zero_value=False.
    - Ranking is applied only to available entries; ties share the same rank
      and are flagged with tied=True.
    - direction="desc" → rank 1 = highest value; "asc" → rank 1 = lowest.
    """
    available = [e for e in entries if e.get("available")]
    unavailable = [e for e in entries if not e.get("available")]

    # Sort
    reverse = (direction == "desc")
    available_sorted = sorted(available, key=lambda e: e["value"], reverse=reverse)

    # Assign ranks (handle ties)
    rank = 1
    for i, entry in enumerate(available_sorted):
        if i == 0:
            entry["rank"] = rank
        else:
            prev_val = available_sorted[i - 1]["value"]
            if entry["value"] == prev_val:
                entry["rank"] = available_sorted[i - 1]["rank"]
            else:
                rank = i + 1
                entry["rank"] = rank
        entry["zero_value"] = (entry["value"] == 0)

    # Mark ties
    rank_counts: dict[int, int] = {}
    for e in available_sorted:
        rank_counts[e["rank"]] = rank_counts.get(e["rank"], 0) + 1
    for e in available_sorted:
        e["tied"] = rank_counts[e["rank"]] > 1

    # Unavailable entries
    for e in unavailable:
        e["rank"] = None
        e["tied"] = False
        e["zero_value"] = False

    # Return original order (caller will re-sort if needed)
    id_to_entry = {e["id"]: e for e in available_sorted + unavailable}
    return [id_to_entry[e["id"]] for e in entries]


# ---------------------------------------------------------------------------
# CSV ingestion helpers
# ---------------------------------------------------------------------------

def _read_csv_safe(path: str, stat_id: str) -> pd.DataFrame | None:
    """Load a CSV; return None (with logged warning) on any error."""
    try:
        df = pd.read_csv(path)
    except Exception as exc:
        logger.warning("Could not read %s: %s — skipping", os.path.basename(path), exc)
        return None

    if "isoCode" not in df.columns:
        logger.warning("%s has no 'isoCode' column — skipping", os.path.basename(path))
        return None

    if len(df.columns) < 3:
        logger.warning("%s has fewer than 3 columns — skipping", os.path.basename(path))
        return None

    # Deduplicate on isoCode (case-insensitive), keeping first occurrence
    before = len(df)
    df["_iso_upper"] = df["isoCode"].astype(str).str.strip().str.upper()
    df = df.drop_duplicates(subset="_iso_upper", keep="first").drop(columns="_iso_upper")
    dupes = before - len(df)
    if dupes:
        logger.warning("%s: dropped %d duplicate isoCode row(s)", os.path.basename(path), dupes)

    return df


def _value_column(df: pd.DataFrame) -> str:
    """Return the name of the stat-value column (third column, index 2)."""
    return df.columns[2]


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------

def build_dataset(
    input_dir: str,
    output_path: str,
    stable_timestamp: bool = False,
    verbose: bool = False,
) -> int:
    """
    Build data/dataset.json from processed CSVs.

    Returns an exit code: 0 on success, 1 on fatal error.
    """
    from scripts.iso_map import resolve_country
    from scripts.stat_definitions import STAT_DEFINITIONS
    from scripts.country_pool import COUNTRY_POOL

    if not os.path.isdir(input_dir):
        logger.error("Input directory not found: %s", input_dir)
        return 1

    pool_upper = {c.upper() for c in COUNTRY_POOL}

    stats_output: dict = {}
    warnings_count = 0
    processed_stat_count = 0

    for stat_id, stat_def in STAT_DEFINITIONS.items():
        csv_path = os.path.join(input_dir, stat_def.csv_filename)

        if not os.path.isfile(csv_path):
            logger.warning("Missing CSV for stat '%s': %s — skipping", stat_id, stat_def.csv_filename)
            warnings_count += 1
            continue

        df = _read_csv_safe(csv_path, stat_id)
        if df is None:
            warnings_count += 1
            continue

        val_col = _value_column(df)
        entries: list[dict] = []
        rows_skipped = 0

        for _, row in df.iterrows():
            raw_code = str(row.get("isoCode", "")).strip()
            if not raw_code or raw_code.upper() not in pool_upper:
                continue

            resolved = resolve_country(raw_code)
            if resolved is None:
                rows_skipped += 1
                continue

            alpha3, display_name, flag_code = resolved

            raw_val = row.get(val_col)
            # Handle pandas NaN
            if pd.isna(raw_val) if not isinstance(raw_val, str) else False:
                parsed = None
            else:
                parsed = parse_value(str(raw_val))

            entries.append({
                "id": alpha3,
                "name": display_name,
                "flagCode": flag_code,
                "value": parsed,
                "available": parsed is not None,
            })

        if not entries:
            logger.warning("No valid entries for stat '%s' — skipping", stat_id)
            warnings_count += 1
            continue

        # Compute ranks
        entries = compute_ranks(entries, direction=stat_def.direction)

        # Sort by rank ascending (unavailable last)
        def sort_key(e):
            r = e.get("rank")
            return (0, r) if r is not None else (1, 0)
        entries.sort(key=sort_key)

        # Build tooltip
        tooltip = stat_def.tooltip_template.format(
            source=stat_def.source,
            year=stat_def.data_year,
        )

        stats_output[stat_id] = {
            "label": stat_def.label,
            "category": stat_def.category,
            "direction": stat_def.direction,
            "unit": stat_def.unit,
            "source": stat_def.source,
            "dataYear": stat_def.data_year,
            "tooltip": tooltip,
            "entries": [
                {
                    "id": e["id"],
                    "name": e["name"],
                    "flagCode": e["flagCode"],
                    "value": e["value"],
                    "rank": e["rank"],
                    "tied": e["tied"],
                    "zeroValue": e["zero_value"],
                    "available": e["available"],
                }
                for e in entries
            ],
        }

        processed_stat_count += 1

        if verbose:
            available_count = sum(1 for e in entries if e["available"])
            logger.info(
                "  %-22s %3d countries  (%d available)",
                stat_id, len(entries), available_count,
            )

        if rows_skipped and verbose:
            logger.warning("  %s: %d rows skipped (unresolvable codes)", stat_id, rows_skipped)

    if not stats_output:
        logger.error("No stats could be processed — aborting.")
        return 1

    # Count unique countries across all stats
    all_country_ids: set[str] = set()
    for stat_block in stats_output.values():
        for e in stat_block["entries"]:
            all_country_ids.add(e["id"])

    timestamp = (
        "1970-01-01T00:00:00Z"
        if stable_timestamp
        else datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    )

    dataset = {
        "generatedAt": timestamp,
        "countryCount": len(all_country_ids),
        "statCount": processed_stat_count,
        "stats": stats_output,
    }

    # Atomic write
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    tmp_fd, tmp_path = tempfile.mkstemp(
        dir=os.path.dirname(os.path.abspath(output_path)),
        suffix=".tmp",
    )
    try:
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(dataset, f, indent=2)
        os.replace(tmp_path, output_path)
    except Exception:
        os.unlink(tmp_path)
        raise

    if verbose or True:
        print(f"\nDataset written to {output_path}")
        print(f"  Stats: {processed_stat_count}")
        print(f"  Countries: {len(all_country_ids)}")
        print(f"  Warnings: {warnings_count} files skipped")

    return 0


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build data/dataset.json from processed country-statistics CSVs."
    )
    parser.add_argument(
        "--input-dir",
        default="data/stats/processed",
        help="Directory containing processed CSV files (default: data/stats/processed)",
    )
    parser.add_argument(
        "--output",
        default="data/dataset.json",
        help="Output path for the structured dataset (default: data/dataset.json)",
    )
    parser.add_argument(
        "--stable-timestamp",
        action="store_true",
        help="Use 1970-01-01T00:00:00Z as generatedAt (for reproducible output)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print per-file ingestion summary",
    )
    args = parser.parse_args()

    sys.exit(build_dataset(
        input_dir=args.input_dir,
        output_path=args.output,
        stable_timestamp=args.stable_timestamp,
        verbose=args.verbose,
    ))


if __name__ == "__main__":
    main()
