import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const stylesheetSource = readFileSync('src/App.css', 'utf8')

function assertIncludes(expected: string, label: string) {
  assert(
    stylesheetSource.includes(expected),
    `Expected content density CSS to include ${label}: ${JSON.stringify(expected)}`,
  )
}

function getBlock(selector: string, source = stylesheetSource) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockPattern = new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\}`)
  const match = source.match(blockPattern)

  assert(match, `Expected CSS block for ${selector}`)

  return match[0]
}

function getMediaBlock(query: string) {
  const start = stylesheetSource.indexOf(`@media (${query})`)

  assert(start >= 0, `Expected media query for ${query}`)

  const blockStart = stylesheetSource.indexOf('{', start)
  let depth = 0

  for (let index = blockStart; index < stylesheetSource.length; index += 1) {
    const character = stylesheetSource[index]

    if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1
    }

    if (depth === 0) {
      return stylesheetSource.slice(blockStart + 1, index)
    }
  }

  throw new Error(`Expected complete media query block for ${query}`)
}

const tabletBlock = getMediaBlock('max-width: 820px')
const mobileBlock = getMediaBlock('max-width: 540px')
const narrowMobileBlock = getMediaBlock('max-width: 430px')
const tinyMobileBlock = getMediaBlock('max-width: 360px')

assert(getBlock('.command-room', tabletBlock).includes('padding: 16px;'))
assert(getBlock('.command-room', mobileBlock).includes('padding: 12px;'))
assert(getBlock('.panel', mobileBlock).includes('padding: 13px;'))

assert(
  tabletBlock.includes('grid-template-rows: none;'),
  'Expected tablet stack to avoid carrying desktop row heights',
)
assert(getBlock('.hologram', tabletBlock).includes('min-height: 330px;'))
assert(getBlock('.workflow-graph', tabletBlock).includes('min-height: 350px;'))
assert(getBlock('.hologram', narrowMobileBlock).includes('min-height: 340px;'))
assert(getBlock('.workflow-graph', narrowMobileBlock).includes('min-height: 400px;'))

assert(
  getBlock('.timeline-filters', mobileBlock).includes(
    'grid-template-columns: repeat(2, minmax(0, 1fr));',
  ),
  'Expected 390px timeline filters to use dense two-column wrapping',
)
assert(
  tinyMobileBlock.includes('grid-template-columns: 1fr;'),
  'Expected tiny mobile timeline filters to fall back to one column',
)

for (const selector of [
  '.timeline strong',
  '.timeline p',
  '.task-chip span',
  '.inspector-risk p',
  '.inspector-next strong',
]) {
  assertIncludes(selector, `${selector} selector`)
}

assertIncludes('overflow-wrap: anywhere;', 'safe wrapping token')
assert(getBlock('.task-chip strong').includes('overflow-wrap: anywhere;'))

console.log('[content-density] Source-level content density checks passed.')
