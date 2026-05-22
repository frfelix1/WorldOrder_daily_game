# API Contract: Puzzle Endpoint

**Version**: 1.0 | **Date**: 2026-05-22

## Overview

The puzzle API is the only server-side interface exposed by the game. It returns the daily puzzle — including the correct answer key — for use in client-side validation.

---

## Endpoint

```
GET /api/puzzle?date={YYYY-MM-DD}
```

### Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `date`    | string | Yes      | UTC date in `YYYY-MM-DD` format. Clients should always pass the current UTC date, derived as: `new Date().toISOString().slice(0, 10)`. |

### Example Request

```
GET /api/puzzle?date=2026-05-22
Accept: application/json
```

---

## Response: 200 OK

```json
{
  "date": "2026-05-22",
  "countries": [
    { "id": "BRA", "name": "Brazil",    "flagCode": "br" },
    { "id": "DEU", "name": "Germany",   "flagCode": "de" },
    { "id": "NGA", "name": "Nigeria",   "flagCode": "ng" },
    { "id": "JPN", "name": "Japan",     "flagCode": "jp" },
    { "id": "AUS", "name": "Australia", "flagCode": "au" }
  ],
  "stats": [
    {
      "id": "stat_1",
      "label": "Population",
      "category": "demographics",
      "tooltip": "Total resident population as of the most recent census estimate.",
      "direction": "desc",
      "solution": ["NGA", "BRA", "DEU", "JPN", "AUS"]
    },
    {
      "id": "stat_2",
      "label": "Land Area",
      "category": "geography",
      "tooltip": "Total land area in square kilometres, excluding inland water.",
      "direction": "desc",
      "solution": ["AUS", "BRA", "DEU", "NGA", "JPN"]
    },
    {
      "id": "stat_3",
      "label": "Urban Population %",
      "category": "demographics",
      "tooltip": "Percentage of the population living in urban areas.",
      "direction": "desc",
      "solution": ["AUS", "JPN", "DEU", "BRA", "NGA"]
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | The puzzle date, echoed back for client verification |
| `countries` | Country[] | Exactly 5 entries; order is arbitrary (client displays them; player reorders) |
| `countries[].id` | string | ISO 3166-1 alpha-3 country code, used as the stable identifier everywhere |
| `countries[].name` | string | Display name |
| `countries[].flagCode` | string | ISO 3166-1 alpha-2 lowercase, used to load `/flags/4x3/{flagCode}.svg` |
| `stats` | StatDef[] | Exactly 3 entries, in reveal order (index 0 is shown first) |
| `stats[].id` | string | Unique within this puzzle |
| `stats[].label` | string | Short display label |
| `stats[].category` | string | Category slug; at most 2 of 3 stats share a category |
| `stats[].tooltip` | string | Plain-language description shown in the hover/tap tooltip |
| `stats[].direction` | `"asc"` \| `"desc"` | `"desc"` = rank 1 is the highest value; `"asc"` = rank 1 is the lowest value |
| `stats[].solution` | string[] | Correct ranking of country IDs; position 0 = rank 1 |

---

## Response: 404 Not Found

Returned when no puzzle exists for the requested date (e.g. a future date or before the game's launch date).

```json
{
  "error": "not_found",
  "message": "No puzzle available for 2026-12-31"
}
```

---

## Response: 400 Bad Request

Returned when the `date` parameter is missing or malformed.

```json
{
  "error": "invalid_date",
  "message": "date parameter must be in YYYY-MM-DD format"
}
```

---

## Caching

The response for a given date is immutable once published.

```
Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600
```

CDN edge nodes may serve cached responses for up to 24 hours. Clients MUST NOT cache the response themselves beyond the current game session (a new date should trigger a fresh fetch).

---

## Client Retry Behaviour

If the fetch fails (network error or 5xx), the client must:
1. Show a loading/error state (FR-020)
2. Offer a manual retry button
3. Re-request using the same `date` parameter — do not fall back to a hardcoded puzzle

---

## Answer Validation

Guess evaluation is performed entirely client-side. The `solution` array is included in the response and used directly by the game engine to compute bulls feedback and scores. This is consistent with industry practice for casual daily games (Wordle, Worldle, etc.).

**Implication**: A determined user can inspect the network response to find the correct answer. This is accepted for MVP; if shareability integrity becomes a concern, a HMAC signature on the share payload can be added as a post-MVP enhancement.

---

## Puzzle File Format (Server-side)

Puzzle data lives as static JSON files at:

```
data/puzzles/YYYY-MM-DD.json
```

The API route reads the file for the requested date and returns it directly (with the `Cache-Control` header). The file schema is identical to the response body above.

### Authoring a Puzzle

1. Create `data/puzzles/YYYY-MM-DD.json` matching the response schema
2. Verify all `solution` arrays are permutations of the `countries[*].id` set
3. Verify all country-stat value combinations are distinct (no ties)
4. Verify stats span at least 2 distinct categories
5. Deploy (or merge to main) before the puzzle date's UTC midnight
