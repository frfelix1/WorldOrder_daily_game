"""
Puzzle generator: reads data/dataset.json → writes data/puzzles/YYYY-MM-DD.json.

Usage:
    python scripts/generate_puzzles.py [OPTIONS]

Exit codes:
    0 — all requested dates generated (or already existed)
    1 — one or more dates could not be satisfied
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import sys
import tempfile
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

# Ensure project root is on sys.path for both script and module usage
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from scripts.stat_definitions import STAT_DEFINITIONS

logging.basicConfig(format="%(levelname)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class PuzzleCandidate:
    date: str
    country_ids: list[str]
    stat_ids: list[str]
    countries: list[dict]
    stats: list[dict]
    violations: list[str]


class DatasetError(Exception):
    pass


# ---------------------------------------------------------------------------
# Dataset loading
# ---------------------------------------------------------------------------

def load_dataset(path: str) -> dict:
    """
    Load and validate data/dataset.json.

    Raises DatasetError with a descriptive message on validation failure.
    """
    if not os.path.isfile(path):
        raise DatasetError(f"Dataset file not found: {path}")
    with open(path) as f:
        dataset = json.load(f)

    for key in ("generatedAt", "countryCount", "statCount", "stats"):
        if key not in dataset:
            raise DatasetError(f"Dataset missing required key: {key}")

    if dataset["statCount"] < 14:
        raise DatasetError(
            f"Dataset has only {dataset['statCount']} stats; expected >= 14. "
            "Run build_dataset.py to regenerate."
        )
    if dataset["countryCount"] < 30:
        raise DatasetError(
            f"Dataset has only {dataset['countryCount']} countries; expected >= 30."
        )
    return dataset


# ---------------------------------------------------------------------------
# Solution derivation
# ---------------------------------------------------------------------------

def derive_solution(country_ids: list[str], entries_by_id: dict) -> list[str]:
    """
    Return country_ids sorted by rank ascending (rank 1 first).

    entries_by_id maps country_id -> entry dict with at least a 'rank' key.
    """
    return sorted(country_ids, key=lambda cid: entries_by_id[cid]["rank"])


# ---------------------------------------------------------------------------
# Quintile-band selection
# ---------------------------------------------------------------------------

def compute_quintile_bands(entries: list[dict]) -> list[list[dict]]:
    """
    Split eligible entries into 5 quintile bands.

    Eligible = available=True. Entries already carry a 'rank' field
    (pre-computed by build_dataset.py).

    Zero-value variant: if any entry has zero_value=True, band 5 contains
    all zero-value entries and bands 1–4 are equal-width quartiles of the
    non-zero entries.

    Normal variant: 5 equal-width percentile bands using floor(N × 0.20)
    boundaries applied to the rank-sorted eligible list.
    """
    eligible = [e for e in entries if e.get("available") and e.get("rank") is not None]
    eligible_sorted = sorted(eligible, key=lambda e: e["rank"])

    zero_entries = [e for e in eligible_sorted if e.get("zeroValue") or e.get("zero_value")]
    non_zero = [e for e in eligible_sorted if not (e.get("zeroValue") or e.get("zero_value"))]

    if zero_entries:
        # Zero-value variant: bands 1–4 are quartiles of non-zero; band 5 = zeros
        N = len(non_zero)
        if N < 4:
            # Fallback to regular quintiles on all entries
            zero_entries = []
            non_zero = eligible_sorted

    if zero_entries:
        N = len(non_zero)
        cuts = [
            0,
            max(1, int(N * 0.25)),
            max(2, int(N * 0.50)),
            max(3, int(N * 0.75)),
            N,
        ]
        bands: list[list[dict]] = []
        for i in range(4):
            start, end = cuts[i], cuts[i + 1]
            bands.append(non_zero[start:end] if end > start else non_zero[start:start + 1])
        bands.append(zero_entries)
        return bands

    # Normal variant
    N = len(eligible_sorted)
    cuts = [
        0,
        max(1, int(N * 0.20)),
        max(2, int(N * 0.40)),
        max(3, int(N * 0.60)),
        max(4, int(N * 0.80)),
        N,
    ]
    bands = []
    for i in range(5):
        start, end = cuts[i], cuts[i + 1]
        bands.append(eligible_sorted[start:end] if end > start else eligible_sorted[start:start + 1])
    return bands


def select_one_per_band(bands: list[list[dict]], rng: random.Random) -> list[str]:
    """Randomly select one country ID from each of the 5 bands."""
    return [rng.choice(band)["id"] for band in bands]


# ---------------------------------------------------------------------------
# Constraint validation
# ---------------------------------------------------------------------------

def validate_candidate(candidate: PuzzleCandidate, dataset: dict) -> list[str]:
    """
    Run all 5 constraint checks against the candidate.

    Returns a (possibly empty) list of violation description strings.
    An empty list means the candidate is valid.
    """
    violations: list[str] = []
    stats = dataset["stats"]

    for stat_id in candidate.stat_ids:
        if stat_id not in stats:
            violations.append(f"stat not in dataset: {stat_id!r}")
            continue

        entries_by_id = {e["id"]: e for e in stats[stat_id]["entries"]}

        for cid in candidate.country_ids:
            entry = entries_by_id.get(cid)

            # Check 1: availability
            if entry is None or not entry.get("available"):
                violations.append(
                    f"availability: country {cid!r} has no data for stat {stat_id!r}"
                )

    # Check 2: distinct (non-tied) ranks for all 3 stats
    for stat_id in candidate.stat_ids:
        if stat_id not in stats:
            continue
        entries_by_id = {e["id"]: e for e in stats[stat_id]["entries"]}
        available_entries = [
            entries_by_id[cid] for cid in candidate.country_ids
            if cid in entries_by_id and entries_by_id[cid].get("available")
        ]
        rank_to_countries: dict[int, list[str]] = {}
        for e in available_entries:
            r = e.get("rank")
            if r is not None:
                rank_to_countries.setdefault(r, []).append(e["id"])
        for rank, countries in rank_to_countries.items():
            if len(countries) > 1:
                pair = " and ".join(countries)
                violations.append(
                    f"tied ranks: {pair} tied at rank {rank} for stat {stat_id!r}"
                )

    # Check 3: stats span ≥2 distinct categories
    if candidate.stat_ids:
        categories = {
            stats[sid]["category"]
            for sid in candidate.stat_ids
            if sid in stats
        }
        if len(categories) < 2:
            violations.append(
                f"category variety: all 3 stats share the same category "
                f"({', '.join(categories)}); need ≥2 distinct categories"
            )

    # Check 4: quintile-band spread (countries from 5 distinct bands of primary stat)
    primary_stat_id = candidate.stat_ids[0] if candidate.stat_ids else None
    if primary_stat_id and primary_stat_id in stats:
        primary_entries = stats[primary_stat_id]["entries"]
        bands = compute_quintile_bands(primary_entries)
        band_sets = [frozenset(e["id"] for e in band) for band in bands]
        countries_set = set(candidate.country_ids)
        # Each selected country must be in exactly one band; check one per band
        bands_covered = set()
        for i, band_set in enumerate(band_sets):
            if countries_set & band_set:
                bands_covered.add(i)
        if len(bands_covered) < 5:
            violations.append(
                f"quintile bands: only {len(bands_covered)} of 5 bands represented "
                f"in primary stat {primary_stat_id!r}"
            )

    # Check 5: solution derivability (all selected countries have ranks in all stats)
    for stat_id in candidate.stat_ids:
        if stat_id not in stats:
            continue
        entries_by_id = {e["id"]: e for e in stats[stat_id]["entries"]}
        for cid in candidate.country_ids:
            entry = entries_by_id.get(cid)
            if entry is None or entry.get("rank") is None:
                violations.append(
                    f"solution derivability: country {cid!r} has no rank for stat {stat_id!r}"
                )

    return violations


# ---------------------------------------------------------------------------
# Puzzle file construction
# ---------------------------------------------------------------------------

def build_puzzle_file(candidate: PuzzleCandidate) -> dict:
    """Serialize a PuzzleCandidate to the PuzzleFile dict format."""
    return {
        "date": candidate.date,
        "countries": candidate.countries,
        "stats": candidate.stats,
    }


def write_puzzle_file(candidate: PuzzleCandidate, output_dir: str, force: bool) -> Optional[str]:
    """
    Write the puzzle file for candidate.date to output_dir/YYYY-MM-DD.json.

    Returns:
        "written"  — file was created or overwritten
        "skipped"  — file already existed and force=False
        None       — candidate has violations; nothing written
    """
    if candidate.violations:
        return None

    output_path = os.path.join(output_dir, f"{candidate.date}.json")

    if os.path.isfile(output_path) and not force:
        return "skipped"

    os.makedirs(output_dir, exist_ok=True)
    puzzle = build_puzzle_file(candidate)

    tmp_fd, tmp_path = tempfile.mkstemp(dir=output_dir, suffix=".tmp")
    try:
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(puzzle, f, indent=2)
        os.replace(tmp_path, output_path)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise

    return "written"


# ---------------------------------------------------------------------------
# Single-date puzzle generation
# ---------------------------------------------------------------------------

def _stat_entries_for(dataset: dict, stat_id: str) -> dict[str, dict]:
    """Return {country_id: entry} for a given stat."""
    return {e["id"]: e for e in dataset["stats"][stat_id]["entries"]}


def generate_puzzle(
    puzzle_date: str,
    dataset: dict,
    rng: random.Random,
    verbose: bool = False,
) -> Optional[PuzzleCandidate]:
    """
    Generate a single PuzzleCandidate for puzzle_date.

    Returns None if unsatisfiable after max retries.
    """
    available_stat_ids = list(dataset["stats"].keys())

    # Filter to stat_ids that have at least 5 available, non-tied countries
    usable_stats = [
        sid for sid in available_stat_ids
        if _count_usable(dataset["stats"][sid]) >= 5
    ]
    if len(usable_stats) < 3:
        logger.error("Not enough usable stats (found %d, need ≥3)", len(usable_stats))
        return None

    for attempt in range(20):
        # Select 3 stats spanning ≥2 categories
        stat_ids = _pick_stats(usable_stats, dataset, rng)
        if stat_ids is None:
            continue

        primary_stat_id = stat_ids[0]
        primary_entries = dataset["stats"][primary_stat_id]["entries"]
        bands = compute_quintile_bands(primary_entries)

        # Try to pick 5 countries (one per band) satisfying all constraints
        country_ids = _pick_countries(bands, stat_ids, dataset, rng)
        if country_ids is None:
            continue

        # Build candidate
        candidate = _build_candidate(puzzle_date, country_ids, stat_ids, dataset)
        violations = validate_candidate(candidate, dataset)

        if not violations:
            return candidate

        if verbose:
            logger.warning(
                "Attempt %d for %s failed: %s", attempt + 1, puzzle_date, violations[0]
            )

    logger.error("Could not satisfy constraints for %s after 20 attempts", puzzle_date)
    return None


def _count_usable(stat_block: dict) -> int:
    """Count entries that are available and not tied."""
    return sum(1 for e in stat_block["entries"] if e.get("available") and not e.get("tied"))


def _pick_stats(usable_stats: list[str], dataset: dict, rng: random.Random) -> Optional[list[str]]:
    """
    Randomly pick 3 stat IDs spanning ≥2 categories, with diverse category selection.
    Returns None if no valid combination found.
    """
    categories: dict[str, list[str]] = {}
    for sid in usable_stats:
        cat = dataset["stats"][sid]["category"]
        categories.setdefault(cat, []).append(sid)

    cat_names = list(categories.keys())
    if len(cat_names) < 2:
        return None

    # Pick primary stat
    primary = rng.choice(usable_stats)
    primary_cat = dataset["stats"][primary]["category"]

    # Pick second stat from a different category
    other_cats = [c for c in cat_names if c != primary_cat]
    if not other_cats:
        return None
    second_cat = rng.choice(other_cats)
    second = rng.choice(categories[second_cat])

    # Pick third stat from any category (can repeat one of the existing two)
    remaining = [s for s in usable_stats if s != primary and s != second]
    if not remaining:
        return None
    third = rng.choice(remaining)

    return [primary, second, third]


def _pick_countries(
    bands: list[list[dict]],
    stat_ids: list[str],
    dataset: dict,
    rng: random.Random,
) -> Optional[list[str]]:
    """
    Try to select one country per quintile band such that all 5 countries
    have available, non-tied data for all 3 stats.

    Returns a list of 5 country IDs, or None if not satisfiable.
    """
    # Build per-stat lookup of (available & not tied) country IDs
    valid_per_stat: list[set[str]] = []
    for sid in stat_ids:
        valid = {
            e["id"] for e in dataset["stats"][sid]["entries"]
            if e.get("available") and not e.get("tied")
        }
        valid_per_stat.append(valid)
    required = valid_per_stat[0].intersection(*valid_per_stat[1:])

    selected: list[str] = []
    for band in bands:
        eligible = [e for e in band if e["id"] in required]
        if not eligible:
            return None
        chosen = rng.choice(eligible)
        selected.append(chosen["id"])
        # Remove from required to prevent re-selection
        required.discard(chosen["id"])

    return selected if len(selected) == 5 else None


def _build_candidate(
    puzzle_date: str,
    country_ids: list[str],
    stat_ids: list[str],
    dataset: dict,
) -> PuzzleCandidate:
    """Populate a PuzzleCandidate's countries and stats from the dataset."""
    # Build country list from first stat's entries (all stats share country metadata)
    first_entries_by_id = _stat_entries_for(dataset, stat_ids[0])
    countries = [
        {
            "id": first_entries_by_id[cid]["id"],
            "name": first_entries_by_id[cid]["name"],
            "flagCode": first_entries_by_id[cid]["flagCode"],
        }
        for cid in country_ids
    ]

    # Build stats list
    stats_list = []
    for i, stat_id in enumerate(stat_ids):
        stat_def = dataset["stats"][stat_id]
        entries_by_id = _stat_entries_for(dataset, stat_id)
        solution = derive_solution(country_ids, entries_by_id)
        stats_list.append({
            "id": f"stat_{i + 1}",
            "label": stat_def["label"],
            "category": stat_def["category"],
            "tooltip": stat_def["tooltip"],
            "direction": stat_def["direction"],
            "solution": solution,
        })

    return PuzzleCandidate(
        date=puzzle_date,
        country_ids=country_ids,
        stat_ids=stat_ids,
        countries=countries,
        stats=stats_list,
        violations=[],
    )


# ---------------------------------------------------------------------------
# Batch generation
# ---------------------------------------------------------------------------

def generate_batch(
    dataset: dict,
    start: date,
    end: date,
    output_dir: str,
    seed: Optional[int],
    force: bool,
    dry_run: bool,
    verbose: bool,
) -> tuple[int, int, int]:
    """
    Generate puzzles for every date in [start, end] inclusive.

    Returns (generated, skipped, failed) counts.
    """
    generated = skipped = failed = 0
    prev_country_set: Optional[frozenset] = None
    current = start

    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        output_path = os.path.join(output_dir, f"{date_str}.json")

        # Skip if exists and not forcing
        if os.path.isfile(output_path) and not force and not dry_run:
            if verbose:
                logger.info("SKIP %s (already exists)", date_str)
            skipped += 1
            # Load existing to track consecutive uniqueness
            try:
                with open(output_path) as f:
                    existing = json.load(f)
                prev_country_set = frozenset(c["id"] for c in existing["countries"])
            except Exception:
                pass
            current += timedelta(days=1)
            continue

        # Seed per date for reproducibility
        if seed is not None:
            date_seed = seed + (current - start).days
        else:
            date_seed = None

        candidate = None
        for retry in range(10):
            rng_seed = (date_seed + retry) if date_seed is not None else None
            rng = random.Random(rng_seed)
            candidate = generate_puzzle(date_str, dataset, rng, verbose=verbose)
            if candidate is None:
                continue
            # Consecutive uniqueness check
            new_set = frozenset(candidate.country_ids)
            if prev_country_set is not None and new_set == prev_country_set:
                if verbose:
                    logger.warning("Retry %d: same country set as previous puzzle", retry + 1)
                candidate = None
                continue
            break

        if candidate is None:
            logger.error("FAIL %s — could not generate a valid puzzle", date_str)
            failed += 1
            current += timedelta(days=1)
            continue

        if dry_run:
            country_names = ", ".join(c["name"] for c in candidate.countries)
            stat_labels = ", ".join(s["label"] for s in candidate.stats)
            print(f"[DRY-RUN] {date_str}: {country_names} | {stat_labels}")
            if os.path.isfile(output_path) and not force:
                print(f"  → would skip (already exists)")
                skipped += 1
            else:
                print(f"  → would write {output_path}")
                generated += 1
        else:
            result = write_puzzle_file(candidate, output_dir, force=force)
            if result == "written":
                if verbose:
                    country_names = ", ".join(c["name"] for c in candidate.countries)
                    logger.info("WRITE %s: %s", date_str, country_names)
                generated += 1
                prev_country_set = frozenset(candidate.country_ids)
            elif result == "skipped":
                if verbose:
                    logger.info("SKIP %s (already exists)", date_str)
                skipped += 1

        current += timedelta(days=1)

    return generated, skipped, failed


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate daily puzzle files from data/dataset.json."
    )
    parser.add_argument("--dataset", default="data/dataset.json",
                        help="Path to the local dataset (default: data/dataset.json)")
    parser.add_argument("--output-dir", default="data/puzzles",
                        help="Directory to write puzzle JSON files (default: data/puzzles)")
    parser.add_argument("--start-date", default=None,
                        help="First date to generate, YYYY-MM-DD (default: today UTC)")
    parser.add_argument("--end-date", default=None,
                        help="Last date to generate, YYYY-MM-DD (default: same as start)")
    parser.add_argument("--seed", type=int, default=None,
                        help="Integer seed for reproducible selection")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite existing puzzle files")
    parser.add_argument("--verbose", action="store_true",
                        help="Print per-puzzle generation details")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate and print what would be generated; do not write files")
    args = parser.parse_args()

    # Parse dates
    from datetime import date as date_type, datetime, timezone
    today = datetime.now(timezone.utc).date()
    start = date_type.fromisoformat(args.start_date) if args.start_date else today
    end = date_type.fromisoformat(args.end_date) if args.end_date else start

    if end < start:
        logger.error("--end-date must be >= --start-date")
        sys.exit(1)

    # Load dataset
    try:
        dataset = load_dataset(args.dataset)
    except DatasetError as e:
        logger.error("%s", e)
        sys.exit(1)

    generated, skipped, failed = generate_batch(
        dataset=dataset,
        start=start,
        end=end,
        output_dir=args.output_dir,
        seed=args.seed,
        force=args.force,
        dry_run=args.dry_run,
        verbose=args.verbose,
    )

    print(f"\nGenerated: {generated}, Skipped: {skipped} (already existed), Failed: {failed}")

    if failed > 0:
        logger.error("%d date(s) could not be satisfied — see above for details", failed)
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
