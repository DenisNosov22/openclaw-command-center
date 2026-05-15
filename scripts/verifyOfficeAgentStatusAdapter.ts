import { strict as assert } from 'node:assert'
import {
  createOfficeAgentStatusFixture,
  createOfficeAgentStatusSimulationOverrides,
  mapOfficeAgentStatusSnapshot,
  type OfficeAgentLiveState,
} from '../src/features/command-room/OfficeAgentStatusAdapter.ts'
import { createOfficeSceneViewModel } from '../src/features/command-room/IsometricOfficeSceneModel.ts'
import { createOfficeSimulation, OFFICE_AGENT_PROFILES } from '../src/features/command-room/OfficeSimulationModel.ts'
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

const tasks: Task[] = agents.map((agent) => ({
  id: agent.currentTaskId ?? `task-${agent.id}`,
  title: `${agent.name} task`,
  status: agent.status === 'blocked' || agent.status === 'error' ? 'blocked' : 'in_progress',
  ownerAgentId: agent.id,
  priority: 'medium',
}))

const activity: ActivityEvent[] = [
  {
    id: 'event-status-adapter',
    timestamp: '2026-05-14T09:20:00.000Z',
    agentId: 'agent-dev',
    category: 'system',
    severity: 'info',
    summary: 'Live adapter fixture check.',
  },
]

const workflow: CommandCenterSnapshot['workflow'] = {
  nodes: agents.map((agent, index) => ({
    id: `workflow-${agent.id}`,
    agentId: agent.id,
    label: agent.name,
    lane: agent.role,
    x: 12 + index * 8,
    y: 16 + index * 7,
  })),
  edges: [
    { id: 'edge-command-dev', from: 'workflow-agent-krab', to: 'workflow-agent-dev', label: 'task' },
    { id: 'edge-dev-qa', from: 'workflow-agent-dev', to: 'workflow-agent-varta', label: 'verify' },
  ],
}

for (const agent of agents) {
  assert(OFFICE_AGENT_PROFILES[agent.role], `Expected known office profile for ${agent.id}`)
}

const fixture = createOfficeAgentStatusFixture(agents, '2026-05-14T09:20:00.000Z')
assert.equal(fixture.length, agents.length, 'Fixture should cover every known office agent')
assert.deepEqual(
  fixture.map((snapshot) => snapshot.agentId).sort(),
  agents.map((agent) => agent.id).sort(),
  'Every known office agent should map from live snapshot fixture',
)

const stateExpectations: Record<
  OfficeAgentLiveState,
  { activity: string; posture: string; badge: string }
> = {
  blocked: { activity: 'blocked', posture: 'blocked', badge: 'blocked' },
  done: { activity: 'reviewing', posture: 'sitting', badge: 'done' },
  failed: { activity: 'blocked', posture: 'blocked', badge: 'failed' },
  idle: { activity: 'idle', posture: 'idle', badge: 'idle' },
  running: { activity: 'working', posture: 'working', badge: 'running' },
  waiting: { activity: 'monitoring', posture: 'standing', badge: 'waiting' },
}

for (const [state, expected] of Object.entries(stateExpectations) as Array<
  [OfficeAgentLiveState, (typeof stateExpectations)[OfficeAgentLiveState]]
>) {
  const override = mapOfficeAgentStatusSnapshot({
    agentId: 'agent-dev',
    name: 'Дев',
    state,
    currentTask: `${state} task`,
    updatedAt: '2026-05-14T09:20:00.000Z',
  })

  assert.equal(override.activity, expected.activity, `${state} should map activity`)
  assert.equal(override.posture, expected.posture, `${state} should map posture`)
  assert.equal(override.statusBadge, expected.badge, `${state} should keep status badge cue`)
  assert.equal(override.currentTask, `${state} task`, `${state} should keep current live task`)
}

const overrides = createOfficeAgentStatusSimulationOverrides(agents, [
  ...fixture,
  {
    agentId: 'unknown-agent',
    name: 'Unknown',
    state: 'failed',
    currentTask: 'Should be ignored',
    updatedAt: '2026-05-14T09:20:00.000Z',
  },
])

assert.equal(
  Object.keys(overrides).length,
  agents.length,
  'Unknown live agent ids should be ignored safely',
)
assert(!overrides['unknown-agent'], 'Unknown live agent should not create simulation override')

const routedOverride = createOfficeAgentStatusSimulationOverrides(agents, [
  {
    agentId: 'agent-dev',
    name: 'Дев',
    state: 'running',
    currentTask: 'Move toward QA review',
    updatedAt: '2026-05-14T09:20:00.000Z',
    targetRole: 'QA',
    progress: 0.4,
  },
])
assert.equal(routedOverride['agent-dev']?.activity, 'walking', 'Running targetRole should expose movement')
assert.equal(routedOverride['agent-dev']?.posture, 'walking', 'Running targetRole should expose walking posture')
assert(routedOverride['agent-dev']?.target, 'targetRole should resolve target point')
assert(routedOverride['agent-dev']?.pathId, 'targetRole should resolve a known path')

const leftClusterOverride = createOfficeAgentStatusSimulationOverrides(agents, [
  {
    agentId: 'agent-dev',
    name: 'Дев',
    state: 'running',
    currentTask: 'Keep left workstation handoff local',
    updatedAt: '2026-05-14T09:20:00.000Z',
    targetRole: 'main/orchestrator',
    progress: 0.6,
  },
])
assert.deepEqual(
  leftClusterOverride['agent-dev']?.target,
  { x: 22.5, y: 54.6 },
  'Left workstation live routes should stay local instead of crossing the whole office',
)

const arrivingOverride = createOfficeAgentStatusSimulationOverrides(agents, [
  {
    agentId: 'agent-dev',
    name: 'Дев',
    state: 'running',
    currentTask: 'Arrive at QA handoff',
    updatedAt: '2026-05-14T09:20:00.000Z',
    targetRole: 'QA',
    progress: 0.9,
  },
])
assert.equal(arrivingOverride['agent-dev']?.activity, 'handoff', 'Arriving targetRole should expose handoff activity')
assert.equal(arrivingOverride['agent-dev']?.posture, 'handoff', 'Arriving targetRole should expose handoff posture')

const baselineSimulation = createOfficeSimulation(agents, tasks)
const fallbackOverrideSimulation = createOfficeSimulation(agents, tasks, {
  liveAgents: createOfficeAgentStatusSimulationOverrides(agents, []),
})
assert.deepEqual(
  fallbackOverrideSimulation,
  baselineSimulation,
  'Empty live snapshots should preserve deterministic demo simulation',
)

const liveSimulation = createOfficeSimulation(agents, tasks, { liveAgents: overrides })
const devState = liveSimulation.agents.find((agent) => agent.agentId === 'agent-dev')
assert(devState, 'Expected live mapped simulation agent')
assert.equal(devState.currentTask, fixture.find((snapshot) => snapshot.agentId === 'agent-dev')?.currentTask)

const baselineViewModel = createOfficeSceneViewModel(agents, tasks, activity, workflow)
const fallbackViewModel = createOfficeSceneViewModel(agents, tasks, activity, workflow, undefined, {
  liveAgents: createOfficeAgentStatusSimulationOverrides(agents, []),
})
assert.deepEqual(
  fallbackViewModel.stations.map((station) => station.simulation),
  baselineViewModel.stations.map((station) => station.simulation),
  'Scene view model should keep demo simulation when no live data exists',
)

const liveViewModel = createOfficeSceneViewModel(agents, tasks, activity, workflow, undefined, {
  liveAgents: {
    ...overrides,
    'agent-varta': mapOfficeAgentStatusSnapshot({
      agentId: 'agent-varta',
      name: 'Варта',
      state: 'blocked',
      currentTask: 'Blocked live QA gate',
      updatedAt: '2026-05-14T09:20:00.000Z',
    }),
  },
})
const blockedStation = liveViewModel.stations.find((station) => station.agentId === 'agent-varta')
assert(blockedStation, 'Expected blocked live station')
assert.equal(blockedStation.simulation.activity, 'blocked', 'View model should accept adapter activity override')
assert.equal(blockedStation.simulation.posture, 'blocked', 'View model should accept adapter posture override')
