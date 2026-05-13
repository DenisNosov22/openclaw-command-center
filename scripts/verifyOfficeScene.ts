import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { createOfficeSceneViewModel } from '../src/features/command-room/IsometricOfficeSceneModel.ts'
import type { ActivityEvent, Agent, Task, WorkflowEdge, WorkflowNode } from '../src/shared/types/index.ts'

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
assertIncludes(modelSource, 'export function createOfficeSceneViewModel', 'office scene view-model mapper')
assertIncludes(modelSource, 'export interface OfficeSignalRoute', 'typed office signal route model')
assertIncludes(modelSource, 'getStationPulse', 'status-derived office pulse mapping')
assertIncludes(modelSource, 'getTerminalMode', 'task-derived terminal mode mapping')
assertIncludes(modelSource, 'isSelected: boolean', 'selected route state')
assertIncludes(modelSource, 'selectedAgentId?: string', 'selected agent route input')
assertIncludes(componentSource, 'export function IsometricOfficeScene', 'office scene component')
assertIncludes(componentSource, 'role="img"', 'accessible scene role')
assertIncludes(componentSource, 'aria-label="Isometric orbital office scene"', 'scene aria label')
assertIncludes(componentSource, 'office-core', 'central orbital command core')
assertIncludes(componentSource, 'office-transfer office-transfer--core', 'signal transfer layer')
assertIncludes(componentSource, 'office-transfer--${route.activity}', 'state-aware signal transfer classes')
assertIncludes(componentSource, 'data-label={route.label}', 'mock route packet labels')
assertIncludes(componentSource, 'office-walker office-walker--inner', 'walking agent orbital layer')
assertIncludes(componentSource, 'office-desk', 'agent desks')
assertIncludes(componentSource, 'office-desk--${station.activity}', 'activity-aware desks')
assertIncludes(componentSource, 'office-desk--pulse-${station.pulse}', 'status-aware desk pulse classes')
assertIncludes(componentSource, 'office-terminal--${station.terminalMode}', 'task-aware terminal mode classes')
assertIncludes(componentSource, 'office-terminal', 'desk terminals')
assertIncludes(componentSource, 'office-terminal__ticks', 'terminal activity ticks')
assertIncludes(componentSource, 'office-agent-marker', 'abstract agent markers')
assertIncludes(componentSource, 'office-status-lamp', 'status lamps')
assertIncludes(componentSource, 'aria-label={`${isSelected ? \'Selected\' : \'Select\'} read-only office station', 'state-aware selectable station labels')
assertIncludes(componentSource, 'aria-pressed={isSelected}', 'selected station pressed state')
assertIncludes(componentSource, 'data-agent-id={station.agentId}', 'station-to-agent mapping metadata')
assertIncludes(componentSource, 'onClick={() => onSelectAgent(station.agentId)}', 'station selection handler')
assertIncludes(componentSource, 'selectedAgentId', 'office selected agent prop')
assertIncludes(componentSource, 'office-transfer--selected', 'selected route emphasis class')
assertIncludes(pageSource, "type StageView = 'room' | 'office' | 'graph'", 'Office stage view type')
assertIncludes(pageSource, "setStageView('office')", 'Office toggle handler')
assertIncludes(pageSource, '<IsometricOfficeScene', 'office scene integration')
assertIncludes(pageSource, 'activity={snapshot.activity}', 'office scene timeline binding')
assertIncludes(pageSource, 'workflow={snapshot.workflow}', 'office scene workflow binding')
assertIncludes(pageSource, 'onSelectAgent={setSelectedAgentId}', 'office station selection updates shared inspector agent')
assertIncludes(pageSource, 'selectedAgentId={selectedAgent.id}', 'office selected agent mirrors inspector state')
assertIncludes(getBlock('.isometric-office'), 'linear-gradient', 'office scene layered surface')
assertIncludes(getBlock('.office-floor'), 'rotateX(60deg) rotateZ(45deg)', 'isometric office floor')
assertIncludes(getBlock('.office-core'), 'rgba(215, 180, 92', 'gold command core')
assertIncludes(getBlock('.office-desk'), 'border: 1px solid rgba(215, 180, 92', 'desk graphite/gold frame')
assertIncludes(getBlock('.office-desk--selected'), 'outline:', 'selected desk outline')
assertIncludes(getBlock('.office-desk--selected'), 'rgba(120, 212, 192', 'selected desk cyan/gold accent')
assertIncludes(getBlock('.office-desk--selected'), 'outline: none', 'selected desk does not consume focus outline')
assertIncludes(getBlock('.office-desk--selected'), 'inset 0 0 0 1px rgba(120, 212, 192', 'selected desk readable inner ring')
assertIncludes(getBlock('.office-desk:focus-visible'), 'outline:', 'keyboard focus ring remains separate from selection')
assertIncludes(getBlock('.office-desk:focus-visible'), 'outline-offset:', 'keyboard focus ring clears selected desk state')
assertIncludes(getBlock('.office-terminal'), 'rgba(120, 212, 192', 'cyan terminal accent')
assertIncludes(getBlock('.office-desk--working'), 'office-desk-pulse', 'working desk pulse')
assertIncludes(getBlock('.office-desk--pulse-danger'), 'office-blocked-pulse', 'danger pulse intensity')
assertIncludes(getBlock('.office-desk--pulse-active'), 'office-desk-pulse', 'active pulse intensity')
assertIncludes(getBlock('.office-terminal--typing .office-terminal__ticks'), 'office-terminal-ticks', 'typing mode ticks')
assertIncludes(getBlock('.office-terminal--monitoring .office-terminal__ticks'), 'office-terminal-monitor', 'monitoring mode ticks')
assertIncludes(getBlock('.office-terminal__ticks'), 'office-terminal-ticks', 'typing activity ticks')
assertIncludes(getBlock('.office-walker--inner'), 'office-walker-inner', 'short orbital walking path')
assertIncludes(getBlock('.office-transfer--core::after'), 'office-packet-core', 'core packet transfer')
assertIncludes(getBlock('.office-transfer--danger::after'), '#d4544d', 'critical route packet tone')
assertIncludes(getBlock('.office-transfer--selected'), 'opacity:', 'selected route emphasis')
assertIncludes(getBlock('.office-transfer--selected::after'), 'office-packet-selected', 'selected route packet cadence')
assertIncludes(getBlock('.office-transfer--selected::before'), 'text-shadow:', 'selected route label contrast')
assertIncludes(getBlock('.office-transfer::before'), 'attr(data-label)', 'packet route labels')
assertIncludes(getBlock('.office-transfer::before'), 'opacity: 0', 'quiet default route labels')
assertIncludes(stylesheetSource, '.office-transfer--danger::before', 'selective danger route labels')
assertIncludes(stylesheetSource, 'opacity: 0.54', 'selective route label opacity')
assertIncludes(getBlock('.office-desk--blocked'), 'office-blocked-pulse', 'blocked calm red pulse')
assertIncludes(getBlock('.office-desk--blocked'), '9.2s', 'slowed blocked pulse')
assertIncludes(getBlock('.office-status-lamp--danger'), '#d4544d', 'red danger lamp')
assertIncludes(getBlock('.office-walker'), 'opacity: 0.64', 'subtle walking markers')
assertIncludes(getBlock('.office-terminal--typing .office-terminal__ticks'), '3s', 'measured typing cadence')
assertIncludes(stylesheetSource, '@media (prefers-reduced-motion: reduce)', 'reduced-motion support')
assertIncludes(stylesheetSource, '.office-walker,\n  .office-transfer::after', 'reduced-motion animated layer fallback')
assertIncludes(readmeSource, 'Office Scene phase 3', 'README office scene state-aware roadmap')
assertIncludes(readmeSource, 'Office Scene phase 4', 'README office scene interaction roadmap')
assertIncludes(readmeSource, 'clicking an office station updates the shared selected agent inspector', 'README office scene interaction behavior')

const agents: Agent[] = [
  {
    id: 'agent-online',
    name: 'Dev',
    role: 'coding',
    status: 'working',
    currentTaskId: 'task-online',
  },
  {
    id: 'agent-busy',
    name: 'QA',
    role: 'QA',
    status: 'waiting',
    currentTaskId: 'task-busy',
  },
  {
    id: 'agent-blocked',
    name: 'Ops',
    role: 'ops',
    status: 'idle',
    currentTaskId: 'task-blocked',
  },
]
const tasks: Task[] = [
  {
    id: 'task-online',
    title: 'Build UI',
    status: 'in_progress',
    ownerAgentId: 'agent-online',
    priority: 'high',
  },
  {
    id: 'task-busy',
    title: 'Watch gates',
    status: 'waiting',
    ownerAgentId: 'agent-busy',
    priority: 'medium',
  },
  {
    id: 'task-blocked',
    title: 'Deploy disabled',
    status: 'failed',
    ownerAgentId: 'agent-blocked',
    priority: 'low',
  },
]
const activity: ActivityEvent[] = [
  {
    id: 'event-blocked',
    timestamp: '2026-05-13T13:15:00Z',
    agentId: 'agent-blocked',
    category: 'blocker',
    severity: 'critical',
    summary: 'Mock critical route.',
  },
  {
    id: 'event-online',
    timestamp: '2026-05-13T13:14:00Z',
    agentId: 'agent-online',
    category: 'task',
    severity: 'success',
    summary: 'Mock task route.',
  },
]
const workflowNodes: WorkflowNode[] = [
  { id: 'node-online', agentId: 'agent-online', label: 'Dev', lane: 'Code', x: 50, y: 12 },
  { id: 'node-busy', agentId: 'agent-busy', label: 'QA', lane: 'QA', x: 50, y: 58 },
  { id: 'node-blocked', agentId: 'agent-blocked', label: 'Ops', lane: 'Ops', x: 34, y: 84 },
]
const workflowEdges: WorkflowEdge[] = [
  { id: 'edge-online-busy', from: 'node-online', to: 'node-busy', label: 'verify' },
  { id: 'edge-busy-blocked', from: 'node-busy', to: 'node-blocked', label: 'release' },
]
const viewModel = createOfficeSceneViewModel(agents, tasks, activity, {
  nodes: workflowNodes,
  edges: workflowEdges,
})
const selectedViewModel = createOfficeSceneViewModel(agents, tasks, activity, {
  nodes: workflowNodes,
  edges: workflowEdges,
}, 'agent-blocked')
const onlineStation = viewModel.stations.find((station) => station.agentId === 'agent-online')
const busyStation = viewModel.stations.find((station) => station.agentId === 'agent-busy')
const blockedStation = viewModel.stations.find((station) => station.agentId === 'agent-blocked')

assert.equal(onlineStation?.activity, 'working', 'in-progress current task maps to working')
assert.equal(onlineStation?.terminalMode, 'typing', 'in-progress current task maps to typing')
assert.equal(onlineStation?.pulse, 'active', 'working health maps to active pulse')
assert.equal(busyStation?.activity, 'monitoring', 'waiting status maps to monitoring')
assert.equal(busyStation?.terminalMode, 'monitoring', 'waiting task maps to monitoring')
assert.equal(blockedStation?.activity, 'blocked', 'failed task state maps to blocked')
assert.equal(blockedStation?.pulse, 'danger', 'failed task state maps to danger pulse')
assert.equal(blockedStation?.tone, 'danger', 'failed task state maps to danger lamp')
assert(
  viewModel.signalRoutes.some(
    (route) => route.label === 'release' && route.tone === 'danger' && route.activity === 'blocked',
  ),
  'workflow plus critical timeline event maps to a blocked danger signal route',
)
assert(
  selectedViewModel.signalRoutes.some(
    (route) => route.label === 'release' && route.isSelected,
  ),
  'selected office station emphasizes its related workflow route',
)

console.log('[office-scene] Source-level office scene checks passed.')
