"""
Static metadata definitions for all 17 processable statistics.

Provides:
  - StatDefinition: dataclass describing one statistic
  - STAT_DEFINITIONS: dict[str, StatDefinition] keyed by stat_id
"""

from dataclasses import dataclass


@dataclass
class StatDefinition:
    stat_id: str
    label: str
    category: str        # geography | demographics | economy | health | environment | culture
    direction: str       # "desc" or "asc"
    unit: str
    source: str
    data_year: int
    tooltip_template: str   # {source} and {year} are interpolated at build time
    csv_filename: str


STAT_DEFINITIONS: dict[str, StatDefinition] = {
    "area": StatDefinition(
        stat_id="area",
        label="Land Area",
        category="geography",
        direction="desc",
        unit="km²",
        source="Wikipedia — List of countries by area",
        data_year=2023,
        tooltip_template=(
            "Total land area in square kilometres, excluding inland water. "
            "Source: {source}, {year}."
        ),
        csv_filename="area.csv",
    ),
    "capital_distance": StatDefinition(
        stat_id="capital_distance",
        label="Distance from Equator",
        category="geography",
        direction="desc",
        unit="km",
        source="Wikipedia — List of countries by latitude",
        data_year=2023,
        tooltip_template=(
            "Distance of the capital city from the equator in kilometres. "
            "Source: {source}, {year}."
        ),
        csv_filename="capital_distance_from_equator.csv",
    ),
    "elevation": StatDefinition(
        stat_id="elevation",
        label="Highest Elevation",
        category="geography",
        direction="desc",
        unit="m",
        source="Wikipedia — List of countries by highest point",
        data_year=2023,
        tooltip_template=(
            "Altitude of the highest point in the country in metres above sea level. "
            "Source: {source}, {year}."
        ),
        csv_filename="elevation.csv",
    ),
    "life_expectancy": StatDefinition(
        stat_id="life_expectancy",
        label="Life Expectancy",
        category="health",
        direction="desc",
        unit="years",
        source="WHO",
        data_year=2022,
        tooltip_template=(
            "Average life expectancy at birth in years. "
            "Source: {source}, {year}."
        ),
        csv_filename="life_expectancy.csv",
    ),
    "alcohol_per_capita": StatDefinition(
        stat_id="alcohol_per_capita",
        label="Alcohol Consumption",
        category="culture",
        direction="desc",
        unit="litres/person/year",
        source="WHO",
        data_year=2019,
        tooltip_template=(
            "Total alcohol consumption per person per year in litres of pure alcohol. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_alcohol_per_capita.csv",
    ),
    "annual_rainfall": StatDefinition(
        stat_id="annual_rainfall",
        label="Annual Rainfall",
        category="environment",
        direction="desc",
        unit="mm/year",
        source="Wikipedia — List of countries by average annual precipitation",
        data_year=2023,
        tooltip_template=(
            "Mean annual precipitation in millimetres per year. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_annual_rainfall.csv",
    ),
    "co2_per_capita": StatDefinition(
        stat_id="co2_per_capita",
        label="CO₂ per Capita",
        category="environment",
        direction="desc",
        unit="tonnes/person/year",
        source="Global Carbon Project",
        data_year=2022,
        tooltip_template=(
            "CO₂ emissions per capita in tonnes per year. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_co2_per_capita.csv",
    ),
    "coastline": StatDefinition(
        stat_id="coastline",
        label="Coastline Length",
        category="geography",
        direction="desc",
        unit="km",
        source="CIA World Factbook",
        data_year=2023,
        tooltip_template=(
            "Total coastline length in kilometres (0 for landlocked countries). "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_coastline.csv",
    ),
    "forest_coverage": StatDefinition(
        stat_id="forest_coverage",
        label="Forest Coverage",
        category="environment",
        direction="desc",
        unit="%",
        source="World Bank",
        data_year=2021,
        tooltip_template=(
            "Percentage of land area covered by forest. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_forest_coverage.csv",
    ),
    "gdp": StatDefinition(
        stat_id="gdp",
        label="GDP (Total)",
        category="economy",
        direction="desc",
        unit="million USD",
        source="World Bank",
        data_year=2023,
        tooltip_template=(
            "Gross domestic product at current prices in millions of US dollars. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_gdp.csv",
    ),
    "gdp_per_capita": StatDefinition(
        stat_id="gdp_per_capita",
        label="GDP per Capita",
        category="economy",
        direction="desc",
        unit="USD",
        source="World Bank",
        data_year=2023,
        tooltip_template=(
            "Gross domestic product divided by population in US dollars. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_gdp_per_capita.csv",
    ),
    "hdi": StatDefinition(
        stat_id="hdi",
        label="Human Development Index",
        category="demographics",
        direction="desc",
        unit="index (0–1)",
        source="UNDP",
        data_year=2022,
        tooltip_template=(
            "UNDP Human Development Index score (0 = lowest, 1 = highest). "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_HDI.csv",
    ),
    "internet_speed": StatDefinition(
        stat_id="internet_speed",
        label="Internet Speed",
        category="culture",
        direction="desc",
        unit="Mbit/s",
        source="Ookla Speedtest Global Index",
        data_year=2023,
        tooltip_template=(
            "Median fixed broadband download speed in megabits per second. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_internet_speed.csv",
    ),
    "obesity_rate": StatDefinition(
        stat_id="obesity_rate",
        label="Obesity Rate",
        category="health",
        direction="desc",
        unit="%",
        source="WHO",
        data_year=2022,
        tooltip_template=(
            "Percentage of adults classified as obese (BMI ≥ 30). "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_obesity_rate.csv",
    ),
    "olympic_medals": StatDefinition(
        stat_id="olympic_medals",
        label="Olympic Medals (All-Time)",
        category="culture",
        direction="desc",
        unit="total medals",
        source="Wikipedia — All-time Olympic Games medal table",
        data_year=2024,
        tooltip_template=(
            "Total Olympic medals won across all Summer and Winter Games. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_olympic_medals.csv",
    ),
    "passport_power": StatDefinition(
        stat_id="passport_power",
        label="Passport Power",
        category="culture",
        direction="desc",
        unit="visa-free destinations",
        source="Henley Passport Index",
        data_year=2024,
        tooltip_template=(
            "Number of countries accessible without a prior visa. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_passport_power.csv",
    ),
    "population": StatDefinition(
        stat_id="population",
        label="Population",
        category="demographics",
        direction="desc",
        unit="people",
        source="Wikipedia — List of countries by population",
        data_year=2024,
        tooltip_template=(
            "Total resident population. "
            "Source: {source}, {year}."
        ),
        csv_filename="modify_population.csv",
    ),
}
