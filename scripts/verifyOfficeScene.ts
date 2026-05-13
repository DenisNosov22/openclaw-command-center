import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const componentSource = readFileSync(
  'src/features/command-room/IsometricOfficeScene.tsx',
  'utf8',
)
const modelSource = readFileSync(
  'src/features/command-room/IsometricOfficeSceneModel.ts',
  'utf8',
)
const pageSource = readFileSync('src/features/command-room/CommandRoomPage.tsx', 'utf8')
const stylesheetSource = readFileSync('src/App.css', 'utf8')
const readmeSource = readFileSync('README.md', 'utf8')

function assertIncludes(source: string, expected: string, label: string) {
  assert(source.includes(expected), `Expected ${label} to include ${JSON.stringify(expected)}`)
}

function getBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockPattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\}`)
  const match = stylesheetSource.match(blockPattern)

  assert(match, `Expected CSS block for ${selector}`)

  return match[0]
}

assertIncludes(modelSource, 'export interface OfficeAgentStation', 'typed office station model')
assertIncludes(modelSource, "| 'walking'", 'walking office station action')
assertIncludes(modelSource, "| 'handoff'", 'handoff office station action')
assertIncludes(modelSource, "| 'blocked'", 'blocked office station action')
assertIncludes(modelSource, 'export function createOfficeAgentStations', 'agent view-model mapper')
assertIncludes(componentSource, 'export function IsometricOfficeScene', 'office scene component')
assertIncludes(componentSource, 'role="img"', 'accessible scene role')
assertIncludes(componentSource, 'aria-label="Isometric orbital office scene"', 'scene aria label')
assertIncludes(componentSource, 'office-core', 'central orbital command core')
assertIncludes(componentSource, 'office-transfer office-transfer--core', 'signal transfer layer')
assertIncludes(componentSource, 'office-walker office-walker--inner', 'walking agent orbital layer')
assertIncludes(componentSource, 'office-desk', 'agent desks')
assertIncludes(componentSource, 'office-desk--${station.activity}', 'activity-aware desks')
assertIncludes(componentSource, 'office-terminal', 'desk terminals')
assertIncludes(componentSource, 'office-terminal__ticks', 'terminal activity ticks')
assertIncludes(componentSource, 'office-agent-marker', 'abstract agent markers')
assertIncludes(componentSource, 'office-status-lamp', 'status lamps')
assertIncludes(componentSource, 'aria-label={`Select office station', 'selectable station labels')
assertIncludes(pageSource, "type StageView = 'room' | 'office' | 'graph'", 'Office stage view type')
assertIncludes(pageSource, "setStageView('office')", 'Office toggle handler')
assertIncludes(pageSource, '<IsometricOfficeScene', 'office scene integration')
assertIncludes(getBlock('.isometric-office'), 'linear-gradient', 'office scene layered surface')
assertIncludes(getBlock('.office-floor'), 'rotateX(60deg) rotateZ(45deg)', 'isometric office floor')
assertIncludes(getBlock('.office-core'), 'rgba(215, 180, 92', 'gold command core')
assertIncludes(getBlock('.office-desk'), 'border: 1px solid rgba(215, 180, 92', 'desk graphite/gold frame')
assertIncludes(getBlock('.office-terminal'), 'rgba(120, 212, 192', 'cyan terminal accent')
assertIncludes(getBlock('.office-desk--working'), 'office-desk-pulse', 'working desk pulse')
assertIncludes(getBlock('.office-terminal__ticks'), 'office-terminal-ticks', 'typing activity ticks')
assertIncludes(getBlock('.office-walker--inner'), 'office-walker-inner', 'short orbital walking path')
assertIncludes(getBlock('.office-transfer--core::after'), 'office-packet-core', 'core packet transfer')
assertIncludes(getBlock('.office-desk--blocked'), 'office-blocked-pulse', 'blocked calm red pulse')
assertIncludes(getBlock('.office-status-lamp--danger'), '#d4544d', 'red danger lamp')
assertIncludes(stylesheetSource, '@media (prefers-reduced-motion: reduce)', 'reduced-motion support')
assertIncludes(stylesheetSource, '.office-walker,\n  .office-transfer::after', 'reduced-motion animated layer fallback')
assertIncludes(readmeSource, 'Office Scene phase 2', 'README office scene animation roadmap')

console.log('[office-scene] Source-level office scene checks passed.')
