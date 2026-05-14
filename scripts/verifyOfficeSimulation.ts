import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { createOfficeSceneViewModel } from '../src/features/command-room/IsometricOfficeSceneModel.ts'
import {
  createOfficeSimulation,
  getOfficeAgentSimulationTick,
  getOfficeAgentRouteProgress,
  getOfficeDeskForProfession,
  getOfficePath,
  OFFICE_AGENT_PROFILES,
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

assert(OFFICE_ZONES.length >= 4, 'Expected office simulation zones')
assert(OFFICE_DESKS.length >= snapshot.agents.length, 'Expected enough desks for visible agents')
assert(OFFICE_PATHS.length >= 3, 'Expected deterministic office movement paths')

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

const walkingBaseline = snapshot.agents.find((agent) => agent.id === 'agent-shturman')
assert(walkingBaseline, 'Expected walking fixture agent')
const earlyTick = getOfficeAgentSimulationTick(walkingBaseline, snapshot.tasks, {
  elapsedMs: 1_000,
  mode: 'animated',
})
const lateTick = getOfficeAgentSimulationTick(walkingBaseline, snapshot.tasks, {
  elapsedMs: 9_000,
  mode: 'animated',
})
assert.notDeepEqual(earlyTick.position, lateTick.position, 'Walking agent position should progress over time')
assert.equal(earlyTick.progress, getOfficeAgentRouteProgress(walkingBaseline, 1_000), 'Tick progress should use bounded route helper')
assert.equal(lateTick.progress, getOfficeAgentRouteProgress(walkingBaseline, 9_000), 'Late tick progress should use bounded route helper')

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
  const progress = getOfficeAgentRouteProgress(walkingBaseline, elapsedMs)

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
