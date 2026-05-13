import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const appStyles = readFileSync('src/App.css', 'utf8')

function getBlock(selector: string, source = appStyles) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockPattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\}`)
  const match = source.match(blockPattern)

  assert(match, `Expected CSS block for ${selector}`)

  return match[0]
}

function getMediaBlock(query: string) {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockPattern = new RegExp(`@media\\s+${escapedQuery}\\s*\\{[\\s\\S]*?\\n\\}`)
  const match = appStyles.match(blockPattern)

  assert(match, `Expected media block for ${query}`)

  return match[0]
}

function assertIncludes(source: string, expected: string, label: string) {
  assert(source.includes(expected), `Expected composition QA CSS to include ${label}`)
}

assertIncludes(getBlock('.stage-header'), 'flex-wrap: wrap;', 'wrapping stage header')
assertIncludes(getBlock('.stage-actions'), 'flex-wrap: wrap;', 'wrapping stage controls')
assertIncludes(
  getMediaBlock('(max-width: 820px)'),
  'flex-direction: column;',
  'tablet/mobile stacked stage header controls',
)
assertIncludes(
  getMediaBlock('(max-width: 430px)'),
  'grid-template-columns: repeat(2, minmax(0, 1fr));',
  'narrow mobile stage stats grid',
)
assertIncludes(getBlock('.hologram'), 'overflow: hidden;', 'contained room composition')
assertIncludes(getBlock('.workflow-graph'), 'overflow: hidden;', 'contained graph composition')

console.log('[composition-qa] Source-level composition checks passed.')
