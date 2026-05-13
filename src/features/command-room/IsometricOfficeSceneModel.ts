import type { ActivityEvent, Agent, CommandCenterSnapshot, Task, WorkflowEdge } from '../../shared/types'

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
  choreography: OfficeBehaviorChoreography
  slot: number
  x: number
  y: number
  lane: 'north' | 'east' | 'south' | 'west'
  taskTitle: string
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
  { x: 50, y: 16, lane: 'north' },
  { x: 68, y: 24, lane: 'north' },
  { x: 80, y: 42, lane: 'east' },
  { x: 76, y: 64, lane: 'east' },
  { x: 60, y: 78, lane: 'south' },
  { x: 40, y: 78, lane: 'south' },
  { x: 24, y: 64, lane: 'west' },
  { x: 20, y: 42, lane: 'west' },
  { x: 32, y: 24, lane: 'north' },
]

const roleLabel: Record<string, string> = {
  'main/orchestrator': 'Orchestration',
  coding: 'Code',
  ops: 'Ops',
  research: 'Research',
  requirements: 'Spec',
  QA: 'QA',
  video: 'Media',
  'UI/layout': 'UI',
  trading: 'Trading',
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
  return agent.name.replace(/\s*\p{Extended_Pictographic}/gu, '')
}

function getStationActivity(agent: Agent, task?: Task): OfficeStationActivity {
  if (
    agent.status === 'blocked' ||
    agent.status === 'error' ||
    task?.status === 'blocked' ||
    task?.status === 'failed'
  ) {
    return 'blocked'
  }

  if (task?.status === 'delegated') {
    return 'handoff'
  }

  if (agent.status === 'done' || task?.status === 'completed') {
    return 'resting'
  }

  if (agent.role === 'main/orchestrator') {
    return 'coordinating'
  }

  if (
    agent.status === 'working' ||
    task?.status === 'in_progress'
  ) {
    return 'working'
  }

  if (agent.status === 'waiting' || task?.status === 'waiting') {
    return 'monitoring'
  }

  if (task?.status === 'queued') {
    return 'walking'
  }

  return 'standby'
}

function getStationAction(agent: Agent, task?: Task): OfficeStationAction {
  const activity = getStationActivity(agent, task)

  if (activity === 'blocked') {
    return 'alert'
  }

  return activity
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

export function createOfficeAgentStations(agents: Agent[], tasks: Task[]): OfficeAgentStation[] {
  return agents.map((agent, index) => {
    const layout = officeStationLayout[index % officeStationLayout.length]
    const task =
      tasks.find((item) => item.id === agent.currentTaskId) ??
      tasks.find((item) => item.ownerAgentId === agent.id)

    return {
      id: `office-station-${agent.id}`,
      agentId: agent.id,
      name: getAgentDisplayName(agent),
      role: roleLabel[agent.role] ?? agent.role,
      marker: getAgentMarker(agent),
      status: agent.status,
      action: getStationAction(agent, task),
      activity: getStationActivity(agent, task),
      tone: getStationTone(agent.status, task?.status),
      pulse: getStationPulse(agent, task),
      terminalMode: getTerminalMode(agent, task),
      choreography: getStationChoreography(index, getStationAction(agent, task), agent.status),
      slot: index % officeStationLayout.length,
      taskTitle: task?.title ?? 'Read-only station',
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
): OfficeSceneViewModel {
  const stations = createOfficeAgentStations(agents, tasks)
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
