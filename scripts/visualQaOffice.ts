import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { get } from 'node:http'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { chromium, type Browser, type Locator, type Page } from '@playwright/test'

const previewHost = '127.0.0.1'
const previewBasePath = '/openclaw-command-center/'
const outputDir = join('artifacts', 'visual-qa')

interface ViewportCase {
  readonly name: string
  readonly width: number
  readonly height: number
}

const viewportCases: readonly ViewportCase[] = [
  { name: 'desktop', width: 1366, height: 900 },
  { name: 'responsive-390', width: 390, height: 900 },
]

function request(path: string, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = get(
      {
        host: previewHost,
        path,
        port,
      },
      (res) => {
        const chunks: Buffer[] = []

        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`GET ${path} returned HTTP ${res.statusCode ?? 'unknown'}`))
            return
          }

          resolve(Buffer.concat(chunks).toString('utf8'))
        })
      },
    )

    req.on('error', reject)
    req.setTimeout(8_000, () => {
      req.destroy(new Error(`GET ${path} timed out`))
    })
  })
}

async function waitForPreview(port: number) {
  const deadline = Date.now() + 20_000
  let lastError: unknown

  while (Date.now() < deadline) {
    try {
      await request(previewBasePath, port)
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Timed out waiting for Vite preview')
}

function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer()

    server.once('error', reject)
    server.listen(0, previewHost, () => {
      const address = server.address()

      server.close(() => {
        if (typeof address === 'object' && address?.port) {
          resolve(address.port)
          return
        }

        reject(new Error('Could not allocate a local preview port'))
      })
    })
  })
}

async function verifyOfficeDom(page: Page) {
  await page.getByRole('heading', { name: 'Офіс агентів' }).waitFor()

  const officeToggle = page.getByRole('button', { name: 'Показати office floor' })
  const graphToggle = page.getByRole('button', { name: 'Показати workflow graph' })

  await expectVisible(officeToggle, 'Office toggle')
  await expectVisible(graphToggle, 'Graph toggle')
  assert.equal(await officeToggle.getAttribute('aria-pressed'), 'true', 'Office is the default scene')

  await expectVisible(page.locator('.isometric-office'), 'Office scene')
  await expectVisible(page.locator('.office-floor'), 'Office floor')
  await expectVisible(page.locator('.office-area--desk'), 'Desk/PC zone')
  await expectVisible(page.locator('.office-area--sofa'), 'Sofa/rest zone')
  await expectVisible(page.locator('.office-area--hologram'), 'Hologram/status zone')
  await expectVisible(page.locator('.office-lounge-sofa'), 'Lounge sofa prop')
  await expectVisible(page.locator('.office-handoff-hub'), 'Handoff hub prop')
  await expectVisible(page.locator('.office-room-props'), 'Physical office room props layer')
  await expectVisible(page.locator('.office-wall--back'), 'Back wall room plane')
  await expectVisible(page.locator('.office-rug--center'), 'Central office rug/path')
  await expectVisible(page.locator('.office-cabinet--ops'), 'Ops cabinet/server furniture')
  await expectVisible(page.locator('.office-whiteboard--research'), 'Research whiteboard/search wall')

  assert.equal(await page.locator('.office-core, .command-core').count(), 0, 'Large central core/card block should not render in the office scene')
  assert((await page.locator('.office-desk').count()) >= 4, 'Expected multiple office stations')
  assert((await page.locator('.office-desk-cluster').count()) >= 2, 'Expected desk clusters grounding work zones')
  assert((await page.locator('.office-plant').count()) >= 2, 'Expected small office props around the room')
  assert((await page.locator('.office-agent-sprite').count()) >= 4, 'Expected office agent sprites')
  assert((await page.locator('.office-agent-floor').count()) === 1, 'Expected physical agent floor layer')
  assert((await page.locator('.office-floor-agent[data-physical-agent="true"]').count()) >= 4, 'Expected physical agent sprites on the office floor')
  assert((await page.locator('.office-desk .office-agent-sprite').count()) === 0, 'Office agents should not be rendered inside desk blocks')
  assert((await page.locator('.office-walker .office-agent-sprite').count()) >= 2, 'Expected sprite-like walking agents on route layer')
  assert((await page.locator('.office-monitor-stand').count()) >= 4, 'Expected monitor stands')
  assert((await page.locator('.office-keyboard-tray').count()) >= 4, 'Expected keyboard/tool trays')
  assert((await page.locator('[data-profession-prop]').count()) >= 9, 'Expected profession props at agent workstations')
  assert((await page.locator('.office-activity-chip[data-activity-state]').count()) >= 9, 'Expected compact attached activity chips')
  assert((await page.locator('.office-task-bubble').count()) >= 9, 'Expected small action bubbles on physical agents')
  for (const activityState of [
    'coding',
    'monitoring',
    'researching',
    'reviewing',
    'checking',
    'filming',
    'designing',
    'trading',
    'coordinating',
  ]) {
    assert(
      (await page.locator(`.office-desk[data-activity-state="${activityState}"]`).count()) >= 1,
      `Expected ${activityState} desk activity state`,
    )
  }
  assert(
    (await page.locator('[data-action-phase]').count()) >= 4,
    'Expected agent action phase metadata',
  )
  assert(
    (
      await page
        .locator(
          [
            '.office-behavior--type-monitor',
            '.office-behavior--path-step',
            '.office-behavior--sofa-idle',
            '.office-behavior--signal-transfer',
            '.office-behavior--scan-check',
            '.office-behavior--resolve-pulse',
          ].join(', '),
        )
        .count()
    ) >= 4,
    'Expected behavior choreography classes',
  )

  const oversizedLabels = await page.evaluate(() =>
    window.innerWidth <= 430
      ? []
      : [...document.querySelectorAll('.office-desk__label, .office-activity-chip, .office-task-bubble')]
          .map((element, index) => {
            const box = element.getBoundingClientRect()

            return box.width > 96 || box.height > 30
              ? `${element.className} ${index + 1}: ${Math.round(box.width)}x${Math.round(box.height)}`
              : ''
          })
          .filter(Boolean),
  )

  assert.deepEqual(
    oversizedLabels,
    [],
    `Office labels and chips should stay compact attached metadata, not dashboard cards: ${oversizedLabels.join('; ')}`,
  )

  const crampedCentralStations = await page.evaluate(() => {
    if (window.innerWidth <= 430) {
      return []
    }

    const centralStates = new Set(['checking', 'coding', 'designing'])
    const desks = [...document.querySelectorAll<HTMLElement>('.office-desk[data-activity-state]')]
      .filter((desk) => centralStates.has(desk.dataset.activityState ?? ''))
      .map((desk) => {
        const box = desk.getBoundingClientRect()

        return {
          state: desk.dataset.activityState,
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
        }
      })

    return desks.flatMap((firstDesk, firstIndex) =>
      desks.slice(firstIndex + 1).map((secondDesk) => {
        const distance = Math.hypot(firstDesk.x - secondDesk.x, firstDesk.y - secondDesk.y)

        return distance < 118
          ? `${firstDesk.state}-${secondDesk.state}: ${Math.round(distance)}px`
          : ''
      }),
    ).filter(Boolean)
  })

  assert.deepEqual(
    crampedCentralStations,
    [],
    `Central coding/QA/layout stations should preserve readable walkways: ${crampedCentralStations.join('; ')}`,
  )
}

async function verifyResponsiveOfficeComposition(page: Page, viewportCase: ViewportCase) {
  if (viewportCase.width > 430) {
    return
  }

  assert.equal(
    await page.locator('.office-core, .command-core').count(),
    0,
    'Responsive Office should not reintroduce the large central core/card block',
  )

  const crampedLabels = await page.evaluate(() =>
    [...document.querySelectorAll('.office-desk__label')]
      .map((label, index) => {
        const name = label.querySelector('strong')?.getBoundingClientRect()
        const role = label.querySelector('small')
        const roleDisplay = role ? getComputedStyle(role).display : 'none'

        return !name || name.width < 62 || roleDisplay !== 'none'
          ? `station ${index + 1}: name ${Math.round(name?.width ?? 0)}px, role ${roleDisplay}`
          : ''
      })
      .filter(Boolean),
  )

  assert.deepEqual(
    crampedLabels,
    [],
    `Responsive Office station labels should prioritize readable names over role abbreviations: ${crampedLabels.join('; ')}`,
  )
}

async function verifyReducedMotionOffice(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload({ waitUntil: 'networkidle' })
  await verifyOfficeDom(page)

  const animatedOfficeElements = await page.evaluate(() =>
    [
      '.office-desk',
      '.office-terminal__ticks',
      '.office-agent-avatar',
      '.office-agent-tool',
      '.office-agent-signal-prop',
      '.office-agent-sprite__legs',
      '.office-floor-agent',
      '.office-walker',
      '.office-handoff-hub',
      '.office-transfer',
    ]
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .flatMap((element) => [
        getComputedStyle(element).animationName,
        getComputedStyle(element, '::before').animationName,
        getComputedStyle(element, '::after').animationName,
      ])
      .filter((animationName) => animationName !== 'none' && animationName !== 'office-reduced-low-pulse'),
  )

  assert.deepEqual(
    animatedOfficeElements,
    [],
    `Reduced-motion Office should disable choreographed movement and packet animations: ${animatedOfficeElements.join(', ')}`,
  )

  await page.emulateMedia({ reducedMotion: 'no-preference' })
}

async function expectVisible(locator: Locator, label: string) {
  await locator.first().waitFor({ state: 'visible', timeout: 8_000 })

  const box = await locator.first().boundingBox()
  assert(box && box.width > 0 && box.height > 0, `${label} should have visible dimensions`)
}

async function captureViewport(page: Page, viewportCase: ViewportCase, port: number) {
  await page.setViewportSize({ width: viewportCase.width, height: viewportCase.height })
  await page.goto(`http://${previewHost}:${port}${previewBasePath}`, { waitUntil: 'networkidle' })
  await verifyOfficeDom(page)
  await verifyResponsiveOfficeComposition(page, viewportCase)
  await page.locator('.center-stage').screenshot({
    path: join(outputDir, `office-${viewportCase.name}.png`),
  })
}

const port = await getAvailablePort()
const preview = spawn(
  join('node_modules', '.bin', 'vite'),
  ['preview', '--host', previewHost, '--port', String(port), '--strictPort'],
  {
    detached: true,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)
const previewClosed = new Promise((resolve) => preview.once('close', resolve))

let previewOutput = ''
let browser: Browser | undefined

preview.stdout.on('data', (chunk: Buffer) => {
  previewOutput += chunk.toString()
})
preview.stderr.on('data', (chunk: Buffer) => {
  previewOutput += chunk.toString()
})

try {
  rmSync(outputDir, { force: true, recursive: true })
  mkdirSync(outputDir, { recursive: true })

  await waitForPreview(port)
  browser = await chromium.launch()
  const page = await browser.newPage()

  for (const viewportCase of viewportCases) {
    await captureViewport(page, viewportCase, port)
    console.log(`[qa:visual] captured ${join(outputDir, `office-${viewportCase.name}.png`)}`)
  }

  await verifyReducedMotionOffice(page)
  console.log('[qa:visual] Office browser visual QA passed.')
} catch (error) {
  throw new Error(
    `Office browser visual QA failed: ${
      error instanceof Error ? error.message : String(error)
    }\n${previewOutput}`,
    { cause: error },
  )
} finally {
  await browser?.close()

  if (preview.pid) {
    try {
      process.kill(-preview.pid, 'SIGTERM')
    } catch {
      preview.kill('SIGTERM')
    }
  }

  await Promise.race([
    previewClosed,
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ])
}
