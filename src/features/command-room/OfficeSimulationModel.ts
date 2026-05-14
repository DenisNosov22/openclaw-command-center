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

type OfficeMovementState = Agent['status'] | Task['status'] | OfficeAgentActivity | OfficeAgentPosture | string | undefined

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

export const OFFICE_COORDINATION_HUB_POINT: OfficePoint = { x: 49, y: 42 }

export const OFFICE_ZONES: OfficeZone[] = [
  {
    id: 'command',
    label: 'Central meeting command table',
    bounds: { x: 41, y: 28, width: 19, height: 23 },
  },
  {
    id: 'delivery',
    label: 'Left workstation rows',
    bounds: { x: 8, y: 20, width: 28, height: 35 },
  },
  {
    id: 'ops',
    label: 'Server and admin console',
    bounds: { x: 6, y: 64, width: 28, height: 32 },
  },
  {
    id: 'research',
    label: 'Top-left research row',
    bounds: { x: 8, y: 20, width: 28, height: 16 },
  },
  {
    id: 'design',
    label: 'Right presentation studio',
    bounds: { x: 72, y: 33, width: 22, height: 62 },
  },
  {
    id: 'marketing',
    label: 'Visual wall and showcase',
    bounds: { x: 72, y: 33, width: 22, height: 27 },
  },
  {
    id: 'market',
    label: 'Bottom-center ops monitors',
    bounds: { x: 53, y: 62, width: 22, height: 28 },
  },
]

export const OFFICE_DESKS: OfficeDesk[] = [
  {
    id: 'desk-command',
    zoneId: 'command',
    profession: 'Coordinator',
    label: 'Command',
    defaultAction: 'coordinating',
    point: { x: 49, y: 38 },
    lane: 'south',
  },
  {
    id: 'desk-coding',
    zoneId: 'delivery',
    profession: 'Developer',
    label: 'Coding',
    defaultAction: 'working',
    point: { x: 11, y: 52 },
    lane: 'north',
  },
  {
    id: 'desk-ops',
    zoneId: 'ops',
    profession: 'Operator',
    label: 'Ops',
    defaultAction: 'monitoring',
    point: { x: 15, y: 86 },
    lane: 'south',
  },
  {
    id: 'desk-research',
    zoneId: 'research',
    profession: 'Researcher',
    label: 'Research',
    defaultAction: 'reviewing',
    point: { x: 12, y: 28 },
    lane: 'north',
  },
  {
    id: 'desk-spec',
    zoneId: 'research',
    profession: 'Spec writer',
    label: 'Spec',
    defaultAction: 'reviewing',
    point: { x: 32, y: 37 },
    lane: 'north',
  },
  {
    id: 'desk-qa',
    zoneId: 'delivery',
    profession: 'QA analyst',
    label: 'QA/Sec',
    defaultAction: 'reviewing',
    point: { x: 27, y: 70 },
    lane: 'west',
  },
  {
    id: 'desk-video',
    zoneId: 'design',
    profession: 'Video director',
    label: 'Director',
    defaultAction: 'idle',
    point: { x: 80, y: 76 },
    lane: 'east',
  },
  {
    id: 'desk-layout',
    zoneId: 'delivery',
    profession: 'Layout designer',
    label: 'Layout',
    defaultAction: 'reviewing',
    point: { x: 73, y: 58 },
    lane: 'east',
  },
  {
    id: 'desk-marketing',
    zoneId: 'marketing',
    profession: 'Marketing visuals',
    label: 'Вітрина',
    defaultAction: 'working',
    point: { x: 82, y: 43 },
    lane: 'east',
  },
  {
    id: 'desk-trading',
    zoneId: 'market',
    profession: 'Market watcher',
    label: 'Trading',
    defaultAction: 'monitoring',
    point: { x: 62, y: 76 },
    lane: 'south',
  },
]

export const OFFICE_PATHS: OfficePath[] = [
  {
    id: 'path-command-delivery',
    fromZoneId: 'command',
    toZoneId: 'delivery',
    points: [{ x: 49, y: 49 }, { x: 44, y: 51 }, { x: 34, y: 53 }, { x: 24, y: 53 }, { x: 16, y: 54 }],
  },
  {
    id: 'path-delivery-ops',
    fromZoneId: 'delivery',
    toZoneId: 'ops',
    points: [{ x: 37, y: 55 }, { x: 32, y: 63 }, { x: 25, y: 72 }, { x: 18, y: 80 }, { x: 14, y: 87 }],
  },
  {
    id: 'path-research-design',
    fromZoneId: 'research',
    toZoneId: 'design',
    points: [{ x: 14, y: 37 }, { x: 35, y: 39 }, { x: 48, y: 52 }, { x: 64, y: 53 }, { x: 83, y: 58 }],
  },
  {
    id: 'path-design-marketing',
    fromZoneId: 'design',
    toZoneId: 'marketing',
    points: [{ x: 83, y: 58 }, { x: 84, y: 52 }, { x: 84, y: 45 }],
  },
  {
    id: 'path-market-handoff',
    fromZoneId: 'market',
    toZoneId: 'delivery',
    points: [{ x: 62, y: 72 }, { x: 56, y: 63 }, { x: 45, y: 58 }, { x: 35, y: 55 }, { x: 28, y: 54 }],
  },
]

const standingHomeRoles = new Set([
  'main/orchestrator',
  'marketing',
  'research',
  'video',
])

const seatedHomeRoles = new Set([
  'QA',
  'UI/layout',
  'coding',
  'ops',
  'trading',
])

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
    defaultAction: 'reviewing',
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
    zoneId: 'delivery',
    deskId: 'desk-layout',
    defaultAction: 'reviewing',
    pathId: 'path-command-delivery',
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
export const OFFICE_MAX_ACTIVE_ROUTE_AGENTS = 4

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
  return [...agent.id].reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  )
}

function getScenarioPhase(agent: Agent, elapsedMs = 0) {
  const shiftedElapsed = Math.max(0, elapsedMs) + getAgentSeed(agent) * 97

  return (shiftedElapsed % scenarioCycleMs) / scenarioCycleMs
}

function interpolatePoint(from: OfficePoint, to: OfficePoint, progress: number): OfficePoint {
  const boundedProgress = clamp(progress, 0, 1)

  return roundPoint({
    x: from.x + (to.x - from.x) * boundedProgress,
    y: from.y + (to.y - from.y) * boundedProgress,
  })
}

function getRoutePoint(points: OfficePoint[], progress: number) {
  const boundedProgress = clamp(progress, 0, 1)

  if (points.length === 0) {
    return { x: 0, y: 0 }
  }

  if (points.length === 1) {
    return points[0]
  }

  const segmentCount = points.length - 1
  const rawSegment = boundedProgress * segmentCount
  const segmentIndex = Math.min(Math.floor(rawSegment), segmentCount - 1)
  const segmentProgress = rawSegment - segmentIndex
  const start = points[segmentIndex]
  const end = points[segmentIndex + 1]

  return interpolatePoint(start, end, segmentProgress)
}

export function getOfficeAgentRouteProgress(agent: Agent, elapsedMs = 0) {
  const phase = getScenarioPhase(agent, elapsedMs)

  return clamp(phase <= 0.5 ? phase * 2 : (1 - phase) * 2, 0, 1)
}

export function canAgentMove(...states: OfficeMovementState[]) {
  const activeMovementStates = new Set([
    'active',
    'working',
    'running',
    'reviewing',
    'handoff',
    'routing',
    'transferring',
    'escalating',
    'blocked_escalation',
    'in_progress',
    'delegated',
    'walking',
  ])
  const inactiveMovementStates = new Set([
    'idle',
    'waiting',
    'done',
    'paused',
    'queued',
    'blocked',
    'failed',
    'completed',
    'error',
    'monitoring',
  ])
  const normalizedStates = states.filter(Boolean).map((state) => String(state))

  return normalizedStates.some((state) => activeMovementStates.has(state))
    && !normalizedStates.some((state) => inactiveMovementStates.has(state))
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

function sameOfficePoint(left: OfficePoint, right: OfficePoint) {
  return Math.abs(left.x - right.x) < 0.01 && Math.abs(left.y - right.y) < 0.01
}

const officeHubCorridorsByDesk: Record<OfficeDeskId, OfficePoint[]> = {
  'desk-command': [],
  'desk-coding': [{ x: 16, y: 54 }, { x: 34, y: 53 }, { x: 44, y: 51 }],
  'desk-ops': [{ x: 18, y: 80 }, { x: 25, y: 72 }, { x: 32, y: 63 }, { x: 43, y: 55 }, { x: 49, y: 49 }],
  'desk-research': [{ x: 16, y: 35 }, { x: 35, y: 39 }, { x: 46, y: 46 }],
  'desk-spec': [{ x: 35, y: 39 }, { x: 46, y: 46 }],
  'desk-qa': [{ x: 30, y: 68 }, { x: 38, y: 59 }, { x: 45, y: 52 }],
  'desk-video': [{ x: 76, y: 69 }, { x: 66, y: 60 }, { x: 56, y: 52 }, { x: 49, y: 49 }],
  'desk-layout': [{ x: 69, y: 57 }, { x: 60, y: 53 }, { x: 52, y: 48 }],
  'desk-marketing': [{ x: 77, y: 48 }, { x: 64, y: 50 }, { x: 56, y: 48 }],
  'desk-trading': [{ x: 58, y: 64 }, { x: 52, y: 55 }, { x: 49, y: 49 }],
}

function getDeskByPoint(point: OfficePoint) {
  return OFFICE_DESKS.find((desk) => sameOfficePoint(desk.point, point))
}

function getCoordinationHubRoute(desk: OfficeDesk, finalTarget = OFFICE_COORDINATION_HUB_POINT) {
  const route = [
    roundPoint(desk.point),
    ...officeHubCorridorsByDesk[desk.id].map(roundPoint),
    roundPoint(OFFICE_COORDINATION_HUB_POINT),
  ]

  if (sameOfficePoint(finalTarget, OFFICE_COORDINATION_HUB_POINT)) {
    return route
  }

  const targetDesk = getDeskByPoint(finalTarget)
  const continuation = targetDesk
    ? [...officeHubCorridorsByDesk[targetDesk.id]].reverse()
    : []

  return [
    ...route,
    ...continuation.map(roundPoint),
    roundPoint(finalTarget),
  ]
}

function canContinueFromHub(...states: OfficeMovementState[]) {
  return states
    .filter(Boolean)
    .map((state) => String(state))
    .some((state) => state === 'handoff' || state === 'transferring' || state === 'delegated')
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

  if (agent.status === 'waiting' || task?.status === 'waiting' || task?.status === 'queued') {
    return 'monitoring'
  }

  if (agent.status === 'working' || task?.status === 'in_progress') {
    return profile.defaultAction === 'coordinating' ? 'coordinating' : 'working'
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

  if (!canAgentMove(agent.status, task?.status, baseActivity)) {
    return baseActivity
  }

  const phase = getScenarioPhase(agent, elapsedMs)

  if (baseActivity === 'handoff' || task?.status === 'delegated') {
    return phase < 0.5 ? 'walking' : 'handoff'
  }

  if (baseActivity === 'walking') {
    return phase < 0.7 ? 'walking' : profile.defaultAction
  }

  if (baseActivity === 'working' || baseActivity === 'coordinating') {
    return phase < 0.36 ? 'walking' : baseActivity
  }

  if (baseActivity === 'reviewing') {
    return baseActivity
  }

  return baseActivity
}

function getSimulationPosture(
  activity: OfficeAgentActivity,
  profile: OfficeAgentProfile,
): OfficeAgentPosture {
  if (activity === 'blocked') {
    return standingHomeRoles.has(profile.role) ? 'standing' : 'blocked'
  }

  if (activity === 'handoff') {
    return 'handoff'
  }

  if (activity === 'walking') {
    return 'walking'
  }

  if (activity === 'coordinating') {
    return 'standing'
  }

  if (standingHomeRoles.has(profile.role)) {
    return 'standing'
  }

  if (seatedHomeRoles.has(profile.role) && activity === 'monitoring') {
    return 'sitting'
  }

  if (activity === 'working') {
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
  route: OfficePoint[],
  posture: OfficeAgentPosture,
  progress = 0.5,
) {
  if (posture === 'handoff') {
    return OFFICE_COORDINATION_HUB_POINT
  }

  if (posture !== 'walking') {
    return desk.point
  }

  return getRoutePoint(route, progress)
}

function normalizeAgentHomeState(
  state: OfficeAgentSimulationState,
  desk: OfficeDesk,
): OfficeAgentSimulationState {
  return {
    ...state,
    position: roundPoint(desk.point),
    progress: 0,
    target: roundPoint(desk.point),
    route: [roundPoint(desk.point)],
  }
}

function getStationaryActiveActivity(
  state: OfficeAgentSimulationState,
  profile: OfficeAgentProfile,
): OfficeAgentActivity {
  if (state.activity !== 'walking' && state.activity !== 'handoff') {
    return state.activity
  }

  if (profile.defaultAction === 'coordinating') {
    return 'coordinating'
  }

  if (profile.defaultAction === 'monitoring' || profile.defaultAction === 'reviewing') {
    return profile.defaultAction
  }

  return 'working'
}

function settleActiveAgentAtHome(state: OfficeAgentSimulationState): OfficeAgentSimulationState {
  const profile = OFFICE_AGENT_PROFILES[state.role] ?? { ...fallbackProfile, role: state.role }
  const desk = getOfficeDesk(state.deskId)
  const activity = getStationaryActiveActivity(state, profile)

  return normalizeAgentHomeState(
    {
      ...state,
      activity,
      posture: getSimulationPosture(activity, profile),
    },
    desk,
  )
}

function isRouteActiveState(state: OfficeAgentSimulationState) {
  return (
    (state.posture === 'walking' || state.posture === 'handoff') &&
    canAgentMove(state.statusBadge, state.activity, state.posture)
  )
}

function capActiveRouteAgents(states: OfficeAgentSimulationState[]) {
  let routeActiveCount = 0

  return states.map((state) => {
    if (!isRouteActiveState(state)) {
      return state
    }

    routeActiveCount += 1

    return routeActiveCount <= OFFICE_MAX_ACTIVE_ROUTE_AGENTS
      ? state
      : settleActiveAgentAtHome(state)
  })
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

  const merged = {
    ...state,
    ...liveStatus,
    position: liveStatus.position ? roundPoint(liveStatus.position) : state.position,
    target: liveStatus.target ? roundPoint(liveStatus.target) : state.target,
    route: state.route,
  }

  if (!canAgentMove(merged.statusBadge, merged.activity, merged.posture)) {
    return normalizeAgentHomeState(merged, getOfficeDesk(merged.deskId))
  }

  const desk = getOfficeDesk(merged.deskId)

  if (merged.posture !== 'walking' && merged.posture !== 'handoff') {
    return normalizeAgentHomeState(merged, desk)
  }

  const target = liveStatus.target && canContinueFromHub(merged.statusBadge, merged.activity, merged.posture)
    ? roundPoint(liveStatus.target)
    : OFFICE_COORDINATION_HUB_POINT

  return {
    ...merged,
    target: roundPoint(target),
    route: getCoordinationHubRoute(desk, target),
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
  const shouldAnimate = options.mode !== 'static' && Boolean(options.elapsedMs)
  const elapsedMs = shouldAnimate ? options.elapsedMs ?? 0 : 0
  const activity = shouldAnimate
    ? getTimedSimulationActivity(agent, profile, task, elapsedMs)
    : getSimulationActivity(agent, profile, task)
  const posture = getSimulationPosture(activity, profile)
  const progress = getOfficeAgentRouteProgress(agent, elapsedMs)
  const route = getCoordinationHubRoute(desk)
  const position = getAgentPosition(desk, route, posture, progress)
  const baseState = {
    agentId: agent.id,
    role: agent.role,
    profession: profile.profession,
    deskId: profile.deskId,
    zoneId: profile.zoneId,
    pathId: profile.pathId,
    route,
    position,
    progress,
    target: OFFICE_COORDINATION_HUB_POINT,
    activity,
    currentTask: getTimedTaskLabel(task, activity, elapsedMs),
    posture,
  }
  const stationaryState = canAgentMove(agent.status, task?.status, activity, posture)
    ? baseState
    : normalizeAgentHomeState(baseState, desk)

  return applyLiveStatus(
    stationaryState,
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
    agents: capActiveRouteAgents(simulationAgents),
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
