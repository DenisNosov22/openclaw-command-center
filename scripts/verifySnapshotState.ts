import { strict as assert } from 'node:assert'
import {
  createCommandCenterSnapshotState,
  createLoadingCommandCenterSnapshotState,
} from '../src/adapters/commandCenterSnapshotState.ts'
import type { CommandCenterSnapshot } from '../src/shared/types/index.ts'

const now = new Date('2026-05-13T14:00:00.000Z')

const emptySnapshot: CommandCenterSnapshot = {
  generatedAt: '2026-05-13T13:55:00Z',
  agents: [],
  tasks: [],
  activity: [],
  workflow: {
    nodes: [],
    edges: [],
  },
}

const loadingState = createLoadingCommandCenterSnapshotState(now)
assert.equal(loadingState.kind, 'loading')
assert.equal(loadingState.snapshot.generatedAt, now.toISOString())
assert.match(loadingState.detail, /Read-only/)

const emptyState = createCommandCenterSnapshotState(() => emptySnapshot, now)
assert.equal(emptyState.kind, 'empty')
assert.equal(emptyState.snapshot.generatedAt, '2026-05-13T13:55:00.000Z')
assert.match(emptyState.detail, /порожній/)

const errorState = createCommandCenterSnapshotState(() => {
  throw new Error('adapter failed')
}, now)
assert.equal(errorState.kind, 'error')
assert.equal(errorState.snapshot.generatedAt, now.toISOString())
assert.match(errorState.detail, /fallback/)
assert.equal(errorState.snapshot.agents.length, 0)

const readyState = createCommandCenterSnapshotState(
  () => ({
    ...emptySnapshot,
    agents: [
      {
        id: 'agent-test',
        name: 'Agent test@example.com',
        role: 'coding',
        status: 'surprising',
      },
    ],
  } as CommandCenterSnapshot),
  now,
)
assert.equal(readyState.kind, 'ready')
assert.equal(readyState.snapshot.agents[0].status, 'waiting')
assert(!JSON.stringify(readyState.snapshot).includes('test@example.com'))
