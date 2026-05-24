# normalize_stats output

**Reference:** `area.csv` — 203 countries

---

## Skipped files

Multi-line cell values make these unparseable automatically.

- `modify_bordering_countries.csv`
- `modify_num_languages.csv`
- `modify_timezones.csv`

## Processed files

| File | Matched | Dropped | Fuzzy | Alias |
|------|--------:|--------:|------:|------:|
| `area.csv` | 205 | 1 | 0 | 0 |
| `capital_distance_from_equator.csv` | 214 | 1 | 0 | 0 |
| `elevation.csv` | 208 | 1 | 0 | 0 |
| `life_expectancy.csv` | 234 | 1 | 0 | 0 |
| `modify_HDI.csv` | 192 | 1 | 0 | 6 |
| `modify_alcohol_per_capita.csv` | 188 | 3 | 2 | 4 |
| `modify_annual_rainfall.csv` | 182 | 2 | 1 | 4 |
| `modify_co2_per_capita.csv` | 186 | 23 | 8 | 5 |
| `modify_coastline.csv` | 201 | 58 | 5 | 8 |
| `modify_corruption_index.csv` | ❌ ERROR | — | — | — |
| `modify_forest_coverage.csv` | 200 | 35 | 2 | 6 |
| `modify_gdp.csv` | 200 | 22 | 1 | 5 |
| `modify_gdp_per_capita.csv` | 200 | 24 | 6 | 4 |
| `modify_internet_speed.csv` | 151 | 2 | 0 | 4 |
| `modify_obesity_rate.csv` | 191 | 0 | 0 | 5 |
| `modify_olympic_medals.csv` | 127 | 36 | 30 | 1 |
| `modify_passport_power.csv` | 195 | 4 | 1 | 4 |
| `modify_population.csv` | 202 | 38 | 5 | 5 |
| `modify_population_density.csv` | 0 | 246 | 0 | 0 |
| `modify_temperature.csv` | ❌ ERROR | — | — | — |

## Per-file detail

### `area.csv`

**Dropped (no match):**

- `Namibia`

### `capital_distance_from_equator.csv`

**Dropped (no match):**

- `Namibia`

### `elevation.csv`

**Dropped (no match):**

- `Namibia`

### `life_expectancy.csv`

**Dropped (no match):**

- `Namibia`

### `modify_HDI.csv`

**Alias matches:**

- `Netherlands` → `kingdom of the netherlands`
- `Czechia` → `czech republic`
- `Bahamas` → `the bahamas`
- `China` → `people's republic of china`
- `Micronesia` → `federated states of micronesia`
- `Gambia` → `the gambia`

**Dropped (no match):**

- `Hong Kong`

### `modify_alcohol_per_capita.csv`

**Alias matches:**

- `Bahamas` → `the bahamas`
- `China` → `people's republic of china`
- `Gambia` → `the gambia`
- `Netherlands` → `kingdom of the netherlands`

**Fuzzy matches:**

- `Congo` → `democratic republic of the congo` (score 90)
- `Macedonia` → `north macedonia` (score 90)

**Dropped (no match):**

- `DR Congo (duplicate isoCode CD)`
- `Netherlands Antilles`
- `New Caledonia`

### `modify_annual_rainfall.csv`

**Alias matches:**

- `Bahamas` → `the bahamas`
- `Gambia` → `the gambia`
- `Netherlands` → `kingdom of the netherlands`
- `China` → `people's republic of china`

**Fuzzy matches:**

- `Congo` → `democratic republic of the congo` (score 90)

**Dropped (no match):**

- `Puerto Rico`
- `DR Congo (duplicate isoCode CD)`

### `modify_co2_per_capita.csv`

**Alias matches:**

- `China` → `people's republic of china`
- `Netherlands` → `kingdom of the netherlands`
- `Bahamas` → `the bahamas`
- `East Timor` → `timor-leste`
- `Gambia` → `the gambia`

**Fuzzy matches:**

- `Saint Pierre and Miquelon` → `saint lucia` (score 86)
- `Italy (including San Marino and Vatican City)` → `san marino` (score 90)
- `Spain (including Andorra)` → `spain` (score 90)
- `France (including Monaco)` → `france` (score 90)
- `Switzerland (including Liechtenstein)` → `switzerland` (score 90)
- `Turks and Caicos Islands` → `solomon islands` (score 86)
- `Congo` → `democratic republic of the congo` (score 90)
- `Sudan
 South Sudan` → `sudan` (score 90)

**Dropped (no match):**

- `World`
- `European Union`
- `New Caledonia`
- `Gibraltar`
- `Falkland Islands`
- `Bermuda`
- `Cayman Islands`
- `Hong Kong`
- `Saint Helena, Ascension and Tristan da Cunha (duplicate isoCode BA)`
- `Macao`
- `French Polynesia`
- `Puerto Rico`
- `Martinique`
- `Réunion`
- `Guadeloupe`
- `British Virgin Islands (duplicate isoCode CK)`
- `Saint Lucia (duplicate isoCode LC)`
- `Anguilla`
- `French Guiana`
- `Solomon Islands (duplicate isoCode SB)`
- `Western Sahara`
- `Faroe Islands`
- `Democratic Republic of the Congo (duplicate isoCode CD)`

### `modify_coastline.csv`

**Alias matches:**

- `China` → `people's republic of china`
- `Micronesia` → `federated states of micronesia`
- `Bahamas` → `the bahamas`
- `Netherlands` → `kingdom of the netherlands`
- `Congo, Republic of the` → `republic of the congo`
- `Gambia` → `the gambia`
- `Congo, Democratic Republic of the` → `democratic republic of the congo`
- `Swaziland` → `eswatini`

**Fuzzy matches:**

- `Greenland (Denmark)` → `greenland` (score 90)
- `Curaçao (Netherlands)` → `curaçao` (score 90)
- `Aruba (Netherlands)` → `aruba` (score 90)
- `Gaza Strip (Palestine)` → `palestine` (score 90)
- `Sint Maarten (Netherlands)` → `sint maarten` (score 90)

**Dropped (no match):**

- `World`
- `European Union`
- `Antarctica (Disputed)`
- `Svalbard (Norway) (duplicate isoCode NO)`
- `Coral Sea Islands (Australia) (duplicate isoCode AU)`
- `French Southern and Antarctic Lands (France) (duplicate isoCode FR)`
- `French Polynesia (France) (duplicate isoCode FR)`
- `New Caledonia (France) (duplicate isoCode FR)`
- `Northern Mariana Islands (United States) (duplicate isoCode US)`
- `Falkland Islands (United Kingdom) (duplicate isoCode GB)`
- `Faroe Islands (Denmark) (duplicate isoCode DK)`
- `Spratly Islands (Disputed) (duplicate isoCode SB)`
- `Hong Kong (China)`
- `British Indian Ocean Territory (United Kingdom) (duplicate isoCode GB)`
- `Paracel Islands (Disputed) (duplicate isoCode SB)`
- `Puerto Rico (United States) (duplicate isoCode US)`
- `Turks and Caicos Islands (United Kingdom) (duplicate isoCode GB)`
- `U.S. Virgin Islands (United States) (duplicate isoCode US)`
- `Cayman Islands (United Kingdom) (duplicate isoCode GB)`
- `Isle of Man (United Kingdom) (duplicate isoCode GB)`
- `Christmas Island (Australia) (duplicate isoCode AU)`
- `Wallis and Futuna (France) (duplicate isoCode FR)`
- `Guam (United States) (duplicate isoCode US)`
- `Jan Mayen (Norway) (duplicate isoCode NO)`
- `Cook Islands (New Zealand) (duplicate isoCode NZ)`
- `Saint Pierre and Miquelon (France) (duplicate isoCode FR)`
- `American Samoa (United States) (duplicate isoCode US)`
- `Bermuda (United Kingdom) (duplicate isoCode GB)`
- `Heard Island and McDonald Islands (Australia) (duplicate isoCode AU)`
- `Tokelau (New Zealand) (duplicate isoCode NZ)`
- `Saint Helena, Ascension and Tristan da Cunha (United Kingdom) (duplicate isoCode GB)`
- `United States Pacific Island Wildlife Refuges (United States) (duplicate isoCode US)`
- `Akrotiri and Dhekelia (United Kingdom) (duplicate isoCode GB)`
- `British Virgin Islands (United Kingdom) (duplicate isoCode GB)`
- `Ashmore and Cartier Islands (Australia) (duplicate isoCode AU)`
- `Jersey (United Kingdom) (duplicate isoCode GB)`
- `Niue (New Zealand) (duplicate isoCode NZ)`
- `Anguilla (United Kingdom) (duplicate isoCode GB)`
- `Saint Martin (Netherlands) (duplicate isoCode LC)`
- `Pitcairn Islands (United Kingdom) (duplicate isoCode GB)`
- `Guernsey (United Kingdom) (duplicate isoCode GB)`
- `Macau (China)`
- `Montserrat (United Kingdom) (duplicate isoCode GB)`
- `Norfolk Island (Australia) (duplicate isoCode AU)`
- `Bouvet Island (Norway) (duplicate isoCode NO)`
- `Cocos (Keeling) Islands (Australia) (duplicate isoCode AU)`
- `Wake Island (United States) (duplicate isoCode US)`
- `Gibraltar (United Kingdom) (duplicate isoCode GB)`
- `Clipperton Island (France) (duplicate isoCode FR)`
- `Navassa Island (Disputed)`
- `Saint Barthélemy (France) (duplicate isoCode FR)`
- `South Georgia and the South Sandwich Islands (United Kingdom) (duplicate isoCode GB)`
- `West Bank (Palestine) (duplicate isoCode PS)`
- `French Guiana (France) (duplicate isoCode FR)`
- `Guadeloupe (France) (duplicate isoCode FR)`
- `Martinique (France) (duplicate isoCode FR)`
- `Caribbean Netherlands (Netherlands)`
- `Réunion (France) (duplicate isoCode FR)`

### `modify_corruption_index.csv`

> **Error:** country_col 'Nation or Territory' not in columns: ['2025 scores #', 'Nation\xa0or\xa0Territory', 'Corruption index (*)', 'Rank Change']

### `modify_forest_coverage.csv`

**Alias matches:**

- `Micronesia` → `federated states of micronesia`
- `Sao Tome and Principe` → `são tomé and príncipe`
- `Bahamas` → `the bahamas`
- `China` → `people's republic of china`
- `Gambia` → `the gambia`
- `Netherlands` → `kingdom of the netherlands`

**Fuzzy matches:**

- `American Samoa` → `samoa` (score 90)
- `Congo` → `democratic republic of the congo` (score 90)

**Dropped (no match):**

- `World`
- `French Guiana`
- `Pitcairn`
- `Anguilla`
- `Samoa (duplicate isoCode WS)`
- `US Virgin Islands`
- `Puerto Rico`
- `Democratic Republic of the Congo (duplicate isoCode CD)`
- `Northern Mariana Islands (duplicate isoCode SB)`
- `Cayman Islands`
- `Guam`
- `Martinique`
- `New Caledonia`
- `Guadeloupe`
- `French Polynesia`
- `Wallis and Futuna Islands (duplicate isoCode SB)`
- `Réunion`
- `Mayotte`
- `Montserrat`
- `Saint Martin (duplicate isoCode VC)`
- `British Virgin Islands (duplicate isoCode CK)`
- `Bermuda`
- `Norfolk Island`
- `Turks and Caicos Islands (duplicate isoCode SB)`
- `Saint Barthélemy (duplicate isoCode VC)`
- `Isle of Man (duplicate isoCode CN)`
- `Caribbean Netherlands`
- `Channel Islands`
- `Saint Pierre and Miquelon (duplicate isoCode LC)`
- `Saint Helena, Ascension and Tristan da Cunha (duplicate isoCode BA)`
- `Western Sahara`
- `Faroe Islands`
- `Falkland Islands`
- `Gibraltar`
- `Tokelau`

### `modify_gdp.csv`

**Alias matches:**

- `China` → `people's republic of china`
- `Netherlands` → `kingdom of the netherlands`
- `DR Congo` → `democratic republic of the congo`
- `Bahamas` → `the bahamas`
- `Gambia` → `the gambia`

**Fuzzy matches:**

- `U.S. Virgin Islands` → `cook islands` (score 86)

**Dropped (no match):**

- `World`
- `Hong Kong`
- `Puerto Rico`
- `Macau`
- `Congo (duplicate isoCode CD)`
- `Channel Islands`
- `Bermuda`
- `New Caledonia`
- `Cayman Islands`
- `Isle of Man (duplicate isoCode CN)`
- `Guam`
- `French Polynesia`
- `Faroe Islands`
- `Zanzibar`
- `British Virgin Islands (duplicate isoCode CK)`
- `Turks and Caicos Islands (duplicate isoCode SB)`
- `Northern Mariana Islands (duplicate isoCode SB)`
- `American Samoa (duplicate isoCode WS)`
- `Saint Martin (duplicate isoCode VC)`
- `Anguilla`
- `Cook Islands (duplicate isoCode CK)`
- `Montserrat`

### `modify_gdp_per_capita.csv`

**Alias matches:**

- `Netherlands` → `kingdom of the netherlands`
- `Bahamas` → `the bahamas`
- `Sint Maarten (Dutch part)` → `sint maarten`
- `Gambia` → `the gambia`

**Fuzzy matches:**

- `Isle of Man` → `people's republic of china` (score 86)
- `U.S. Virgin Islands` → `cook islands` (score 86)
- `Turks and Caicos Islands` → `solomon islands` (score 86)
- `Saint Martin (French part)` → `saint lucia` (score 86)
- `American Samoa` → `samoa` (score 90)
- `Congo` → `democratic republic of the congo` (score 90)

**Dropped (no match):**

- `Bermuda`
- `Cayman Islands`
- `Macau`
- `Channel Islands`
- `Faroe Islands`
- `Hong Kong`
- `European Union`
- `Guam`
- `Puerto Rico`
- `British Virgin Islands (duplicate isoCode CK)`
- `New Caledonia`
- `Anguilla`
- `Cook Islands (duplicate isoCode CK)`
- `Northern Mariana Islands (duplicate isoCode SB)`
- `French Polynesia`
- `Montserrat`
- `Saint Lucia (duplicate isoCode LC)`
- `China (duplicate isoCode CN)`
- `World`
- `Samoa (duplicate isoCode WS)`
- `Solomon Islands (duplicate isoCode SB)`
- `Zanzibar`
- `DR Congo (duplicate isoCode CD)`
- `Notes:
Data unavailable for the Falkland Islands, Gibraltar, Guernsey, the Holy See (Vatican City), Jersey, Niue, the Pitcairn Islands, Saint Helena, Ascension and Tristan da Cunha, Tokelau, and Western Sahara.
Nearly all country links in the table (except that of Zanzibar) take to articles titled "Income in country or territory" or to "Economy of country or territory".`

### `modify_internet_speed.csv`

**Alias matches:**

- `Netherlands` → `kingdom of the netherlands`
- `China` → `people's republic of china`
- `Bahamas` → `the bahamas`
- `DR Congo` → `democratic republic of the congo`

**Dropped (no match):**

- `Hong Kong`
- `Macau`

### `modify_obesity_rate.csv`

**Alias matches:**

- `Micronesia` → `federated states of micronesia`
- `Netherlands` → `kingdom of the netherlands`
- `China` → `people's republic of china`
- `DR Congo` → `democratic republic of the congo`
- `East Timor` → `timor-leste`

### `modify_olympic_medals.csv`

**Alias matches:**

- `Bahamas` → `the bahamas`

**Fuzzy matches:**

- `Australia[AUS][Z]` → `australia` (score 90)
- `Barbados[BAR]` → `barbados` (score 90)
- `Chile[I]` → `chile` (score 90)
- `Cuba[Z]` → `cuba` (score 90)
- `Czechoslovakia[TCH]` → `slovakia` (score 90)
- `Egypt[EGY][Z]` → `egypt` (score 90)
- `France[O][P][Z]` → `france` (score 90)
- `Germany[GER][Z]` → `germany` (score 90)
- `Ghana[GHA]` → `ghana` (score 90)
- `Guyana[GUY]` → `guyana` (score 90)
- `Haiti[J]` → `haiti` (score 90)
- `India[F]` → `india` (score 90)
- `Iran[K]` → `iran` (score 90)
- `Italy[M][S]` → `italy` (score 90)
- `Jamaica[JAM]` → `jamaica` (score 90)
- `Luxembourg[O]` → `luxembourg` (score 87)
- `Malaysia[MAS]` → `malaysia` (score 90)
- `North Macedonia (MKD)` → `north macedonia` (score 95)
- `Norway[Q]` → `norway` (score 90)
- `Peru[L]` → `peru` (score 90)
- `Russia[RUS]` → `russia` (score 90)
- `Serbia[SRB]` → `serbia` (score 90)
- `Spain[Z]` → `spain` (score 90)
- `Sri Lanka[SRI]` → `sri lanka` (score 90)
- `Sweden[Z]` → `sweden` (score 90)
- `Tanzania[TAN]` → `tanzania` (score 90)
- `Trinidad and Tobago[TTO]` → `trinidad and tobago` (score 88)
- `United States[P][Q][R][Z][F]` → `united states` (score 90)
- `Zambia[ZAM]` → `zambia` (score 90)
- `Zimbabwe[ZIM]` → `zimbabwe` (score 90)

**Dropped (no match):**

- `Australasia[ANZ]`
- `Bermuda`
- `Bohemia[BOH][Z]`
- `British West Indies[BWI]`
- `Bulgaria[H]`
- `China[CHN]`
- `Ivory Coast[CIV]`
- `Czech Republic[CZE]`
- `Denmark[Z]`
- `Djibouti[B]`
- `United Team of Germany[EUA] (duplicate isoCode DE)`
- `East Germany[GDR] (duplicate isoCode DE)`
- `West Germany[FRG] (duplicate isoCode DE)`
- `Great Britain[GBR][Z]`
- `Hong Kong[HKG]`
- `Netherlands[Z]`
- `Netherlands Antilles[AHO][I]`
- `New Zealand[NZL]`
- `Puerto Rico`
- `Refugee Olympic Team`
- `Russian Empire[RU1] (duplicate isoCode RU)`
- `Soviet Union[URS]`
- `Unified Team[EUN]`
- `Olympic Athletes from Russia[OAR] (duplicate isoCode RU)`
- `ROC (ROC)[ROC]`
- `Serbia and Montenegro[YUG/SCG] (duplicate isoCode RS)`
- `Slovakia[SVK] (duplicate isoCode SK)`
- `Suriname[E]`
- `Chinese Taipei[TPE][TPE2]`
- `Virgin Islands`
- `Yugoslavia[YUG to 1992]`
- `Individual Neutral Athletes[AIN]`
- `Independent Olympic Athletes[IOA]`
- `Independent Olympic Participants[IOP]`
- `Mixed team[ZZX]`
- `Totals`

### `modify_passport_power.csv`

**Alias matches:**

- `Netherlands` → `kingdom of the netherlands`
- `Bahamas` → `the bahamas`
- `China` → `people's republic of china`
- `Gambia` → `the gambia`

**Fuzzy matches:**

- `Congo` → `democratic republic of the congo` (score 90)

**Dropped (no match):**

- `Hong Kong`
- `Macau`
- `DR Congo (duplicate isoCode CD)`
- `Palestinian Authority`

### `modify_population.csv`

**Alias matches:**

- `China` → `people's republic of china`
- `Netherlands` → `kingdom of the netherlands`
- `Gambia` → `the gambia`
- `Bahamas` → `the bahamas`
- `Micronesia` → `federated states of micronesia`

**Fuzzy matches:**

- `Curaçao (Netherlands)` → `curaçao` (score 90)
- `Aruba (Netherlands)` → `aruba` (score 90)
- `Cayman Islands (UK)` → `cook islands` (score 86)
- `Greenland (Denmark)` → `greenland` (score 90)
- `Sint Maarten (Netherlands)` → `sint maarten` (score 90)

**Dropped (no match):**

- `World`
- `Hong Kong (China)`
- `Puerto Rico (US)`
- `Macau (China)`
- `Western Sahara (disputed)`
- `Northern Cyprus (duplicate isoCode CY)`
- `Transnistria`
- `French Polynesia (France) (duplicate isoCode FR)`
- `New Caledonia (France) (duplicate isoCode FR)`
- `Abkhazia`
- `Guam (US)`
- `Jersey (UK)`
- `U.S. Virgin Islands (US) (duplicate isoCode SB)`
- `Isle of Man (UK) (duplicate isoCode CN)`
- `Guernsey (UK)`
- `Bermuda (UK)`
- `South Ossetia`
- `Faroe Islands (Denmark) (duplicate isoCode DK)`
- `Turks and Caicos Islands (UK) (duplicate isoCode SB)`
- `American Samoa (US) (duplicate isoCode WS)`
- `Northern Mariana Islands (US) (duplicate isoCode SB)`
- `British Virgin Islands (UK) (duplicate isoCode SB)`
- `Gibraltar (UK)`
- `Saint Martin (France) (duplicate isoCode FR)`
- `Anguilla (UK)`
- `Cook Islands (New Zealand) (duplicate isoCode NZ)`
- `Wallis and Futuna (France) (duplicate isoCode FR)`
- `Saint Barthélemy (France) (duplicate isoCode FR)`
- `Saint Pierre and Miquelon (France) (duplicate isoCode FR)`
- `Saint Helena, Ascension and Tristan da Cunha (UK) (duplicate isoCode BA)`
- `Montserrat (UK)`
- `Falkland Islands (UK) (duplicate isoCode CK)`
- `Tokelau (New Zealand) (duplicate isoCode NZ)`
- `Norfolk Island (Australia) (duplicate isoCode AU)`
- `Christmas Island (Australia) (duplicate isoCode AU)`
- `Niue (New Zealand) (duplicate isoCode NZ)`
- `Cocos (Keeling) Islands (Australia) (duplicate isoCode AU)`
- `Pitcairn Islands (UK) (duplicate isoCode CK)`

### `modify_population_density.csv`

**Dropped (no match):**

- `55`
- `21,826`
- `19,000`
- `8,290`
- `7,062`
- `5,800`
- `2,034`
- `1,800`
- `1,759`
- `1,686`
- `1,333`
- `1,275`
- `1,197`
- `892`
- `891`
- `867`
- `657`
- `656`
- `637`
- `600`
- `597`
- `578`
- `568`
- `563`
- `560`
- `547`
- `541`
- `530`
- `523`
- `488`
- `468`
- `466`
- `427`
- `418`
- `389`
- `385`
- `373`
- `366`
- `345`
- `340`
- `322`
- `311`
- `310`
- `309`
- `306`
- `295`
- `294`
- `289`
- `285`
- `284`
- `277`
- `273`
- `265`
- `263`
- `262`
- `261`
- `258`
- `255`
- `251`
- `249`
- `249`
- `245`
- `243`
- `242`
- `237`
- `234`
- `230`
- `226`
- `220`
- `213`
- `209`
- `207`
- `201`
- `180`
- `175`
- `174`
- `172`
- `169`
- `166`
- `166`
- `162`
- `162`
- `156`
- `155`
- `154`
- `151`
- `151`
- `150`
- `149`
- `148`
- `147`
- `146`
- `145`
- `140`
- `139`
- `133`
- `130`
- `130`
- `128`
- `126`
- `125`
- `122`
- `120`
- `117`
- `117`
- `115`
- `114`
- `114`
- `111`
- `108`
- `106`
- `106`
- `105`
- `104`
- `102`
- `100`
- `100`
- `100`
- `99`
- `97`
- `96`
- `96`
- `97`
- `94`
- `92`
- `89`
- `88`
- `88`
- `88`
- `86`
- `85`
- `84`
- `83`
- `83`
- `81`
- `81`
- `79`
- `78`
- `78`
- `78`
- `77`
- `77`
- `77`
- `76`
- `76`
- `73`
- `72`
- `72`
- `72`
- `69`
- `67`
- `67`
- `65`
- `65`
- `62`
- `62`
- `62`
- `61`
- `61`
- `60`
- `58`
- `57`
- `57`
- `56`
- `55`
- `55`
- `53`
- `53`
- `51`
- `50`
- `49`
- `48`
- `48`
- `47`
- `46`
- `45`
- `44`
- `44`
- `43`
- `43`
- `40`
- `40`
- `38`
- `37`
- `37`
- `35`
- `34`
- `32`
- `32`
- `30`
- `30`
- `30`
- `29`
- `29`
- `29`
- `28`
- `27`
- `27`
- `27`
- `27`
- `26`
- `25`
- `24`
- `23`
- `21`
- `21`
- `20`
- `20`
- `20`
- `20`
- `19`
- `19`
- `19`
- `18`
- `18`
- `17`
- `17`
- `17`
- `16`
- `16`
- `16`
- `16`
- `15`
- `14`
- `13`
- `13`
- `11`
- `9.9`
- `8.6`
- `8.6`
- `7.6`
- `7.0`
- `5.0`
- `4.5`
- `4.4`
- `4.2`
- `4.2`
- `4.0`
- `3.9`
- `3.7`
- `3.5`
- `2.2`
- `2.2`
- `0.85`
- `0.29`
- `0.026`

### `modify_temperature.csv`

> **Error:** country_col 'Country or region' not in columns: ['Unnamed: 0', '"Country or region"', 'Continent', 'Avarage Temperature (*)']

