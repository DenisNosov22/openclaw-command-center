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
assertIncludes(modelSource, "'main/orchestrator': { x: 18, y: 51, lane: 'west' }", 'coordinator desk sits in office coordinator zone')
assertIncludes(modelSource, "ops: { x: 85, y: 22, lane: 'east' }", 'ops station sits by server corner')
assertIncludes(modelSource, "'UI/layout': { x: 47, y: 76, lane: 'south' }", 'design/layout station sits near design wall')
assertIncludes(modelSource, "marketing: { x: 68, y: 61, lane: 'south' }", 'marketing visuals station sits on its own visual wall zone')
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
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS', 'office zone token map usage')
assertIncludes(componentSource, 'export function IsometricOfficeScene', 'office scene component')
assertIncludes(componentSource, 'role="img"', 'accessible scene role')
assertIncludes(componentSource, 'aria-label="2D game-like real office floor plan with agents working at profession stations"', 'scene aria label')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.desk', 'desk/computer office zones')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.sofa', 'sofa/rest office zone')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.hologram', 'subtle hologram UI zone')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.path', 'structured floor lane zone token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.handoff', 'structured handoff/signal zone token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.loungeSofa', 'structured visible lounge sofa token')
assertIncludes(componentSource, 'OFFICE_ZONE_TOKENS.statusBoard', 'structured live office status board token')
assertIncludes(componentSource, 'office-room-props', 'physical room props layer')
assertIncludes(componentSource, 'office-wall office-wall--back', 'back wall room composition prop')
assertIncludes(componentSource, 'office-rug office-rug--center', 'central rug/path room composition prop')
assertIncludes(componentSource, 'office-cabinet office-cabinet--ops', 'ops cabinet/server room prop')
assertIncludes(componentSource, 'office-whiteboard office-whiteboard--research', 'research whiteboard room prop')
assertIncludes(componentSource, 'office-social-board office-social-board--marketing', 'marketing visuals wall prop')
assertIncludes(componentSource, 'office-desk-cluster office-desk-cluster--north', 'desk cluster grounding prop')
assertIncludes(componentSource, 'office-zone-label office-zone-label--ops', 'ops/server corner label')
assertIncludes(componentSource, 'office-zone-label office-zone-label--design', 'design/marketing wall label')
assertIncludes(componentSource, 'office-zone-label office-zone-label--marketing', 'marketing/visual wall label')
assertIncludes(componentSource, 'office-zone-label office-zone-label--trade', 'trading desk label')
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
assertIncludes(componentSource, 'getOfficeTerminalClassName(station.terminalMode)', 'task-aware terminal mode classes')
assertIncludes(componentSource, 'data-profession-prop={station.professionProp}', 'profession prop metadata')
assertIncludes(componentSource, 'office-profession-prop--${station.professionProp}', 'profession prop visual classes')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.taskBubble', 'small task bubble token')
assertIncludes(componentSource, 'OFFICE_SPRITE_TOKENS.activityChip', 'attached activity state chip token')
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
assertIncludes(pageSource, 'getOfficeSourceIndicator', 'office status source indicator mapper')
assertIncludes(pageSource, 'data-office-status-source={officeSourceIndicator.label}', 'office status source indicator DOM metadata')
assertIncludes(pageSource, "useState<StageView>('office')", 'Office default stage view')
assertIncludes(pageSource, "setStageView('office')", 'Office toggle handler')
assertIncludes(pageSource, '<IsometricOfficeScene', 'office scene integration')
assertIncludes(pageSource, 'activity={snapshot.activity}', 'office scene timeline binding')
assertIncludes(pageSource, 'workflow={snapshot.workflow}', 'office scene workflow binding')
assertIncludes(pageSource, 'onSelectAgent={setSelectedAgentId}', 'office station selection updates shared inspector agent')
assertIncludes(pageSource, 'selectedAgentId={selectedAgent.id}', 'office selected agent mirrors inspector state')
assertIncludes(getBlock('.isometric-office'), 'linear-gradient', 'office scene layered surface')
assertIncludes(getBlock('.office-source-chip'), 'max-width: 104px', 'office source indicator remains compact but readable')
assertIncludes(getBlock('.office-source-chip'), 'border-radius: 999px', 'office source indicator is a small game-like chip')
assertIncludes(getBlock('.office-source-chip strong'), 'max-width: 52px', 'office source indicator source value remains readable')
assertIncludes(getBlock('.office-source-chip--json'), '#78d4c0', 'office JSON source gets live cyan tone')
assertIncludes(stylesheetSource, '.office-source-chip--stale', 'office stale source indicator tone')
assertIncludes(stylesheetSource, '#ff827b', 'office stale/error source gets warning tone')
assertIncludes(getBlock('.office-floor'), 'perspective(900px) rotateX(50deg)', 'isometric office floor plan')
assertIncludes(getBlock('.office-floor'), 'inset 0 0 0 1px rgba(244, 241, 234', 'mature floor material edge')
assertIncludes(getBlock('.office-room-props'), 'pointer-events: none', 'physical room props layer does not block station selection')
assertIncludes(getBlock('.office-wall--back'), 'repeating-linear-gradient', 'back wall panels')
assertIncludes(getBlock('.office-rug--center'), 'repeating-linear-gradient', 'central rug/path material')
assertIncludes(getBlock('.office-cabinet--ops'), 'repeating-linear-gradient', 'ops cabinet/server prop')
assertIncludes(getBlock('.office-plant::after'), 'radial-gradient', 'office plant leaf prop')
assertIncludes(getBlock('.office-whiteboard--research'), 'repeating-linear-gradient', 'research/search whiteboard prop')
assertIncludes(getBlock('.office-social-board--marketing'), 'linear-gradient(135deg', 'marketing/social board wall prop')
assertIncludes(stylesheetSource, 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3), transparent 70%)', 'desk cluster floor shadows')
assertIncludes(getBlock('.office-zone-label'), 'text-transform: uppercase', 'office zone labels')
assertIncludes(getBlock('.office-area'), 'position: absolute', 'office functional zones')
assertIncludes(getBlock('.office-area--desk'), 'rgba(120, 212, 192', 'desk/computer zone cyan signal')
assertIncludes(getBlock('.office-area--sofa'), 'rgba(215, 180, 92', 'sofa/rest zone gold accent')
assertIncludes(getBlock('.office-area--hologram'), 'rgba(120, 212, 192', 'subtle hologram zone')
assertIncludes(getBlock('.office-area--marketing'), 'rgba(212, 84, 77', 'marketing/visual wall zone')
assertIncludes(getBlock('.office-lounge-sofa'), 'linear-gradient', 'visible sofa lounge shape')
assertIncludes(getBlock('.office-lounge-sofa::before'), 'rgba(215, 180, 92', 'sofa cushion/back detail')
assertIncludes(getBlock('.office-status-board'), 'repeating-linear-gradient', 'visible live status board lanes')
assertIncludes(getBlock('.office-status-board::after'), 'office-board-pulse', 'subtle live board activity')
assertNotIncludes(stylesheetSource, '.office-core', 'office CSS')
assertNotIncludes(stylesheetSource, '.command-core', 'office CSS')
assertNotIncludes(stylesheetSource, 'office-core-scan', 'office CSS')
assertIncludes(getBlock('.office-desk'), 'border: 1px solid rgba(215, 180, 92', 'desk graphite/gold frame')
assertIncludes(getBlock('.office-desk'), '--office-desk-angle', 'furniture desks have stable orientation angles')
assertIncludes(getBlock('.office-desk'), 'rotate(var(--office-desk-angle)) skewY(-4deg)', 'desks are angled furniture objects')
assertIncludes(getBlock('.office-desk'), 'inset 0 -13px 18px', 'desks have physical apron/depth shadow')
assertIncludes(getBlock('.office-workstation::before'), 'rgba(215, 180, 92', 'workstation desktop accent')
assertIncludes(getBlock('.office-workstation::before'), 'border-top:', 'workstation desktop lip detail')
assertIncludes(getBlock('.office-profession-prop'), 'position: absolute', 'profession props are physical workstation objects')
assertIncludes(getBlock('.office-profession-prop--servers'), 'repeating-linear-gradient', 'ops server rack prop')
assertIncludes(getBlock('.office-profession-prop--research::before'), 'border: 2px solid rgba(120, 212, 192', 'research magnifier prop')
assertIncludes(getBlock('.office-profession-prop--blueprint'), 'background-size: 7px 7px', 'spec blueprint table prop')
assertIncludes(getBlock('.office-profession-prop--blueprint::after'), 'border-left: 0', 'spec review folded blueprint marker')
assertIncludes(getBlock('.office-profession-prop--qa::before'), 'border: 1px solid rgba(244, 241, 234', 'QA/security shield prop')
assertIncludes(getBlock('.office-profession-prop--qa::after'), 'box-shadow:', 'QA checklist marker')
assertIncludes(getBlock('.office-profession-prop--canvas'), 'linear-gradient(90deg', 'layout/marketing visual canvas prop')
assertIncludes(getBlock('.office-profession-prop--canvas::before'), 'linear-gradient(90deg', 'layout/design grid marker')
assertIncludes(getBlock('.office-profession-prop--trading'), 'rgba(212, 84, 77', 'trading chart prop')
assertIncludes(getBlock('.office-profession-prop--trading::after'), 'box-shadow:', 'trading chart axis marker')
assertIncludes(getBlock('.office-profession-prop--camera::after'), 'border-left', 'director camera prop')
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
assertIncludes(getBlock('.office-monitor-stand'), 'rgba(215, 180, 92', 'PC monitor stand detail')
assertIncludes(getBlock('.office-keyboard-tray'), 'repeating-linear-gradient', 'keyboard/tool tray key detail')
assertIncludes(getBlock('.office-desk-worklog'), 'box-shadow:', 'desk task stack/worklog prop')
assertIncludes(getBlock('.office-chair'), 'translateY(3px)', 'chairs sit as separate physical furniture')
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
assertIncludes(getBlock('.office-desk'), 'left: var(--office-station-x)', 'desks use view-model office floor x position')
assertIncludes(getBlock('.office-desk'), 'top: var(--office-station-y)', 'desks use view-model office floor y position')
assertIncludes(getBlock('.office-lane'), 'linear-gradient(90deg', 'office walking lane floor treatment')
assertIncludes(getBlock('.office-lane'), 'linear-gradient(90deg', 'office walking lane floor treatment')
assertIncludes(getBlock('.office-lane--inner'), 'height: 248px', 'vertical walking lane path geometry')
assertIncludes(getBlock('.office-desk--coordinating'), 'width: clamp(96px, 12%, 112px)', 'coordinator desk remains a small side overview desk')
assertIncludes(getBlock('.office-handoff-hub::before'), 'data-link', 'handoff hub communicates data transfer')
assertIncludes(getBlock('.office-handoff-hub::after'), 'office-handoff-bus', 'handoff hub packet animation')
assertIncludes(getBlock('.office-handoff-hub'), 'width: 62px', 'handoff hub stays compact instead of becoming a card')
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
assertNotIncludes(componentSource, 'office-walker', 'walking agents live in physical floor-agent layer')
assertIncludes(getBlock('.office-agent-floor'), 'pointer-events: none', 'physical agent floor layer does not block desk selection')
assertIncludes(getBlock('.office-floor-agent'), 'left: var(--office-agent-x)', 'physical agent x/y positioning')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='walking']"), '--office-agent-shift-x: 0px', 'walking posture uses simulation path position without desk offset')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='working'] .office-agent-marker"), 'scaleY(0.94)', 'working posture calms into desk/sitting pose')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='handoff'] .office-agent-marker"), 'rgba(215, 180, 92', 'handoff posture gets document-transfer tone')
assertIncludes(getBlock(".office-floor-agent[data-agent-posture='blocked'] .office-agent-marker"), 'rgba(212, 84, 77', 'blocked posture gets distinct marker tone')
assertIncludes(getBlock(".office-floor-agent[data-agent-activity='monitoring'] .office-agent-marker::before"), '#78d4c0', 'monitoring activity gets distinct status marker')
assertIncludes(getBlock('.office-floor-agent--north'), '--office-agent-shift-y: 52px', 'north agents stand away from desk blocks')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='coding']"), '--office-agent-shift-x: 40px', 'coding floor agent is offset out of the central desk pinch')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='checking']"), '--office-agent-shift-y: -62px', 'QA floor agent keeps a clear lower walkway')
assertIncludes(getBlock(".office-floor-agent[data-activity-state='designing']"), '--office-agent-shift-x: 28px', 'layout floor agent moves toward the design wall')
assertIncludes(getBlock('.office-floor-agent.office-behavior--path-step'), 'office-floor-agent-route', 'walking physical agents use floor route animation')
assertIncludes(stylesheetSource, '@keyframes office-floor-agent-route', 'physical floor walking route keyframes')
assertIncludes(getBlock('.office-terminal--typing .office-terminal__ticks'), '3s', 'measured typing cadence')
assertIncludes(stylesheetSource, '@media (prefers-reduced-motion: reduce)', 'reduced-motion support')
assertIncludes(stylesheetSource, '.office-agent-avatar,', 'reduced-motion avatar fallback')
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
assert.equal(OFFICE_SPRITE_TOKENS.monitorStand, 'office-monitor-stand', 'PC monitor stand token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.professionProp, 'office-profession-prop', 'profession prop token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.taskBubble, 'office-task-bubble', 'task bubble token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.activityChip, 'office-activity-chip', 'activity chip token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.keyboardTray, 'office-keyboard-tray', 'keyboard/tool tray token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.worklog, 'office-desk-worklog', 'desk worklog token is stable')
assert.equal(OFFICE_SPRITE_TOKENS.hands, 'office-agent-sprite__hands', 'worker hands token is stable')
assert.equal(OFFICE_ZONE_TOKENS.desk, 'office-area--desk', 'desk zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.sofa, 'office-area--sofa', 'sofa zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.path, 'office-lane', 'walking path zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.handoff, 'office-handoff-hub', 'handoff signal zone token is stable')
assert.equal(OFFICE_ZONE_TOKENS.loungeSofa, 'office-lounge-sofa', 'lounge sofa prop token is stable')
assert.equal(OFFICE_ZONE_TOKENS.statusBoard, 'office-status-board', 'live status board token is stable')
assert.equal(
  getOfficeStationClassName('north', 'working', 'active', 'coding', true),
  'office-desk office-workstation office-desk--north office-desk--working office-desk--state-coding office-desk--pulse-active office-desk--selected',
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
  { x: 25, y: 38, lane: 'north' },
  'coding station sits left of the central walkway in the main desk row',
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
  { x: 20, y: 77, lane: 'south' },
  'QA station is pulled down-left to open the central desk cluster',
)
assert.equal(busyStation?.terminalMode, 'monitoring', 'waiting task maps to monitoring')
assert.equal(busyStation?.choreography.phaseLabel, 'scan-check', 'monitoring loops through scan/check phase')
assert.equal(blockedStation?.activity, 'blocked', 'failed task state maps to blocked')
assert.deepEqual(
  { x: blockedStation?.x, y: blockedStation?.y, lane: blockedStation?.lane },
  { x: 85, y: 22, lane: 'east' },
  'ops station is in the server corner, not a radial position',
)
assert.equal(blockedStation?.action, 'alert', 'failed task state maps to alert action')
assert.equal(blockedStation?.pulse, 'danger', 'failed task state maps to danger pulse')
assert.equal(blockedStation?.tone, 'danger', 'failed task state maps to danger lamp')
assert.equal(blockedStation?.choreography.phaseLabel, 'resolve-pulse', 'alert loops through resolve pulse phase')
assert.equal(restingStation?.activity, 'resting', 'completed task state maps to resting')
assert.equal(restingStation?.action, 'resting', 'completed task state maps to resting action')
assert.equal(restingStation?.choreography.phaseLabel, 'sofa-idle', 'resting loops through sofa idle phase')
assert.equal(walkingStation?.activity, 'walking', 'queued task state maps to walking')
assert.deepEqual(
  { x: walkingStation?.x, y: walkingStation?.y, lane: walkingStation?.lane },
  { x: 24, y: 20, lane: 'north' },
  'research station stays in the north profession zone with more top-row spacing',
)
assert.equal(walkingStation?.action, 'walking', 'queued task state maps to walking action')
assert.equal(walkingStation?.choreography.phaseLabel, 'path-step', 'walking loops through path/step phase')
assert.equal(handoffStation?.activity, 'handoff', 'delegated task state maps to handoff')
assert.deepEqual(
  { x: handoffStation?.x, y: handoffStation?.y, lane: handoffStation?.lane },
  { x: 18, y: 51, lane: 'west' },
  'coordinator desk stays on the side of the office floor',
)
assert.equal(handoffStation?.action, 'handoff', 'delegated task state maps to handoff action')
assert.equal(handoffStation?.choreography.phaseLabel, 'signal-transfer', 'handoff loops through signal transfer phase')
assert.equal(marketingStation?.name, 'Вітрина', 'marketing visuals agent renders as its own office station')
assert.deepEqual(
  { x: marketingStation?.x, y: marketingStation?.y, lane: marketingStation?.lane },
  { x: 68, y: 61, lane: 'south' },
  'marketing visuals station sits in a separate lower-right visual wall zone',
)
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
