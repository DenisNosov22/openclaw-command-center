import { strict as assert } from 'node:assert'
import type { Agent } from '../src/shared/types/index.ts'
import {
  createOfficeAgentStatusFixture,
  createOfficeAgentStatusSimulationOverrides,
} from '../src/features/command-room/OfficeAgentStatusAdapter.ts'
import {
  createFallbackOfficeAgentStatusDataSourceState,
  loadOfficeAgentStatusSnapshots,
  sanitizeOfficeAgentStatusSnapshots,
} from '../src/features/command-room/OfficeAgentStatusDataSource.ts'
import { createOfficeSimulation } from '../src/features/command-room/OfficeSimulationModel.ts'

const agents: Agent[] = [
  { id: 'agent-krab', name: 'Краб', role: 'main/orchestrator', status: 'working', currentTaskId: 'task-command' },
  { id: 'agent-dev', name: 'Дев', role: 'coding', status: 'working', currentTaskId: 'task-dev' },
  { id: 'agent-varta', name: 'Варта', role: 'QA', status: 'blocked', currentTaskId: 'task-qa' },
  { id: 'agent-vitryna', name: 'Вітрина', role: 'marketing', status: 'working', currentTaskId: 'task-marketing' },
]

const tasks = agents.map((agent) => ({
  id: agent.currentTaskId ?? `task-${agent.id}`,
  title: `${agent.name} task`,
  status: 'in_progress' as const,
  ownerAgentId: agent.id,
  priority: 'medium' as const,
}))

const fixture = createOfficeAgentStatusFixture(agents, '2026-05-14T09:20:00.000Z')
const fallbackState = createFallbackOfficeAgentStatusDataSourceState(agents, '2026-05-14T09:20:00.000Z')

assert.equal(fallbackState.kind, 'fallback', 'Default data source state should use deterministic fixture fallback')
assert.equal(fallbackState.isFallback, true, 'Fallback state should expose fallback flag')
assert.deepEqual(fallbackState.snapshots, fixture, 'Fallback state should be deterministic for static deployments')

const sanitized = sanitizeOfficeAgentStatusSnapshots(
  [
    {
      agentId: 'agent-dev',
      name: 'Дев',
      state: 'running',
      currentTask: 'Review status data source',
      updatedAt: '2026-05-14T09:21:00.000Z',
      progress: 1.7,
      targetRole: 'QA',
    },
    {
      agentId: 'unknown-agent',
      name: 'Unknown',
      state: 'running',
      currentTask: 'Ignore me',
      updatedAt: '2026-05-14T09:21:00.000Z',
    },
    {
      agentId: 'agent-varta',
      name: 'Варта',
      state: 'mystery',
      currentTask: 'Invalid state',
      updatedAt: '2026-05-14T09:21:00.000Z',
    },
    null,
  ],
  agents,
)

assert.equal(sanitized.length, 1, 'Malformed and unknown snapshots should be ignored safely')
assert.equal(sanitized[0]?.agentId, 'agent-dev', 'Known valid snapshot should be kept')
assert.equal(sanitized[0]?.progress, 1, 'Progress should be clamped into simulation bounds')

const fetchedState = await loadOfficeAgentStatusSnapshots(agents, {
  fallbackUpdatedAt: '2026-05-14T09:20:00.000Z',
  fetcher: async () =>
    new Response(JSON.stringify({ snapshots: sanitized }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    }),
  url: '/openclaw-command-center/agent-status.json',
})

assert.equal(fetchedState.kind, 'ready', 'Valid JSON source should produce ready state')
assert.equal(fetchedState.isFallback, false, 'Valid JSON source should not be marked fallback')
assert.deepEqual(fetchedState.snapshots, sanitized, 'Ready state should use sanitized fetched snapshots')

const malformedState = await loadOfficeAgentStatusSnapshots(agents, {
  fallbackUpdatedAt: '2026-05-14T09:20:00.000Z',
  fetcher: async () => new Response('{bad json', { status: 200 }),
  url: '/openclaw-command-center/agent-status.json',
})

assert.equal(malformedState.kind, 'error', 'Malformed source should expose safe error state')
assert.equal(malformedState.isFallback, true, 'Malformed source should fall back to fixture')
assert.deepEqual(malformedState.snapshots, fixture, 'Malformed source fallback should remain deterministic')

const missingState = await loadOfficeAgentStatusSnapshots(agents, {
  fallbackUpdatedAt: '2026-05-14T09:20:00.000Z',
  fetcher: async () => new Response('', { status: 404 }),
  url: '/openclaw-command-center/agent-status.json',
})

assert.equal(missingState.kind, 'stale', 'Missing static JSON should expose stale fallback state')
assert.equal(missingState.isFallback, true, 'Missing static JSON should fall back to fixture')

const baselineSimulation = createOfficeSimulation(agents, tasks)
const fallbackSimulation = createOfficeSimulation(agents, tasks, {
  liveAgents: createOfficeAgentStatusSimulationOverrides(agents, missingState.snapshots),
  mode: 'static',
})

assert.equal(
  fallbackSimulation.agents.length,
  baselineSimulation.agents.length,
  'Fallback source should not break static office simulation',
)
assert.deepEqual(
  createFallbackOfficeAgentStatusDataSourceState(agents, '2026-05-14T09:20:00.000Z').snapshots,
  createFallbackOfficeAgentStatusDataSourceState(agents, '2026-05-14T09:20:00.000Z').snapshots,
  'GitHub Pages/static fallback should be repeatable',
)
