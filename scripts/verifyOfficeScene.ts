import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { createOfficeSceneViewModel } from '../src/features/command-room/IsometricOfficeSceneModel.ts'
import {
  getOfficeAgentMarkerClassName,
  getOfficeStationClassName,
  getOfficeStatusLampClassName,
  OFFICE_SPRITE_ACTIONS,
  OFFICE_SPRITE_TOKENS,
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

function assertNotIncludes(source: string, expected: string, label: string) {
  assert(!source.includes(expected), `Expected ${label} not to include ${JSON.stringify(expected)}`)
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
assertIncludes(modelSource, 'roleOfficeLayout', 'profession-specific office floor layout')
assertIncludes(modelSource, 'roleActivityState', 'profession-specific office activity state map')
assertIncludes(modelSource, 'roleActivityLabel', 'compact profession activity labels')
assertIncludes(modelSource, 'activityState: OfficeActivityState', 'typed profession activity state on stations')
assertIncludes(modelSource, "'main/orchestrator': { x: 51, y: 40, lane: 'south' }", 'coordinator desk sits at the central meeting table')
assertIncludes(modelSource, "coding: { x: 9, y: 43, lane: 'north' }", 'coding station sits at a top-left workstation PC')
assertIncludes(modelSource, "ops: { x: 16, y: 82, lane: 'south' }", 'ops station sits by the bottom-left server/admin console')
assertIncludes(modelSource, "research: { x: 14, y: 25, lane: 'north' }", 'research station stands near the upper-left planning row')
assertIncludes(modelSource, "requirements: { x: 8, y: 25, lane: 'north' }", 'spec station is seated at a top-left workstation PC')
assertIncludes(modelSource, "QA: { x: 19, y: 43, lane: 'north' }", 'QA station is seated at a separate top-left workstation PC')
assertIncludes(modelSource, "video: { x: 81, y: 81, lane: 'east' }", 'director station sits by the camera/studio area without edge clipping')
assertIncludes(modelSource, "'UI/layout': { x: 8, y: 35, lane: 'north' }", 'design/layout station is seated at the top-left PC cluster near research')
assertIncludes(modelSource, "marketing: { x: 76, y: 38, lane: 'east' }", 'marketing visuals station sits inside the right visual wall zone without edge clipping')
assertIncludes(modelSource, "trading: { x: 63, y: 76, lane: 'south' }", 'trading station sits at the bottom-center multi-monitor desk')
assertIncludes(modelSource, "marketing: 'Вітрина'", 'marketing visuals agent gets a readable station label')
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
assertNotIncludes(componentSource, 'className="office-zones"', 'removed office zone DOM wrapper')
assertNotIncludes(componentSource, 'office-area', 'removed old office-zone span areas')
assertIncludes(componentSource, 'export function IsometricOfficeScene', 'office scene component')
assertIncludes(componentSource, 'role="img"', 'accessible scene role')
assertIncludes(componentSource, 'aria-label="2D game-like real office floor plan with agents working at profession stations"', 'scene aria label')
for (const removedOverlayClass of [
  'OFFICE_ROUTE_TOKENS.path',
  'OFFICE_ROUTE_TOKENS.handoff',
  'office-room-props',
  'office-wall office-wall--back',
  'office-rug office-rug--center',
  'office-cabinet office-cabinet--ops',
  'office-whiteboard office-whiteboard--research',
  'office-social-board office-social-board--marketing',
  'office-desk-cluster office-desk-cluster--north',
  'office-zone-label office-zone-label--ops',
  'office-zone-label office-zone-label--design',
  'office-zone-label office-zone-label--marketing',
  'office-zone-label office-zone-label--trade',
]) {
  assertNotIncludes(componentSource, removedOverlayClass, 'removed visual overlay source')
}
assertNotIncludes(componentSource, 'office-core', 'office component source')
assertNotIncludes(componentSource, 'command-core', 'office component source')
assertNotIncludes(componentSource.toLowerCase(), 'orbital', 'office component source')
assertIncludes(componentSource, 'office-transfer--${route.activity}', 'state-aware signal transfer classes')
assertIncludes(componentSource, 'data-label={route.label}', 'mock route packet labels')
assertNotIncludes(componentSource, 'office-walkers', 'large standalone walking overlay wrapper')
assertNotIncludes(componentSource, 'office-walker office-walker--inner', 'decorative walking sprites should not render as a separate overlay')
assertIncludes(componentSource, 'office-agent-floor', 'physical agent floor layer')
assertIncludes(componentSource, 'getOfficeFloorAgentClassName', 'simulation-aware physical agent class mapper')
assertIncludes(componentSource, 'office-floor-agent--posture-${station.simulation.posture}', 'physical agents expose simulation posture classes')
assertIncludes(componentSource, 'office-floor-agent--activity-${station.simulation.activity}', 'physical agents expose simulation activity classes')
assertIncludes(componentSource, 'office-floor-agent--path-${station.simulation.pathId}', 'physical agents expose simulation path classes')
assertIncludes(componentSource, 'office-floor-agent--zone-${station.simulation.zoneId}', 'physical agents expose simulation zone classes')
assertIncludes(componentSource, 'data-physical-agent="true"', 'physical agent metadata exposed in DOM')
assertIncludes(componentSource, "'--office-agent-x': `${station.simulation.position.x}%`", 'physical agent x coordinate comes from simulation position')
assertIncludes(componentSource, "'--office-agent-y': `${station.simulation.position.y}%`", 'physical agent y coordinate comes from simulation position')
assertIncludes(componentSource, "'--office-agent-target-x': `${station.simulation.target.x}%`", 'physical agent target x coordinate comes from simulation target')
assertIncludes(componentSource, "'--office-agent-target-y': `${station.simulation.target.y}%`", 'physical agent target y coordinate comes from simulation target')
assertIncludes(componentSource, 'data-agent-activity={station.simulation.activity}', 'simulation activity metadata exposed in DOM')
assertIncludes(componentSource, 'getOfficeStationClassName(', 'activity-aware desks')
assertIncludes(componentSource, 'station.activityState', 'profession activity state reaches visual classes')
assertIncludes(componentSource, 'data-activity-state={station.activityState}', 'activity state metadata exposed in DOM')
assertNotIncludes(componentSource, 'getOfficeTerminalClassName(station.terminalMode)', 'duplicate terminal overlay classes')
assertIncludes(componentSource, 'data-profession-prop={station.professionProp}', 'physical agents expose profession sprite metadata')
assertNotIncludes(componentSource, 'office-profession-prop--${station.professionProp}', 'duplicate profession prop visual classes')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.taskBubble', 'small task bubble token')
assertNotIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.activityChip', 'duplicate activity state chip token')
assertIncludes(componentSource, 'station.choreography.className', 'behavior choreography classes applied to sprites')
assertIncludes(componentSource, 'data-action-phase={station.choreography.phaseLabel}', 'action phase metadata exposed in DOM')
assertIncludes(componentSource, 'data-office-slot={station.slot}', 'stable office station layout slot metadata')
assertIncludes(componentSource, "'--office-agent-delay': station.choreography.animationDelay", 'stable agent delay CSS variable')
assertIncludes(componentSource, "'--office-agent-duration': station.choreography.animationDuration", 'stable agent duration CSS variable')
assertIncludes(componentSource, "'--office-agent-tempo': station.choreography.tempo", 'stable agent tempo CSS variable')
assertNotIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.terminalTicks', 'duplicate terminal activity ticks')
assertNotIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.monitorStand', 'duplicate PC monitor stand token')
assertNotIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.keyboardTray', 'duplicate keyboard/tool tray token')
assertNotIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.worklog', 'duplicate desk worklog prop token')
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
assertIncludes(componentSource, 'office-agent-action-cue', 'compact role-specific action cue attached to each physical sprite')
assertIncludes(componentSource, 'aria-label={`${isSelected ? \'Selected\' : \'Select\'} read-only office station', 'state-aware selectable station labels')
assertIncludes(componentSource, 'aria-pressed={isSelected}', 'selected station pressed state')
assertIncludes(componentSource, 'data-agent-id={station.agentId}', 'station-to-agent mapping metadata')
assertIncludes(componentSource, 'onClick={() => onSelectAgent(station.agentId)}', 'station selection handler')
assertIncludes(componentSource, 'selectedAgentId', 'office selected agent prop')
assertIncludes(componentSource, 'office-transfer--selected', 'selected route emphasis class')
assertIncludes(pageSource, "type StageView = 'office' | 'graph'", 'Office-first stage view type')
assertIncludes(pageSource, 'getOfficeSourceIndicator', 'office status source indicator mapper')
assertIncludes(pageSource, 'data-office-status-source={officeSourceIndicator.label}', 'office status source indicator DOM metadata')
assertIncludes(pageSource, "useState<StageView>('office')", 'Office default stage view')
assertIncludes(pageSource, "setStageView('office')", 'Office toggle handler')
assertIncludes(pageSource, '<IsometricOfficeScene', 'office scene integration')
assertIncludes(pageSource, 'activity={snapshot.activity}', 'office scene timeline binding')
assertIncludes(pageSource, 'workflow={snapshot.workflow}', 'office scene workflow binding')
assertIncludes(pageSource, 'onSelectAgent={setSelectedAgentId}', 'office station selection updates shared inspector agent')
assertIncludes(pageSource, 'selectedAgentId={selectedAgent.id}', 'office selected agent mirrors inspector state')
assertIncludes(pageSource, 'center-stage--office', 'office view applies flattened stage container modifier')
assertIncludes(getBlock('.center-stage--office'), 'background: transparent', 'office stage parent has no visible card background')
assertIncludes(getBlock('.center-stage--office'), 'border-color: transparent', 'office stage parent has no visible border')
assertIncludes(getBlock('.center-stage--office'), 'box-shadow: none', 'office stage parent has no visible card shadow')
assertIncludes(getBlock('.isometric-office'), 'min-height: clamp(540px, 54vw, 640px)', 'office scene root gives the room taller vertical space')
assertIncludes(getBlock('.isometric-office'), 'background: transparent', 'office scene root is only a layout mount, not a visible card')
assertIncludes(getBlock('.isometric-office'), 'border: 0', 'office scene root has no visible wrapper border')
assertIncludes(getBlock('.isometric-office'), 'box-shadow: none', 'office scene root has no wrapper glow/card shadow')
assertIncludes(getBlock('.office-source-chip'), 'max-width: 104px', 'office source indicator remains compact but readable')
assertIncludes(getBlock('.office-source-chip'), 'border-radius: 999px', 'office source indicator is a small game-like chip')
assertIncludes(getBlock('.office-source-chip strong'), 'max-width: 52px', 'office source indicator source value remains readable')
assertIncludes(getBlock('.office-source-chip--json'), '#78d4c0', 'office JSON source gets live cyan tone')
assertIncludes(stylesheetSource, '.office-source-chip--stale', 'office stale source indicator tone')
assertIncludes(stylesheetSource, '#ff827b', 'office stale/error source gets warning tone')
assertIncludes(getBlock('.office-floor'), 'perspective(900px) rotateX(50deg)', 'isometric office floor plan')
assertIncludes(getBlock('.office-floor'), 'inset: -44px 0 -54px', 'office floor crops generated-image edge banding')
assertIncludes(getBlock('.office-floor'), "url('./assets/office-background.png')", 'room background lives on the office floor layer')
assertIncludes(getBlock('.office-floor'), 'box-shadow: none', 'office floor has no inset frame or black banding')
assertIncludes(getBlock('.office-plant::after'), 'radial-gradient', 'office plant leaf prop')
assertIncludes(stylesheetSource, '.office-room-props,', 'removed room-prop overlay guard selector')
assertIncludes(stylesheetSource, 'display: none', 'removed overlay guards hide duplicate blocks')
assertNotIncludes(stylesheetSource, '.office-zones', 'removed office zone wrapper CSS')
assertNotIncludes(stylesheetSource, '.office-area', 'removed old office-zone span CSS')
assertNotIncludes(stylesheetSource, '.office-lounge-sofa', 'removed duplicate lounge furniture overlay')
assertNotIncludes(stylesheetSource, '.office-status-board', 'removed duplicate status board overlay')
assertNotIncludes(stylesheetSource, '.office-core', 'office CSS')
assertNotIncludes(stylesheetSource, '.command-core', 'office CSS')
assertNotIncludes(stylesheetSource, 'office-core-scan', 'office CSS')
assertIncludes(stylesheetSource, 'background: transparent', 'desk hit target is visually transparent over generated office background')
assertIncludes(getBlock('.office-desk'), '--office-desk-angle', 'furniture desks have stable orientation angles')
assertIncludes(stylesheetSource, 'box-shadow: none', 'desk hit target does not duplicate furniture')
assertIncludes(stylesheetSource, '.office-terminal,', 'duplicate terminal overlay guard selector')
assertIncludes(getBlock('.office-task-bubble'), 'border-radius: 999px', 'small overhead task bubbles')
assertIncludes(getBlock('.office-task-bubble'), 'max-width: 58px', 'task bubbles remain compact metadata')
assertIncludes(
  getBlock(".office-floor-agent[data-activity-state='coordinating'] .office-task-bubble"),
  'max-width: 18px',
  'coordinator bubble collapses to a compact document tab',
)
assertIncludes(
  getBlock(".office-floor-agent[data-action-phase='signal-transfer'] .office-task-bubble"),
  'border-radius: 4px',
  'handoff bubble is a staged document chip',
)
assertIncludes(getBlock('.office-activity-chip'), 'border-radius: 999px', 'activity chips stay compact and attached')
assertIncludes(getBlock('.office-activity-chip'), 'max-width: 42px', 'activity chips are not dashboard cards')
assertIncludes(stylesheetSource, '.office-desk::before,', 'desk pseudo furniture is suppressed')
assertIncludes(getBlock('.office-desk--selected'), 'outline: none', 'selected desk does not consume focus outline')
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
assertIncludes(getBlock('.office-desk'), 'left: var(--office-station-x)', 'desks use view-model office floor x position')
assertIncludes(getBlock('.office-desk'), 'top: var(--office-station-y)', 'desks use view-model office floor y position')
assertIncludes(stylesheetSource, '.office-lane,', 'walking lane block overlay is suppressed')
assertIncludes(getBlock('.office-desk--coordinating'), 'width: clamp(96px, 12%, 112px)', 'coordinator desk remains a small side overview desk')
assertIncludes(stylesheetSource, '.office-handoff-hub,', 'handoff hub block overlay is suppressed')
assertIncludes(getBlock('.office-transfer--danger::after'), '#d4544d', 'critical route packet tone')
assertIncludes(getBlock('.office-transfer--selected'), 'opacity:', 'selected route emphasis')
assertIncludes(getBlock('.office-transfer--selected::after'), 'office-packet-selected', 'selected route packet cadence')
assertIncludes(getBlock('.office-transfer--selected::before'), 'text-shadow:', 'selected route label contrast')
assertIncludes(getBlock('.office-transfer::before'), 'attr(data-label)', 'packet route labels')
assertIncludes(getBlock('.office-transfer::before'), 'opacity: 0', 'quiet default route labels')
assertIncludes(stylesheetSource, '.office-transfer--danger::before', 'selective danger route labels')
assertIncludes(stylesheetSource, 'opacity: 0.54', 'selective route label opacity')
assertIncludes(componentSource, 'focusedSignalRoutes', 'only selected workflow signal routes render in the office floor')
assertIncludes(componentSource, 'routedStations', 'only active moving/handoff simulation paths render in the office floor')
assertIncludes(componentSource, 'canAgentMove(', 'route visibility is gated by office movement predicate')
const routedStationsSource = componentSource.slice(
  componentSource.indexOf('const routedStations'),
  componentSource.indexOf('const focusedSignalRoutes'),
)
assertNotIncludes(routedStationsSource, 'selectedAgentId', 'selected inactive agents must not render route SVG paths')
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
assertNotIncludes(componentSource, 'office-walker', 'walking agents live in physical floor-agent layer')
assertIncludes(getBlock('.office-agent-floor'), 'pointer-events: none', 'physical agent floor layer does not block desk selection')
assertIncludes(getBlock('.office-floor-agent'), 'left: var(--office-agent-x)', 'physical agent x/y positioning')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='walking']"), '--office-agent-shift-x: 0px', 'walking posture uses simulation path position without desk offset')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='working'] .office-agent-marker"), 'scaleY(0.94)', 'working posture calms into desk/sitting pose')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='handoff'] .office-agent-marker"), 'rgba(215, 180, 92', 'handoff posture gets document-transfer tone')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='blocked'] .office-agent-marker"), 'rgba(212, 84, 77', 'blocked posture gets distinct marker tone')
assertIncludes(getBlock(".office-floor-agent[data-agent-activity='monitoring'] .office-agent-marker::before"), '#78d4c0', 'monitoring activity gets distinct status marker')
assertIncludes(getBlock('.office-agent-action-cue'), 'border-radius: 3px', 'role-specific action cues stay compact and attached to sprites')
for (const actionCue of [
  'office-action-code-spark',
  'office-action-scan',
  'office-action-check',
  'office-action-blueprint',
  'office-action-record',
  'office-action-swatch',
  'office-action-server-pulse',
  'office-action-market-pulse',
  'office-action-command-signal',
]) {
  assertIncludes(stylesheetSource, actionCue, `role-specific cue animation ${actionCue}`)
}
assertIncludes(getBlock('.office-floor-agent--north'), '--office-agent-shift-y: 60px', 'north agents stand away from desk blocks without drifting into labels')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='coding']"), '--office-agent-shift-x: 54px', 'larger coding floor agent is offset into the left aisle')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='checking']"), '--office-agent-shift-x: -52px', 'larger QA floor agent pulls away from the dev/spec cluster')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='designing']"), '--office-agent-shift-y: -66px', 'larger layout floor agent stays by the design wall without stacking on Вітрина')
assertIncludes(stylesheetSource, ".office-floor-agent[data-agent-id='agent-vitryna']:not([data-agent-posture='walking']):not([data-agent-posture='handoff'])", 'Вітрина has a role-specific home offset at the visual wall')
assertIncludes(stylesheetSource, ".office-floor-agent[data-agent-id='agent-rezhyser']:not([data-agent-posture='walking']):not([data-agent-posture='handoff'])", 'Режисер has a role-specific home offset near the camera/studio area')
assertIncludes(stylesheetSource, ".office-floor-agent[data-activity-state='coding'] .office-agent-sprite__head::before", 'coding agents have readable visor/glasses detail')
assertIncludes(stylesheetSource, 'rgba(120, 212, 192, 0.78)', 'coding/monitoring visor detail uses cyan glass')
assertIncludes(stylesheetSource, ".office-floor-agent[data-activity-state='checking'] .office-agent-sprite__body::before", 'QA/review agents get a visible chest mark')
assertIncludes(stylesheetSource, 'rgba(244, 241, 234, 0.9)', 'QA/review chest mark stays bright enough')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='filming'] .office-agent-sprite__head::before"), 'radial-gradient', 'director agent gets camera/headset-like head detail')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='trading'] .office-agent-sprite__body::after"), 'rgba(212, 84, 77, 0.58)', 'trading agent gets chart-line suit detail')
assertIncludes(stylesheetSource, ".office-floor-agent[data-profession-prop='command'] .office-agent-signal-prop", 'coordinator agent gets command signal detail')
assertIncludes(stylesheetSource, ".office-floor-agent[data-profession-prop='servers'] .office-agent-tool", 'ops agent gets server rack detail')
assertIncludes(stylesheetSource, ".office-floor-agent[data-profession-prop='research'] .office-agent-signal-prop", 'research agent gets map/crosshair detail')
assertIncludes(stylesheetSource, ".office-floor-agent[data-profession-prop='blueprint'] .office-agent-sprite__body::before", 'spec agent gets blueprint chest document')
assertIncludes(stylesheetSource, ".office-floor-agent[data-profession-prop='qa'] .office-agent-sprite__body::before", 'QA agent gets shield/check chest cue')
assertIncludes(stylesheetSource, ".office-floor-agent[data-agent-id='agent-verstalnyk'] .office-agent-tool::before", 'layout agent gets grid/canvas cue')
assertIncludes(stylesheetSource, ".office-floor-agent[data-agent-id='agent-vitryna'] .office-agent-tool", 'Вітрина agent gets image/frame cue')
assertIncludes(stylesheetSource, ".office-floor-agent[data-profession-prop='trading'] .office-agent-signal-prop", 'trading agent gets market chart cue')
assertIncludes(stylesheetSource, ".office-floor-agent[data-profession-prop='camera'] .office-agent-tool::after", 'director agent gets camera lens cue')
assertIncludes(getBlock('.office-floor-agent.office-behavior--path-step'), 'office-floor-agent-route', 'walking physical agents use floor route animation')
assertIncludes(stylesheetSource, '@keyframes office-floor-agent-route', 'physical floor walking route keyframes')
assertIncludes(getBlock('.office-terminal--typing .office-terminal__ticks'), '3s', 'measured typing cadence')
assertIncludes(stylesheetSource, '@media (prefers-reduced-motion: reduce)', 'reduced-motion support')
assertIncludes(stylesheetSource, '.office-agent-avatar,', 'reduced-motion avatar fallback')
assertIncludes(stylesheetSource, '.office-agent-action-cue,', 'reduced-motion action cue fallback')
assertIncludes(stylesheetSource, '.office-agent-sprite__legs::before', 'reduced-motion sprite fallback')
assertNotIncludes(componentSource, 'className="office-walkers"', 'reduced-motion no longer needs a standalone walking overlay')
assertIncludes(stylesheetSource, '.office-floor-agent,', 'reduced-motion physical agent route fallback')
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
assert.equal(OFFICE_SPRITE_TOKENS.taskBubble, 'office-task-bubble', 'task bubble token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.hands, 'office-agent-sprite__hands', 'worker hands token is stable')
assert.equal(
  getOfficeStationClassName('north', 'working', 'active', 'coding', true),
  'office-desk office-workstation office-desk--north office-desk--working office-desk--state-coding office-desk--pulse-active office-desk--selected',
  'station class mapper separates view-model state from CSS tokens',
)
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
  {
    id: 'agent-marketing',
    name: 'Вітрина 🖼️',
    role: 'marketing',
    status: 'working',
    currentTaskId: 'task-marketing',
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
  {
    id: 'task-marketing',
    title: 'Social preview board',
    status: 'in_progress',
    ownerAgentId: 'agent-marketing',
    priority: 'medium',
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
const marketingStation = viewModel.stations.find((station) => station.agentId === 'agent-marketing')

assert.equal(onlineStation?.activity, 'working', 'in-progress current task maps to working')
assert.deepEqual(
  { x: onlineStation?.x, y: onlineStation?.y, lane: onlineStation?.lane },
  { x: 9, y: 43, lane: 'north' },
  'coding station sits at a lower top-left workstation PC with a clear aisle',
)
assert.equal(onlineStation?.terminalMode, 'typing', 'in-progress current task maps to typing')
assert.equal(onlineStation?.pulse, 'active', 'working health maps to active pulse')
assert.equal(onlineStation?.choreography.phaseLabel, 'type-monitor', 'working loops through type/monitor phase')
assert.equal(onlineStation?.choreography.className, 'office-behavior--type-monitor', 'working phase class is stable')
assert.equal(onlineStation?.choreography.intensity, 'focused', 'working phase uses focused intensity')
assert.equal(onlineStation?.choreography.routeInvolvement, true, 'working routed station tracks route involvement')
assert.equal(busyStation?.activity, 'monitoring', 'waiting status maps to monitoring')
assert.deepEqual(
  { x: busyStation?.x, y: busyStation?.y, lane: busyStation?.lane },
  { x: 19, y: 43, lane: 'north' },
  'QA station sits at a separate top-left workstation PC with aisle clearance',
)
assert.equal(busyStation?.terminalMode, 'monitoring', 'waiting task maps to monitoring')
assert.equal(busyStation?.choreography.phaseLabel, 'scan-check', 'monitoring loops through scan/check phase')
assert.equal(blockedStation?.activity, 'blocked', 'failed task state maps to blocked')
assert.deepEqual(
  { x: blockedStation?.x, y: blockedStation?.y, lane: blockedStation?.lane },
  { x: 16, y: 82, lane: 'south' },
  'ops station is in the server/admin console zone, not a radial position',
)
assert.equal(blockedStation?.action, 'alert', 'failed task state maps to alert action')
assert.equal(blockedStation?.pulse, 'danger', 'failed task state maps to danger pulse')
assert.equal(blockedStation?.tone, 'danger', 'failed task state maps to danger lamp')
assert.equal(blockedStation?.choreography.phaseLabel, 'resolve-pulse', 'alert loops through resolve pulse phase')
assert.equal(restingStation?.activity, 'resting', 'completed spec stays seated at the top-left PC station')
assert.equal(restingStation?.action, 'resting', 'completed spec uses a seated review/check action')
assert.equal(restingStation?.choreography.phaseLabel, 'sofa-idle', 'seated spec loops through the calm idle phase')
assert.equal(walkingStation?.activity, 'monitoring', 'queued task state stays local monitoring')
assert.deepEqual(
  { x: walkingStation?.x, y: walkingStation?.y, lane: walkingStation?.lane },
  { x: 14, y: 25, lane: 'north' },
  'research station stays in the top-left workstation row',
)
assert.equal(walkingStation?.action, 'monitoring', 'queued task state maps to local monitoring action')
assert.equal(walkingStation?.choreography.phaseLabel, 'scan-check', 'queued task loops through local scan/check phase')
assert.equal(handoffStation?.activity, 'handoff', 'delegated task state maps to handoff')
assert.deepEqual(
  { x: handoffStation?.x, y: handoffStation?.y, lane: handoffStation?.lane },
  { x: 51, y: 40, lane: 'south' },
  'coordinator desk stays at the central meeting table',
)
assert.equal(handoffStation?.action, 'handoff', 'delegated task state maps to handoff action')
assert.equal(handoffStation?.choreography.phaseLabel, 'signal-transfer', 'handoff loops through signal transfer phase')
assert.equal(marketingStation?.name, 'Вітрина', 'marketing visuals agent renders as its own office station')
assert.deepEqual(
  { x: marketingStation?.x, y: marketingStation?.y, lane: marketingStation?.lane },
  { x: 76, y: 38, lane: 'east' },
  'marketing visuals station sits fully inside the right visual presentation wall',
)
assert.equal(marketingStation?.simulation.posture, 'standing', 'marketing visuals agent stands at the visual wall instead of sitting at a generic desk')
assert.equal(marketingStation?.professionProp, 'canvas', 'marketing visuals station uses visual canvas profession prop')
assert.equal(marketingStation?.activityState, 'presenting', 'marketing visuals station has its own activity state')
assert.equal(marketingStation?.simulation.deskId, 'desk-marketing', 'marketing visuals simulation maps to dedicated desk')
assert.equal(marketingStation?.simulation.zoneId, 'marketing', 'marketing visuals simulation maps to dedicated zone')
assert.equal(marketingStation?.simulation.pathId, 'path-design-marketing', 'marketing visuals simulation maps to dedicated route')
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
