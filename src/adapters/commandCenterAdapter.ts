import type { CommandCenterSnapshot } from '../shared/types'

export type CommandCenterAdapterSource = 'mock' | 'openclaw'

export interface CommandCenterAdapter {
  readonly source: CommandCenterAdapterSource
  getSnapshot(): CommandCenterSnapshot
}
