import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { createOfficeSceneViewModel } from '../src/features/command-room/IsometricOfficeSceneModel.ts'
import {
  getOfficeAgentMarkerClassName,
  getOfficeStationClassName,
  getOfficeStatusLampClassName,
  getOfficeTerminalClassName,
  OFFICE_SPRITE_ACTIONS,
  OFFICE_SPRITE_TOKENS,
  OFFICE_ZONE_TOKENS,
} from '../src/features/command-room/IsometricOfficeSpriteSystem.ts'
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
const blueprintSource = readFileSync('docs/final-office-blueprint.md', 'utf8')

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
assertIncludes(modelSource, "| 'resting'", 'resting office station action')
assertIncludes(modelSource, "| 'alert'", 'alert office station action')
assertIncludes(modelSource, 'export function createOfficeAgentStations', 'agent view-model mapper')
assertIncludes(modelSource, 'export function createOfficeSceneViewModel', 'office scene view-model mapper')
assertIncludes(modelSource, 'export interface OfficeSignalRoute', 'typed office signal route model')
assertIncludes(modelSource, 'export interface OfficeBehaviorChoreography', 'typed office behavior choreography metadata')
assertIncludes(modelSource, 'getStationPulse', 'status-derived office pulse mapping')
assertIncludes(modelSource, 'getTerminalMode', 'task-derived terminal mode mapping')
assertIncludes(modelSource, 'getStationChoreography', 'deterministic station choreography mapper')
assertIncludes(modelSource, 'phaseLabel:', 'semantic action phase labels')
assertIncludes(modelSource, 'routeInvolvement:', 'station route involvement metadata')
assertIncludes(modelSource, 'tempo:', 'station behavior tempo metadata')
assertIncludes(modelSource, 'intensity:', 'station behavior intensity metadata')
assertIncludes(modelSource, 'animationDelay:', 'stable station animation delays')
assertIncludes(modelSource, 'animationDuration:', 'stable station animation durations')
assertIncludes(modelSource, 'isSelected: boolean', 'selected route state')
assertIncludes(modelSource, 'selectedAgentId?: string', 'selected agent route input')
assertIncludes(componentSource, "from './IsometricOfficeSpriteSystem'", 'visual class map module import')
assertIncludes(componentSource, 'getOfficeStationClassName', 'station view model to visual class mapper')
assertIncludes(componentSource, 'getOfficeAgentMarkerClassName', 'sprite action to visual class mapper')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS', 'sprite part token map usage')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS', 'office zone token map usage')
assertIncludes(componentSource, 'export function IsometricOfficeScene', 'office scene component')
assertIncludes(componentSource, 'role="img"', 'accessible scene role')
assertIncludes(componentSource, 'aria-label="Isometric orbital office scene"', 'scene aria label')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.desk', 'desk/computer office zones')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.sofa', 'sofa/rest office zone')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.hologram', 'subtle hologram UI zone')
assertIncludes(componentSource, 'office-core', 'central orbital command core')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.core', 'professional command core visual token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.path', 'structured floor lane zone token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.handoff', 'structured handoff/signal zone token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.loungeSofa', 'structured visible lounge sofa token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.statusBoard', 'structured live office status board token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.coreSurface', 'structured command core status surface token')
assertIncludes(componentSource, 'office-transfer office-transfer--core', 'signal transfer layer')
assertIncludes(componentSource, 'office-transfer--${route.activity}', 'state-aware signal transfer classes')
assertIncludes(componentSource, 'data-label={route.label}', 'mock route packet labels')
assertIncludes(componentSource, 'office-walker office-walker--inner', 'walking agent orbital layer')
assertIncludes(componentSource, 'getOfficeStationClassName(station.lane', 'activity-aware desks')
assertIncludes(componentSource, 'getOfficeTerminalClassName(station.terminalMode)', 'task-aware terminal mode classes')
assertIncludes(componentSource, 'station.choreography.className', 'behavior choreography classes applied to sprites')
assertIncludes(componentSource, 'data-action-phase={station.choreography.phaseLabel}', 'action phase metadata exposed in DOM')
assertIncludes(componentSource, 'data-office-slot={station.slot}', 'stable office station layout slot metadata')
assertIncludes(componentSource, "'--office-agent-delay': station.choreography.animationDelay", 'stable agent delay CSS variable')
assertIncludes(componentSource, "'--office-agent-duration': station.choreography.animationDuration", 'stable agent duration CSS variable')
assertIncludes(componentSource, "'--office-agent-tempo': station.choreography.tempo", 'stable agent tempo CSS variable')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.terminalTicks', 'terminal activity ticks')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.monitorStand', 'clear PC monitor stand token')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.keyboardTray', 'keyboard/tool tray token')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.worklog', 'desk worklog prop token')
assertIncludes(componentSource, 'getOfficeAgentMarkerClassName(station.action)', 'abstract agent markers')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.sprite', 'original 2D character sprite token')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.head', '2D avatar head shape')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.body', '2D avatar body shape')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.hands', '2D avatar active worker hands')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.legs', '2D avatar leg animation shape')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.tool', '2D avatar action prop')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.restProp', '2D avatar rest/sofa prop')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.signalProp', '2D avatar signal/alert prop')
assertIncludes(componentSource, 'getOfficeStatusLampClassName(station.tone)', 'status lamps')
assertIncludes(componentSource, 'aria-label={`${isSelected ? \'Selected\' : \'Select\'} read-only office station', 'state-aware selectable station labels')
assertIncludes(componentSource, 'aria-pressed={isSelected}', 'selected station pressed state')
assertIncludes(componentSource, 'data-agent-id={station.agentId}', 'station-to-agent mapping metadata')
assertIncludes(componentSource, 'onClick={() => onSelectAgent(station.agentId)}', 'station selection handler')
assertIncludes(componentSource, 'selectedAgentId', 'office selected agent prop')
assertIncludes(componentSource, 'office-transfer--selected', 'selected route emphasis class')
assertIncludes(pageSource, "type StageView = 'office' | 'graph'", 'Office-first stage view type')
assertIncludes(pageSource, "useState<StageView>('office')", 'Office default stage view')
assertIncludes(pageSource, "setStageView('office')", 'Office toggle handler')
assertIncludes(pageSource, '<IsometricOfficeScene', 'office scene integration')
assertIncludes(pageSource, 'activity={snapshot.activity}', 'office scene timeline binding')
assertIncludes(pageSource, 'workflow={snapshot.workflow}', 'office scene workflow binding')
assertIncludes(pageSource, 'onSelectAgent={setSelectedAgentId}', 'office station selection updates shared inspector agent')
assertIncludes(pageSource, 'selectedAgentId={selectedAgent.id}', 'office selected agent mirrors inspector state')
assertIncludes(getBlock('.isometric-office'), 'linear-gradient', 'office scene layered surface')
assertIncludes(getBlock('.office-floor'), 'rotateX(60deg) rotateZ(45deg)', 'isometric office floor')
assertIncludes(getBlock('.office-floor'), 'inset 0 0 0 1px rgba(244, 241, 234', 'mature floor material edge')
assertIncludes(getBlock('.office-area'), 'position: absolute', 'office functional zones')
assertIncludes(getBlock('.office-area--desk'), 'rgba(120, 212, 192', 'desk/computer zone cyan signal')
assertIncludes(getBlock('.office-area--sofa'), 'rgba(215, 180, 92', 'sofa/rest zone gold accent')
assertIncludes(getBlock('.office-area--hologram'), 'rgba(120, 212, 192', 'subtle hologram zone')
assertIncludes(getBlock('.office-lounge-sofa'), 'linear-gradient', 'visible sofa lounge shape')
assertIncludes(getBlock('.office-lounge-sofa::before'), 'rgba(215, 180, 92', 'sofa cushion/back detail')
assertIncludes(getBlock('.office-status-board'), 'repeating-linear-gradient', 'visible live status board lanes')
assertIncludes(getBlock('.office-status-board::after'), 'office-board-pulse', 'subtle live board activity')
assertIncludes(getBlock('.office-core'), 'rgba(215, 180, 92', 'gold command core')
assertIncludes(getBlock('.office-core__surface'), 'repeating-linear-gradient', 'command core hologram/status surface')
assertIncludes(getBlock('.office-core__surface::after'), 'office-core-scan', 'subtle command core scan animation')
assertIncludes(stylesheetSource, 'background: linear-gradient(90deg, transparent, rgba(120, 212, 192, 0.18), transparent)', 'glass command core halo')
assertIncludes(getBlock('.office-desk'), 'border: 1px solid rgba(215, 180, 92', 'desk graphite/gold frame')
assertIncludes(getBlock('.office-workstation::before'), 'rgba(215, 180, 92', 'workstation desktop accent')
assertIncludes(getBlock('.office-monitor-stand'), 'rgba(215, 180, 92', 'PC monitor stand detail')
assertIncludes(getBlock('.office-keyboard-tray'), 'repeating-linear-gradient', 'keyboard/tool tray key detail')
assertIncludes(getBlock('.office-desk-worklog'), 'box-shadow:', 'desk task stack/worklog prop')
assertIncludes(stylesheetSource, 'background: radial-gradient(ellipse, rgba(0, 0, 0, 0.46), transparent 72%)', 'workstation grounded shadow')
assertIncludes(getBlock('.office-desk--selected'), 'outline:', 'selected desk outline')
assertIncludes(getBlock('.office-desk--selected'), 'rgba(120, 212, 192', 'selected desk cyan/gold accent')
assertIncludes(getBlock('.office-desk--selected'), 'outline: none', 'selected desk does not consume focus outline')
assertIncludes(getBlock('.office-desk--selected'), 'inset 0 0 0 1px rgba(120, 212, 192', 'selected desk readable inner ring')
assertIncludes(getBlock('.office-desk:focus-visible'), 'outline:', 'keyboard focus ring remains separate from selection')
assertIncludes(getBlock('.office-desk:focus-visible'), 'outline-offset:', 'keyboard focus ring clears selected desk state')
assertIncludes(stylesheetSource, ".office-desk[data-office-slot='2']", 'stable office slot layout selectors')
assertIncludes(getBlock('.office-terminal'), 'rgba(120, 212, 192', 'cyan terminal accent')
assertIncludes(getBlock('.office-terminal::before'), 'rgba(244, 241, 234', 'terminal glass reflection')
assertIncludes(getBlock('.office-desk--working'), 'office-desk-pulse', 'working desk pulse')
assertIncludes(getBlock('.office-desk--pulse-danger'), 'office-blocked-pulse', 'danger pulse intensity')
assertIncludes(getBlock('.office-desk--pulse-active'), 'office-desk-pulse', 'active pulse intensity')
assertIncludes(getBlock('.office-terminal--typing .office-terminal__ticks'), 'office-terminal-ticks', 'typing mode ticks')
assertIncludes(getBlock('.office-terminal--monitoring .office-terminal__ticks'), 'office-terminal-monitor', 'monitoring mode ticks')
assertIncludes(getBlock('.office-terminal__ticks'), 'office-terminal-ticks', 'typing activity ticks')
assertIncludes(getBlock('.office-walker--inner'), 'office-walker-inner', 'short orbital walking path')
assertIncludes(getBlock('.office-lane'), 'linear-gradient(90deg', 'office walking lane floor treatment')
assertIncludes(getBlock('.office-lane--inner'), 'rotate(28deg)', 'inner walking lane path geometry')
assertIncludes(getBlock('.office-transfer--core::after'), 'office-packet-core', 'core packet transfer')
assertIncludes(getBlock('.office-handoff-hub::before'), 'data-link', 'handoff hub communicates data transfer')
assertIncludes(getBlock('.office-handoff-hub::after'), 'office-handoff-bus', 'handoff hub packet animation')
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
assertIncludes(stylesheetSource, 'background: currentColor', 'office avatar posture marker')
assertIncludes(getBlock('.office-agent-sprite'), 'image-rendering: pixelated', 'original lightweight 2D sprite language')
assertIncludes(getBlock('.office-agent-sprite__legs::before'), 'office-agent-step', '2D sprite walk/work leg motion')
assertIncludes(getBlock('.office-agent-sprite__hands'), 'office-agent-hands-type', 'animated worker hands')
assertIncludes(getBlock('.office-agent-tool'), 'border-color: rgba(120, 212, 192', 'avatar action tool signal')
assertIncludes(stylesheetSource, 'office-agent-work', 'calm working avatar motion')
assertIncludes(stylesheetSource, 'office-agent-hands-type', 'typing worker hand motion')
assertIncludes(stylesheetSource, '.office-behavior--type-monitor', 'working type/monitor phase token')
assertIncludes(stylesheetSource, '.office-behavior--path-step', 'walking path/step phase token')
assertIncludes(stylesheetSource, '.office-behavior--sofa-idle', 'resting sofa idle phase token')
assertIncludes(stylesheetSource, '.office-behavior--signal-transfer', 'handoff signal/transfer phase token')
assertIncludes(stylesheetSource, '.office-behavior--scan-check', 'monitoring scan/check phase token')
assertIncludes(stylesheetSource, '.office-behavior--resolve-pulse', 'alert resolve pulse phase token')
assertIncludes(stylesheetSource, 'var(--office-agent-delay', 'deterministic agent animation delays')
assertIncludes(stylesheetSource, 'var(--office-agent-duration', 'deterministic agent animation durations')
assertIncludes(stylesheetSource, 'var(--office-route-delay', 'deterministic route animation delays')
assertIncludes(stylesheetSource, 'var(--office-route-duration', 'deterministic route animation durations')
assertIncludes(getBlock('.office-agent-marker--alert'), 'office-agent-alert', 'calm alert avatar motion')
assertIncludes(getBlock('.office-agent-marker--resting'), 'office-agent-rest', 'visible resting avatar motion')
assertIncludes(getBlock('.office-agent-marker--resting .office-agent-rest-prop'), 'rgba(215, 180, 92', 'resting action sofa prop')
assertIncludes(getBlock('.office-agent-marker--handoff .office-agent-signal-prop'), 'office-handoff-signal', 'handoff action signal prop')
assertIncludes(getBlock('.office-walker'), 'opacity: 0.64', 'subtle walking markers')
assertIncludes(getBlock('.office-terminal--typing .office-terminal__ticks'), '3s', 'measured typing cadence')
assertIncludes(stylesheetSource, '@media (prefers-reduced-motion: reduce)', 'reduced-motion support')
assertIncludes(stylesheetSource, '.office-agent-avatar,', 'reduced-motion avatar fallback')
assertIncludes(stylesheetSource, '.office-agent-sprite__legs::before', 'reduced-motion sprite fallback')
assertIncludes(stylesheetSource, '.office-walker,', 'reduced-motion walking layer fallback')
assertIncludes(stylesheetSource, '.office-transfer::after', 'reduced-motion transfer layer fallback')
assertIncludes(stylesheetSource, '.office-behavior--resolve-pulse', 'reduced-motion keeps calm resolve state readable')
assertIncludes(stylesheetSource, 'office-reduced-low-pulse', 'reduced-motion low pulse token')
assertIncludes(readmeSource, 'Office Scene phase 3', 'README office scene state-aware roadmap')
assertIncludes(readmeSource, 'Office Scene phase 4', 'README office scene interaction roadmap')
assertIncludes(readmeSource, 'Office Scene phase 5', 'README office scene professional maturity roadmap')
assertIncludes(readmeSource, 'Office Scene phase 6', 'README office scene Step 42 roadmap')
assertIncludes(readmeSource, 'Office Scene phase 7', 'README office scene sprite/action polish roadmap')
assertIncludes(readmeSource, 'Office Scene phase 8', 'README final office blueprint roadmap')
assertIncludes(readmeSource, 'docs/final-office-blueprint.md', 'README final office blueprint link')
assertIncludes(readmeSource, 'Office is now the main/default scene', 'README office default note')
assertIncludes(readmeSource, 'professional polish/maturity pass', 'README office scene maturity note')
assertIncludes(readmeSource, 'clicking an office station updates the shared selected agent inspector', 'README office scene interaction behavior')
assertIncludes(blueprintSource, 'Final Office Blueprint', 'durable final office blueprint')
assertIncludes(blueprintSource, 'Desk/PC zone', 'blueprint office zones')
assertIncludes(blueprintSource, '`working`', 'blueprint working action')
assertIncludes(blueprintSource, '`walking`', 'blueprint walking action')
assertIncludes(blueprintSource, '`resting`', 'blueprint resting action')
assertIncludes(blueprintSource, '`handoff`', 'blueprint handoff action')
assertIncludes(blueprintSource, '`alert`', 'blueprint alert action')
assertIncludes(blueprintSource, '`monitoring`', 'blueprint monitoring action')
assertIncludes(blueprintSource, 'Do not copy Mario, Nintendo', 'blueprint no-IP-copy rule')
assertIncludes(blueprintSource, 'station data -> office view model -> visual sprite tokens', 'blueprint separation rule')

const expectedCanonicalActions = ['working', 'walking', 'resting', 'handoff', 'alert', 'monitoring'] as const

for (const action of expectedCanonicalActions) {
  assert.equal(OFFICE_SPRITE_ACTIONS[action].action, action, `sprite action ${action} is canonical`)
  assert(OFFICE_SPRITE_ACTIONS[action].description.length > 24, `sprite action ${action} is documented`)
}

assert.equal(OFFICE_SPRITE_ACTIONS.working.pose, 'working', 'working action has working pose')
assert.equal(OFFICE_SPRITE_ACTIONS.walking.motion, 'walk', 'walking action has walk motion')
assert.equal(OFFICE_SPRITE_ACTIONS.resting.prop, 'sofa', 'resting action has sofa prop')
assert.equal(OFFICE_SPRITE_ACTIONS.handoff.prop, 'signal', 'handoff action has signal prop')
assert.equal(OFFICE_SPRITE_ACTIONS.alert.motion, 'alert', 'alert action has alert motion')
assert.equal(OFFICE_SPRITE_ACTIONS.monitoring.terminalMode, 'monitoring', 'monitoring action watches terminal')
assert.equal(OFFICE_SPRITE_TOKENS.sprite, 'office-agent-sprite', 'sprite root token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.head, 'office-agent-sprite__head', 'sprite head token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.body, 'office-agent-sprite__body', 'sprite body token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.legs, 'office-agent-sprite__legs', 'sprite legs token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.monitorStand, 'office-monitor-stand', 'PC monitor stand token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.keyboardTray, 'office-keyboard-tray', 'keyboard/tool tray token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.worklog, 'office-desk-worklog', 'desk worklog token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.hands, 'office-agent-sprite__hands', 'worker hands token is stable')
assert.equal(OFFICE_ZONE_TOKENS.desk, 'office-area--desk', 'desk zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.sofa, 'office-area--sofa', 'sofa zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.path, 'office-lane', 'walking path zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.handoff, 'office-handoff-hub', 'handoff signal zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.loungeSofa, 'office-lounge-sofa', 'lounge sofa prop token is stable')
assert.equal(OFFICE_ZONE_TOKENS.coreSurface, 'office-core__surface', 'command core surface token is stable')
assert.equal(OFFICE_ZONE_TOKENS.statusBoard, 'office-status-board', 'live status board token is stable')
assert.equal(
  getOfficeStationClassName('north', 'working', 'active', true),
  'office-desk office-workstation office-desk--north office-desk--working office-desk--pulse-active office-desk--selected',
  'station class mapper separates view-model state from CSS tokens',
)
assert.equal(getOfficeTerminalClassName('typing'), 'office-terminal office-terminal--typing', 'terminal class mapper')
assert.equal(
  getOfficeAgentMarkerClassName('blocked'),
  'office-agent-marker office-agent-avatar office-agent-marker--alert',
  'blocked action aliases to alert visual pose',
)
assert.equal(
  getOfficeStatusLampClassName('danger'),
  'office-status-lamp office-status-lamp--danger',
  'status lamp class mapper',
)

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
  {
    id: 'agent-resting',
    name: 'Spec',
    role: 'requirements',
    status: 'done',
    currentTaskId: 'task-resting',
  },
  {
    id: 'agent-walking',
    name: 'Research',
    role: 'research',
    status: 'idle',
    currentTaskId: 'task-walking',
  },
  {
    id: 'agent-handoff',
    name: 'Main',
    role: 'main/orchestrator',
    status: 'working',
    currentTaskId: 'task-handoff',
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
  {
    id: 'task-resting',
    title: 'Review complete',
    status: 'completed',
    ownerAgentId: 'agent-resting',
    priority: 'medium',
  },
  {
    id: 'task-walking',
    title: 'Queue research',
    status: 'queued',
    ownerAgentId: 'agent-walking',
    priority: 'low',
  },
  {
    id: 'task-handoff',
    title: 'Delegate polish',
    status: 'delegated',
    ownerAgentId: 'agent-handoff',
    priority: 'high',
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
const restingStation = viewModel.stations.find((station) => station.agentId === 'agent-resting')
const walkingStation = viewModel.stations.find((station) => station.agentId === 'agent-walking')
const handoffStation = viewModel.stations.find((station) => station.agentId === 'agent-handoff')

assert.equal(onlineStation?.activity, 'working', 'in-progress current task maps to working')
assert.equal(onlineStation?.terminalMode, 'typing', 'in-progress current task maps to typing')
assert.equal(onlineStation?.pulse, 'active', 'working health maps to active pulse')
assert.equal(onlineStation?.choreography.phaseLabel, 'type-monitor', 'working loops through type/monitor phase')
assert.equal(onlineStation?.choreography.className, 'office-behavior--type-monitor', 'working phase class is stable')
assert.equal(onlineStation?.choreography.intensity, 'focused', 'working phase uses focused intensity')
assert.equal(onlineStation?.choreography.routeInvolvement, true, 'working routed station tracks route involvement')
assert.equal(busyStation?.activity, 'monitoring', 'waiting status maps to monitoring')
assert.equal(busyStation?.terminalMode, 'monitoring', 'waiting task maps to monitoring')
assert.equal(busyStation?.choreography.phaseLabel, 'scan-check', 'monitoring loops through scan/check phase')
assert.equal(blockedStation?.activity, 'blocked', 'failed task state maps to blocked')
assert.equal(blockedStation?.action, 'alert', 'failed task state maps to alert action')
assert.equal(blockedStation?.pulse, 'danger', 'failed task state maps to danger pulse')
assert.equal(blockedStation?.tone, 'danger', 'failed task state maps to danger lamp')
assert.equal(blockedStation?.choreography.phaseLabel, 'resolve-pulse', 'alert loops through resolve pulse phase')
assert.equal(restingStation?.activity, 'resting', 'completed task state maps to resting')
assert.equal(restingStation?.action, 'resting', 'completed task state maps to resting action')
assert.equal(restingStation?.choreography.phaseLabel, 'sofa-idle', 'resting loops through sofa idle phase')
assert.equal(walkingStation?.activity, 'walking', 'queued task state maps to walking')
assert.equal(walkingStation?.action, 'walking', 'queued task state maps to walking action')
assert.equal(walkingStation?.choreography.phaseLabel, 'path-step', 'walking loops through path/step phase')
assert.equal(handoffStation?.activity, 'handoff', 'delegated task state maps to handoff')
assert.equal(handoffStation?.action, 'handoff', 'delegated task state maps to handoff action')
assert.equal(handoffStation?.choreography.phaseLabel, 'signal-transfer', 'handoff loops through signal transfer phase')
assert.match(handoffStation?.choreography.animationDelay ?? '', /^-\d+ms$/, 'stable animation delay is negative ms')
assert.match(handoffStation?.choreography.animationDuration ?? '', /^\d+ms$/, 'stable animation duration is ms')
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
