# dragonbrosy.github.io

## flights.db

A local SQLite mirror of the flight-hours data shown on the site. It's
rebuilt from scratch by `.github/workflows/logbook.yml` every time
`logbook.txt`/`logbook-*.csv` changes, so it always exactly matches
`logbook.json`/`propel.json` — not meant to be hand-edited.

**Schema** — single `flights` table, one row per flight:

| column | type | notes |
|---|---|---|
| `id` | INTEGER | primary key |
| `source` | TEXT | which file this row came from (`logbook.txt`, `logbook-milkeep.csv`, ...) |
| `date` | TEXT | `YYYY-MM-DD` |
| `aircraft_type` | TEXT | e.g. `PA-28-181`, `UH-60M` |
| `tail_number` | TEXT | registration, when the source export has one |
| `category` | TEXT | `sel` / `mel` / `rotor` |
| `total_time` | REAL | hours |
| `pic` | REAL | |
| `sic` | REAL | |
| `instructor` | REAL | dual given |
| `dual_received` | REAL | |
| `night` | REAL | |
| `actual_instrument` | REAL | |
| `simulated_instrument` | REAL | |
| `cross_country` | REAL | |
| `remarks` | TEXT | instructor notes, anonymized |

**Querying it** — the `sqlite3` CLI ships with macOS:

```bash
sqlite3 flights.db
```

```sql
-- total hours
SELECT ROUND(SUM(total_time), 1) FROM flights;

-- hours by aircraft category
SELECT category, COUNT(*), ROUND(SUM(total_time), 1) FROM flights GROUP BY category;

-- most recent flights
SELECT date, aircraft_type, total_time, remarks FROM flights ORDER BY date DESC LIMIT 10;

-- hours per aircraft type
SELECT aircraft_type, ROUND(SUM(total_time), 1) AS hrs FROM flights GROUP BY aircraft_type ORDER BY hrs DESC;

-- instrument time in a given year
SELECT ROUND(SUM(actual_instrument + simulated_instrument), 1) FROM flights WHERE date LIKE '2026%';
```

`.mode column` and `.headers on` make the interactive shell's output more
readable, or run one-off queries directly: `sqlite3 -header -column
flights.db "SELECT ..."`.

Prefer a GUI over SQL? [DB Browser for SQLite](https://sqlitebrowser.org/)
(`brew install --cask db-browser-for-sqlite`) opens the same file as a
spreadsheet-like table browser.