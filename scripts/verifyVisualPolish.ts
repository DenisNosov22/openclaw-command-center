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

function getLastBlock(selector: string, source = appStyles) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockPattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\}`, 'g')
  const matches = [...source.matchAll(blockPattern)]

  assert(matches.length > 0, `Expected CSS block for ${selector}`)

  return matches[matches.length - 1][0]
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

assertIncludes(getLastBlock('.command-room::before'), 'scanline', 'ambient scanline overlay')
assertIncludes(getLastBlock('.command-room::before'), 'opacity: 0.22;', 'tempered ambient scanlines')
assertIncludes(getLastBlock('.command-room::after'), 'radial-gradient', 'ambient command-room glow')
assertIncludes(getBlock('.center-stage'), 'perspective:', 'center-stage perspective depth')
assertIncludes(getBlock('.hologram'), 'transform-style: preserve-3d;', 'hologram 2.5D layering')
assertIncludes(getLastBlock('.hologram::before'), 'rotateX(68deg)', 'projected hologram floor')
assertIncludes(getLastBlock('.hologram::after'), 'scanline-drift', 'hologram scanline drift')
assertIncludes(getLastBlock('.hologram::after'), 'opacity: 0.32;', 'tempered hologram scanlines')
assertIncludes(getBlock('.room-grid'), 'translateZ(-34px)', 'recessed floor grid layer')
assertIncludes(getBlock('.agent-node::before'), 'radial-gradient', 'agent node glow halo')
assertIncludes(getBlock('.workflow-node::before'), 'radial-gradient', 'workflow node glow halo')
assertIncludes(getBlock('.workflow-node::before'), 'filter: blur(2px);', 'workflow halo performance budget')
assertIncludes(getBlock('.agent-node::before'), 'filter: blur(2px);', 'agent halo performance budget')
assertIncludes(appStyles, '@media (prefers-reduced-motion: reduce)', 'reduced-motion visual fallback')
assertIncludes(getBlock('.telemetry-pill--live span'), '#78d4c0', 'live telemetry accent')
assertIncludes(getBlock('.legend-dot--online'), '#78d4c0', 'online legend accent')
assertIncludes(
  getBlock('.workflow-node--online > span'),
  'rgba(120, 212, 192',
  'online workflow accent',
)
assertIncludes(getBlock('.node-signal--online'), '#78d4c0', 'online node accent')
assertIncludes(getBlock('.timeline-event--live'), 'rgba(120, 212, 192', 'live timeline accent')
assertIncludes(getBlock('.timeline-event--success'), 'rgba(120, 212, 192', 'success timeline accent')
assertIncludes(appStyles, '.timeline__severity--success,\n.timeline__severity--info', 'shared success/info selector')
assertIncludes(appStyles, '#9fe0d2', 'success/info tag accent')
assertIncludes(appStyles, '#bdb5aa', 'strong muted text contrast')

console.log('[visual-polish] Source-level visual polish checks passed.')
