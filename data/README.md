# RinkPulse Data Directory

This folder holds the MoneyPuck historical CSV files (2008–2024) that power the
historical-context engine behind RinkPulse's daily stat stories.

## Required Files

| File | Description |
|------|-------------|
| `skaters.csv` | Skater on-ice stats per season/situation |
| `goalies.csv` | Goalie stats per season/situation |
| `lines.csv` | Line-combination stats per season/situation |
| `teams.csv` | Team stats per season/situation |

## Where to Download

1. Go to **moneypuck.com/data.htm**
2. Under "All Seasons", download each of the four CSV files
3. Rename them to match the filenames above and place them in this `/data` folder
4. Redeploy to Vercel (or restart locally) — the app reads and caches the CSVs at startup

## Column Reference

### skaters.csv
```
playerId, season, name, team, position, situation, games_played, icetime,
gameScore, onIce_corsiPercentage, onIce_fenwickPercentage, I_F_points,
I_F_goals, I_F_primaryAssists, I_F_secondaryAssists, I_F_xGoals,
I_F_highDangerGoals, I_F_highDangerShots
```

### goalies.csv
```
playerId, season, name, team, situation, games_played, icetime,
xGoals, goals, ongoal, highDangerGoals, highDangerShots
```

### lines.csv
```
lineId, season, name, team, situation, games_played, xGoalsPercentage,
corsiPercentage, fenwickPercentage, goalsFor, goalsAgainst
```

### teams.csv
```
team, season, situation, games_played, xGoalsPercentage, corsiPercentage,
fenwickPercentage, goalsFor, goalsAgainst, shotsOnGoalFor, shotsOnGoalAgainst
```

## Notes

- The `situation` column distinguishes `all`, `5on5`, `powerPlay`, `penaltyKill`, etc.
  RinkPulse uses `all` for most story types.
- Season codes use the MoneyPuck convention: `20232024` = 2023–24 season.
- Sample data (`skaters_sample.csv` etc.) is included for local development and
  initial Vercel deploys. Replace with the full datasets for production.

## Without Data Files

The app still runs — stories fall back to NHL API-only stats (no historical percentile
context). The player comparison tool works fully without these files.
