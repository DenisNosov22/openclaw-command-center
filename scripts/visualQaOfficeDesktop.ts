import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { get } from 'node:http'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { chromium, type Browser, type Page } from '@playwright/test'

const previewHost = '127.0.0.1'
const previewBasePath = '/openclaw-command-center/'
const outputDir = join('artifacts', 'visual-qa')
const desktopViewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
] as const

function request(path: string, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = get({ host: previewHost, path, port }, (res) => {
      const chunks: Buffer[] = []

      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${path} returned HTTP ${res.statusCode ?? 'unknown'}`))
          return
        }

        resolve(Buffer.concat(chunks).toString('utf8'))
      })
    })

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

type Placement = Record<string, { x: number; y: number }>

async function verifyDesktopOffice(page: Page, viewportName: string): Promise<Placement> {
  await page.getByRole('heading', { name: 'Офіс агентів' }).waitFor()

  const result = await page.evaluate(() => {
    const officeViewport = document.querySelector<HTMLElement>('.office-world-viewport')
    const officeWorld = document.querySelector<HTMLElement>('.office-world')
    const officeFloor = document.querySelector<HTMLElement>('.office-floor')
    const viewportBox = officeViewport?.getBoundingClientRect()
    const worldBox = officeWorld?.getBoundingClientRect()
    const floorBox = officeFloor?.getBoundingClientRect()

    if (!officeViewport || !officeWorld || !officeFloor || !viewportBox || !worldBox || !floorBox) {
      return { issues: ['missing locked office world'], centers: {} }
    }

    const getCenter = (agentId: string) => {
      const agent = document.querySelector<HTMLElement>(`.office-floor-agent[data-agent-id="${agentId}"]`)
      const box = agent?.getBoundingClientRect()

      return agent && box
        ? {
            x: ((box.left + box.width / 2 - worldBox.left) / worldBox.width) * 100,
            y: ((box.top + box.height / 2 - worldBox.top) / worldBox.height) * 100,
            posture: agent.dataset.agentPosture ?? '',
          }
        : undefined
    }

    const checks = [
      ['agent-krab', getCenter('agent-krab'), 47, 53, 36, 43],
      ['agent-shturman', getCenter('agent-shturman'), 6, 16, 32, 40],
      ['agent-spec', getCenter('agent-spec'), 18, 27, 31, 39],
      ['agent-dev', getCenter('agent-dev'), 8, 44, 47, 58],
      ['agent-varta', getCenter('agent-varta'), 20, 27, 52, 59],
      ['agent-bastion', getCenter('agent-bastion'), 10, 16, 70, 76],
      ['agent-rezhyser', getCenter('agent-rezhyser'), 69, 83, 42, 50],
      ['agent-vitryna', getCenter('agent-vitryna'), 79, 85, 31, 37],
      ['agent-verstalnyk', getCenter('agent-verstalnyk'), 65, 86, 38, 76],
      ['agent-desk', getCenter('agent-desk'), 71, 77, 71, 77],
    ] as const

    const placementIssues = checks.map(([agentId, center, minX, maxX, minY, maxY]) => {
      if (!center) {
        return `${agentId}: missing`
      }

      return center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY
        ? ''
        : `${agentId}: ${Math.round(center.x)},${Math.round(center.y)} outside ${minX}-${maxX}/${minY}-${maxY}`
    })

    const movingAgents = [...document.querySelectorAll<HTMLElement>(
      '.office-floor-agent[data-agent-posture="walking"], .office-floor-agent[data-agent-posture="handoff"]',
    )].map((agent) => agent.dataset.agentId ?? 'unknown')

    const visibleRouteCount = [...document.querySelectorAll<SVGElement>('.office-agent-route--visible')].length
    const leftCluster = ['agent-shturman', 'agent-spec', 'agent-varta']
      .map((agentId) => getCenter(agentId))
      .filter(Boolean)
      .every((center) => center!.x >= 5 && center!.x <= 27 && center!.y >= 31 && center!.y <= 61)

    const centers = Object.fromEntries(
      checks.map(([agentId]) => {
        const center = getCenter(agentId)

        return [agentId, center ? { x: center.x, y: center.y } : { x: -1, y: -1 }]
      }),
    )
    const worldAspect = worldBox.width / worldBox.height
    const viewportAspect = viewportBox.width / viewportBox.height
    const floorDrift = Math.max(
      Math.abs(floorBox.left - worldBox.left),
      Math.abs(floorBox.top - worldBox.top),
      Math.abs(floorBox.width - worldBox.width),
      Math.abs(floorBox.height - worldBox.height),
    )
    const worldScale = Number(officeWorld.dataset.officeWorldScale ?? '0')
    const expectedScale = Math.min(viewportBox.width / 1536, viewportBox.height / 1024)
    const floorBackgroundSize = getComputedStyle(officeFloor).backgroundSize

    return {
      centers,
      issues: [
      Math.abs(worldAspect - 1.5) > 0.01
        ? `locked world aspect ${worldAspect.toFixed(3)} is not 1536:1024`
        : '',
      Math.abs(viewportAspect - 1.5) > 0.01
        ? `office viewport aspect ${viewportAspect.toFixed(3)} is not 1536:1024`
        : '',
      floorDrift > 1
        ? `floor layer is not locked to world bounds, drift ${floorDrift.toFixed(2)}px`
        : '',
      Math.abs(worldScale - expectedScale) > 0.01
        ? `world scale ${worldScale.toFixed(4)} does not match contain scale ${expectedScale.toFixed(4)}`
        : '',
      floorBackgroundSize.includes('cover')
        ? 'office floor background uses cover instead of contain'
        : '',
      ...placementIssues,
      movingAgents.length < 1 || movingAgents.length > 3
        ? `expected restrained autonomous movers, got ${movingAgents.join(', ') || 'none'}`
        : '',
      visibleRouteCount > 3 ? `too many visible route overlays: ${visibleRouteCount}` : '',
      leftCluster ? '' : 'left priority agents are not all inside the left laptop/chair cluster',
      ].filter(Boolean),
    }
  })

  assert.deepEqual(result.issues, [], `Desktop office visual QA failed at ${viewportName}: ${result.issues.join('; ')}`)

  return result.centers
}

async function verifyDesktopInteractions(page: Page) {
  const targetAgent = page.locator(".office-floor-agent[data-agent-id='agent-vitryna']")
  await targetAgent.click()
  await page.waitForFunction(() => {
    const floorAgent = document.querySelector<HTMLElement>(".office-floor-agent[data-agent-id='agent-vitryna']")
    const desk = document.querySelector<HTMLElement>(".office-desk[data-agent-id='agent-vitryna']")

    return floorAgent?.getAttribute('aria-pressed') === 'true' &&
      desk?.getAttribute('aria-pressed') === 'true'
  })

  const before = await targetAgent.boundingBox()
  assert(before, 'Expected draggable Вітрина floor agent bounds')

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width / 2 - 80, before.y + before.height / 2 + 55, { steps: 4 })
  await page.waitForFunction(() => {
    const agent = document.querySelector<HTMLElement>(".office-floor-agent[data-agent-id='agent-vitryna']")

    return agent?.dataset.isDragging === 'true'
  })
  await page.mouse.up()
  await page.waitForFunction(() => {
    const agent = document.querySelector<HTMLElement>(".office-floor-agent[data-agent-id='agent-vitryna']")

    return agent?.dataset.isDragging === 'false'
  })
  await page.waitForTimeout(420)

  const after = await targetAgent.boundingBox()
  assert(after, 'Expected returned Вітрина floor agent bounds')
  const returnDrift = Math.hypot(after.x - before.x, after.y - before.y)
  assert(returnDrift < 14, `Dragged floor agent should return to simulation/home safely, drift ${returnDrift.toFixed(2)}px`)
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

let previewOutput = ''
let browser: Browser | undefined

preview.stdout.on('data', (chunk: Buffer) => {
  previewOutput += chunk.toString()
})
preview.stderr.on('data', (chunk: Buffer) => {
  previewOutput += chunk.toString()
})

try {
  mkdirSync(outputDir, { recursive: true })
  await waitForPreview(port)
  browser = await chromium.launch()
  let baselineCenters: Placement | undefined

  for (const viewport of desktopViewports) {
    const page = await browser.newPage({ viewport })
    const screenshotPath = join(outputDir, `office-desktop-locked-world-${viewport.name}.png`)

    await page.goto(`http://${previewHost}:${port}${previewBasePath}?officeElapsedMs=1200`, { waitUntil: 'networkidle' })
    const centers = await verifyDesktopOffice(page, viewport.name)
    await verifyDesktopInteractions(page)

    if (baselineCenters) {
      const driftIssues = Object.entries(centers).map(([agentId, center]) => {
        const baseline = baselineCenters![agentId]
        const drift = Math.hypot(center.x - baseline.x, center.y - baseline.y)

        return drift <= 0.35 ? '' : `${agentId} drifted ${drift.toFixed(2)}%`
      }).filter(Boolean)

      assert.deepEqual(driftIssues, [], `Locked world placement drift failed at ${viewport.name}: ${driftIssues.join('; ')}`)
    }

    baselineCenters = centers
    await page.locator('.center-stage').screenshot({ path: screenshotPath })
    await page.close()
    console.log(`[qa:visual:desktop] captured ${screenshotPath}`)
  }

  console.log('[qa:visual:desktop] Office desktop visual QA passed.')
} catch (error) {
  throw new Error(
    `Office desktop browser visual QA failed: ${
      error instanceof Error ? error.message : String(error)
    }\n${previewOutput}`,
    { cause: error },
  )
} finally {
  await browser?.close()
  process.kill(-preview.pid!, 'SIGTERM')
}
