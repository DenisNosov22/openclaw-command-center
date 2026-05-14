import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { createOfficeSceneViewModel } from '../src/features/command-room/IsometricOfficeSceneModel.ts'
import {
  canAgentMove,
  createOfficeSimulation,
  getOfficeAgentSimulationTick,
  getOfficeAgentRouteProgress,
  getOfficeDeskForProfession,
  getOfficePath,
  OFFICE_AGENT_PROFILES,
  OFFICE_COORDINATION_HUB_POINT,
  OFFICE_DESKS,
  OFFICE_PATHS,
  OFFICE_ZONES,
  tickOfficeSimulation,
} from '../src/features/command-room/OfficeSimulationModel.ts'
import type { ActivityEvent, Agent, CommandCenterSnapshot, Task } from '../src/shared/types/index.ts'

const agents: Agent[] = [
  { id: 'agent-krab', name: 'Краб', role: 'main/orchestrator', status: 'working', currentTaskId: 'task-command' },
  { id: 'agent-dev', name: 'Дев', role: 'coding', status: 'working', currentTaskId: 'task-dev' },
  { id: 'agent-bastion', name: 'Бастіон', role: 'ops', status: 'waiting', currentTaskId: 'task-ops' },
  { id: 'agent-shturman', name: 'Штурман', role: 'research', status: 'idle', currentTaskId: 'task-research' },
  { id: 'agent-spec', name: 'Спек', role: 'requirements', status: 'done', currentTaskId: 'task-spec' },
  { id: 'agent-varta', name: 'Варта', role: 'QA', status: 'blocked', currentTaskId: 'task-qa' },
  { id: 'agent-rezhyser', name: 'Режисер', role: 'video', status: 'idle', currentTaskId: 'task-video' },
  { id: 'agent-verstalnyk', name: 'Верстальник', role: 'UI/layout', status: 'done', currentTaskId: 'task-layout' },
  { id: 'agent-vitryna', name: 'Вітрина', role: 'marketing', status: 'working', currentTaskId: 'task-marketing' },
  { id: 'agent-desk', name: 'Деск', role: 'trading', status: 'error', currentTaskId: 'task-trading' },
]

const tasks: Task[] = [
  { id: 'task-command', title: 'Coordinate office', status: 'in_progress', ownerAgentId: 'agent-krab', priority: 'high' },
  { id: 'task-dev', title: 'Implement model', status: 'delegated', ownerAgentId: 'agent-dev', priority: 'high' },
  { id: 'task-ops', title: 'Watch deploy', status: 'waiting', ownerAgentId: 'agent-bastion', priority: 'medium' },
  { id: 'task-research', title: 'Walk route', status: 'queued', ownerAgentId: 'agent-shturman', priority: 'medium' },
  { id: 'task-spec', title: 'Review spec', status: 'completed', ownerAgentId: 'agent-spec', priority: 'medium' },
  { id: 'task-qa', title: 'Check gates', status: 'blocked', ownerAgentId: 'agent-varta', priority: 'high' },
  { id: 'task-video', title: 'Rest media', status: 'queued', ownerAgentId: 'agent-rezhyser', priority: 'low' },
  { id: 'task-layout', title: 'Review layout', status: 'completed', ownerAgentId: 'agent-verstalnyk', priority: 'medium' },
  { id: 'task-marketing', title: 'Social preview board', status: 'in_progress', ownerAgentId: 'agent-vitryna', priority: 'medium' },
  { id: 'task-trading', title: 'Market feed', status: 'failed', ownerAgentId: 'agent-desk', priority: 'low' },
]

const activity: ActivityEvent[] = [
  {
    id: 'event-dev',
    timestamp: '2026-05-13T13:10:00Z',
    agentId: 'agent-dev',
    category: 'task',
    severity: 'success',
    summary: 'Simulation test fixture.',
  },
]

const workflow: CommandCenterSnapshot['workflow'] = {
  nodes: agents.map((agent, index) => ({
    id: `workflow-${agent.id}`,
    agentId: agent.id,
    label: agent.name,
    lane: agent.role,
    x: 10 + index * 8,
    y: 20 + index * 6,
  })),
  edges: [
    { id: 'edge-command-dev', from: 'workflow-agent-krab', to: 'workflow-agent-dev', label: 'task' },
    { id: 'edge-dev-qa', from: 'workflow-agent-dev', to: 'workflow-agent-varta', label: 'verify' },
    { id: 'edge-qa-ops', from: 'workflow-agent-varta', to: 'workflow-agent-bastion', label: 'release' },
  ],
}

const snapshot = { agents, tasks, activity, workflow }
const simulation = createOfficeSimulation(snapshot.agents, snapshot.tasks)

function routeIncludesPoint(route: Array<{ x: number; y: number }>, point: { x: number; y: number }) {
  return route.some((routePoint) => routePoint.x === point.x && routePoint.y === point.y)
}

assert(OFFICE_ZONES.length >= 4, 'Expected office simulation zones')
assert(OFFICE_DESKS.length >= snapshot.agents.length, 'Expected enough desks for visible agents')
assert(OFFICE_PATHS.length >= 3, 'Expected deterministic office movement paths')

for (const state of [
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
]) {
  assert.equal(canAgentMove(state), true, `${state} should allow office movement`)
}

for (const state of ['idle', 'waiting', 'done', 'paused', 'queued', 'blocked', 'failed', 'completed', 'error']) {
  assert.equal(canAgentMove(state), false, `${state} should keep agent at home station`)
}

assert.equal(canAgentMove('running', 'queued'), false, 'Inactive task status should suppress decorative movement')

for (const agent of snapshot.agents) {
  const profile = OFFICE_AGENT_PROFILES[agent.role]
  const state = simulation.agents.find((item) => item.agentId === agent.id)

  assert(profile, `Expected profession profile for ${agent.role}`)
  assert(state, `Expected simulation state for ${agent.id}`)
  assert(state.profession, `Expected profession for ${agent.id}`)
  assert(state.activity, `Expected activity for ${agent.id}`)
  assert(state.posture, `Expected posture for ${agent.id}`)
  assert(state.currentTask, `Expected current task summary for ${agent.id}`)
  assert(state.route.length >= 1, `Expected visible route points for ${agent.id}`)

  const desk = getOfficeDeskForProfession(agent.role)
  assert.equal(desk.id, state.deskId, `Expected ${agent.role} to map to its desk`)
  assert.equal(desk.zoneId, profile.zoneId, `Expected ${agent.role} desk to match profile zone`)
  assert.equal(desk.defaultAction, profile.defaultAction, `Expected ${agent.role} action mapping`)
}

for (const state of simulation.agents.filter((agent) => agent.posture === 'walking')) {
  assert(state.target, `Expected moving agent ${state.agentId} to have a target`)
  assert(Number.isFinite(state.position.x), `Expected moving agent ${state.agentId} x`)
  assert(Number.isFinite(state.position.y), `Expected moving agent ${state.agentId} y`)
  assert(Number.isFinite(state.target.x), `Expected moving agent ${state.agentId} target x`)
  assert(Number.isFinite(state.target.y), `Expected moving agent ${state.agentId} target y`)
  assert(getOfficePath(state.pathId), `Expected moving agent ${state.agentId} path`)
  assert(state.route.length >= 2, `Expected moving agent ${state.agentId} to expose route cue points`)
}

for (const state of simulation.agents.filter((agent) => agent.route.length > 1)) {
  const desk = getOfficeDeskForProfession(state.role)

  assert.deepEqual(state.route[0], desk.point, `${state.agentId} active route should start from home station`)
  assert(
    routeIncludesPoint(state.route, OFFICE_COORDINATION_HUB_POINT),
    `${state.agentId} active route should pass through Краб coordination hub`,
  )
  assert.deepEqual(state.target, OFFICE_COORDINATION_HUB_POINT, `${state.agentId} active target should be Краб hub`)
}

const secondSimulation = createOfficeSimulation(snapshot.agents, snapshot.tasks)
assert.deepEqual(simulation, secondSimulation, 'Office simulation should be deterministic')

const timedSimulation = createOfficeSimulation(snapshot.agents, snapshot.tasks, {
  elapsedMs: 8_000,
  mode: 'animated',
})
const secondTimedSimulation = createOfficeSimulation(snapshot.agents, snapshot.tasks, {
  elapsedMs: 8_000,
  mode: 'animated',
})

assert.deepEqual(timedSimulation, secondTimedSimulation, 'Timed office simulation should be deterministic')
assert.notDeepEqual(
  timedSimulation,
  simulation,
  'Animated office simulation should advance scenario state over time',
)

const staticSimulation = createOfficeSimulation(snapshot.agents, snapshot.tasks, {
  elapsedMs: 8_000,
  mode: 'static',
})
assert.deepEqual(
  staticSimulation,
  simulation,
  'Static office simulation mode should keep baseline state despite elapsed time',
)

const tickedSimulation = tickOfficeSimulation(simulation, {
  agents: snapshot.agents,
  tasks: snapshot.tasks,
  elapsedMs: 8_000,
  mode: 'animated',
})
assert.deepEqual(
  tickedSimulation,
  timedSimulation,
  'Tick helper should match direct timed simulation construction',
)

const staticTick = tickOfficeSimulation(simulation, {
  agents: snapshot.agents,
  tasks: snapshot.tasks,
  elapsedMs: 8_000,
  mode: 'static',
})
assert.deepEqual(staticTick, simulation, 'Static tick helper should return unchanged simulation state')

const liveOverrideSimulation = createOfficeSimulation(snapshot.agents, snapshot.tasks, {
  elapsedMs: 8_000,
  liveAgents: {
    'agent-dev': {
      currentTask: 'Live integration placeholder',
      activity: 'monitoring',
      posture: 'standing',
    },
  },
})
const liveAgent = liveOverrideSimulation.agents.find((agent) => agent.agentId === 'agent-dev')
assert(liveAgent, 'Expected live override target')
assert.equal(liveAgent.currentTask, 'Live integration placeholder', 'Live seam should override task copy')
assert.equal(liveAgent.activity, 'monitoring', 'Live seam should override activity')
assert.equal(liveAgent.posture, 'standing', 'Live seam should override posture')
assert.deepEqual(liveAgent.route, [{ x: 9, y: 43 }], 'Inactive live status should keep the agent at the home station')

const liveHandoffSimulation = createOfficeSimulation(snapshot.agents, snapshot.tasks, {
  elapsedMs: 8_000,
  liveAgents: {
    'agent-dev': {
      activity: 'handoff',
      posture: 'handoff',
      statusBadge: 'transferring',
      target: { x: 19, y: 43 },
    },
  },
})
const liveHandoffAgent = liveHandoffSimulation.agents.find((agent) => agent.agentId === 'agent-dev')
assert(liveHandoffAgent, 'Expected live handoff override target')
assert.deepEqual(liveHandoffAgent.route[0], { x: 9, y: 43 }, 'Live handoff route should start at the home station')
assert(
  routeIncludesPoint(liveHandoffAgent.route, OFFICE_COORDINATION_HUB_POINT),
  'Live handoff route should pass through Краб central hub before continuing',
)
assert.deepEqual(liveHandoffAgent.target, { x: 19, y: 43 }, 'Live handoff route may continue from hub to target station')

const queuedBaseline = snapshot.agents.find((agent) => agent.id === 'agent-shturman')
assert(queuedBaseline, 'Expected queued fixture agent')
const earlyTick = getOfficeAgentSimulationTick(queuedBaseline, snapshot.tasks, {
  elapsedMs: 1_000,
  mode: 'animated',
})
const lateTick = getOfficeAgentSimulationTick(queuedBaseline, snapshot.tasks, {
  elapsedMs: 9_000,
  mode: 'animated',
})
assert.deepEqual(earlyTick.position, lateTick.position, 'Queued agent should stay at home station over time')
assert.deepEqual(earlyTick.position, { x: 14, y: 25 }, 'Queued research agent should stay at upper-left planning home station')
assert.equal(earlyTick.progress, 0, 'Queued agent should not expose route progress')
assert.equal(lateTick.progress, 0, 'Late queued tick should not expose route progress')
assert.equal(earlyTick.posture, 'standing', 'Queued agent should use local waiting posture instead of walking')

const completedSpec = getOfficeAgentSimulationTick(
  snapshot.agents.find((agent) => agent.id === 'agent-spec')!,
  snapshot.tasks,
)
const idleDirector = getOfficeAgentSimulationTick(
  snapshot.agents.find((agent) => agent.id === 'agent-rezhyser')!,
  snapshot.tasks,
)
const waitingOps = getOfficeAgentSimulationTick(
  snapshot.agents.find((agent) => agent.id === 'agent-bastion')!,
  snapshot.tasks,
)

assert.deepEqual(completedSpec.position, { x: 8, y: 25 }, 'Completed spec stays seated at the top-left PC home station')
assert.equal(completedSpec.posture, 'sitting', 'Completed spec sits at the workstation instead of floating in the aisle')
assert.deepEqual(completedSpec.route, [{ x: 8, y: 25 }], 'Completed spec should not expose a walking route to the hub')
assert.deepEqual(idleDirector.position, { x: 81, y: 81 }, 'Idle director stays by the camera/studio home station')
assert.equal(idleDirector.posture, 'standing', 'Idle director stands near the camera/studio setup')
assert.deepEqual(idleDirector.route, [{ x: 81, y: 81 }], 'Idle director should not expose a walking route to the hub')
assert.deepEqual(waitingOps.position, { x: 16, y: 82 }, 'Waiting ops stays at the bottom-left server/admin console')
assert.equal(waitingOps.posture, 'sitting', 'Waiting ops monitors from the admin console')
assert.deepEqual(waitingOps.route, [{ x: 16, y: 82 }], 'Waiting ops should not expose a walking route to the hub')

const activeBaseline = snapshot.agents.find((agent) => agent.id === 'agent-dev')
assert(activeBaseline, 'Expected active fixture agent')
const activeTick = getOfficeAgentSimulationTick(activeBaseline, snapshot.tasks, {
  elapsedMs: 1_000,
  mode: 'animated',
})

assert(canAgentMove(activeBaseline.status, 'delegated', activeTick.activity), 'Delegated active task should allow movement cues')
assert(
  activeTick.posture === 'walking' || activeTick.posture === 'handoff',
  'Delegated active task should expose walking or handoff posture',
)
assert.deepEqual(activeTick.route[0], { x: 9, y: 43 }, 'Delegated active task should start its route from the coding desk')
assert(
  routeIncludesPoint(activeTick.route, OFFICE_COORDINATION_HUB_POINT),
  'Delegated active task should route through Краб central coordination hub',
)
assert.deepEqual(activeTick.target, OFFICE_COORDINATION_HUB_POINT, 'Delegated active task should target Краб central hub')

for (const state of timedSimulation.agents) {
  assert(
    OFFICE_DESKS.some((desk) => desk.id === state.deskId),
    `Expected ${state.agentId} to stay tied to a valid desk`,
  )
  assert(
    OFFICE_ZONES.some((zone) => zone.id === state.zoneId),
    `Expected ${state.agentId} to stay tied to a valid zone`,
  )
  assert(
    OFFICE_PATHS.some((path) => path.id === state.pathId),
    `Expected ${state.agentId} to stay tied to a valid path`,
  )
  assert(state.position.x >= 0 && state.position.x <= 100, `Expected ${state.agentId} x within floor bounds`)
  assert(state.position.y >= 0 && state.position.y <= 100, `Expected ${state.agentId} y within floor bounds`)
  assert(state.progress >= 0 && state.progress <= 1, `Expected ${state.agentId} progress within route bounds`)
  assert(state.target.x >= 0 && state.target.x <= 100, `Expected ${state.agentId} target x within floor bounds`)
  assert(state.target.y >= 0 && state.target.y <= 100, `Expected ${state.agentId} target y within floor bounds`)
}

for (const elapsedMs of [-1_000, 0, 8_000, 32_000, Number.MAX_SAFE_INTEGER]) {
  const progress = getOfficeAgentRouteProgress(activeBaseline, elapsedMs)

  assert(progress >= 0 && progress <= 1, `Expected helper progress ${progress} to stay bounded`)
}

const viewModel = createOfficeSceneViewModel(
  snapshot.agents,
  snapshot.tasks,
  snapshot.activity,
  snapshot.workflow,
)
const animatedViewModel = createOfficeSceneViewModel(
  snapshot.agents,
  snapshot.tasks,
  snapshot.activity,
  snapshot.workflow,
  undefined,
  {
    elapsedMs: 8_000,
    mode: 'animated',
  },
)
const staticViewModel = createOfficeSceneViewModel(
  snapshot.agents,
  snapshot.tasks,
  snapshot.activity,
  snapshot.workflow,
  undefined,
  {
    elapsedMs: 8_000,
    mode: 'static',
  },
)
assert.deepEqual(
  staticViewModel.stations.map((station) => station.simulation),
  viewModel.stations.map((station) => station.simulation),
  'Static scene view model should keep baseline simulation state',
)
assert.notDeepEqual(
  animatedViewModel.stations.map((station) => station.simulation),
  viewModel.stations.map((station) => station.simulation),
  'Animated scene view model should consume timed simulation state',
)

for (const station of viewModel.stations) {
  const state = simulation.agents.find((agent) => agent.agentId === station.agentId)

  assert(state, `Expected station ${station.agentId} in simulation`)
  assert.equal(station.simulation.posture, state.posture, `Expected posture on ${station.agentId}`)
  assert.equal(station.simulation.progress, state.progress, `Expected progress on ${station.agentId}`)
  assert.equal(station.simulation.position.x, state.position.x, `Expected x position on ${station.agentId}`)
  assert.equal(station.simulation.position.y, state.position.y, `Expected y position on ${station.agentId}`)
  assert.equal(station.currentTask, state.currentTask, `Expected current task on ${station.agentId}`)
}

const componentSource = readFileSync('src/features/command-room/IsometricOfficeScene.tsx', 'utf8')
const modelSource = readFileSync('src/features/command-room/IsometricOfficeSceneModel.ts', 'utf8')
const stylesheetSource = readFileSync('src/App.css', 'utf8')

assert(!componentSource.includes('office-core'), 'Office scene must not reintroduce core block')
assert(!componentSource.toLowerCase().includes('oval'), 'Office scene must not reintroduce oval layout')
assert(!componentSource.toLowerCase().includes('orbital'), 'Office scene must not reintroduce orbit wording')
assert(modelSource.includes('OfficeSimulationModel'), 'Office scene model should read from simulation model')
assert(
  componentSource.includes("'--office-agent-x': `${station.simulation.position.x}%`"),
  'Floor agent x CSS variable should use simulation position',
)
assert(
  componentSource.includes("'--office-agent-y': `${station.simulation.position.y}%`"),
  'Floor agent y CSS variable should use simulation position',
)
assert(
  componentSource.includes("'--office-agent-target-x': `${station.simulation.target.x}%`"),
  'Floor agent target x CSS variable should use simulation target',
)
assert(
  componentSource.includes('data-agent-activity={station.simulation.activity}'),
  'Floor agent DOM should expose simulation activity',
)
assert(
  componentSource.includes('office-floor-agent--posture-${station.simulation.posture}'),
  'Floor agent class should expose simulation posture',
)
assert(
  stylesheetSource.includes(".office-floor-agent[data-agent-posture='walking']"),
  'Walking posture should have simulation-keyed floor styling',
)
assert(
  stylesheetSource.includes(".office-floor-agent[data-agent-posture='blocked'] .office-agent-marker"),
  'Blocked posture should have simulation-keyed marker styling',
)
assert(
  componentSource.includes('office-agent-route-map'),
  'Office scene should render simulation route overlay',
)
assert(
  componentSource.includes('office-agent-state-badge'),
  'Office scene should render compact simulation state badges',
)
assert(
  stylesheetSource.includes('.office-agent-trail'),
  'Walking posture should expose visible movement trail styling',
)
assert(
  stylesheetSource.includes('.office-agent-document-transfer'),
  'Handoff posture should expose document transfer marker styling',
)
assert(
  stylesheetSource.includes('@media (prefers-reduced-motion: reduce)'),
  'Reduced-motion behavior should stay protected',
)
