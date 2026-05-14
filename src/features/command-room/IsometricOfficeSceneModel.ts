import type { ActivityEvent, Agent, CommandCenterSnapshot, Task, WorkflowEdge } from '../../shared/types'
import type { OfficeActivityState } from './IsometricOfficeSpriteSystem'
import {
  createOfficeSimulation,
  type OfficeAgentSimulationState,
  type OfficeSimulationTickOptions,
} from './OfficeSimulationModel.ts'

export type OfficeStationAction =
  | 'alert'
  | 'blocked'
  | 'coordinating'
  | 'handoff'
  | 'resting'
  | 'walking'
  | 'working'
  | 'monitoring'
  | 'signaling'
  | 'standby'

export type OfficeStationActivity = OfficeStationAction
export type OfficeActionPhase =
  | 'path-step'
  | 'resolve-pulse'
  | 'scan-check'
  | 'signal-transfer'
  | 'sofa-idle'
  | 'type-monitor'
export type OfficeBehaviorIntensity = 'calm' | 'focused' | 'high' | 'low' | 'medium'
export type OfficeBehaviorTempo = 'brisk' | 'measured' | 'settled' | 'slow' | 'steady'
export type OfficeProfessionProp =
  | 'blueprint'
  | 'camera'
  | 'canvas'
  | 'code'
  | 'command'
  | 'qa'
  | 'research'
  | 'servers'
  | 'trading'

export interface OfficeBehaviorChoreography {
  phaseLabel: OfficeActionPhase
  className: `office-behavior--${OfficeActionPhase}`
  routeInvolvement: boolean
  intensity: OfficeBehaviorIntensity
  tempo: OfficeBehaviorTempo
  animationDelay: string
  animationDuration: string
}

export interface OfficeAgentStation {
  id: string
  agentId: string
  name: string
  role: string
  marker: string
  status: Agent['status']
  action: OfficeStationAction
  activity: OfficeStationActivity
  tone: OfficeStationTone
  pulse: OfficeStationPulse
  terminalMode: OfficeTerminalMode
  professionProp: OfficeProfessionProp
  activityState: OfficeActivityState
  activityLabel: string
  taskBubble: string
  choreography: OfficeBehaviorChoreography
  slot: number
  x: number
  y: number
  lane: 'north' | 'east' | 'south' | 'west'
  taskTitle: string
  currentTask: string
  simulation: OfficeAgentSimulationState
}

export interface OfficeSignalRoute {
  id: string
  lane: OfficeAgentStation['lane']
  label: string
  activity: 'active' | 'blocked' | 'handoff' | 'monitoring'
  tone: OfficeStationTone
  isSelected: boolean
  animationDelay: string
  animationDuration: string
}

export interface OfficeSceneViewModel {
  stations: OfficeAgentStation[]
  signalRoutes: OfficeSignalRoute[]
}

export type OfficeStationTone = 'caution' | 'danger' | 'online' | 'standby'
export type OfficeStationPulse = 'active' | 'calm' | 'danger' | 'idle'
export type OfficeTerminalMode = 'idle' | 'monitoring' | 'typing'

const officeStationLayout: Array<Pick<OfficeAgentStation, 'x' | 'y' | 'lane'>> = [
  { x: 51, y: 40, lane: 'south' },
  { x: 16, y: 47, lane: 'west' },
  { x: 16, y: 82, lane: 'south' },
  { x: 14, y: 25, lane: 'north' },
  { x: 38, y: 27, lane: 'north' },
  { x: 37, y: 49, lane: 'east' },
  { x: 81, y: 81, lane: 'east' },
  { x: 83, y: 55, lane: 'east' },
  { x: 76, y: 38, lane: 'east' },
  { x: 63, y: 76, lane: 'south' },
]

const roleOfficeLayout: Record<string, Pick<OfficeAgentStation, 'x' | 'y' | 'lane'>> = {
  'main/orchestrator': { x: 51, y: 40, lane: 'south' },
  coding: { x: 16, y: 47, lane: 'west' },
  ops: { x: 16, y: 82, lane: 'south' },
  research: { x: 14, y: 25, lane: 'north' },
  requirements: { x: 38, y: 27, lane: 'north' },
  QA: { x: 37, y: 49, lane: 'east' },
  video: { x: 81, y: 81, lane: 'east' },
  'UI/layout': { x: 83, y: 55, lane: 'east' },
  marketing: { x: 76, y: 38, lane: 'east' },
  trading: { x: 63, y: 76, lane: 'south' },
}

const roleLabel: Record<string, string> = {
  'main/orchestrator': 'Command',
  coding: 'Coding',
  ops: 'Ops',
  research: 'Research',
  requirements: 'Spec',
  QA: 'QA/Sec',
  video: 'Director',
  'UI/layout': 'Layout',
  marketing: 'Вітрина',
  trading: 'Trading',
}

const roleProfessionProp: Record<string, OfficeProfessionProp> = {
  'main/orchestrator': 'command',
  coding: 'code',
  ops: 'servers',
  research: 'research',
  requirements: 'blueprint',
  QA: 'qa',
  video: 'camera',
  'UI/layout': 'canvas',
  marketing: 'canvas',
  trading: 'trading',
}

const roleActivityState: Record<string, OfficeActivityState> = {
  'main/orchestrator': 'coordinating',
  coding: 'coding',
  ops: 'monitoring',
  research: 'researching',
  requirements: 'reviewing',
  QA: 'checking',
  video: 'filming',
  'UI/layout': 'designing',
  marketing: 'presenting',
  trading: 'trading',
}

const roleActivityLabel: Record<OfficeActivityState, string> = {
  checking: 'check',
  coding: 'code',
  coordinating: 'sync',
  designing: 'grid',
  filming: 'shot',
  monitoring: 'ops',
  presenting: 'board',
  researching: 'scan',
  reviewing: 'spec',
  trading: 'chart',
}

const roleTaskBubble: Record<string, string> = {
  'main/orchestrator': 'sync',
  coding: 'code',
  ops: 'deploy',
  research: 'research',
  requirements: 'spec',
  QA: 'visual QA',
  video: 'shot list',
  'UI/layout': 'layout',
  marketing: 'visuals',
  trading: 'market',
}

function getCompactTaskBubbleLabel(currentTask: string, fallback: string) {
  const normalizedTask = currentTask
    .replace(/^(route to|handoff:|monitor:)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalizedTask || normalizedTask === 'Read-only station') {
    return fallback
  }

  const compactWords = normalizedTask
    .split(' ')
    .filter((word) => word.length > 1)
    .slice(0, 3)
    .join(' ')

  return compactWords.length > 18 ? `${compactWords.slice(0, 17)}.` : compactWords
}

const actionPhaseMap: Record<OfficeStationAction, Pick<OfficeBehaviorChoreography, 'intensity' | 'phaseLabel' | 'tempo'>> = {
  alert: { phaseLabel: 'resolve-pulse', intensity: 'high', tempo: 'slow' },
  blocked: { phaseLabel: 'resolve-pulse', intensity: 'high', tempo: 'slow' },
  coordinating: { phaseLabel: 'type-monitor', intensity: 'focused', tempo: 'steady' },
  handoff: { phaseLabel: 'signal-transfer', intensity: 'medium', tempo: 'measured' },
  monitoring: { phaseLabel: 'scan-check', intensity: 'calm', tempo: 'slow' },
  resting: { phaseLabel: 'sofa-idle', intensity: 'low', tempo: 'settled' },
  signaling: { phaseLabel: 'signal-transfer', intensity: 'medium', tempo: 'measured' },
  standby: { phaseLabel: 'scan-check', intensity: 'low', tempo: 'slow' },
  walking: { phaseLabel: 'path-step', intensity: 'medium', tempo: 'brisk' },
  working: { phaseLabel: 'type-monitor', intensity: 'focused', tempo: 'steady' },
}

const actionDurationMs: Record<OfficeActionPhase, number> = {
  'path-step': 7200,
  'resolve-pulse': 9200,
  'scan-check': 6400,
  'signal-transfer': 7600,
  'sofa-idle': 10400,
  'type-monitor': 6200,
}

const statusDelayStepMs: Record<Agent['status'], number> = {
  blocked: 470,
  done: 310,
  error: 530,
  idle: 190,
  waiting: 370,
  working: 230,
}

function formatMs(value: number) {
  return `${value}ms`
}

function getStableAnimationDelay(index: number, action: OfficeStationAction, status: Agent['status']) {
  const actionSeed = action.length * 83
  const statusSeed = statusDelayStepMs[status]
  const layoutSeed = (index % officeStationLayout.length) * 137

  return formatMs(-((actionSeed + statusSeed + layoutSeed) % 2800))
}

export function getStationChoreography(
  index: number,
  action: OfficeStationAction,
  status: Agent['status'],
  routeInvolvement = false,
): OfficeBehaviorChoreography {
  const phase = actionPhaseMap[action]
  const durationMs = actionDurationMs[phase.phaseLabel] + (index % 3) * 260

  return {
    ...phase,
    className: `office-behavior--${phase.phaseLabel}`,
    routeInvolvement,
    animationDelay: getStableAnimationDelay(index, action, status),
    animationDuration: formatMs(durationMs),
  }
}

function getAgentMarker(agent: Agent) {
  return agent.name.match(/\p{Extended_Pictographic}/u)?.[0] ?? agent.name.slice(0, 1)
}

function getAgentDisplayName(agent: Agent) {
  return agent.name.replace(/\s*\p{Extended_Pictographic}[\uFE0E\uFE0F]?/gu, '').trim()
}

function getStationActionFromSimulation(simulationState: OfficeAgentSimulationState): OfficeStationAction {
  if (simulationState.activity === 'blocked') {
    return 'alert'
  }

  if (simulationState.posture === 'standing' && simulationState.activity === 'reviewing') {
    return 'monitoring'
  }

  if (simulationState.activity === 'idle') {
    return 'resting'
  }

  return simulationState.activity === 'reviewing' ? 'resting' : simulationState.activity
}

export function getStationTone(status: Agent['status'], taskStatus?: Task['status']): OfficeStationTone {
  if (
    status === 'blocked' ||
    status === 'error' ||
    taskStatus === 'blocked' ||
    taskStatus === 'failed'
  ) {
    return 'danger'
  }

  if (status === 'waiting' || taskStatus === 'waiting') {
    return 'caution'
  }

  if (status === 'working' || status === 'done' || taskStatus === 'in_progress') {
    return 'online'
  }

  return 'standby'
}

function isBlockedState(agent: Agent, task?: Task) {
  return (
    agent.status === 'blocked' ||
    agent.status === 'error' ||
    task?.status === 'blocked' ||
    task?.status === 'failed'
  )
}

function getStationPulse(agent: Agent, task?: Task): OfficeStationPulse {
  if (isBlockedState(agent, task)) {
    return 'danger'
  }

  if (
    agent.status === 'working' ||
    task?.status === 'in_progress' ||
    task?.status === 'delegated'
  ) {
    return 'active'
  }

  if (agent.status === 'waiting' || task?.status === 'waiting' || task?.status === 'queued') {
    return 'calm'
  }

  return 'idle'
}

function getTerminalMode(agent: Agent, task?: Task): OfficeTerminalMode {
  if (isBlockedState(agent, task)) {
    return 'monitoring'
  }

  if (
    agent.status === 'working' ||
    task?.status === 'in_progress' ||
    task?.status === 'delegated'
  ) {
    return 'typing'
  }

  if (agent.status === 'waiting' || task?.status === 'waiting' || task?.status === 'queued') {
    return 'monitoring'
  }

  return 'idle'
}

export function createOfficeAgentStations(
  agents: Agent[],
  tasks: Task[],
  simulationOptions: OfficeSimulationTickOptions = {},
): OfficeAgentStation[] {
  const simulation = createOfficeSimulation(agents, tasks, simulationOptions)

  return agents.map((agent, index) => {
    const layout = roleOfficeLayout[agent.role] ?? officeStationLayout[index % officeStationLayout.length]
    const task =
      tasks.find((item) => item.id === agent.currentTaskId) ??
      tasks.find((item) => item.ownerAgentId === agent.id)
    const simulationState =
      simulation.agents.find((item) => item.agentId === agent.id) ?? simulation.agents[0]
    const action = getStationActionFromSimulation(simulationState)
    const activity = action === 'alert' ? 'blocked' : action

    return {
      id: `office-station-${agent.id}`,
      agentId: agent.id,
      name: getAgentDisplayName(agent),
      role: roleLabel[agent.role] ?? agent.role,
      marker: getAgentMarker(agent),
      status: agent.status,
      action,
      activity,
      tone: getStationTone(agent.status, task?.status),
      pulse: getStationPulse(agent, task),
      terminalMode: getTerminalMode(agent, task),
      professionProp: roleProfessionProp[agent.role] ?? 'command',
      activityState: roleActivityState[agent.role] ?? 'presenting',
      activityLabel: roleActivityLabel[roleActivityState[agent.role] ?? 'presenting'],
      taskBubble: getCompactTaskBubbleLabel(
        simulationState.currentTask,
        roleTaskBubble[agent.role] ?? task?.nextStep ?? task?.title ?? 'watch',
      ),
      choreography: getStationChoreography(index, action, agent.status),
      slot: index % officeStationLayout.length,
      taskTitle: task?.title ?? 'Read-only station',
      currentTask: simulationState.currentTask,
      simulation: simulationState,
      ...layout,
    }
  })
}

function sortActivityByNewest(events: ActivityEvent[]) {
  return [...events].sort(
    (firstEvent, secondEvent) =>
      new Date(secondEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime(),
  )
}

function getRouteTone(
  edge: WorkflowEdge,
  workflow: CommandCenterSnapshot['workflow'],
  stations: OfficeAgentStation[],
  activity: ActivityEvent[],
): OfficeStationTone {
  const nodeIds = new Set([edge.from, edge.to])
  const agentIds = new Set(
    workflow.nodes.filter((node) => nodeIds.has(node.id)).map((node) => node.agentId),
  )
  const relatedStation = stations.find((station) => agentIds.has(station.agentId))
  const relatedEvent = sortActivityByNewest(activity).find((event) => agentIds.has(event.agentId))

  if (
    relatedStation?.tone === 'danger' ||
    relatedEvent?.severity === 'critical' ||
    relatedEvent?.category === 'blocker'
  ) {
    return 'danger'
  }

  if (relatedEvent?.severity === 'warning' || relatedStation?.tone === 'caution') {
    return 'caution'
  }

  if (relatedEvent?.severity === 'success' || relatedStation?.tone === 'online') {
    return 'online'
  }

  return 'standby'
}

function getRouteActivity(
  edge: WorkflowEdge,
  workflow: CommandCenterSnapshot['workflow'],
  stations: OfficeAgentStation[],
  tone: OfficeStationTone,
): OfficeSignalRoute['activity'] {
  if (tone === 'danger') {
    return 'blocked'
  }

  const targetNode = workflow.nodes.find((node) => node.id === edge.to)
  const targetStation = stations.find((station) => station.agentId === targetNode?.agentId)

  if (targetStation?.activity === 'handoff' || edge.label.toLowerCase().includes('release')) {
    return 'handoff'
  }

  if (targetStation?.activity === 'monitoring') {
    return 'monitoring'
  }

  return 'active'
}

export function createOfficeSignalRoutes(
  stations: OfficeAgentStation[],
  activity: ActivityEvent[],
  workflow: CommandCenterSnapshot['workflow'],
  selectedAgentId?: string,
): OfficeSignalRoute[] {
  return workflow.edges.slice(0, 6).map((edge, index) => {
    const targetNode = workflow.nodes.find((node) => node.id === edge.to)
    const targetStation = stations.find((station) => station.agentId === targetNode?.agentId)
    const lane = targetStation?.lane ?? officeStationLayout[index % officeStationLayout.length].lane
    const tone = getRouteTone(edge, workflow, stations, activity)
    const relatedNodeIds = new Set([edge.from, edge.to])
    const relatedAgentIds = new Set(
      workflow.nodes.filter((node) => relatedNodeIds.has(node.id)).map((node) => node.agentId),
    )

    return {
      id: `office-route-${edge.id}`,
      lane,
      label: edge.label,
      tone,
      activity: getRouteActivity(edge, workflow, stations, tone),
      isSelected: selectedAgentId ? relatedAgentIds.has(selectedAgentId) : false,
      animationDelay: formatMs(-((index * 420 + edge.label.length * 37) % 2600)),
      animationDuration: formatMs(5000 + (index % 4) * 520),
    }
  })
}

function getRoutedAgentIds(workflow: CommandCenterSnapshot['workflow']) {
  const routedNodeIds = new Set(workflow.edges.flatMap((edge) => [edge.from, edge.to]))

  return new Set(
    workflow.nodes.filter((node) => routedNodeIds.has(node.id)).map((node) => node.agentId),
  )
}

export function createOfficeSceneViewModel(
  agents: Agent[],
  tasks: Task[],
  activity: ActivityEvent[],
  workflow: CommandCenterSnapshot['workflow'],
  selectedAgentId?: string,
  simulationOptions: OfficeSimulationTickOptions = {},
): OfficeSceneViewModel {
  const stations = createOfficeAgentStations(agents, tasks, simulationOptions)
  const routedAgentIds = getRoutedAgentIds(workflow)
  const choreographedStations = stations.map((station, index) => ({
    ...station,
    choreography: getStationChoreography(
      index,
      station.action,
      station.status,
      routedAgentIds.has(station.agentId),
    ),
  }))

  return {
    stations: choreographedStations,
    signalRoutes: createOfficeSignalRoutes(choreographedStations, activity, workflow, selectedAgentId),
  }
}
