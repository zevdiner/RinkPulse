/**
 * Creates data/skaters_slim.csv from data/skaters.csv.
 * Filters to situation=all rows only and keeps only the columns
 * that moneypuck.ts actually reads (SKATER_COLS).
 *
 * Run: node scripts/make-skaters-slim.mjs
 */

import fs from 'fs'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const INPUT  = path.join(ROOT, 'data', 'skaters.csv')
const OUTPUT = path.join(ROOT, 'data', 'skaters_slim.csv')

const KEEP_COLS = [
  'playerId', 'season', 'name', 'team', 'position', 'situation',
  'games_played', 'icetime', 'gameScore',
  'onIce_corsiPercentage', 'onIce_fenwickPercentage',
  'I_F_points', 'I_F_goals', 'I_F_primaryAssists', 'I_F_secondaryAssists',
  'I_F_xGoals', 'I_F_highDangerGoals', 'I_F_highDangerShots',
]

let headerIdxMap = null
let keepIdxs = []
let outLines = 0

const rl = createInterface({ input: createReadStream(INPUT), crlfDelay: Infinity })
const out = fs.createWriteStream(OUTPUT)

rl.on('line', (line) => {
  if (!headerIdxMap) {
    // First line: parse header
    const cols = line.split(',')
    headerIdxMap = {}
    cols.forEach((c, i) => { headerIdxMap[c.trim()] = i })
    keepIdxs = KEEP_COLS.map(c => headerIdxMap[c] ?? -1)
    out.write(KEEP_COLS.join(',') + '\n')
    return
  }

  const cols = line.split(',')
  const situation = cols[headerIdxMap['situation']]

  // Only keep 'all' situation rows
  if (situation !== 'all') return

  const row = keepIdxs.map(i => (i >= 0 ? cols[i] ?? '' : '')).join(',')
  out.write(row + '\n')
  outLines++
})

rl.on('close', () => {
  out.end()
  const size = fs.statSync(OUTPUT).size
  console.log(`✓ skaters_slim.csv — ${outLines} rows, ${(size / 1024 / 1024).toFixed(1)} MB`)
})
