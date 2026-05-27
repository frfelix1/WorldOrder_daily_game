# Stat Categories and Data Sources

This document lists all candidate stat categories and individual stats for WorldOrder puzzles, along with the recommended primary data source for each. Wikipedia is the default source where it maintains a reliable list article — it provides stable, human-readable tables that are easy to scrape or reference manually. Alternative sources are noted where Wikipedia coverage is thin or unreliable.

For each stat the direction column indicates the natural ranking direction used in puzzle generation (`desc` = highest value ranks first, `asc` = lowest value ranks first).

---

## Size / Geography

| Stat | Direction | Primary Source | Notes |
|------|-----------|----------------|-------|
| Total land area (km²) | desc | Wikipedia — "List of countries and dependencies by area" | Land area only, excluding inland water bodies |
| Coastline length (km) | desc | Wikipedia — "List of countries by length of coastline" | Sourced from CIA World Factbook; landlocked countries have 0 and should be excluded from this stat |
| Number of time zones | desc | Wikipedia — "List of time zones by country" | Count distinct IANA zones per country, including overseas territories |
| Highest point elevation (m) | desc | Wikipedia — "List of countries by highest point" | Good coverage; values are well-cited |
| Distance from equator (km) | desc | Wikipedia — geographic coordinates of each country's geographic centre or capital | Distance is derived: convert latitude of geographic centre to km (1° ≈ 111 km). Geographic centres are listed on each country's Wikipedia article or on "Geographical midpoint" articles |

---

## People

| Stat | Direction | Primary Source | Notes |
|------|-----------|----------------|-------|
| Population | desc | Wikipedia — "List of countries and dependencies by population" | Figures updated frequently; note the estimate year used |
| Population density (per km²) | desc | Wikipedia — "List of countries and dependencies by population density" | Use land area for consistency |
| Median age (years) | desc | Wikipedia — "List of countries by median age" | Data from CIA World Factbook via Wikipedia |
| Life expectancy (years) | desc | Wikipedia — "List of countries by life expectancy" | WHO / World Bank data aggregated on Wikipedia |
| Urbanization rate (% urban population) | desc | Wikipedia — "List of countries by urbanization rate" | UN data; note reference year |

---

## Economy

| Stat | Direction | Primary Source | Notes |
|------|-----------|----------------|-------|
| GDP total, nominal (USD) | desc | Wikipedia — "List of countries by GDP (nominal)" | Use IMF or World Bank column consistently; note year |
| GDP per capita, nominal (USD) | desc | Wikipedia — "List of countries by GDP (nominal) per capita" | Same source columns as above |
| Tourism revenue (USD) | desc | Wikipedia — "World Tourism rankings" | UNWTO data; coverage is good for major economies, patchier for smaller ones |
| Military spending % of GDP | desc | Wikipedia — "List of countries by military expenditures" | SIPRI data aggregated on Wikipedia; note reference year |

---

## Nature / Environment

| Stat | Direction | Primary Source | Notes |
|------|-----------|----------------|-------|
| Forest coverage (% of land area) | desc | Wikipedia — "List of countries by forest area" | FAO data; note reference year (Global Forest Resources Assessment cycles) |
| CO₂ emissions per capita (tonnes) | desc | Wikipedia — "List of countries by carbon dioxide emissions per capita" | Our World in Data / IEA figures aggregated on Wikipedia; note year carefully as values shift significantly |
| Average annual rainfall (mm) | desc | Wikipedia — "List of countries by average annual precipitation" | Data varies by source; cross-check with FAO AQUASTAT if Wikipedia figures look inconsistent |

---

## Culture / Misc

| Stat | Direction | Primary Source | Notes |
|------|-----------|----------------|-------|
| Number of official languages | desc | Wikipedia — "List of countries by number of official languages" or individual country articles | Distinguish national vs. regional official languages; use national only for consistency |
| Coffee consumption per capita (kg/year) | desc | Wikipedia — "List of countries by coffee consumption" | ICO (International Coffee Organization) data; Wikipedia table is well-maintained |
| Beer consumption per capita (litres/year) | desc | Wikipedia — "List of countries by beer consumption per capita" | Kirin Holdings annual report data, aggregated on Wikipedia |
| Internet speed (Mbps, median fixed broadband) | desc | Ookla Speedtest Global Index — annual report (speedtest.net/global-index) | More current than Wikipedia; use the most recent full-year annual report |
| Olympic medals all-time (total) | desc | Wikipedia — "All-time Olympic Games medal table" | Summer + Winter Games combined; note the cutoff Games edition when the dataset is built |
| McDonald's locations per capita (per million people) | desc | Derived: number of McDonald's locations per country ÷ population × 1,000,000 | Location counts include overseas territories; Wikipedia — "McDonald's by country" lists location counts; cross-check with news sources for recent figures |
| Average height (cm, combined) | desc | Wikipedia — "Average human height by country" | Combined male/female average; data year varies by country |
| Obesity rate (% of adult population) | desc | Wikipedia — "List of countries by obesity rate" | WHO data aggregated on Wikipedia |
| Big Mac index (USD equivalent price) | desc | Wikipedia — "Big Mac Index" | The Economist publishes the index bi-annually; Wikipedia reproduces the latest table. Use a consistent edition year. |
| Passport power (visa-free destinations) | desc | Wikipedia — "Henley Passport Index" or Henley & Partners website | Henley & Partners is the primary publisher; Wikipedia carries the table. Number of destinations accessible without a prior visa. |
| Country age (years since founding / independence) | asc | Wikipedia — each country's infobox lists independence or founding date | Age is derived: current year minus founding year. Use the most widely recognised founding event (independence declaration, unification, etc.) as noted on Wikipedia. Ranking direction is `asc` so the oldest country ranks first (lowest year = oldest). |
