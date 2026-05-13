import { mockCommandCenterAdapter } from './mockCommandCenterAdapter'
import type { CommandCenterSnapshot } from '../shared/types'

export type CommandCenterAdapterSource = 'mock' | 'openclaw'

export interface CommandCenterAdapter {
  readonly source: CommandCenterAdapterSource
  getSnapshot(): CommandCenterSnapshot
}

export function getCommandCenterAdapter(): CommandCenterAdapter {
  return mockCommandCenterAdapter
}

export function getCommandCenterSnapshot(): CommandCenterSnapshot {
  return getCommandCenterAdapter().getSnapshot()
}
