import { createCommandCenterAdapterSelection } from './createCommandCenterAdapter'
import { mockCommandCenterAdapter } from './mockCommandCenterAdapter'

export function getCommandCenterAdapterSelection() {
  return createCommandCenterAdapterSelection(mockCommandCenterAdapter)
}

export function getCommandCenterAdapter() {
  return getCommandCenterAdapterSelection().adapter
}

export function getCommandCenterSnapshot() {
  return getCommandCenterAdapter().getSnapshot()
}
