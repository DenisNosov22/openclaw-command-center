import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { createOfficeSceneViewModel } from '../src/features/command-room/IsometricOfficeSceneModel.ts'
import {
  createOfficeSimulation,
  getOfficeDeskForProfession,
  getOfficePath,
  OFFICE_AGENT_PROFILES,
  OFFICE_DESKS,
  OFFICE_PATHS,
  OFFICE_ZONES,
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
}

const secondSimulation = createOfficeSimulation(snapshot.agents, snapshot.tasks)
assert.deepEqual(simulation, secondSimulation, 'Office simulation should be deterministic')

const viewModel = createOfficeSceneViewModel(
  snapshot.agents,
  snapshot.tasks,
  snapshot.activity,
  snapshot.workflow,
)

for (const station of viewModel.stations) {
  const state = simulation.agents.find((agent) => agent.agentId === station.agentId)

  assert(state, `Expected station ${station.agentId} in simulation`)
  assert.equal(station.simulation.posture, state.posture, `Expected posture on ${station.agentId}`)
  assert.equal(station.simulation.position.x, state.position.x, `Expected x position on ${station.agentId}`)
  assert.equal(station.simulation.position.y, state.position.y, `Expected y position on ${station.agentId}`)
  assert.equal(station.currentTask, state.currentTask, `Expected current task on ${station.agentId}`)
}

const componentSource = readFileSync('src/features/command-room/IsometricOfficeScene.tsx', 'utf8')
const modelSource = readFileSync('src/features/command-room/IsometricOfficeSceneModel.ts', 'utf8')

assert(!componentSource.includes('office-core'), 'Office scene must not reintroduce core block')
assert(!componentSource.toLowerCase().includes('oval'), 'Office scene must not reintroduce oval layout')
assert(!componentSource.toLowerCase().includes('orbital'), 'Office scene must not reintroduce orbit wording')
assert(modelSource.includes('OfficeSimulationModel'), 'Office scene model should read from simulation model')
