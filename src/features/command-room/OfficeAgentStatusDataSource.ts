import { useEffect, useMemo, useState } from 'react'
import type { Agent } from '../../shared/types'
import {
  createOfficeAgentStatusFixture,
  type OfficeAgentLiveState,
  type OfficeAgentStatusSnapshot,
} from './OfficeAgentStatusAdapter.ts'

export const DEFAULT_OFFICE_AGENT_STATUS_URL = '/openclaw-command-center/agent-status.json'

const liveStates = new Set<OfficeAgentLiveState>([
  'blocked',
  'done',
  'failed',
  'idle',
  'running',
  'waiting',
])

export type OfficeAgentStatusDataSourceKind =
  | 'error'
  | 'fallback'
  | 'loading'
  | 'ready'
  | 'stale'

export interface OfficeAgentStatusDataSourceState {
  kind: OfficeAgentStatusDataSourceKind
  snapshots: OfficeAgentStatusSnapshot[]
  sourceUrl?: string
  loadedAt: string
  isFallback: boolean
  error?: string
}

export interface OfficeAgentStatusLoadOptions {
  fallbackUpdatedAt?: string
  fetcher?: typeof fetch
  url?: string
}

export interface UseOfficeAgentStatusOptions extends OfficeAgentStatusLoadOptions {
  enabled?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidDateString(value: string) {
  return Number.isFinite(Date.parse(value))
}

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value))
}

function getRawSnapshots(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (isRecord(payload) && Array.isArray(payload.snapshots)) {
    return payload.snapshots
  }

  return []
}

export function sanitizeOfficeAgentStatusSnapshots(
  payload: unknown,
  agents: Agent[],
): OfficeAgentStatusSnapshot[] {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]))

  return getRawSnapshots(payload).flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const { agentId, currentTask, name, progress, state, targetRole, updatedAt } = item

    if (
      typeof agentId !== 'string' ||
      !agentsById.has(agentId) ||
      typeof state !== 'string' ||
      !liveStates.has(state as OfficeAgentLiveState) ||
      typeof currentTask !== 'string' ||
      currentTask.trim().length === 0 ||
      typeof updatedAt !== 'string' ||
      !isValidDateString(updatedAt)
    ) {
      return []
    }

    const agent = agentsById.get(agentId)
    const sanitized: OfficeAgentStatusSnapshot = {
      agentId,
      name: typeof name === 'string' && name.trim().length > 0 ? name : (agent?.name ?? agentId),
      state: state as OfficeAgentLiveState,
      currentTask: currentTask.trim(),
      updatedAt,
    }

    if (typeof progress === 'number' && Number.isFinite(progress)) {
      sanitized.progress = clampProgress(progress)
    }

    if (typeof targetRole === 'string' && targetRole.trim().length > 0) {
      sanitized.targetRole = targetRole.trim()
    }

    return [sanitized]
  })
}

export function createFallbackOfficeAgentStatusDataSourceState(
  agents: Agent[],
  fallbackUpdatedAt = '2026-05-14T09:20:00.000Z',
  overrides: Partial<Pick<OfficeAgentStatusDataSourceState, 'error' | 'kind' | 'sourceUrl'>> = {},
): OfficeAgentStatusDataSourceState {
  return {
    kind: overrides.kind ?? 'fallback',
    snapshots: createOfficeAgentStatusFixture(agents, fallbackUpdatedAt),
    sourceUrl: overrides.sourceUrl,
    loadedAt: fallbackUpdatedAt,
    isFallback: true,
    error: overrides.error,
  }
}

export async function loadOfficeAgentStatusSnapshots(
  agents: Agent[],
  options: OfficeAgentStatusLoadOptions = {},
): Promise<OfficeAgentStatusDataSourceState> {
  const sourceUrl = options.url ?? DEFAULT_OFFICE_AGENT_STATUS_URL
  const fallbackUpdatedAt = options.fallbackUpdatedAt
  const fetcher =
    options.fetcher ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined)

  if (!fetcher) {
    return createFallbackOfficeAgentStatusDataSourceState(agents, fallbackUpdatedAt, {
      kind: 'fallback',
      sourceUrl,
    })
  }

  try {
    const response = await fetcher(sourceUrl, {
      cache: 'no-cache',
      headers: { accept: 'application/json' },
    })

    if (!response.ok) {
      return createFallbackOfficeAgentStatusDataSourceState(agents, fallbackUpdatedAt, {
        kind: response.status === 404 ? 'stale' : 'error',
        sourceUrl,
        error: `HTTP ${response.status}`,
      })
    }

    const payload = await response.json()
    const snapshots = sanitizeOfficeAgentStatusSnapshots(payload, agents)

    if (snapshots.length === 0) {
      return createFallbackOfficeAgentStatusDataSourceState(agents, fallbackUpdatedAt, {
        kind: 'error',
        sourceUrl,
        error: 'No valid office agent status snapshots',
      })
    }

    return {
      kind: 'ready',
      snapshots,
      sourceUrl,
      loadedAt: new Date().toISOString(),
      isFallback: false,
    }
  } catch (error) {
    return createFallbackOfficeAgentStatusDataSourceState(agents, fallbackUpdatedAt, {
      kind: 'error',
      sourceUrl,
      error: error instanceof Error ? error.message : 'Unable to load office agent status source',
    })
  }
}

export function useOfficeAgentStatus(
  agents: Agent[],
  options: UseOfficeAgentStatusOptions = {},
): OfficeAgentStatusDataSourceState {
  const fallbackUpdatedAt = options.fallbackUpdatedAt
  const sourceUrl = options.url ?? DEFAULT_OFFICE_AGENT_STATUS_URL
  const enabled = options.enabled ?? true
  const agentIds = useMemo(() => agents.map((agent) => agent.id).join('|'), [agents])
  const requestKey = `${sourceUrl}|${fallbackUpdatedAt ?? ''}|${agentIds}|${enabled ? 'enabled' : 'disabled'}`
  const fallbackState = useMemo(
    () =>
      createFallbackOfficeAgentStatusDataSourceState(agents, fallbackUpdatedAt, {
        kind: enabled ? 'loading' : 'fallback',
        sourceUrl,
      }),
    [agents, enabled, fallbackUpdatedAt, sourceUrl],
  )
  const [resolvedState, setResolvedState] = useState<{
    key: string
    state: OfficeAgentStatusDataSourceState
  }>()

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    let isActive = true

    loadOfficeAgentStatusSnapshots(agents, {
      fallbackUpdatedAt,
      fetcher: options.fetcher,
      url: sourceUrl,
    }).then((nextState) => {
      if (isActive) {
        setResolvedState({ key: requestKey, state: nextState })
      }
    })

    return () => {
      isActive = false
    }
  }, [agents, enabled, fallbackUpdatedAt, options.fetcher, requestKey, sourceUrl])

  if (!enabled || resolvedState?.key !== requestKey) {
    return fallbackState
  }

  return resolvedState.state
}
