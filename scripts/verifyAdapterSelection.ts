import { strict as assert } from 'node:assert'
import { createCommandCenterAdapterSelection } from '../src/adapters/createCommandCenterAdapter.ts'
import type { CommandCenterAdapter } from '../src/adapters/commandCenterAdapter.ts'

const fallbackAdapter: CommandCenterAdapter = {
  source: 'mock',
  getSnapshot() {
    throw new Error('Selection test should not request snapshots.')
  },
}

const defaultSelection = createCommandCenterAdapterSelection(fallbackAdapter, undefined)
assert.equal(defaultSelection.mode, 'mock')
assert.equal(defaultSelection.label, 'Mock adapter')
assert.equal(defaultSelection.usesFallback, false)
assert.equal(defaultSelection.readOnly, true)
assert.equal(defaultSelection.adapter.source, 'mock')

const blankSelection = createCommandCenterAdapterSelection(fallbackAdapter, '  ')
assert.equal(blankSelection.mode, 'mock')
assert.equal(blankSelection.usesFallback, false)

const disabledSelection = createCommandCenterAdapterSelection(fallbackAdapter, ' OpenClaw ')
assert.equal(disabledSelection.mode, 'openclaw')
assert.equal(disabledSelection.label, 'OpenClaw adapter disabled')
assert.equal(disabledSelection.requestedMode, 'openclaw')
assert.equal(disabledSelection.usesFallback, true)
assert.equal(disabledSelection.readOnly, true)
assert.equal(disabledSelection.adapter.source, 'mock')
assert.match(disabledSelection.warning ?? '', /disabled/)

const unknownSelection = createCommandCenterAdapterSelection(fallbackAdapter, 'unexpected-mode')
assert.equal(unknownSelection.mode, 'mock')
assert.equal(unknownSelection.label, 'Mock adapter')
assert.equal(unknownSelection.requestedMode, 'unexpected-mode')
assert.equal(unknownSelection.usesFallback, true)
assert.equal(unknownSelection.adapter.source, 'mock')
assert.match(unknownSelection.warning ?? '', /Unknown adapter mode/)
