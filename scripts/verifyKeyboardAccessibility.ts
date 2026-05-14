import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(
  'src/features/command-room/CommandRoomPage.tsx',
  'utf8',
)
const officeSceneSource = readFileSync(
  'src/features/command-room/IsometricOfficeScene.tsx',
  'utf8',
)
const componentSource = `${pageSource}\n${officeSceneSource}`
const stylesheetSource = readFileSync('src/App.css', 'utf8')

function assertIncludes(source: string, expected: string, label: string) {
  assert(
    source.includes(expected),
    `Expected ${label} to include ${JSON.stringify(expected)}`,
  )
}

function assertButtonHasAttribute(className: string, attribute: string) {
  const classNamePattern =
    className === 'office-desk'
      ? 'className=\\{getOfficeStationClassName\\('
      : `className=\\{\\\`[^\\\`]*${className}`
  const buttonPattern = new RegExp(`<button[\\s\\S]*?${classNamePattern}[\\s\\S]*?</button>`)
  const match = componentSource.match(buttonPattern)

  assert(match, `Expected ${className} to be rendered as a button`)
  assert(
    match[0].includes(attribute),
    `Expected ${className} button to include ${attribute}`,
  )
}

function assertToggleButton(label: string, setter: string) {
  const buttonPattern = new RegExp(
    `<button[\\s\\S]*?aria-label="${label}"[\\s\\S]*?</button>`,
  )
  const match = componentSource.match(buttonPattern)

  assert(match, `Expected toggle button "${label}"`)
  assert(match[0].includes('aria-pressed='), `Expected "${label}" to expose aria-pressed`)
  assert(match[0].includes(`onClick={() => ${setter}}`), `Expected "${label}" to be clickable`)
  assert(match[0].includes('type="button"'), `Expected "${label}" to be a safe button`)
}

assertIncludes(
  componentSource,
  '<div className="stage-toggle" aria-label="Режим центральної панелі" role="group">',
  'Office/Graph toggle group',
)
assertToggleButton('Показати office floor', "setStageView('office')")
assertToggleButton('Показати workflow graph', "setStageView('graph')")
assert(!componentSource.includes('Показати кімнату агентів'), 'Room is not exposed as a central-stage toggle')

assertIncludes(
  componentSource,
  '<div className="timeline-filters" aria-label="Read-only timeline filters" role="group">',
  'timeline filter group',
)
for (const filter of ['all', 'selected', 'critical', 'system']) {
  assertIncludes(
    componentSource,
    `aria-pressed={activityFilter === '${filter}'}`,
    `timeline ${filter} filter state`,
  )
  assertIncludes(
    componentSource,
    `onClick={() => setActivityFilter('${filter}')}`,
    `timeline ${filter} filter click handler`,
  )
}

for (const className of ['agent-card', 'workflow-node', 'office-desk']) {
  assertButtonHasAttribute(className, 'aria-label=')
  assertButtonHasAttribute(className, 'aria-pressed=')
  assertButtonHasAttribute(className, 'onClick=')
  assertButtonHasAttribute(className, 'type="button"')
}

const nonButtonClickTargets = componentSource.match(
  /<(?:div|article|span|section|aside|li)\b[^>]*\bonClick=/g,
)
assert.deepEqual(nonButtonClickTargets, null, 'Clickable non-button elements are not expected')
assert(!componentSource.includes('role="button"'), 'Use native buttons instead of role="button"')

for (const selector of [
  '.command-room button:focus-visible',
  '.stage-toggle button:focus-visible',
  '.timeline-filters button:focus-visible',
  '.agent-card:focus-visible',
  '.agent-node:focus-visible',
  '.workflow-node:focus-visible',
  '.office-desk:focus-visible',
]) {
  assertIncludes(stylesheetSource, selector, `${selector} focus-visible style`)
}

console.log('[keyboard-accessibility] Source-level keyboard accessibility checks passed.')
