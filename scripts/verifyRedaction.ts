import { strict as assert } from 'node:assert'
import { normalizeCommandCenterSnapshot } from '../src/adapters/normalizeCommandCenterSnapshot.ts'
import type { CommandCenterSnapshot } from '../src/shared/types/index.ts'

const unsafeSnapshot = {
  generatedAt: 'not-a-date',
  agents: [
    {
      id: 'agent-private',
      name: 'Agent operator@example.com',
      role: 'ops',
      status: 'surprising',
      summary:
        'Investigating api_key=super-secret-value at http://192.168.1.10:8787/internal and https://user:pass@example.com/private with Bearer abcdefghijklmnopqrstuvwxyz and contact admin@example.com. '.repeat(
          3,
        ),
      lastSeen: '2026-05-13T12:00:00Z',
    },
  ],
  tasks: [
    {
      id: 'task-private',
      title: 'Rotate token=secret-token',
      status: 'paused',
      ownerAgentId: 'agent-private',
      priority: 'urgent',
      blockerReason: 'Use ghp_1234567890abcdefghijklmnopqrstuvwxyz for access',
    },
  ],
  activity: [
    {
      id: 'event-private',
      timestamp: 'invalid',
      agentId: 'agent-private',
      category: 'unknown',
      severity: 'loud',
      summary: 'Private endpoint http://localhost:3000/admin and user dev@example.com',
    },
  ],
  workflow: {
    nodes: [
      {
        id: 'workflow-private',
        agentId: 'agent-private',
        label: 'ops@example.com',
        lane: 'http://service.local/private',
        x: 50,
        y: 50,
      },
    ],
    edges: [
      {
        id: 'edge-private',
        from: 'workflow-private',
        to: 'workflow-private',
        label: 'secret=abc123456789',
      },
    ],
  },
} as unknown as CommandCenterSnapshot

const normalized = normalizeCommandCenterSnapshot(unsafeSnapshot)

assert.equal(normalized.generatedAt, '1970-01-01T00:00:00.000Z')
assert.equal(normalized.agents[0].status, 'waiting')
assert.equal(normalized.tasks[0].status, 'queued')
assert.equal(normalized.tasks[0].priority, 'medium')
assert.equal(normalized.activity[0].category, 'system')
assert.equal(normalized.activity[0].severity, 'info')
assert.equal(normalized.activity[0].timestamp, normalized.generatedAt)
assert.equal(normalized.agents[0].lastSeen, '2026-05-13T12:00:00.000Z')

const serialized = JSON.stringify(normalized)

assert(!serialized.includes('operator@example.com'))
assert(!serialized.includes('admin@example.com'))
assert(!serialized.includes('dev@example.com'))
assert(!serialized.includes('192.168.1.10'))
assert(!serialized.includes('localhost:3000'))
assert(!serialized.includes('service.local'))
assert(!serialized.includes('user:pass'))
assert(!serialized.includes('super-secret-value'))
assert(!serialized.includes('abcdefghijklmnopqrstuvwxyz'))
assert(normalized.agents[0].summary && normalized.agents[0].summary.length <= 220)
