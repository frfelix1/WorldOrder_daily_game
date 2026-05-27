"""
Tests for scripts/build_dataset.py — Phase 3 (T006–T009).

Written BEFORE implementation; all tests must fail initially.
Run with: python -m pytest tests/scripts/test_build_dataset.py -v
"""

import logging
import pytest

# ---------------------------------------------------------------------------
# T006 — alpha-2 → alpha-3 mapping
# ---------------------------------------------------------------------------

class TestAlpha2ToAlpha3:
    """Covers T006: alpha-2→alpha-3 mapping via iso_map.resolve_country."""

    def test_jp_resolves_to_jpn(self):
        from scripts.iso_map import resolve_country
        result = resolve_country("jp")
        assert result == ("JPN", "Japan", "jp")

    def test_case_insensitive(self):
        from scripts.iso_map import resolve_country
        assert resolve_country("JP") == resolve_country("jp")

    def test_unknown_code_returns_none(self, caplog):
        from scripts.iso_map import resolve_country
        with caplog.at_level(logging.WARNING, logger="scripts.iso_map"):
            result = resolve_country("XX")
        assert result is None
        assert "XX" in caplog.text

    def test_gb_to_gbr(self):
        from scripts.iso_map import resolve_country
        alpha3, name, flag = resolve_country("GB")
        assert alpha3 == "GBR"
        assert flag == "gb"

    def test_fr_to_fra(self):
        from scripts.iso_map import resolve_country
        alpha3, _, _ = resolve_country("FR")
        assert alpha3 == "FRA"

    def test_in_to_ind(self):
        from scripts.iso_map import resolve_country
        alpha3, _, _ = resolve_country("IN")
        assert alpha3 == "IND"

    def test_za_to_zaf(self):
        from scripts.iso_map import resolve_country
        alpha3, _, _ = resolve_country("ZA")
        assert alpha3 == "ZAF"

    def test_br_to_bra(self):
        from scripts.iso_map import resolve_country
        alpha3, _, _ = resolve_country("BR")
        assert alpha3 == "BRA"

    def test_de_to_deu(self):
        from scripts.iso_map import resolve_country
        alpha3, _, _ = resolve_country("DE")
        assert alpha3 == "DEU"

    def test_ng_to_nga(self):
        from scripts.iso_map import resolve_country
        alpha3, _, _ = resolve_country("NG")
        assert alpha3 == "NGA"

    def test_au_to_aus(self):
        from scripts.iso_map import resolve_country
        alpha3, _, _ = resolve_country("AU")
        assert alpha3 == "AUS"

    def test_flag_code_is_lowercase_alpha2(self):
        from scripts.iso_map import resolve_country
        _, _, flag = resolve_country("US")
        assert flag == "us"

    def test_display_name_override_applied(self):
        """pycountry formal name is 'United Kingdom of Great Britain...' — must return short name."""
        from scripts.iso_map import resolve_country
        _, name, _ = resolve_country("GB")
        assert name == "United Kingdom"
        assert "Great Britain" not in name

    def test_russia_display_name_override(self):
        """pycountry formal name is 'Russian Federation' — must return 'Russia'."""
        from scripts.iso_map import resolve_country
        _, name, _ = resolve_country("RU")
        assert name == "Russia"

    def test_kosovo_xk_resolves(self):
        """Kosovo uses non-ISO code XK → XKX."""
        from scripts.iso_map import resolve_country
        result = resolve_country("XK")
        assert result is not None
        alpha3, name, flag = result
        assert alpha3 == "XKX"
        assert name == "Kosovo"
        assert flag == "xk"


# ---------------------------------------------------------------------------
# T007 — numeric parsing
# ---------------------------------------------------------------------------

class TestNumericParsing:
    """Covers T007: numeric parsing via build_dataset.parse_value."""

    def test_comma_separated_integer(self):
        from scripts.build_dataset import parse_value
        assert parse_value("32,383,920") == 32383920.0

    def test_plain_float(self):
        from scripts.build_dataset import parse_value
        assert parse_value("3.5") == 3.5

    def test_dash_na_returns_none(self):
        from scripts.build_dataset import parse_value
        assert parse_value("—N/a") is None

    def test_plain_na_returns_none(self):
        from scripts.build_dataset import parse_value
        assert parse_value("N/a") is None

    def test_empty_string_returns_none(self):
        from scripts.build_dataset import parse_value
        assert parse_value("") is None

    def test_whitespace_only_returns_none(self):
        from scripts.build_dataset import parse_value
        assert parse_value("   ") is None

    def test_non_breaking_space_stripped(self):
        from scripts.build_dataset import parse_value
        # non-breaking space (\u00a0) before/after a number
        assert parse_value("\u00a01234\u00a0") == 1234.0

    def test_percentage_sign_stripped(self):
        from scripts.build_dataset import parse_value
        assert parse_value("94.5%") == 94.5

    def test_integer_string(self):
        from scripts.build_dataset import parse_value
        assert parse_value("42") == 42.0

    def test_zero(self):
        from scripts.build_dataset import parse_value
        assert parse_value("0") == 0.0

    def test_negative_value(self):
        from scripts.build_dataset import parse_value
        # Some stats (e.g. temperature) might be negative
        assert parse_value("-5.2") == -5.2


# ---------------------------------------------------------------------------
# T008 — rank computation
# ---------------------------------------------------------------------------

class TestRankComputation:
    """Covers T008: rank computation via build_dataset.compute_ranks."""

    def _make_entries(self, values, direction="desc"):
        """Helper: build minimal entry dicts for rank testing."""
        return [
            {"id": f"C{i}", "value": v, "available": v is not None}
            for i, v in enumerate(values)
        ]

    def test_desc_rank1_is_highest(self):
        from scripts.build_dataset import compute_ranks
        entries = self._make_entries([10.0, 5.0, 1.0])
        ranked = compute_ranks(entries, direction="desc")
        ranked_by_id = {e["id"]: e for e in ranked}
        assert ranked_by_id["C0"]["rank"] == 1   # highest value
        assert ranked_by_id["C1"]["rank"] == 2
        assert ranked_by_id["C2"]["rank"] == 3

    def test_asc_rank1_is_lowest(self):
        from scripts.build_dataset import compute_ranks
        entries = self._make_entries([10.0, 5.0, 1.0])
        ranked = compute_ranks(entries, direction="asc")
        ranked_by_id = {e["id"]: e for e in ranked}
        assert ranked_by_id["C2"]["rank"] == 1   # lowest value
        assert ranked_by_id["C1"]["rank"] == 2
        assert ranked_by_id["C0"]["rank"] == 3

    def test_tied_values_same_rank(self):
        from scripts.build_dataset import compute_ranks
        entries = self._make_entries([10.0, 10.0, 5.0])
        ranked = compute_ranks(entries, direction="desc")
        ranked_by_id = {e["id"]: e for e in ranked}
        assert ranked_by_id["C0"]["rank"] == 1
        assert ranked_by_id["C1"]["rank"] == 1
        assert ranked_by_id["C0"]["tied"] is True
        assert ranked_by_id["C1"]["tied"] is True

    def test_non_tied_entry_has_tied_false(self):
        from scripts.build_dataset import compute_ranks
        entries = self._make_entries([10.0, 10.0, 5.0])
        ranked = compute_ranks(entries, direction="desc")
        ranked_by_id = {e["id"]: e for e in ranked}
        assert ranked_by_id["C2"]["tied"] is False

    def test_zero_value_sets_zero_value_flag(self):
        from scripts.build_dataset import compute_ranks
        entries = self._make_entries([5.0, 0.0, 3.0])
        ranked = compute_ranks(entries, direction="desc")
        ranked_by_id = {e["id"]: e for e in ranked}
        assert ranked_by_id["C1"]["zero_value"] is True
        assert ranked_by_id["C0"]["zero_value"] is False

    def test_unavailable_entries_excluded_from_ranking(self):
        from scripts.build_dataset import compute_ranks
        entries = [
            {"id": "A", "value": 10.0, "available": True},
            {"id": "B", "value": None, "available": False},
            {"id": "C", "value": 5.0,  "available": True},
        ]
        ranked = compute_ranks(entries, direction="desc")
        ranked_by_id = {e["id"]: e for e in ranked}
        assert ranked_by_id["B"]["rank"] is None
        assert ranked_by_id["A"]["rank"] == 1
        assert ranked_by_id["C"]["rank"] == 2

    def test_unavailable_entry_has_tied_false_and_zero_value_false(self):
        from scripts.build_dataset import compute_ranks
        entries = [
            {"id": "A", "value": None, "available": False},
        ]
        ranked = compute_ranks(entries, direction="desc")
        e = ranked[0]
        assert e["tied"] is False
        assert e["zero_value"] is False
        assert e["rank"] is None


# ---------------------------------------------------------------------------
# T009 — dataset idempotency and schema
# ---------------------------------------------------------------------------

class TestDatasetIdempotencyAndSchema:
    """Covers T009: schema validation and idempotency of build_dataset output."""

    @pytest.fixture(scope="class")
    def dataset(self, tmp_path_factory):
        """
        Build the real dataset once and return the parsed JSON.
        Skipped if processed CSVs are absent.
        """
        import subprocess, json, sys, os
        processed = "data/stats/processed"
        if not os.path.isdir(processed):
            pytest.skip("data/stats/processed not found")
        out = tmp_path_factory.mktemp("dataset") / "dataset.json"
        result = subprocess.run(
            [sys.executable, "scripts/build_dataset.py",
             "--stable-timestamp", "--output", str(out)],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            pytest.fail(f"build_dataset.py failed:\n{result.stderr}")
        with open(out) as f:
            return json.load(f)

    def test_top_level_keys_present(self, dataset):
        for key in ("generatedAt", "countryCount", "statCount", "stats"):
            assert key in dataset, f"Missing top-level key: {key}"

    def test_stats_count_at_least_14(self, dataset):
        assert dataset["statCount"] >= 14

    def test_country_count_positive(self, dataset):
        assert dataset["countryCount"] > 0

    def test_entries_sorted_by_rank_ascending(self, dataset):
        for stat_id, stat_block in dataset["stats"].items():
            entries = [e for e in stat_block["entries"] if e.get("available")]
            ranks = [e["rank"] for e in entries]
            assert ranks == sorted(ranks), (
                f"Entries for '{stat_id}' are not sorted by rank ascending"
            )

    def test_idempotency(self, tmp_path):
        """Running build_dataset twice with --stable-timestamp gives identical stats."""
        import subprocess, json, sys, os
        if not os.path.isdir("data/stats/processed"):
            pytest.skip("data/stats/processed not found")
        outs = []
        for i in range(2):
            out = tmp_path / f"dataset_{i}.json"
            subprocess.run(
                [sys.executable, "scripts/build_dataset.py",
                 "--stable-timestamp", "--output", str(out)],
                check=True, capture_output=True,
            )
            with open(out) as f:
                outs.append(json.load(f))
        assert outs[0]["stats"] == outs[1]["stats"]

    def test_each_entry_has_required_fields(self, dataset):
        required = {"id", "name", "flagCode", "value", "rank", "tied", "zeroValue", "available"}
        for stat_id, stat_block in dataset["stats"].items():
            for entry in stat_block["entries"]:
                missing = required - entry.keys()
                assert not missing, f"{stat_id}: entry {entry.get('id')} missing {missing}"
