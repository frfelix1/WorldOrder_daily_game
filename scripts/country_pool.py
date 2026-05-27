"""
Country pool for puzzle generation — all countries present in the source data.

COUNTRY_POOL contains every ISO 3166-1 alpha-2 code (uppercase) that appears
in at least one of the 17 processed CSVs under data/stats/processed/.  This
covers 202 entries, from large nations to small island states, suitable for
a geography-enthusiast audience.

XK (Kosovo) uses the widely-recognised but non-ISO alpha-2 code and maps to
XKX in iso_map.py.
"""

COUNTRY_POOL: list[str] = [
    # A
    "AD",  # Andorra
    "AE",  # United Arab Emirates
    "AF",  # Afghanistan
    "AG",  # Antigua and Barbuda
    "AL",  # Albania
    "AM",  # Armenia
    "AO",  # Angola
    "AR",  # Argentina
    "AT",  # Austria
    "AU",  # Australia
    "AW",  # Aruba
    "AZ",  # Azerbaijan
    # B
    "BA",  # Bosnia and Herzegovina
    "BB",  # Barbados
    "BD",  # Bangladesh
    "BE",  # Belgium
    "BF",  # Burkina Faso
    "BG",  # Bulgaria
    "BH",  # Bahrain
    "BI",  # Burundi
    "BJ",  # Benin
    "BN",  # Brunei
    "BO",  # Bolivia
    "BR",  # Brazil
    "BS",  # Bahamas
    "BT",  # Bhutan
    "BW",  # Botswana
    "BY",  # Belarus
    "BZ",  # Belize
    # C
    "CA",  # Canada
    "CD",  # DR Congo
    "CF",  # Central African Republic
    "CG",  # Republic of Congo
    "CH",  # Switzerland
    "CI",  # Ivory Coast
    "CK",  # Cook Islands
    "CL",  # Chile
    "CM",  # Cameroon
    "CN",  # China
    "CO",  # Colombia
    "CR",  # Costa Rica
    "CU",  # Cuba
    "CV",  # Cape Verde
    "CW",  # Curaçao
    "CY",  # Cyprus
    "CZ",  # Czech Republic
    # D
    "DE",  # Germany
    "DJ",  # Djibouti
    "DK",  # Denmark
    "DM",  # Dominica
    "DO",  # Dominican Republic
    "DZ",  # Algeria
    # E
    "EC",  # Ecuador
    "EE",  # Estonia
    "EG",  # Egypt
    "ER",  # Eritrea
    "ES",  # Spain
    "ET",  # Ethiopia
    # F
    "FI",  # Finland
    "FJ",  # Fiji
    "FM",  # Micronesia
    "FR",  # France
    # G
    "GA",  # Gabon
    "GB",  # United Kingdom
    "GD",  # Grenada
    "GE",  # Georgia
    "GH",  # Ghana
    "GL",  # Greenland
    "GM",  # Gambia
    "GN",  # Guinea
    "GQ",  # Equatorial Guinea
    "GR",  # Greece
    "GT",  # Guatemala
    "GW",  # Guinea-Bissau
    "GY",  # Guyana
    # H
    "HN",  # Honduras
    "HR",  # Croatia
    "HT",  # Haiti
    "HU",  # Hungary
    # I
    "ID",  # Indonesia
    "IE",  # Ireland
    "IL",  # Israel
    "IN",  # India
    "IQ",  # Iraq
    "IR",  # Iran
    "IS",  # Iceland
    "IT",  # Italy
    # J
    "JM",  # Jamaica
    "JO",  # Jordan
    "JP",  # Japan
    # K
    "KE",  # Kenya
    "KG",  # Kyrgyzstan
    "KH",  # Cambodia
    "KI",  # Kiribati
    "KM",  # Comoros
    "KN",  # Saint Kitts and Nevis
    "KP",  # North Korea
    "KR",  # South Korea
    "KW",  # Kuwait
    "KZ",  # Kazakhstan
    # L
    "LA",  # Laos
    "LB",  # Lebanon
    "LC",  # Saint Lucia
    "LI",  # Liechtenstein
    "LK",  # Sri Lanka
    "LR",  # Liberia
    "LS",  # Lesotho
    "LT",  # Lithuania
    "LU",  # Luxembourg
    "LV",  # Latvia
    "LY",  # Libya
    # M
    "MA",  # Morocco
    "MC",  # Monaco
    "MD",  # Moldova
    "ME",  # Montenegro
    "MG",  # Madagascar
    "MH",  # Marshall Islands
    "MK",  # North Macedonia
    "ML",  # Mali
    "MM",  # Myanmar
    "MN",  # Mongolia
    "MR",  # Mauritania
    "MT",  # Malta
    "MU",  # Mauritius
    "MV",  # Maldives
    "MW",  # Malawi
    "MX",  # Mexico
    "MY",  # Malaysia
    "MZ",  # Mozambique
    # N
    "NE",  # Niger
    "NG",  # Nigeria
    "NI",  # Nicaragua
    "NL",  # Netherlands
    "NO",  # Norway
    "NP",  # Nepal
    "NR",  # Nauru
    "NU",  # Niue
    "NZ",  # New Zealand
    # O
    "OM",  # Oman
    # P
    "PA",  # Panama
    "PE",  # Peru
    "PG",  # Papua New Guinea
    "PH",  # Philippines
    "PK",  # Pakistan
    "PL",  # Poland
    "PS",  # Palestine
    "PT",  # Portugal
    "PW",  # Palau
    "PY",  # Paraguay
    # Q
    "QA",  # Qatar
    # R
    "RO",  # Romania
    "RS",  # Serbia
    "RU",  # Russia
    "RW",  # Rwanda
    # S
    "SA",  # Saudi Arabia
    "SB",  # Solomon Islands
    "SC",  # Seychelles
    "SD",  # Sudan
    "SE",  # Sweden
    "SG",  # Singapore
    "SI",  # Slovenia
    "SK",  # Slovakia
    "SL",  # Sierra Leone
    "SM",  # San Marino
    "SN",  # Senegal
    "SO",  # Somalia
    "SR",  # Suriname
    "SS",  # South Sudan
    "ST",  # Sao Tome and Principe
    "SV",  # El Salvador
    "SX",  # Sint Maarten
    "SY",  # Syria
    "SZ",  # Eswatini
    # T
    "TD",  # Chad
    "TG",  # Togo
    "TH",  # Thailand
    "TJ",  # Tajikistan
    "TL",  # East Timor
    "TM",  # Turkmenistan
    "TN",  # Tunisia
    "TO",  # Tonga
    "TR",  # Turkey
    "TT",  # Trinidad and Tobago
    "TV",  # Tuvalu
    "TW",  # Taiwan
    "TZ",  # Tanzania
    # U
    "UA",  # Ukraine
    "UG",  # Uganda
    "US",  # United States
    "UY",  # Uruguay
    "UZ",  # Uzbekistan
    # V
    "VA",  # Vatican City
    "VC",  # Saint Vincent and the Grenadines
    "VE",  # Venezuela
    "VN",  # Vietnam
    "VU",  # Vanuatu
    # W
    "WS",  # Samoa
    # X
    "XK",  # Kosovo (non-ISO code, maps to XKX in iso_map.py)
    # Y
    "YE",  # Yemen
    # Z
    "ZA",  # South Africa
    "ZM",  # Zambia
    "ZW",  # Zimbabwe
]
