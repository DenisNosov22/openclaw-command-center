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

  const officeToggle = page.getByRole('button', { name: 'Показати orbital office' })
  const graphToggle = page.getByRole('button', { name: 'Показати workflow graph' })

  await expectVisible(officeToggle, 'Office toggle')
  await expectVisible(graphToggle, 'Graph toggle')
  assert.equal(await officeToggle.getAttribute('aria-pressed'), 'true', 'Office is the default scene')

  await expectVisible(page.locator('.isometric-office'), 'Office scene')
  await expectVisible(page.locator('.office-floor'), 'Office floor')
  await expectVisible(page.locator('.office-core'), 'Office command core')
  await expectVisible(page.locator('.office-area--desk'), 'Desk/PC zone')
  await expectVisible(page.locator('.office-area--sofa'), 'Sofa/rest zone')
  await expectVisible(page.locator('.office-area--hologram'), 'Hologram/status zone')
  await expectVisible(page.locator('.office-lounge-sofa'), 'Lounge sofa prop')
  await expectVisible(page.locator('.office-handoff-hub'), 'Handoff hub prop')

  assert((await page.locator('.office-desk').count()) >= 4, 'Expected multiple office stations')
  assert((await page.locator('.office-agent-sprite').count()) >= 4, 'Expected office agent sprites')
  assert((await page.locator('.office-monitor-stand').count()) >= 4, 'Expected monitor stands')
  assert((await page.locator('.office-keyboard-tray').count()) >= 4, 'Expected keyboard/tool trays')
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
}

async function verifyResponsiveOfficeComposition(page: Page, viewportCase: ViewportCase) {
  if (viewportCase.width > 430) {
    return
  }

  const overlaps = await page.evaluate(() => {
    const core = document.querySelector('.office-core')?.getBoundingClientRect()

    if (!core) {
      return ['Office core is missing']
    }

    return [...document.querySelectorAll('.office-desk')]
      .map((station, index) => {
        const box = station.getBoundingClientRect()
        const overlapsCore =
          box.left < core.right &&
          box.right > core.left &&
          box.top < core.bottom &&
          box.bottom > core.top

        return overlapsCore ? `station ${index + 1}` : ''
      })
      .filter(Boolean)
  })

  assert.equal(
    overlaps.length,
    0,
    `Responsive Office stations should not overlap the command core: ${overlaps.join(', ')}`,
  )
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
