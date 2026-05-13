import type { Agent, Task } from '../../shared/types'

export type OfficeStationAction =
  | 'coordinating'
  | 'working'
  | 'monitoring'
  | 'signaling'
  | 'standby'

export interface OfficeAgentStation {
  id: string
  agentId: string
  name: string
  role: string
  marker: string
  status: Agent['status']
  action: OfficeStationAction
  x: number
  y: number
  lane: 'north' | 'east' | 'south' | 'west'
  taskTitle: string
}

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

function getStationAction(agent: Agent): OfficeStationAction {
  if (agent.role === 'main/orchestrator') {
    return 'coordinating'
  }

  if (agent.status === 'working' || agent.status === 'done') {
    return 'working'
  }

  if (agent.status === 'blocked' || agent.status === 'error') {
    return 'signaling'
  }

  if (agent.status === 'waiting') {
    return 'monitoring'
  }

  return 'standby'
}

export function getStationTone(status: Agent['status']) {
  if (status === 'blocked' || status === 'error') {
    return 'danger'
  }

  if (status === 'waiting') {
    return 'caution'
  }

  if (status === 'working' || status === 'done') {
    return 'online'
  }

  return 'standby'
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
      action: getStationAction(agent),
      taskTitle: task?.title ?? 'Read-only station',
      ...layout,
    }
  })
}
