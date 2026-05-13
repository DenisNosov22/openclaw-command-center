import { spawn, spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { get } from 'node:http'
import { join } from 'node:path'

interface SmokeMode {
  readonly name: string
  readonly adapterMode?: string
  readonly expectedBundleText: readonly string[]
}

const smokeModes: readonly SmokeMode[] = [
  {
    name: 'default/mock',
    expectedBundleText: ['Mock adapter', 'Read-only'],
  },
  {
    name: 'openclaw disabled',
    adapterMode: 'openclaw-disabled',
    expectedBundleText: [
      'OpenClaw adapter disabled',
      'Requested: ',
      'openclaw-disabled',
      'OpenClaw adapter disabled',
      'Read-only',
    ],
  },
  {
    name: 'unknown fallback',
    adapterMode: 'future-mode',
    expectedBundleText: [
      'Mock adapter',
      'Requested: ',
      'future-mode',
      'Unknown adapter mode',
      'Read-only',
    ],
  },
]

const previewHost = '127.0.0.1'
const previewBasePath = '/openclaw-command-center/'
const staticAssetPaths = [
  `${previewBasePath}logo-command-center.png`,
  `${previewBasePath}favicon.svg`,
]

function runBuild(mode: SmokeMode) {
  const env = { ...process.env }

  if (mode.adapterMode) {
    env.VITE_COMMAND_CENTER_ADAPTER = mode.adapterMode
  } else {
    delete env.VITE_COMMAND_CENTER_ADAPTER
  }

  const build = spawnSync('npm', ['run', 'build'], {
    env,
    stdio: 'inherit',
  })

  if (build.status !== 0) {
    throw new Error(`Build failed for smoke mode: ${mode.name}`)
  }
}

function collectDistText(dir: string): string {
  const chunks: string[] = []

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      chunks.push(collectDistText(path))
      continue
    }

    if (/\.(css|html|js|svg|txt)$/.test(entry)) {
      chunks.push(readFileSync(path, 'utf8'))
    }
  }

  return chunks.join('\n')
}

function assertBundleText(mode: SmokeMode) {
  const distText = collectDistText('dist')

  for (const expectedText of mode.expectedBundleText) {
    if (!distText.includes(expectedText)) {
      throw new Error(`Missing "${expectedText}" in dist bundle for smoke mode: ${mode.name}`)
    }
  }
}

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

function getLinkedAssetPaths(html: string) {
  return Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
    .map((match) => match[1])
    .filter((path) => path.startsWith(`${previewBasePath}assets/`))
}

async function verifyPreviewHttp(mode: SmokeMode, port: number) {
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
  preview.stdout.on('data', (chunk: Buffer) => {
    previewOutput += chunk.toString()
  })
  preview.stderr.on('data', (chunk: Buffer) => {
    previewOutput += chunk.toString()
  })

  try {
    await waitForPreview(port)
    const html = await request(previewBasePath, port)
    const assetPaths = [...getLinkedAssetPaths(html), ...staticAssetPaths]

    for (const assetPath of assetPaths) {
      await request(assetPath, port)
    }
  } catch (error) {
    throw new Error(
      `Preview HTTP smoke failed for ${mode.name}: ${
        error instanceof Error ? error.message : String(error)
      }\n${previewOutput}`,
      { cause: error },
    )
  } finally {
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
}

for (const [index, mode] of smokeModes.entries()) {
  const port = 4273 + index

  console.log(`\n[smoke:html] ${mode.name}`)
  runBuild(mode)
  assertBundleText(mode)
  await verifyPreviewHttp(mode, port)
}

console.log('\n[smoke:html] HTML/assets smoke checks passed.')
