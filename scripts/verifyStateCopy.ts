import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import {
  createCommandCenterAdapterDiagnostics,
  createCommandCenterAdapterSelection,
} from '../src/adapters/createCommandCenterAdapter.ts'
import type { CommandCenterAdapter } from '../src/adapters/commandCenterAdapter.ts'
import {
  createCommandCenterSnapshotState,
  createLoadingCommandCenterSnapshotState,
} from '../src/adapters/commandCenterSnapshotState.ts'
import type { CommandCenterSnapshot } from '../src/shared/types/index.ts'

const now = new Date('2026-05-13T14:00:00.000Z')
const fallbackAdapter: CommandCenterAdapter = {
  source: 'mock',
  getSnapshot() {
    throw new Error('State copy test should not request snapshots.')
  },
}

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

function assertCopy(value: string, label: string, maxLength = 76) {
  assert(value.length <= maxLength, `${label} is too long for compact mobile copy`)
  assert(!/[!?]/.test(value), `${label} should stay calm and avoid urgency punctuation`)
  assert(!/\b(run|deploy|push|fix|action now|live control)\b/i.test(value), `${label} implies action`)
  assert(!/\b(real backend|real data|API)\b/i.test(value), `${label} implies real integration`)
}

const loadingState = createLoadingCommandCenterSnapshotState(now)
assert.equal(loadingState.title, 'Snapshot loading')
assert.equal(loadingState.detail, 'Read-only snapshot is preparing.')

const emptyState = createCommandCenterSnapshotState(() => emptySnapshot, now)
assert.equal(emptyState.title, 'Snapshot empty')
assert.equal(
  emptyState.detail,
  'Read-only snapshot is empty: roster, tasks, timeline, workflow.',
)

const errorState = createCommandCenterSnapshotState(() => {
  throw new Error('adapter failed')
}, now)
assert.equal(errorState.title, 'Adapter fallback')
assert.equal(errorState.detail, 'Snapshot unavailable; showing read-only fallback.')

for (const state of [loadingState, emptyState, errorState]) {
  assertCopy(state.title, `${state.kind} title`, 32)
  assertCopy(state.detail, `${state.kind} detail`)
}

const disabledDiagnostics = createCommandCenterAdapterDiagnostics(
  createCommandCenterAdapterSelection(fallbackAdapter, 'openclaw-disabled'),
)
assert.equal(
  disabledDiagnostics.warningLabel,
  'OpenClaw adapter disabled; showing safe mock snapshot.',
)

const unknownDiagnostics = createCommandCenterAdapterDiagnostics(
  createCommandCenterAdapterSelection(fallbackAdapter, 'future-mode'),
)
assert.equal(
  unknownDiagnostics.warningLabel,
  'Unknown adapter mode "future-mode"; showing safe mock snapshot.',
)

for (const warning of [
  disabledDiagnostics.warningLabel ?? '',
  unknownDiagnostics.warningLabel ?? '',
]) {
  assertCopy(warning, 'adapter warning')
}

const commandRoomSource = readFileSync('src/features/command-room/CommandRoomPage.tsx', 'utf8')
const uiCopy = [
  'Snapshot has no agents.',
  'Snapshot has no workflow nodes.',
  'No read-only tasks in snapshot.',
  'No events for this snapshot.',
  'No events in this read-only snapshot.',
]

for (const expectedCopy of uiCopy) {
  assert(commandRoomSource.includes(expectedCopy), `Missing UI state copy: ${expectedCopy}`)
  assertCopy(expectedCopy, `UI copy ${expectedCopy}`)
}

console.log('[state-copy] State copy checks passed.')
