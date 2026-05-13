import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const stylesheetSource = readFileSync('src/App.css', 'utf8')

function assertIncludes(expected: string, label: string) {
  assert(
    stylesheetSource.includes(expected),
    `Expected responsive accessibility CSS to include ${label}: ${JSON.stringify(expected)}`,
  )
}

function assertBlockIncludes(selector: string, expected: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockPattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\}`)
  const match = stylesheetSource.match(blockPattern)

  assert(match, `Expected CSS block for ${selector}`)
  assert(
    match[0].includes(expected),
    `Expected ${selector} block to include ${JSON.stringify(expected)}`,
  )
}

for (const selector of ['.agent-node', '.timeline-filters button']) {
  assertBlockIncludes(selector, 'min-height: 44px;')
}

assertBlockIncludes('.agent-node', 'min-width: 44px;')
assertBlockIncludes('.stage-toggle button', 'min-height: 38px;')
assertBlockIncludes('.panel', 'overflow: visible;')
assertBlockIncludes('.hologram', 'overflow-clip-margin: 8px;')
assertBlockIncludes('.workflow-graph', 'overflow-clip-margin: 8px;')

for (const selector of [
  '.adapter-diagnostics__label',
  '.status',
  '.task-state',
  '.timeline-filters button',
]) {
  assertIncludes(`${selector}`, `${selector} selector`)
}

assertIncludes('overflow-wrap: anywhere;', 'safe wrapping token')
assertBlockIncludes('.status', 'overflow-wrap: anywhere;')
assertBlockIncludes('.task-state', 'overflow-wrap: anywhere;')
assertBlockIncludes('.timeline-filters button', 'line-height: 1.15;')

assertIncludes('@media (max-width: 540px)', 'mobile media query')
assertIncludes('@media (max-width: 430px)', 'narrow mobile media query')
assertIncludes('grid-template-columns: repeat(2, minmax(0, 1fr));', 'two-column narrow controls')
assertIncludes('white-space: normal;', 'mobile timeline filter wrapping')

console.log('[responsive-accessibility] Source-level responsive accessibility checks passed.')
