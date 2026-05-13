import type { CommandCenterAdapter } from './commandCenterAdapter'

export type CommandCenterAdapterMode = 'mock' | 'openclaw-disabled' | 'openclaw'

export interface CommandCenterAdapterSelection {
  readonly adapter: CommandCenterAdapter
  readonly label: 'Mock adapter' | 'OpenClaw adapter disabled'
  readonly mode: CommandCenterAdapterMode
  readonly requestedMode: string
  readonly readOnly: true
  readonly usesFallback: boolean
  readonly warning?: string
}

export interface CommandCenterAdapterDiagnostics {
  readonly activeLabel: CommandCenterAdapterSelection['label']
  readonly readOnlyLabel: 'Read-only'
  readonly requestedModeLabel?: string
  readonly warningLabel?: string
}

const defaultAdapterMode = 'mock'

function normalizeRequestedMode(rawMode?: string) {
  return rawMode?.trim().toLowerCase() || defaultAdapterMode
}

export function createCommandCenterAdapterSelection(
  fallbackAdapter: CommandCenterAdapter,
  rawMode = import.meta.env?.VITE_COMMAND_CENTER_ADAPTER,
): CommandCenterAdapterSelection {
  const requestedMode = normalizeRequestedMode(rawMode)

  if (requestedMode === 'mock') {
    return {
      adapter: fallbackAdapter,
      label: 'Mock adapter',
      mode: 'mock',
      requestedMode,
      readOnly: true,
      usesFallback: false,
    }
  }

  if (requestedMode === 'openclaw' || requestedMode === 'openclaw-disabled') {
    return {
      adapter: fallbackAdapter,
      label: 'OpenClaw adapter disabled',
      mode: requestedMode,
      requestedMode,
      readOnly: true,
      usesFallback: true,
      warning: 'OpenClaw adapter is disabled; rendering safe mock snapshot.',
    }
  }

  return {
    adapter: fallbackAdapter,
    label: 'Mock adapter',
    mode: 'mock',
    requestedMode,
    readOnly: true,
    usesFallback: true,
    warning: `Unknown adapter mode "${requestedMode}"; rendering safe mock snapshot.`,
  }
}

export function createCommandCenterAdapterDiagnostics(
  selection: CommandCenterAdapterSelection,
): CommandCenterAdapterDiagnostics {
  return {
    activeLabel: selection.label,
    readOnlyLabel: 'Read-only',
    requestedModeLabel: selection.usesFallback
      ? `Requested: ${selection.requestedMode}`
      : undefined,
    warningLabel: selection.warning,
  }
}
