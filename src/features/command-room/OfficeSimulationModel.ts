import type { Agent, Task } from '../../shared/types'

export type OfficeZoneId = 'command' | 'delivery' | 'ops' | 'research' | 'design' | 'market'
export type OfficeDeskId =
  | 'desk-command'
  | 'desk-coding'
  | 'desk-ops'
  | 'desk-research'
  | 'desk-spec'
  | 'desk-qa'
  | 'desk-video'
  | 'desk-layout'
  | 'desk-trading'
export type OfficePathId =
  | 'path-command-delivery'
  | 'path-delivery-ops'
  | 'path-research-design'
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
  position: OfficePoint
  progress: number
  target: OfficePoint
  activity: OfficeAgentActivity
  currentTask: string
  posture: OfficeAgentPosture
}

export type OfficeSimulationMode = 'animated' | 'static'

export interface OfficeAgentLiveStatusInput {
  activity?: OfficeAgentActivity
  currentTask?: string
  posture?: OfficeAgentPosture
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
    bounds: { x: 8, y: 38, width: 22, height: 26 },
  },
  {
    id: 'delivery',
    label: 'Delivery desks',
    bounds: { x: 24, y: 34, width: 44, height: 43 },
  },
  {
    id: 'ops',
    label: 'Ops server corner',
    bounds: { x: 68, y: 18, width: 21, height: 23 },
  },
  {
    id: 'research',
    label: 'Research wall',
    bounds: { x: 24, y: 14, width: 42, height: 18 },
  },
  {
    id: 'design',
    label: 'Design and media wall',
    bounds: { x: 52, y: 62, width: 36, height: 18 },
  },
  {
    id: 'market',
    label: 'Trading watch',
    bounds: { x: 70, y: 42, width: 18, height: 16 },
  },
]

export const OFFICE_DESKS: OfficeDesk[] = [
  {
    id: 'desk-command',
    zoneId: 'command',
    profession: 'Coordinator',
    label: 'Command',
    defaultAction: 'coordinating',
    point: { x: 18, y: 51 },
    lane: 'west',
  },
  {
    id: 'desk-coding',
    zoneId: 'delivery',
    profession: 'Developer',
    label: 'Coding',
    defaultAction: 'working',
    point: { x: 30, y: 43 },
    lane: 'north',
  },
  {
    id: 'desk-ops',
    zoneId: 'ops',
    profession: 'Operator',
    label: 'Ops',
    defaultAction: 'monitoring',
    point: { x: 77, y: 28 },
    lane: 'east',
  },
  {
    id: 'desk-research',
    zoneId: 'research',
    profession: 'Researcher',
    label: 'Research',
    defaultAction: 'walking',
    point: { x: 32, y: 22 },
    lane: 'north',
  },
  {
    id: 'desk-spec',
    zoneId: 'research',
    profession: 'Spec writer',
    label: 'Spec',
    defaultAction: 'reviewing',
    point: { x: 58, y: 23 },
    lane: 'north',
  },
  {
    id: 'desk-qa',
    zoneId: 'delivery',
    profession: 'QA analyst',
    label: 'QA/Sec',
    defaultAction: 'reviewing',
    point: { x: 29, y: 70 },
    lane: 'south',
  },
  {
    id: 'desk-video',
    zoneId: 'design',
    profession: 'Video director',
    label: 'Director',
    defaultAction: 'idle',
    point: { x: 79, y: 68 },
    lane: 'east',
  },
  {
    id: 'desk-layout',
    zoneId: 'design',
    profession: 'Layout designer',
    label: 'Layout',
    defaultAction: 'reviewing',
    point: { x: 58, y: 71 },
    lane: 'south',
  },
  {
    id: 'desk-trading',
    zoneId: 'market',
    profession: 'Market watcher',
    label: 'Trading',
    defaultAction: 'monitoring',
    point: { x: 78, y: 48 },
    lane: 'east',
  },
]

export const OFFICE_PATHS: OfficePath[] = [
  {
    id: 'path-command-delivery',
    fromZoneId: 'command',
    toZoneId: 'delivery',
    points: [{ x: 18, y: 51 }, { x: 29, y: 55 }, { x: 42, y: 58 }],
  },
  {
    id: 'path-delivery-ops',
    fromZoneId: 'delivery',
    toZoneId: 'ops',
    points: [{ x: 42, y: 58 }, { x: 59, y: 45 }, { x: 77, y: 28 }],
  },
  {
    id: 'path-research-design',
    fromZoneId: 'research',
    toZoneId: 'design',
    points: [{ x: 32, y: 22 }, { x: 45, y: 45 }, { x: 58, y: 71 }],
  },
  {
    id: 'path-market-handoff',
    fromZoneId: 'market',
    toZoneId: 'delivery',
    points: [{ x: 78, y: 48 }, { x: 63, y: 55 }, { x: 48, y: 62 }],
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
