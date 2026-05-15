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
const screenshotPath = join(outputDir, 'office-desktop-polished.png')

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

async function verifyDesktopOffice(page: Page) {
  await page.getByRole('heading', { name: 'Офіс агентів' }).waitFor()

  const issues = await page.evaluate(() => {
    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officeBox = office?.getBoundingClientRect()

    if (!office || !officeBox) {
      return ['missing office scene']
    }

    const getCenter = (agentId: string) => {
      const agent = document.querySelector<HTMLElement>(`.office-floor-agent[data-agent-id="${agentId}"]`)
      const box = agent?.getBoundingClientRect()

      return agent && box
        ? {
            x: ((box.left + box.width / 2 - officeBox.left) / officeBox.width) * 100,
            y: ((box.top + box.height / 2 - officeBox.top) / officeBox.height) * 100,
            posture: agent.dataset.agentPosture ?? '',
          }
        : undefined
    }

    const checks = [
      ['agent-krab', getCenter('agent-krab'), 47, 53, 36, 43],
      ['agent-shturman', getCenter('agent-shturman'), 5, 12, 31, 38],
      ['agent-spec', getCenter('agent-spec'), 19, 26, 31, 39],
      ['agent-dev', getCenter('agent-dev'), 5, 13, 49, 57],
      ['agent-varta', getCenter('agent-varta'), 19, 27, 52, 61],
      ['agent-bastion', getCenter('agent-bastion'), 9, 16, 70, 77],
      ['agent-rezhyser', getCenter('agent-rezhyser'), 77, 86, 42, 50],
      ['agent-vitryna', getCenter('agent-vitryna'), 79, 88, 30, 37],
      ['agent-verstalnyk', getCenter('agent-verstalnyk'), 64, 72, 70, 78],
      ['agent-desk', getCenter('agent-desk'), 70, 79, 70, 79],
    ] as const

    const placementIssues = checks.map(([agentId, center, minX, maxX, minY, maxY]) => {
      if (!center) {
        return `${agentId}: missing`
      }

      if (center.posture === 'walking' || center.posture === 'handoff') {
        return `${agentId}: unexpected ${center.posture} posture`
      }

      return center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY
        ? ''
        : `${agentId}: ${Math.round(center.x)},${Math.round(center.y)} outside ${minX}-${maxX}/${minY}-${maxY}`
    })

    const movingAgents = [...document.querySelectorAll<HTMLElement>(
      '.office-floor-agent[data-agent-posture="walking"], .office-floor-agent[data-agent-posture="handoff"]',
    )].map((agent) => agent.dataset.agentId ?? 'unknown')

    const visibleRouteCount = [...document.querySelectorAll<SVGElement>('.office-agent-route--visible')].length
    const leftCluster = ['agent-shturman', 'agent-spec', 'agent-dev', 'agent-varta']
      .map((agentId) => getCenter(agentId))
      .filter(Boolean)
      .every((center) => center!.x >= 5 && center!.x <= 27 && center!.y >= 31 && center!.y <= 61)

    return [
      officeBox.width < 740 || officeBox.width > 790
        ? `desktop office width ${Math.round(officeBox.width)}px is not fixed near 780px`
        : '',
      Math.abs(officeBox.height - 640) > 2
        ? `desktop office height ${Math.round(officeBox.height)}px is not fixed at 640px`
        : '',
      ...placementIssues,
      movingAgents.length ? `unexpected moving agents: ${movingAgents.join(', ')}` : '',
      visibleRouteCount ? `unexpected visible route overlays: ${visibleRouteCount}` : '',
      leftCluster ? '' : 'left priority agents are not all inside the left laptop/chair cluster',
    ].filter(Boolean)
  })

  assert.deepEqual(issues, [], `Desktop office visual QA failed: ${issues.join('; ')}`)
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
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })

  await page.goto(`http://${previewHost}:${port}${previewBasePath}`, { waitUntil: 'networkidle' })
  await verifyDesktopOffice(page)
  await page.locator('.center-stage').screenshot({ path: screenshotPath })
  console.log(`[qa:visual:desktop] captured ${screenshotPath}`)
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
