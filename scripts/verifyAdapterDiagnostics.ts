import { strict as assert } from 'node:assert'
import {
  createCommandCenterAdapterDiagnostics,
  createCommandCenterAdapterSelection,
} from '../src/adapters/createCommandCenterAdapter.ts'
import type { CommandCenterAdapter } from '../src/adapters/commandCenterAdapter.ts'

const fallbackAdapter: CommandCenterAdapter = {
  source: 'mock',
  getSnapshot() {
    throw new Error('Diagnostics test should not request snapshots.')
  },
}

const mockDiagnostics = createCommandCenterAdapterDiagnostics(
  createCommandCenterAdapterSelection(fallbackAdapter, 'mock'),
)
assert.equal(mockDiagnostics.activeLabel, 'Mock adapter')
assert.equal(mockDiagnostics.readOnlyLabel, 'Read-only')
assert.equal(mockDiagnostics.requestedModeLabel, undefined)
assert.equal(mockDiagnostics.warningLabel, undefined)

const blankDiagnostics = createCommandCenterAdapterDiagnostics(
  createCommandCenterAdapterSelection(fallbackAdapter, '  '),
)
assert.equal(blankDiagnostics.activeLabel, 'Mock adapter')
assert.equal(blankDiagnostics.readOnlyLabel, 'Read-only')
assert.equal(blankDiagnostics.requestedModeLabel, undefined)
assert.equal(blankDiagnostics.warningLabel, undefined)

const disabledDiagnostics = createCommandCenterAdapterDiagnostics(
  createCommandCenterAdapterSelection(fallbackAdapter, 'openclaw'),
)
assert.equal(disabledDiagnostics.activeLabel, 'OpenClaw adapter disabled')
assert.equal(disabledDiagnostics.requestedModeLabel, 'Requested: openclaw')
assert.match(disabledDiagnostics.warningLabel ?? '', /disabled/i)
assert.equal(disabledDiagnostics.readOnlyLabel, 'Read-only')

const explicitDisabledDiagnostics = createCommandCenterAdapterDiagnostics(
  createCommandCenterAdapterSelection(fallbackAdapter, 'openclaw-disabled'),
)
assert.equal(explicitDisabledDiagnostics.activeLabel, 'OpenClaw adapter disabled')
assert.equal(explicitDisabledDiagnostics.requestedModeLabel, 'Requested: openclaw-disabled')
assert.match(explicitDisabledDiagnostics.warningLabel ?? '', /disabled/i)
assert.equal(explicitDisabledDiagnostics.readOnlyLabel, 'Read-only')

const unknownDiagnostics = createCommandCenterAdapterDiagnostics(
  createCommandCenterAdapterSelection(fallbackAdapter, 'future-mode'),
)
assert.equal(unknownDiagnostics.activeLabel, 'Mock adapter')
assert.equal(unknownDiagnostics.requestedModeLabel, 'Requested: future-mode')
assert.match(unknownDiagnostics.warningLabel ?? '', /Unknown adapter mode/)
assert.equal(unknownDiagnostics.readOnlyLabel, 'Read-only')
