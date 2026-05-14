import type { Agent, Task } from '../../shared/types'

export type OfficeZoneId =
  | 'command'
  | 'delivery'
  | 'ops'
  | 'research'
  | 'design'
  | 'marketing'
  | 'market'
export type OfficeDeskId =
  | 'desk-command'
  | 'desk-coding'
  | 'desk-ops'
  | 'desk-research'
  | 'desk-spec'
  | 'desk-qa'
  | 'desk-video'
  | 'desk-layout'
  | 'desk-marketing'
  | 'desk-trading'
export type OfficePathId =
  | 'path-command-delivery'
  | 'path-delivery-ops'
  | 'path-research-design'
  | 'path-design-marketing'
  | 'path-market-handoff'
export type OfficeAgentPosture =
  | 'blocked'
  | 'handoff'
  | 'idle'
  | 'sitting'
  | 'standing'
  | 'walking'
  | 'working'
export type OfficeAgentActivity =
  | 'blocked'
  | 'coordinating'
  | 'handoff'
  | 'idle'
  | 'monitoring'
  | 'reviewing'
  | 'walking'
  | 'working'

export interface OfficePoint {
  x: number
  y: number
}

export interface OfficeZone {
  id: OfficeZoneId
  label: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface OfficeDesk {
  id: OfficeDeskId
  zoneId: OfficeZoneId
  profession: string
  label: string
  defaultAction: OfficeAgentActivity
  point: OfficePoint
  lane: 'north' | 'east' | 'south' | 'west'
}

export interface OfficePath {
  id: OfficePathId
  fromZoneId: OfficeZoneId
  toZoneId: OfficeZoneId
  points: OfficePoint[]
}

export interface OfficeAgentProfile {
  role: string
  profession: string
  zoneId: OfficeZoneId
  deskId: OfficeDeskId
  defaultAction: OfficeAgentActivity
  pathId: OfficePathId
}

export interface OfficeAgentSimulationState {
  agentId: string
  role: string
  profession: string
  deskId: OfficeDeskId
  zoneId: OfficeZoneId
  pathId: OfficePathId
  route: OfficePoint[]
  position: OfficePoint
  progress: number
  target: OfficePoint
  activity: OfficeAgentActivity
  currentTask: string
  posture: OfficeAgentPosture
  statusBadge?: string
}

export type OfficeSimulationMode = 'animated' | 'static'

export interface OfficeAgentLiveStatusInput {
  activity?: OfficeAgentActivity
  currentTask?: string
  posture?: OfficeAgentPosture
  statusBadge?: string
  position?: OfficePoint
  target?: OfficePoint
  zoneId?: OfficeZoneId
  deskId?: OfficeDeskId
  pathId?: OfficePathId
}

export interface OfficeSimulationTickOptions {
  elapsedMs?: number
  mode?: OfficeSimulationMode
  liveAgents?: Record<string, OfficeAgentLiveStatusInput>
}

export interface OfficeSimulationTickInput extends OfficeSimulationTickOptions {
  agents: Agent[]
  tasks: Task[]
}

export interface OfficeSimulation {
  zones: OfficeZone[]
  desks: OfficeDesk[]
  paths: OfficePath[]
  agents: OfficeAgentSimulationState[]
}

export const OFFICE_ZONES: OfficeZone[] = [
  {
    id: 'command',
    label: 'Command side desk',
    bounds: { x: 6, y: 35, width: 17, height: 28 },
  },
  {
    id: 'delivery',
    label: 'Delivery desks',
    bounds: { x: 27, y: 35, width: 24, height: 48 },
  },
  {
    id: 'ops',
    label: 'Ops server corner',
    bounds: { x: 70, y: 14, width: 20, height: 22 },
  },
  {
    id: 'research',
    label: 'Research wall',
    bounds: { x: 20, y: 13, width: 42, height: 18 },
  },
  {
    id: 'design',
    label: 'Design and media wall',
    bounds: { x: 39, y: 62, width: 25, height: 24 },
  },
  {
    id: 'marketing',
    label: 'Marketing visuals wall',
    bounds: { x: 62, y: 58, width: 17, height: 21 },
  },
  {
    id: 'market',
    label: 'Trading watch',
    bounds: { x: 74, y: 39, width: 17, height: 18 },
  },
]

export const OFFICE_DESKS: OfficeDesk[] = [
  {
    id: 'desk-command',
    zoneId: 'command',
    profession: 'Coordinator',
    label: 'Command',
    defaultAction: 'coordinating',
    point: { x: 10, y: 52 },
    lane: 'west',
  },
  {
    id: 'desk-coding',
    zoneId: 'delivery',
    profession: 'Developer',
    label: 'Coding',
    defaultAction: 'working',
    point: { x: 31, y: 43 },
    lane: 'north',
  },
  {
    id: 'desk-ops',
    zoneId: 'ops',
    profession: 'Operator',
    label: 'Ops',
    defaultAction: 'monitoring',
    point: { x: 84, y: 18 },
    lane: 'east',
  },
  {
    id: 'desk-research',
    zoneId: 'research',
    profession: 'Researcher',
    label: 'Research',
    defaultAction: 'walking',
    point: { x: 24, y: 16 },
    lane: 'north',
  },
  {
    id: 'desk-spec',
    zoneId: 'research',
    profession: 'Spec writer',
    label: 'Spec',
    defaultAction: 'reviewing',
    point: { x: 54, y: 16 },
    lane: 'north',
  },
  {
    id: 'desk-qa',
    zoneId: 'delivery',
    profession: 'QA analyst',
    label: 'QA/Sec',
    defaultAction: 'reviewing',
    point: { x: 14, y: 83 },
    lane: 'south',
  },
  {
    id: 'desk-video',
    zoneId: 'design',
    profession: 'Video director',
    label: 'Director',
    defaultAction: 'idle',
    point: { x: 89, y: 83 },
    lane: 'east',
  },
  {
    id: 'desk-layout',
    zoneId: 'design',
    profession: 'Layout designer',
    label: 'Layout',
    defaultAction: 'reviewing',
    point: { x: 44, y: 83 },
    lane: 'south',
  },
  {
    id: 'desk-marketing',
    zoneId: 'marketing',
    profession: 'Marketing visuals',
    label: 'Вітрина',
    defaultAction: 'working',
    point: { x: 66, y: 72 },
    lane: 'south',
  },
  {
    id: 'desk-trading',
    zoneId: 'market',
    profession: 'Market watcher',
    label: 'Trading',
    defaultAction: 'monitoring',
    point: { x: 86, y: 51 },
    lane: 'east',
  },
]

export const OFFICE_PATHS: OfficePath[] = [
  {
    id: 'path-command-delivery',
    fromZoneId: 'command',
    toZoneId: 'delivery',
    points: [{ x: 10, y: 52 }, { x: 24, y: 58 }, { x: 39, y: 61 }],
  },
  {
    id: 'path-delivery-ops',
    fromZoneId: 'delivery',
    toZoneId: 'ops',
    points: [{ x: 39, y: 61 }, { x: 61, y: 43 }, { x: 84, y: 18 }],
  },
  {
    id: 'path-research-design',
    fromZoneId: 'research',
    toZoneId: 'design',
    points: [{ x: 24, y: 16 }, { x: 38, y: 48 }, { x: 44, y: 83 }],
  },
  {
    id: 'path-design-marketing',
    fromZoneId: 'design',
    toZoneId: 'marketing',
    points: [{ x: 44, y: 83 }, { x: 56, y: 75 }, { x: 66, y: 72 }],
  },
  {
    id: 'path-market-handoff',
    fromZoneId: 'market',
    toZoneId: 'delivery',
    points: [{ x: 86, y: 51 }, { x: 63, y: 59 }, { x: 43, y: 66 }],
  },
]

export const OFFICE_AGENT_PROFILES: Record<string, OfficeAgentProfile> = {
  'main/orchestrator': {
    role: 'main/orchestrator',
    profession: 'Coordinator',
    zoneId: 'command',
    deskId: 'desk-command',
    defaultAction: 'coordinating',
    pathId: 'path-command-delivery',
  },
  coding: {
    role: 'coding',
    profession: 'Developer',
    zoneId: 'delivery',
    deskId: 'desk-coding',
    defaultAction: 'working',
    pathId: 'path-command-delivery',
  },
  ops: {
    role: 'ops',
    profession: 'Operator',
    zoneId: 'ops',
    deskId: 'desk-ops',
    defaultAction: 'monitoring',
    pathId: 'path-delivery-ops',
  },
  research: {
    role: 'research',
    profession: 'Researcher',
    zoneId: 'research',
    deskId: 'desk-research',
    defaultAction: 'walking',
    pathId: 'path-research-design',
  },
  requirements: {
    role: 'requirements',
    profession: 'Spec writer',
    zoneId: 'research',
    deskId: 'desk-spec',
    defaultAction: 'reviewing',
    pathId: 'path-research-design',
  },
  QA: {
    role: 'QA',
    profession: 'QA analyst',
    zoneId: 'delivery',
    deskId: 'desk-qa',
    defaultAction: 'reviewing',
    pathId: 'path-delivery-ops',
  },
  video: {
    role: 'video',
    profession: 'Video director',
    zoneId: 'design',
    deskId: 'desk-video',
    defaultAction: 'idle',
    pathId: 'path-research-design',
  },
  'UI/layout': {
    role: 'UI/layout',
    profession: 'Layout designer',
    zoneId: 'design',
    deskId: 'desk-layout',
    defaultAction: 'reviewing',
    pathId: 'path-research-design',
  },
  marketing: {
    role: 'marketing',
    profession: 'Marketing visuals',
    zoneId: 'marketing',
    deskId: 'desk-marketing',
    defaultAction: 'working',
    pathId: 'path-design-marketing',
  },
  trading: {
    role: 'trading',
    profession: 'Market watcher',
    zoneId: 'market',
    deskId: 'desk-trading',
    defaultAction: 'monitoring',
    pathId: 'path-market-handoff',
  },
}

const fallbackProfile: OfficeAgentProfile = {
  role: 'system',
  profession: 'Generalist',
  zoneId: 'command',
  deskId: 'desk-command',
  defaultAction: 'monitoring',
  pathId: 'path-command-delivery',
}

const scenarioCycleMs = 16_000

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundPoint(point: OfficePoint): OfficePoint {
  return {
    x: Number(point.x.toFixed(2)),
    y: Number(point.y.toFixed(2)),
  }
}

function getAgentSeed(agent: Agent) {
  return [...agent.id].reduce((total, character) => total + character.charCodeAt(0), 0)
}

function getScenarioPhase(agent: Agent, elapsedMs = 0) {
  const shiftedElapsed = Math.max(0, elapsedMs) + getAgentSeed(agent) * 137

  return (shiftedElapsed % scenarioCycleMs) / scenarioCycleMs
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
    return path.points[0]
  }

  const segmentCount = path.points.length - 1
  const rawSegment = boundedProgress * segmentCount
  const segmentIndex = Math.min(Math.floor(rawSegment), segmentCount - 1)
  const segmentProgress = rawSegment - segmentIndex
  const start = path.points[segmentIndex]
  const end = path.points[segmentIndex + 1]

  return interpolatePoint(start, end, segmentProgress)
}

export function getOfficeAgentRouteProgress(agent: Agent, elapsedMs = 0) {
  const phase = getScenarioPhase(agent, elapsedMs)

  return clamp(phase <= 0.5 ? phase * 2 : (1 - phase) * 2, 0, 1)
}

function getAssignedTask(agent: Agent, tasks: Task[]) {
  return (
    tasks.find((task) => task.id === agent.currentTaskId) ??
    tasks.find((task) => task.ownerAgentId === agent.id)
  )
}

export function getOfficeDesk(deskId: OfficeDeskId) {
  return OFFICE_DESKS.find((desk) => desk.id === deskId) ?? OFFICE_DESKS[0]
}

export function getOfficeDeskForProfession(role: string) {
  const profile = OFFICE_AGENT_PROFILES[role] ?? fallbackProfile

  return getOfficeDesk(profile.deskId)
}

export function getOfficePath(pathId: OfficePathId) {
  return OFFICE_PATHS.find((path) => path.id === pathId)
}

function getTaskLabel(task?: Task) {
  return task?.nextStep ?? task?.title ?? 'Read-only station'
}

function getSimulationActivity(
  agent: Agent,
  profile: OfficeAgentProfile,
  task?: Task,
): OfficeAgentActivity {
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

  if (task?.status === 'queued') {
    return 'walking'
  }

  if (agent.status === 'working' || task?.status === 'in_progress') {
    return profile.defaultAction === 'coordinating' ? 'coordinating' : 'working'
  }

  if (agent.status === 'waiting' || task?.status === 'waiting') {
    return 'monitoring'
  }

  if (agent.status === 'done' || task?.status === 'completed') {
    return 'reviewing'
  }

  return profile.defaultAction
}

function getTimedSimulationActivity(
  agent: Agent,
  profile: OfficeAgentProfile,
  task: Task | undefined,
  elapsedMs: number,
): OfficeAgentActivity {
  const baseActivity = getSimulationActivity(agent, profile, task)

  if (baseActivity === 'blocked') {
    return 'blocked'
  }

  const phase = getScenarioPhase(agent, elapsedMs)

  if (baseActivity === 'handoff' || (task?.status === 'delegated' && phase > 0.5)) {
    return phase < 0.42 ? 'walking' : 'handoff'
  }

  if (baseActivity === 'walking') {
    return phase < 0.7 ? 'walking' : profile.defaultAction
  }

  if (baseActivity === 'monitoring') {
    return phase < 0.62 ? 'monitoring' : 'walking'
  }

  if (baseActivity === 'working' || baseActivity === 'coordinating') {
    return phase < 0.18 ? 'walking' : baseActivity
  }

  if (baseActivity === 'reviewing') {
    return phase < 0.24 ? 'handoff' : 'reviewing'
  }

  return baseActivity
}

function getSimulationPosture(activity: OfficeAgentActivity): OfficeAgentPosture {
  if (activity === 'blocked') {
    return 'blocked'
  }

  if (activity === 'handoff') {
    return 'handoff'
  }

  if (activity === 'walking') {
    return 'walking'
  }

  if (activity === 'working' || activity === 'coordinating') {
    return 'working'
  }

  if (activity === 'idle') {
    return 'idle'
  }

  if (activity === 'monitoring') {
    return 'standing'
  }

  return 'sitting'
}

function getAgentPosition(
  desk: OfficeDesk,
  path: OfficePath | undefined,
  posture: OfficeAgentPosture,
  progress = 0.5,
) {
  if (posture !== 'walking' || !path) {
    return desk.point
  }

  return getPathPoint(path, progress)
}

function getTimedTaskLabel(task: Task | undefined, activity: OfficeAgentActivity, elapsedMs: number) {
  const label = getTaskLabel(task)

  if (!elapsedMs) {
    return label
  }

  if (activity === 'walking') {
    return task?.nextStep ?? `Route to ${task?.title ?? 'station'}`
  }

  if (activity === 'handoff') {
    return task?.nextStep ?? `Handoff: ${task?.title ?? 'agent sync'}`
  }

  if (activity === 'monitoring') {
    return task?.nextStep ?? `Monitor: ${task?.title ?? 'status'}`
  }

  return label
}

function applyLiveStatus(
  state: OfficeAgentSimulationState,
  liveStatus: OfficeAgentLiveStatusInput | undefined,
): OfficeAgentSimulationState {
  if (!liveStatus) {
    return state
  }

  return {
    ...state,
    ...liveStatus,
    position: liveStatus.position ? roundPoint(liveStatus.position) : state.position,
    target: liveStatus.target ? roundPoint(liveStatus.target) : state.target,
    route: liveStatus.position
      ? [roundPoint(liveStatus.position), liveStatus.target ? roundPoint(liveStatus.target) : state.target]
      : state.route,
  }
}

export function getOfficeAgentSimulationTick(
  agent: Agent,
  tasks: Task[],
  options: OfficeSimulationTickOptions = {},
): OfficeAgentSimulationState {
  const profile = OFFICE_AGENT_PROFILES[agent.role] ?? { ...fallbackProfile, role: agent.role }
  const desk = getOfficeDesk(profile.deskId)
  const task = getAssignedTask(agent, tasks)
  const path = getOfficePath(profile.pathId)
  const shouldAnimate = options.mode !== 'static' && Boolean(options.elapsedMs)
  const elapsedMs = shouldAnimate ? options.elapsedMs ?? 0 : 0
  const activity = shouldAnimate
    ? getTimedSimulationActivity(agent, profile, task, elapsedMs)
    : getSimulationActivity(agent, profile, task)
  const posture = getSimulationPosture(activity)
  const progress = getOfficeAgentRouteProgress(agent, elapsedMs)
  const position = getAgentPosition(desk, path, posture, progress)

  return applyLiveStatus(
    {
      agentId: agent.id,
      role: agent.role,
      profession: profile.profession,
      deskId: profile.deskId,
      zoneId: profile.zoneId,
      pathId: profile.pathId,
      route: path?.points.map(roundPoint) ?? [desk.point],
      position,
      progress,
      target: desk.point,
      activity,
      currentTask: getTimedTaskLabel(task, activity, elapsedMs),
      posture,
    },
    options.liveAgents?.[agent.id],
  )
}

export function createOfficeSimulation(
  agents: Agent[],
  tasks: Task[],
  options: OfficeSimulationTickOptions = {},
): OfficeSimulation {
  const simulationAgents = agents.map((agent) => {
    return getOfficeAgentSimulationTick(agent, tasks, options)
  })

  return {
    zones: OFFICE_ZONES,
    desks: OFFICE_DESKS,
    paths: OFFICE_PATHS,
    agents: simulationAgents,
  }
}

export function tickOfficeSimulation(
  currentSimulation: OfficeSimulation,
  input: OfficeSimulationTickInput,
): OfficeSimulation {
  if (input.mode === 'static') {
    return currentSimulation
  }

  return createOfficeSimulation(input.agents, input.tasks, input)
}
