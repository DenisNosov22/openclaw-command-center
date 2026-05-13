import type { CommandCenterSnapshot } from '../shared/types'
import { normalizeCommandCenterSnapshot } from './normalizeCommandCenterSnapshot.ts'

export type CommandCenterSnapshotStateKind = 'loading' | 'ready' | 'empty' | 'error'

export interface CommandCenterSnapshotState {
  readonly kind: CommandCenterSnapshotStateKind
  readonly snapshot: CommandCenterSnapshot
  readonly title: string
  readonly detail: string
}

function createEmptySnapshot(timestamp: string): CommandCenterSnapshot {
  return {
    generatedAt: timestamp,
    agents: [],
    tasks: [],
    activity: [],
    workflow: {
      nodes: [],
      edges: [],
    },
  }
}

function isEmptyLikeSnapshot(snapshot: CommandCenterSnapshot) {
  return (
    snapshot.agents.length === 0 &&
    snapshot.tasks.length === 0 &&
    snapshot.activity.length === 0 &&
    snapshot.workflow.nodes.length === 0
  )
}

export function createLoadingCommandCenterSnapshotState(
  now = new Date(),
): CommandCenterSnapshotState {
  return {
    kind: 'loading',
    snapshot: createEmptySnapshot(now.toISOString()),
    title: 'Snapshot initializing',
    detail: 'Read-only adapter snapshot готується до показу.',
  }
}

export function createCommandCenterSnapshotState(
  getSnapshot: () => CommandCenterSnapshot,
  now = new Date(),
): CommandCenterSnapshotState {
  try {
    const snapshot = normalizeCommandCenterSnapshot(getSnapshot())

    if (isEmptyLikeSnapshot(snapshot)) {
      return {
        kind: 'empty',
        snapshot,
        title: 'Snapshot is empty',
        detail: 'Read-only adapter повернув порожній roster, tasks і timeline.',
      }
    }

    return {
      kind: 'ready',
      snapshot,
      title: 'Snapshot ready',
      detail: 'Read-only adapter snapshot активний.',
    }
  } catch {
    return {
      kind: 'error',
      snapshot: createEmptySnapshot(now.toISOString()),
      title: 'Adapter fallback active',
      detail: 'Read-only snapshot не завантажився; UI показує безпечний fallback.',
    }
  }
}
