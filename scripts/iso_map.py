"""
ISO alpha-2 to alpha-3 country code mapping with curated display-name overrides.

Provides:
  - ALPHA2_TO_ALPHA3: programmatic lookup dict built from pycountry
  - DISPLAY_NAME_OVERRIDES: short/common names keyed by alpha-3
  - resolve_country(alpha2) -> (alpha3, display_name, flag_code) | None
"""

import logging
import pycountry

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Programmatic lookup: alpha-2 (uppercase) -> alpha-3 (uppercase)
# Built from pycountry at import time, with manual entries for codes that
# pycountry does not recognise (e.g. Kosovo XK → XKX).
# ---------------------------------------------------------------------------
ALPHA2_TO_ALPHA3: dict[str, str] = {
    c.alpha_2: c.alpha_3
    for c in pycountry.countries
}
# Non-standard codes used by source data but absent from ISO 3166-1
ALPHA2_TO_ALPHA3["XK"] = "XKX"   # Kosovo

# ---------------------------------------------------------------------------
# Curated display-name overrides.
# Keyed by alpha-3; values are the short/common names used in the game.
# pycountry uses formal names (e.g. "United Kingdom of Great Britain and
# Northern Ireland") which are unsuitable for the UI.
# ---------------------------------------------------------------------------
DISPLAY_NAME_OVERRIDES: dict[str, str] = {
    # Formal pycountry names are too long or differ from common usage
    "GBR": "United Kingdom",
    "RUS": "Russia",
    "USA": "United States",
    "KOR": "South Korea",
    "PRK": "North Korea",
    "IRN": "Iran",
    "VNM": "Vietnam",
    "BOL": "Bolivia",
    "VEN": "Venezuela",
    "MDA": "Moldova",
    "TWN": "Taiwan",
    "TZA": "Tanzania",
    "COD": "DR Congo",
    "MKD": "North Macedonia",
    "PSE": "Palestine",
    "SYR": "Syria",
    "LAO": "Laos",
    "CIV": "Ivory Coast",
    "ARE": "United Arab Emirates",
    "SAU": "Saudi Arabia",
    "CZE": "Czech Republic",
    "SVK": "Slovakia",
    "BIH": "Bosnia and Herzegovina",
    "TTO": "Trinidad and Tobago",
    "PNG": "Papua New Guinea",
    "CAF": "Central African Republic",
    "COG": "Republic of Congo",
    "SLB": "Solomon Islands",
    "CPV": "Cape Verde",
    "STP": "Sao Tome and Principe",
    "ATG": "Antigua and Barbuda",
    "KNA": "Saint Kitts and Nevis",
    "LCA": "Saint Lucia",
    "VCT": "Saint Vincent and the Grenadines",
    "FSM": "Micronesia",
    "MHL": "Marshall Islands",
    "SSD": "South Sudan",
    "TLS": "East Timor",
    "SWZ": "Eswatini",
    "GMB": "Gambia",
    "GNB": "Guinea-Bissau",
    "GNQ": "Equatorial Guinea",
    # Non-ISO / special territories
    "XKX": "Kosovo",
    "GRL": "Greenland",
    "CUW": "Curaçao",
    "SXM": "Sint Maarten",
    "ABW": "Aruba",
    "VAT": "Vatican City",
    "NIU": "Niue",
    "COK": "Cook Islands",
}


def resolve_country(alpha2: str) -> tuple[str, str, str] | None:
    """
    Resolve a 2-letter ISO code to (alpha3, display_name, flag_code).

    - alpha2 is normalised to uppercase before lookup.
    - display_name comes from DISPLAY_NAME_OVERRIDES if present, otherwise
      from pycountry's ``name`` attribute.
    - flag_code is alpha2 lowercased (used for emoji/flag rendering).
    - Returns None and logs a warning for unknown codes.
    """
    code = alpha2.upper()
    alpha3 = ALPHA2_TO_ALPHA3.get(code)
    if alpha3 is None:
        logger.warning("Unknown alpha-2 code: %r — row skipped", alpha2)
        return None

    country = pycountry.countries.get(alpha_3=alpha3)
    raw_name = country.name if country else alpha3
    display_name = DISPLAY_NAME_OVERRIDES.get(alpha3, raw_name)
    flag_code = code.lower()

    return (alpha3, display_name, flag_code)
