"""
Tests for scripts/generate_puzzles.py — Phases 4, 5, 6 (T015–T031).

Written BEFORE implementation; all tests must fail initially.
Run with: python -m pytest tests/scripts/test_generate_puzzles.py -v
"""

from __future__ import annotations

import json
import os
import pytest


# ---------------------------------------------------------------------------
# Helpers to build synthetic dataset entries
# ---------------------------------------------------------------------------

def _make_entry(country_id: str, value: float | None, rank: int | None = None,
                tied: bool = False, zero_value: bool = False,
                available: bool = True) -> dict:
    return {
        "id": country_id,
        "name": country_id,
        "flagCode": country_id.lower()[:2],
        "value": value,
        "rank": rank,
        "tied": tied,
        "zeroValue": zero_value,
        "available": available,
    }


def _make_stat_block(entries: list[dict], category: str = "geography",
                     direction: str = "desc") -> dict:
    return {
        "label": "Test Stat",
        "category": category,
        "direction": direction,
        "unit": "km",
        "source": "Test",
        "dataYear": 2023,
        "tooltip": "Test tooltip",
        "entries": entries,
    }


def _make_dataset(stats: dict) -> dict:
    all_ids = set()
    for block in stats.values():
        for e in block["entries"]:
            all_ids.add(e["id"])
    return {
        "generatedAt": "1970-01-01T00:00:00Z",
        "countryCount": len(all_ids),
        "statCount": len(stats),
        "stats": stats,
    }


# ---------------------------------------------------------------------------
# T015 — tie rejection
# ---------------------------------------------------------------------------

class TestTieRejection:
    """T015: validate_candidate() rejects tied ranks for any stat."""

    def _build_dataset_with_tie(self):
        """Two countries share rank 2 on stat 'area'."""
        from scripts.build_dataset import compute_ranks
        entries = [
            _make_entry("AAA", 100.0),
            _make_entry("BBB", 50.0),
            _make_entry("CCC", 50.0),   # ties with BBB
            _make_entry("DDD", 20.0),
            _make_entry("EEE", 10.0),
        ]
        entries = compute_ranks(entries, direction="desc")
        stat1 = _make_stat_block(entries, category="geography")
        # Second stat, no ties
        entries2 = [
            _make_entry("AAA", 1.0, rank=5),
            _make_entry("BBB", 2.0, rank=4),
            _make_entry("CCC", 3.0, rank=3),
            _make_entry("DDD", 4.0, rank=2),
            _make_entry("EEE", 5.0, rank=1),
        ]
        stat2 = _make_stat_block(entries2, category="demographics", direction="asc")
        entries3 = [
            _make_entry("AAA", 10.0, rank=1),
            _make_entry("BBB", 8.0, rank=2),
            _make_entry("CCC", 6.0, rank=3),
            _make_entry("DDD", 4.0, rank=4),
            _make_entry("EEE", 2.0, rank=5),
        ]
        stat3 = _make_stat_block(entries3, category="health")
        return _make_dataset({"area": stat1, "population": stat2, "hdi": stat3})

    def test_tied_ranks_produce_violation(self):
        from scripts.generate_puzzles import validate_candidate, PuzzleCandidate
        dataset = self._build_dataset_with_tie()
        candidate = PuzzleCandidate(
            date="2026-01-01",
            country_ids=["AAA", "BBB", "CCC", "DDD", "EEE"],
            stat_ids=["area", "population", "hdi"],
            countries=[], stats=[], violations=[],
        )
        violations = validate_candidate(candidate, dataset)
        assert len(violations) > 0
        # Should mention 'tied' or the stat name
        violation_text = " ".join(violations).lower()
        assert "tie" in violation_text or "tied" in violation_text or "rank" in violation_text

    def test_no_file_written_on_tied_violation(self, tmp_path):
        """No partial file should be written when a tie violation exists."""
        from scripts.generate_puzzles import validate_candidate, PuzzleCandidate, write_puzzle_file, build_puzzle_file
        dataset = self._build_dataset_with_tie()
        candidate = PuzzleCandidate(
            date="2026-01-01",
            country_ids=["AAA", "BBB", "CCC", "DDD", "EEE"],
            stat_ids=["area", "population", "hdi"],
            countries=[], stats=[], violations=[],
        )
        violations = validate_candidate(candidate, dataset)
        candidate.violations = violations
        assert len(violations) > 0
        # Should not write a file
        output_file = tmp_path / "2026-01-01.json"
        result = write_puzzle_file(candidate, str(tmp_path), force=False)
        assert result is None or result == ""
        assert not output_file.exists()


# ---------------------------------------------------------------------------
# T016 — category-variety validation
# ---------------------------------------------------------------------------

class TestCategoryVariety:
    """T016: validate_candidate() requires stats from ≥2 distinct categories."""

    def _make_same_category_dataset(self):
        entries = [_make_entry(c, float(i+1), rank=5-i) for i, c in enumerate(["AAA","BBB","CCC","DDD","EEE"])]
        block = _make_stat_block(entries, category="economy")
        return _make_dataset({"gdp": block, "gdp_per_capita": block, "trade": block})

    def _make_two_category_dataset(self):
        entries = [_make_entry(c, float(i+1), rank=5-i) for i, c in enumerate(["AAA","BBB","CCC","DDD","EEE"])]
        b1 = _make_stat_block(entries, category="economy")
        b2 = _make_stat_block(entries, category="economy")
        b3 = _make_stat_block(entries, category="health")
        return _make_dataset({"gdp": b1, "gdp_per_capita": b2, "life_expectancy": b3})

    def test_all_same_category_produces_violation(self):
        from scripts.generate_puzzles import validate_candidate, PuzzleCandidate
        dataset = self._make_same_category_dataset()
        candidate = PuzzleCandidate(
            date="2026-01-01",
            country_ids=["AAA", "BBB", "CCC", "DDD", "EEE"],
            stat_ids=["gdp", "gdp_per_capita", "trade"],
            countries=[], stats=[], violations=[],
        )
        violations = validate_candidate(candidate, dataset)
        assert any("categor" in v.lower() for v in violations)

    def test_two_categories_passes_check(self):
        from scripts.generate_puzzles import validate_candidate, PuzzleCandidate
        dataset = self._make_two_category_dataset()
        candidate = PuzzleCandidate(
            date="2026-01-01",
            country_ids=["AAA", "BBB", "CCC", "DDD", "EEE"],
            stat_ids=["gdp", "gdp_per_capita", "life_expectancy"],
            countries=[], stats=[], violations=[],
        )
        violations = validate_candidate(candidate, dataset)
        category_violations = [v for v in violations if "categor" in v.lower()]
        assert len(category_violations) == 0


# ---------------------------------------------------------------------------
# T017 — quintile-band algorithm
# ---------------------------------------------------------------------------

class TestQuintileBands:
    """T017: compute_quintile_bands and select_one_per_band."""

    def test_10_entries_gives_5_bands_of_2(self):
        from scripts.generate_puzzles import compute_quintile_bands
        entries = [_make_entry(f"C{i:02d}", float(i+1), rank=10-i) for i in range(10)]
        bands = compute_quintile_bands(entries)
        assert len(bands) == 5
        for band in bands:
            assert len(band) == 2

    def test_select_one_per_band_returns_5_ids(self):
        from scripts.generate_puzzles import compute_quintile_bands, select_one_per_band
        import random
        entries = [_make_entry(f"C{i:02d}", float(i+1), rank=10-i) for i in range(10)]
        bands = compute_quintile_bands(entries)
        rng = random.Random(42)
        selected = select_one_per_band(bands, rng)
        assert len(selected) == 5
        assert len(set(selected)) == 5  # all distinct

    def test_20_entries_gives_5_bands_of_4(self):
        from scripts.generate_puzzles import compute_quintile_bands
        entries = [_make_entry(f"C{i:02d}", float(i+1), rank=20-i) for i in range(20)]
        bands = compute_quintile_bands(entries)
        assert len(bands) == 5
        for band in bands:
            assert len(band) == 4

    def test_zero_value_special_case(self):
        """Zero-value country goes to band 5; non-zero split into 4 quartile bands."""
        from scripts.generate_puzzles import compute_quintile_bands
        # 8 non-zero + 2 zero
        non_zero = [_make_entry(f"C{i:02d}", float(i+1), rank=i+1, zero_value=False) for i in range(8)]
        zeros = [_make_entry("Z01", 0.0, rank=9, zero_value=True),
                 _make_entry("Z02", 0.0, rank=9, zero_value=True)]
        entries = non_zero + zeros
        bands = compute_quintile_bands(entries)
        assert len(bands) == 5
        # Band 5 should contain the zero-value entries
        band5_ids = {e["id"] for e in bands[4]}
        assert "Z01" in band5_ids or "Z02" in band5_ids

    def test_band_spans_full_distribution(self):
        """Band 1 should contain the top-ranked entries, band 5 the bottom."""
        from scripts.generate_puzzles import compute_quintile_bands
        entries = [_make_entry(f"C{i:02d}", float(10-i), rank=i+1) for i in range(10)]
        bands = compute_quintile_bands(entries)
        # Band 1 entries should all have rank <= 2
        for e in bands[0]:
            assert e["rank"] <= 2


# ---------------------------------------------------------------------------
# T018 — missing-data exclusion
# ---------------------------------------------------------------------------

class TestMissingDataExclusion:
    """T018: unavailable countries are excluded from selection and cause violations."""

    def _dataset_with_unavailable(self):
        available = [_make_entry(c, float(i+1), rank=5-i) for i, c in enumerate(["AAA","BBB","CCC","DDD"])]
        unavail = [_make_entry("EEE", None, rank=None, available=False)]
        entries = available + unavail
        b1 = _make_stat_block(entries, category="geography")
        b2 = _make_stat_block(entries, category="demographics")
        b3 = _make_stat_block(entries, category="health")
        return _make_dataset({"area": b1, "population": b2, "hdi": b3})

    def test_unavailable_country_in_selection_causes_violation(self):
        from scripts.generate_puzzles import validate_candidate, PuzzleCandidate
        dataset = self._dataset_with_unavailable()
        candidate = PuzzleCandidate(
            date="2026-01-01",
            country_ids=["AAA", "BBB", "CCC", "DDD", "EEE"],  # EEE is unavailable
            stat_ids=["area", "population", "hdi"],
            countries=[], stats=[], violations=[],
        )
        violations = validate_candidate(candidate, dataset)
        assert len(violations) > 0
        assert any("avail" in v.lower() or "EEE" in v for v in violations)

    def test_unavailable_not_selected_by_quintile_algorithm(self):
        """compute_quintile_bands should never include unavailable entries."""
        from scripts.generate_puzzles import compute_quintile_bands
        available = [_make_entry(f"C{i}", float(i+1), rank=i+1) for i in range(10)]
        unavail = [_make_entry("MISS", None, rank=None, available=False)]
        bands = compute_quintile_bands(available + unavail)
        all_in_bands = [e["id"] for band in bands for e in band]
        assert "MISS" not in all_in_bands


# ---------------------------------------------------------------------------
# T022 — PuzzleFile schema conformance
# ---------------------------------------------------------------------------

class TestPuzzleFileSchema:
    """T022: build_puzzle_file() produces a dict matching the PuzzleFile schema."""

    def _make_valid_candidate(self):
        from scripts.generate_puzzles import PuzzleCandidate
        countries = [
            {"id": "JPN", "name": "Japan", "flagCode": "jp"},
            {"id": "BRA", "name": "Brazil", "flagCode": "br"},
            {"id": "NGA", "name": "Nigeria", "flagCode": "ng"},
            {"id": "DEU", "name": "Germany", "flagCode": "de"},
            {"id": "ZAF", "name": "South Africa", "flagCode": "za"},
        ]
        stats = [
            {
                "id": "stat_1", "label": "Land Area", "category": "geography",
                "tooltip": "Test tooltip", "direction": "desc",
                "solution": ["BRA", "ZAF", "DEU", "NGA", "JPN"],
            },
            {
                "id": "stat_2", "label": "Population", "category": "demographics",
                "tooltip": "Test tooltip", "direction": "desc",
                "solution": ["NGA", "BRA", "DEU", "JPN", "ZAF"],
            },
            {
                "id": "stat_3", "label": "HDI", "category": "demographics",
                "tooltip": "Test tooltip", "direction": "desc",
                "solution": ["DEU", "JPN", "BRA", "ZAF", "NGA"],
            },
        ]
        return PuzzleCandidate(
            date="2026-05-27",
            country_ids=["JPN", "BRA", "NGA", "DEU", "ZAF"],
            stat_ids=["area", "population", "hdi"],
            countries=countries,
            stats=stats,
            violations=[],
        )

    def test_build_puzzle_file_has_date(self):
        from scripts.generate_puzzles import build_puzzle_file
        result = build_puzzle_file(self._make_valid_candidate())
        assert result["date"] == "2026-05-27"

    def test_build_puzzle_file_has_5_countries(self):
        from scripts.generate_puzzles import build_puzzle_file
        result = build_puzzle_file(self._make_valid_candidate())
        assert len(result["countries"]) == 5

    def test_build_puzzle_file_has_3_stats(self):
        from scripts.generate_puzzles import build_puzzle_file
        result = build_puzzle_file(self._make_valid_candidate())
        assert len(result["stats"]) == 3

    def test_stat_ids_are_stat_1_2_3(self):
        from scripts.generate_puzzles import build_puzzle_file
        result = build_puzzle_file(self._make_valid_candidate())
        stat_ids = [s["id"] for s in result["stats"]]
        assert stat_ids == ["stat_1", "stat_2", "stat_3"]

    def test_country_has_required_fields(self):
        from scripts.generate_puzzles import build_puzzle_file
        result = build_puzzle_file(self._make_valid_candidate())
        for country in result["countries"]:
            assert "id" in country
            assert "name" in country
            assert "flagCode" in country

    def test_stat_has_required_fields(self):
        from scripts.generate_puzzles import build_puzzle_file
        result = build_puzzle_file(self._make_valid_candidate())
        for stat in result["stats"]:
            for field in ("id", "label", "category", "tooltip", "direction", "solution"):
                assert field in stat, f"Missing field: {field}"

    def test_solution_is_permutation_of_country_ids(self):
        from scripts.generate_puzzles import build_puzzle_file
        result = build_puzzle_file(self._make_valid_candidate())
        country_ids = {c["id"] for c in result["countries"]}
        for stat in result["stats"]:
            assert set(stat["solution"]) == country_ids


# ---------------------------------------------------------------------------
# T023 — solution derivation
# ---------------------------------------------------------------------------

class TestSolutionDerivation:
    """T023: derive_solution() returns country IDs in ascending rank order."""

    def test_desc_stat_highest_value_first(self):
        """desc direction: country with rank 1 (highest value) is first in solution."""
        from scripts.generate_puzzles import derive_solution
        entries_by_id = {
            "AAA": {"rank": 1, "value": 100.0},
            "BBB": {"rank": 2, "value": 50.0},
            "CCC": {"rank": 3, "value": 30.0},
            "DDD": {"rank": 4, "value": 10.0},
            "EEE": {"rank": 5, "value": 5.0},
        }
        result = derive_solution(["AAA", "BBB", "CCC", "DDD", "EEE"], entries_by_id)
        assert result[0] == "AAA"
        assert result[-1] == "EEE"

    def test_asc_stat_lowest_value_first(self):
        """asc direction: country with rank 1 (lowest value) is first in solution."""
        from scripts.generate_puzzles import derive_solution
        entries_by_id = {
            "AAA": {"rank": 5, "value": 100.0},
            "BBB": {"rank": 4, "value": 50.0},
            "CCC": {"rank": 3, "value": 30.0},
            "DDD": {"rank": 2, "value": 10.0},
            "EEE": {"rank": 1, "value": 5.0},
        }
        result = derive_solution(["AAA", "BBB", "CCC", "DDD", "EEE"], entries_by_id)
        assert result[0] == "EEE"  # rank 1 = lowest value
        assert result[-1] == "AAA"

    def test_solution_is_permutation_of_input(self):
        from scripts.generate_puzzles import derive_solution
        country_ids = ["AAA", "BBB", "CCC", "DDD", "EEE"]
        entries_by_id = {c: {"rank": i+1, "value": float(5-i)} for i, c in enumerate(country_ids)}
        result = derive_solution(country_ids, entries_by_id)
        assert set(result) == set(country_ids)
        assert len(result) == 5

    def test_solution_length_matches_input(self):
        from scripts.generate_puzzles import derive_solution
        country_ids = ["AAA", "BBB", "CCC", "DDD", "EEE"]
        entries_by_id = {c: {"rank": i+1, "value": float(5-i)} for i, c in enumerate(country_ids)}
        result = derive_solution(country_ids, entries_by_id)
        assert len(result) == len(country_ids)


# ---------------------------------------------------------------------------
# T024 — end-to-end integration test
# ---------------------------------------------------------------------------

class TestEndToEndIntegration:
    """T024: load real dataset.json, generate puzzle for fixed date, validate schema."""

    @pytest.fixture(scope="class")
    def dataset_path(self):
        path = "data/dataset.json"
        if not os.path.isfile(path):
            pytest.skip("data/dataset.json not found — run build_dataset.py first")
        return path

    def test_generate_puzzle_produces_valid_file(self, dataset_path, tmp_path):
        import subprocess, sys
        result = subprocess.run(
            [sys.executable, "scripts/generate_puzzles.py",
             "--dataset", dataset_path,
             "--output-dir", str(tmp_path),
             "--start-date", "2026-05-27",
             "--end-date", "2026-05-27",
             "--seed", "42"],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            pytest.fail(f"generate_puzzles.py failed:\n{result.stderr}")
        out_file = tmp_path / "2026-05-27.json"
        assert out_file.exists(), "Puzzle file not written"

    def test_generated_puzzle_matches_schema(self, dataset_path, tmp_path):
        import subprocess, sys
        subprocess.run(
            [sys.executable, "scripts/generate_puzzles.py",
             "--dataset", dataset_path,
             "--output-dir", str(tmp_path),
             "--start-date", "2026-05-27",
             "--seed", "42"],
            check=True, capture_output=True,
        )
        with open(tmp_path / "2026-05-27.json") as f:
            puzzle = json.load(f)

        assert puzzle["date"] == "2026-05-27"
        assert len(puzzle["countries"]) == 5
        assert len(puzzle["stats"]) == 3
        country_ids = {c["id"] for c in puzzle["countries"]}
        for stat in puzzle["stats"]:
            assert set(stat["solution"]) == country_ids

    def test_solutions_match_dataset_ranks(self, dataset_path, tmp_path):
        import subprocess, sys
        subprocess.run(
            [sys.executable, "scripts/generate_puzzles.py",
             "--dataset", dataset_path,
             "--output-dir", str(tmp_path),
             "--start-date", "2026-05-27",
             "--seed", "42"],
            check=True, capture_output=True,
        )
        with open(dataset_path) as f:
            dataset = json.load(f)
        with open(tmp_path / "2026-05-27.json") as f:
            puzzle = json.load(f)

        country_ids = [c["id"] for c in puzzle["countries"]]
        # Stat ids in puzzle are stat_1, stat_2, stat_3 — we need the real stat slug
        # We can check consistency: solutions must be sorted by rank
        for i, stat_def in enumerate(puzzle["stats"]):
            solution = stat_def["solution"]
            # Find the corresponding dataset stat by label
            ds_stat = None
            for sid, sb in dataset["stats"].items():
                if sb["label"] == stat_def["label"]:
                    ds_stat = sb
                    break
            if ds_stat is None:
                continue
            entries_by_id = {e["id"]: e for e in ds_stat["entries"]}
            ranks = [entries_by_id[cid]["rank"] for cid in solution if cid in entries_by_id]
            assert ranks == sorted(ranks), f"Solution for {stat_def['label']} is not in rank order"


# ---------------------------------------------------------------------------
# T030 — batch uniqueness
# ---------------------------------------------------------------------------

class TestBatchUniqueness:
    """T030: no two consecutive puzzles share the same 5-country set."""

    @pytest.fixture(scope="class")
    def dataset_path(self):
        path = "data/dataset.json"
        if not os.path.isfile(path):
            pytest.skip("data/dataset.json not found")
        return path

    def test_consecutive_puzzles_have_distinct_country_sets(self, dataset_path, tmp_path):
        import subprocess, sys
        result = subprocess.run(
            [sys.executable, "scripts/generate_puzzles.py",
             "--dataset", dataset_path,
             "--output-dir", str(tmp_path),
             "--start-date", "2026-06-01",
             "--end-date", "2026-06-05",
             "--seed", "42"],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            pytest.fail(f"generate_puzzles.py failed:\n{result.stderr}")

        puzzles = []
        for i in range(1, 6):
            p = tmp_path / f"2026-06-0{i}.json"
            if p.exists():
                with open(p) as f:
                    puzzles.append(json.load(f))

        assert len(puzzles) >= 2, "Not enough puzzles generated"
        for i in range(len(puzzles) - 1):
            ids_a = frozenset(c["id"] for c in puzzles[i]["countries"])
            ids_b = frozenset(c["id"] for c in puzzles[i+1]["countries"])
            assert ids_a != ids_b, f"Consecutive puzzles {i} and {i+1} share same country set"


# ---------------------------------------------------------------------------
# T031 — skip-existing behavior
# ---------------------------------------------------------------------------

class TestSkipExisting:
    """T031: write_puzzle_file() skips existing files unless --force."""

    def _make_candidate(self, date: str):
        from scripts.generate_puzzles import PuzzleCandidate
        return PuzzleCandidate(
            date=date,
            country_ids=["JPN", "BRA", "NGA", "DEU", "ZAF"],
            stat_ids=["area", "population", "hdi"],
            countries=[
                {"id": "JPN", "name": "Japan", "flagCode": "jp"},
                {"id": "BRA", "name": "Brazil", "flagCode": "br"},
                {"id": "NGA", "name": "Nigeria", "flagCode": "ng"},
                {"id": "DEU", "name": "Germany", "flagCode": "de"},
                {"id": "ZAF", "name": "South Africa", "flagCode": "za"},
            ],
            stats=[
                {
                    "id": "stat_1", "label": "Land Area", "category": "geography",
                    "tooltip": "Test", "direction": "desc",
                    "solution": ["BRA", "ZAF", "DEU", "NGA", "JPN"],
                },
                {
                    "id": "stat_2", "label": "Population", "category": "demographics",
                    "tooltip": "Test", "direction": "desc",
                    "solution": ["NGA", "BRA", "DEU", "JPN", "ZAF"],
                },
                {
                    "id": "stat_3", "label": "HDI", "category": "demographics",
                    "tooltip": "Test", "direction": "desc",
                    "solution": ["DEU", "JPN", "BRA", "ZAF", "NGA"],
                },
            ],
            violations=[],
        )

    def test_skips_existing_without_force(self, tmp_path):
        from scripts.generate_puzzles import write_puzzle_file
        c = self._make_candidate("2026-01-01")
        # Write a dummy file first
        existing = tmp_path / "2026-01-01.json"
        existing.write_text('{"original": true}')
        result = write_puzzle_file(c, str(tmp_path), force=False)
        # Should skip — original file unchanged
        content = json.loads(existing.read_text())
        assert content.get("original") is True
        assert result == "skipped" or result is None

    def test_overwrites_with_force(self, tmp_path):
        from scripts.generate_puzzles import write_puzzle_file
        c = self._make_candidate("2026-01-01")
        existing = tmp_path / "2026-01-01.json"
        existing.write_text('{"original": true}')
        result = write_puzzle_file(c, str(tmp_path), force=True)
        content = json.loads(existing.read_text())
        assert "original" not in content
        assert content.get("date") == "2026-01-01"
        assert result == "written"

    def test_new_file_reports_written(self, tmp_path):
        from scripts.generate_puzzles import write_puzzle_file
        c = self._make_candidate("2026-02-01")
        result = write_puzzle_file(c, str(tmp_path), force=False)
        assert (tmp_path / "2026-02-01.json").exists()
        assert result == "written"
