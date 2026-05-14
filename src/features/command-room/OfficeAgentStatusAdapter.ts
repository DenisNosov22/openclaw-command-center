import type { Agent } from '../../shared/types'
import {
  getOfficeDesk,
  getOfficePath,
  OFFICE_AGENT_PROFILES,
  OFFICE_PATHS,
  type OfficeAgentActivity,
  type OfficeAgentLiveStatusInput,
  type OfficeAgentPosture,
  type OfficePath,
  type OfficePoint,
} from './OfficeSimulationModel.ts'

export type OfficeAgentLiveState =
  | 'blocked'
  | 'done'
  | 'failed'
  | 'idle'
  | 'running'
  | 'waiting'

export interface OfficeAgentStatusSnapshot {
  agentId: string
  name: string
  state: OfficeAgentLiveState
  currentTask: string
  updatedAt: string
  progress?: number
  targetRole?: string
}

export interface OfficeAgentStatusSimulationOverride extends OfficeAgentLiveStatusInput {
  statusBadge: OfficeAgentLiveState
  updatedAt: string
}

const stateSimulationCue: Record<
  OfficeAgentLiveState,
  { activity: OfficeAgentActivity; posture: OfficeAgentPosture }
> = {
  blocked: { activity: 'blocked', posture: 'blocked' },
  done: { activity: 'reviewing', posture: 'sitting' },
  failed: { activity: 'blocked', posture: 'blocked' },
  idle: { activity: 'idle', posture: 'idle' },
  running: { activity: 'working', posture: 'working' },
  waiting: { activity: 'monitoring', posture: 'standing' },
}

const fixtureStates: OfficeAgentLiveState[] = [
  'running',
  'running',
  'waiting',
  'running',
  'running',
  'running',
  'running',
  'running',
  'running',
  'waiting',
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundPoint(point: OfficePoint): OfficePoint {
  return {
    x: Number(point.x.toFixed(2)),
    y: Number(point.y.toFixed(2)),
  }
}

function interpolatePoint(from: OfficePoint, to: OfficePoint, progress: number): OfficePoint {
  const boundedProgress = clamp(progress, 0, 1)

  return roundPoint({
    x: from.x + (to.x - from.x) * boundedProgress,
    y: from.y + (to.y - from.y) * boundedProgress,
  })
}

function getPathPoint(path: OfficePath, progress: number) {
  const boundedProgress = clamp(progress, 0, 1)

  if (path.points.length === 0) {
    return { x: 0, y: 0 }
  }

  if (path.points.length === 1) {
    return roundPoint(path.points[0])
  }

  const segmentCount = path.points.length - 1
  const rawSegment = boundedProgress * segmentCount
  const segmentIndex = Math.min(Math.floor(rawSegment), segmentCount - 1)
  const segmentProgress = rawSegment - segmentIndex

  return interpolatePoint(path.points[segmentIndex], path.points[segmentIndex + 1], segmentProgress)
}

function getAgentProfile(agent: Agent) {
  return OFFICE_AGENT_PROFILES[agent.role]
}

function findTargetPath(agent: Agent, targetRole: string) {
  const sourceProfile = getAgentProfile(agent)
  const targetProfile = OFFICE_AGENT_PROFILES[targetRole]

  if (!sourceProfile || !targetProfile) {
    return undefined
  }

  return (
    OFFICE_PATHS.find(
      (path) =>
        path.fromZoneId === sourceProfile.zoneId &&
        path.toZoneId === targetProfile.zoneId,
    ) ??
    OFFICE_PATHS.find(
      (path) =>
        path.fromZoneId === targetProfile.zoneId &&
        path.toZoneId === sourceProfile.zoneId,
    ) ??
    getOfficePath(sourceProfile.pathId)
  )
}

function getTargetPoint(targetRole: string) {
  const profile = OFFICE_AGENT_PROFILES[targetRole]

  return profile ? getOfficeDesk(profile.deskId).point : undefined
}

function createTargetRouteOverride(
  agent: Agent,
  snapshot: OfficeAgentStatusSnapshot,
): Pick<OfficeAgentStatusSimulationOverride, 'activity' | 'pathId' | 'position' | 'posture' | 'target'> {
  if (agent.role === 'main/orchestrator' || agent.role === 'main') {
    return {}
  }

  if (!snapshot.targetRole) {
    return {}
  }

  const target = getTargetPoint(snapshot.targetRole)
  const path = findTargetPath(agent, snapshot.targetRole)

  if (!target || !path) {
    return {}
  }
  const sourceProfile = getAgentProfile(agent)
  const targetProfile = OFFICE_AGENT_PROFILES[snapshot.targetRole]
  const progress = clamp(snapshot.progress ?? 0.5, 0, 1)
  const isArrivingAtHandoff = progress >= 0.8
  const sameZonePosition =
    sourceProfile &&
    targetProfile &&
    sourceProfile.zoneId === targetProfile.zoneId
      ? interpolatePoint(
          getOfficeDesk(sourceProfile.deskId).point,
          target,
          Math.min(progress, 0.34),
        )
      : getPathPoint(path, progress)

  return {
    activity: isArrivingAtHandoff ? 'handoff' : 'walking',
    pathId: path.id,
    position: sameZonePosition,
    posture: isArrivingAtHandoff ? 'handoff' : 'walking',
    target: roundPoint(target),
  }
}

function getLiveHomePosture(
  cue: { activity: OfficeAgentActivity; posture: OfficeAgentPosture },
  agent?: Agent,
) {
  if (!agent) {
    return cue.posture
  }

  const profile = getAgentProfile(agent)
  const desk = profile ? getOfficeDesk(profile.deskId) : undefined
  const seatedAnchorKinds = new Set([
    'camera-studio-standing-mark',
    'meeting-table-chair-edge-seat',
    'pc-chair-workstation-seat',
    'presentation-showcase-wall-spot',
    'server-admin-console-seat',
    'trading-monitor-chair',
  ])

  return desk && seatedAnchorKinds.has(desk.anchorKind) && cue.posture !== 'walking' && cue.posture !== 'handoff'
    ? 'sitting'
    : cue.posture
}

export function mapOfficeAgentStatusSnapshot(
  snapshot: OfficeAgentStatusSnapshot,
  agent?: Agent,
): OfficeAgentStatusSimulationOverride {
  const cue = stateSimulationCue[snapshot.state]
  const targetRouteOverride =
    snapshot.state === 'running' && agent ? createTargetRouteOverride(agent, snapshot) : {}

  return {
    activity: cue.activity,
    currentTask: snapshot.currentTask,
    posture: getLiveHomePosture(cue, agent),
    statusBadge: snapshot.state,
    updatedAt: snapshot.updatedAt,
    ...targetRouteOverride,
  }
}

export function createOfficeAgentStatusSimulationOverrides(
  agents: Agent[],
  snapshots: OfficeAgentStatusSnapshot[],
): Record<string, OfficeAgentStatusSimulationOverride> {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]))
  const overrides: Record<string, OfficeAgentStatusSimulationOverride> = {}

  for (const snapshot of snapshots) {
    const agent = agentsById.get(snapshot.agentId)

    if (!agent || !getAgentProfile(agent)) {
      continue
    }

    overrides[snapshot.agentId] = mapOfficeAgentStatusSnapshot(snapshot, agent)
  }

  return overrides
}

export function createOfficeAgentStatusFixture(
  agents: Agent[],
  updatedAt = '2026-05-14T09:20:00.000Z',
): OfficeAgentStatusSnapshot[] {
  return agents
    .filter((agent) => getAgentProfile(agent))
    .map((agent, index) => {
      const state = fixtureStates[index % fixtureStates.length]
      return {
        agentId: agent.id,
        name: agent.name,
        state,
        currentTask: agent.summary ?? 'Live status fixture',
        updatedAt,
      }
    })
}
