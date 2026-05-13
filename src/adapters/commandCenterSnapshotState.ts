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
    title: 'Snapshot loading',
    detail: 'Read-only snapshot is preparing.',
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
        title: 'Snapshot empty',
        detail: 'Read-only snapshot is empty: roster, tasks, timeline, workflow.',
      }
    }

    return {
      kind: 'ready',
      snapshot,
      title: 'Snapshot ready',
      detail: 'Read-only adapter snapshot active.',
    }
  } catch {
    return {
      kind: 'error',
      snapshot: createEmptySnapshot(now.toISOString()),
      title: 'Adapter fallback',
      detail: 'Snapshot unavailable; showing read-only fallback.',
    }
  }
}
