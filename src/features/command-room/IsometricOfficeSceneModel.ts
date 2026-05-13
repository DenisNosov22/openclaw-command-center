import type { ActivityEvent, Agent, CommandCenterSnapshot, Task, WorkflowEdge } from '../../shared/types'

export type OfficeStationAction =
  | 'blocked'
  | 'coordinating'
  | 'handoff'
  | 'walking'
  | 'working'
  | 'monitoring'
  | 'signaling'
  | 'standby'

export type OfficeStationActivity = OfficeStationAction

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

  if (agent.role === 'main/orchestrator') {
    return 'coordinating'
  }

  if (
    agent.status === 'working' ||
    agent.status === 'done' ||
    task?.status === 'in_progress' ||
    task?.status === 'completed'
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
    return 'signaling'
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
): OfficeSignalRoute[] {
  return workflow.edges.slice(0, 6).map((edge, index) => {
    const targetNode = workflow.nodes.find((node) => node.id === edge.to)
    const targetStation = stations.find((station) => station.agentId === targetNode?.agentId)
    const lane = targetStation?.lane ?? officeStationLayout[index % officeStationLayout.length].lane
    const tone = getRouteTone(edge, workflow, stations, activity)

    return {
      id: `office-route-${edge.id}`,
      lane,
      label: edge.label,
      tone,
      activity: getRouteActivity(edge, workflow, stations, tone),
    }
  })
}

export function createOfficeSceneViewModel(
  agents: Agent[],
  tasks: Task[],
  activity: ActivityEvent[],
  workflow: CommandCenterSnapshot['workflow'],
): OfficeSceneViewModel {
  const stations = createOfficeAgentStations(agents, tasks)

  return {
    stations,
    signalRoutes: createOfficeSignalRoutes(stations, activity, workflow),
  }
}
