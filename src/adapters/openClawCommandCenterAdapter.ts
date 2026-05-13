import type { CommandCenterAdapter } from './commandCenterAdapter'

export const openClawCommandCenterAdapter: CommandCenterAdapter = {
  source: 'openclaw',
  getSnapshot() {
    throw new Error(
      'OpenClaw Command Center real adapter is intentionally disabled until a read-only, redacted data contract is approved.',
    )
  },
}
