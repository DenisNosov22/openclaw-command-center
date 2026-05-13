import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const appStyles = readFileSync('src/App.css', 'utf8')
const indexStyles = readFileSync('src/index.css', 'utf8')

function assertIncludes(source: string, expected: string, label: string) {
  assert(source.includes(expected), `Expected visual polish CSS to include ${label}`)
}

function getBlock(selector: string, source = appStyles) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockPattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\}`)
  const match = source.match(blockPattern)

  assert(match, `Expected CSS block for ${selector}`)

  return match[0]
}

for (const accent of ['#78d4c0', 'rgba(70, 127, 158', 'rgba(94, 138, 96']) {
  assertIncludes(indexStyles + appStyles, accent, `secondary visual accent ${accent}`)
}

for (const selector of [
  '.command-bar',
  '.panel',
  '.center-stage',
  '.hologram',
  '.workflow-graph',
  '.hologram__core',
]) {
  assertIncludes(getBlock(selector), 'linear-gradient', `${selector} layered surface`)
}

assertIncludes(getBlock('.telemetry-pill--live span'), '#78d4c0', 'live telemetry accent')
assertIncludes(
  getBlock('.workflow-node--online > span'),
  'rgba(120, 212, 192',
  'online workflow accent',
)
assertIncludes(getBlock('.node-signal--online'), '#78d4c0', 'online node accent')
assertIncludes(getBlock('.timeline-event--live'), 'rgba(120, 212, 192', 'live timeline accent')
assertIncludes(appStyles, '.timeline__severity--success,\n.timeline__severity--info', 'shared success/info selector')
assertIncludes(appStyles, '#9fe0d2', 'success/info tag accent')

console.log('[visual-polish] Source-level visual polish checks passed.')
