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

  const officeSourceChip = page.locator('[data-office-status-source]')
  await expectVisible(officeSourceChip, 'Office status source indicator')
  assert(
    ['fixture', 'json', 'loading', 'stale', 'error'].includes(
      (await officeSourceChip.first().getAttribute('data-office-status-source')) ?? '',
    ),
    'Office status source indicator should expose fixture/json/loading/stale/error state',
  )

  await expectVisible(page.locator('.isometric-office'), 'Office scene')
  await expectVisible(page.locator('.office-floor'), 'Office floor')
  const officeWrapperIssues = await page.evaluate(() => {
    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officePanel = document.querySelector<HTMLElement>('.center-stage--office')
    const officeFloor = document.querySelector<HTMLElement>('.office-floor')
    const officeBox = office?.getBoundingClientRect()
    const style = office ? getComputedStyle(office) : undefined
    const panelStyle = officePanel ? getComputedStyle(officePanel) : undefined
    const floorStyle = officeFloor ? getComputedStyle(officeFloor) : undefined

    if (!office || !officeBox || !style || !officePanel || !panelStyle || !officeFloor || !floorStyle) {
      return ['missing office wrapper']
    }

    return [
      panelStyle.backgroundImage !== 'none' || panelStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? `office panel background ${panelStyle.backgroundImage} / ${panelStyle.backgroundColor}`
        : '',
      Number.parseFloat(panelStyle.borderTopWidth) > 0 && panelStyle.borderTopColor !== 'rgba(0, 0, 0, 0)'
        ? `office panel border ${panelStyle.borderTopWidth} ${panelStyle.borderTopColor}`
        : '',
      panelStyle.boxShadow !== 'none' ? `office panel shadow ${panelStyle.boxShadow}` : '',
      style.backgroundImage !== 'none' || style.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? `wrapper background ${style.backgroundImage} / ${style.backgroundColor}`
        : '',
      Number.parseFloat(style.borderTopWidth) > 0
        ? `wrapper border ${style.borderTopWidth}`
        : '',
      style.boxShadow !== 'none' ? `wrapper shadow ${style.boxShadow}` : '',
      Number.parseFloat(style.borderTopLeftRadius) > 0
        ? `wrapper radius ${style.borderTopLeftRadius}`
        : '',
      floorStyle.boxShadow !== 'none' ? `office floor shadow ${floorStyle.boxShadow}` : '',
      Number.parseFloat(floorStyle.borderTopWidth) > 0
        ? `office floor border ${floorStyle.borderTopWidth}`
        : '',
      Number.parseFloat(floorStyle.borderTopLeftRadius) > 0
        ? `office floor radius ${floorStyle.borderTopLeftRadius}`
        : '',
      !floorStyle.backgroundSize.split(',').some((layerSize) =>
        window.innerWidth <= 430
          ? ['contain', 'cover'].includes(layerSize.trim())
          : layerSize.trim() === 'cover',
      )
        ? `office floor background-size ${floorStyle.backgroundSize}`
        : '',
      window.innerWidth >= 821 && officeBox.height < 520
        ? `desktop room height ${Math.round(officeBox.height)}px`
        : '',
    ].filter(Boolean)
  })

  assert.deepEqual(
    officeWrapperIssues,
    [],
    `Office scene wrapper should be visually flattened while room stays tall: ${officeWrapperIssues.join('; ')}`,
  )
  assert.equal(
    await page.locator([
      '.office-zones',
      '.office-zones span',
      '.office-area',
      '.office-lounge-sofa',
      '.office-status-board',
      '.office-room-props',
      '.office-wall',
      '.office-rug',
      '.office-cabinet',
      '.office-whiteboard',
      '.office-social-board',
      '.office-desk-cluster',
      '.office-zone-label',
      '.office-lane',
      '.office-handoff-hub',
    ].join(', ')).count(),
    0,
    'Removed office zone/room-prop/lane overlay DOM should not render',
  )
  await expectVisible(page.locator(".office-desk[data-agent-id='agent-vitryna']"), 'Вітрина marketing visuals desk')
  await expectVisible(page.locator(".office-floor-agent[data-agent-id='agent-vitryna'][data-physical-agent='true']"), 'Вітрина physical office agent')
  await expectVisible(page.locator(".office-floor-agent[data-agent-id='agent-vitryna'] .office-agent-status-cue"), 'Вітрина status cue')
  await expectVisible(page.locator(".office-floor-agent[data-agent-id='agent-vitryna'] .office-task-bubble"), 'Вітрина task bubble')
  await expectVisible(page.locator(".office-desk[data-agent-id='agent-rezhyser']"), 'Режисер camera/director station')
  await expectVisible(page.locator(".office-floor-agent[data-agent-id='agent-rezhyser'][data-physical-agent='true']"), 'Режисер physical office agent')

  const edgeRoleClippingIssues = await page.evaluate(() => {
    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officeBox = office?.getBoundingClientRect()
    const elements = [
      document.querySelector<HTMLElement>(".office-desk[data-agent-id='agent-vitryna']"),
      document.querySelector<HTMLElement>(".office-floor-agent[data-agent-id='agent-vitryna']"),
      document.querySelector<HTMLElement>(".office-desk[data-agent-id='agent-vitryna'] .office-desk__label strong"),
      document.querySelector<HTMLElement>(".office-desk[data-agent-id='agent-rezhyser']"),
      document.querySelector<HTMLElement>(".office-floor-agent[data-agent-id='agent-rezhyser']"),
      document.querySelector<HTMLElement>(".office-desk[data-agent-id='agent-rezhyser'] .office-desk__label strong"),
    ].filter(Boolean) as HTMLElement[]

    if (!officeBox) {
      return ['missing office bounds']
    }

    return elements
      .map((element) => {
        const box = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const id = element.dataset.agentId ?? element.textContent?.trim() ?? element.className
        const hasReadableText = element.textContent?.includes('Вітрина') || element.textContent?.includes('Режисер')
          ? box.width >= 42 && box.height >= 7 && style.visibility !== 'hidden'
          : true
        const visibleEnough =
          box.left >= officeBox.left - 8 &&
          box.top >= officeBox.top - 8 &&
          box.right <= officeBox.right + 8 &&
          box.bottom <= officeBox.bottom + 8 &&
          style.opacity !== '0' &&
          hasReadableText

        return visibleEnough
          ? ''
          : `${id}: ${Math.round(box.left - officeBox.left)},${Math.round(box.top - officeBox.top)} ${Math.round(box.width)}x${Math.round(box.height)} in office ${Math.round(officeBox.width)}x${Math.round(officeBox.height)}`
      })
      .filter(Boolean)
  })

  assert.deepEqual(
    edgeRoleClippingIssues,
    [],
    `Вітрина and Режисер stations should be fully visible, especially at 390px: ${edgeRoleClippingIssues.join('; ')}`,
  )

  const rolePlacementIssues = await page.evaluate(() => {
    if (window.innerWidth <= 430) {
      return []
    }

    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officeBox = office?.getBoundingClientRect()

    if (!officeBox) {
      return ['missing office bounds']
    }

    const getCenter = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector)
      const box = element?.getBoundingClientRect()

      return box
        ? {
            x: ((box.left + box.width / 2 - officeBox.left) / officeBox.width) * 100,
            y: ((box.top + box.height / 2 - officeBox.top) / officeBox.height) * 100,
          }
        : undefined
    }

    const checks = [
      ['agent-krab', getCenter(".office-floor-agent[data-agent-id='agent-krab']"), 38, 64, 28, 56],
      ['agent-dev', getCenter(".office-floor-agent[data-agent-id='agent-dev']"), 7, 34, 36, 60],
      ['agent-varta', getCenter(".office-floor-agent[data-agent-id='agent-varta']"), 24, 48, 58, 78],
      ['agent-shturman', getCenter(".office-floor-agent[data-agent-id='agent-shturman']"), 8, 36, 18, 44],
      ['agent-spec', getCenter(".office-floor-agent[data-agent-id='agent-spec']"), 20, 42, 28, 48],
      ['agent-bastion', getCenter(".office-floor-agent[data-agent-id='agent-bastion']"), 4, 34, 62, 90],
      ['agent-desk', getCenter(".office-floor-agent[data-agent-id='agent-desk']"), 48, 76, 58, 84],
      ['agent-verstalnyk', getCenter(".office-floor-agent[data-agent-id='agent-verstalnyk']"), 62, 84, 42, 66],
      ['agent-vitryna', getCenter(".office-floor-agent[data-agent-id='agent-vitryna']"), 62, 88, 24, 54],
      ['agent-rezhyser', getCenter(".office-floor-agent[data-agent-id='agent-rezhyser']"), 66, 94, 58, 86],
    ] as const

    return checks.map(([id, center, minX, maxX, minY, maxY]) => {
      if (!center) {
        return `${id}: missing`
      }

      return center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY
        ? ''
        : `${id}: ${Math.round(center.x)},${Math.round(center.y)} outside ${minX}-${maxX}/${minY}-${maxY}`
    }).filter(Boolean)
  })

  assert.deepEqual(
    rolePlacementIssues,
    [],
    `Office agents should sit/stand at role-specific background furniture: ${rolePlacementIssues.join('; ')}`,
  )

  const topLeftPcClusterIssues = await page.evaluate(() => {
    if (window.innerWidth <= 430) {
      return []
    }

    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officeBox = office?.getBoundingClientRect()

    if (!officeBox) {
      return ['missing office bounds']
    }

    const topLeftPcAgentIds = [
      'agent-dev',
      'agent-shturman',
    ]

    return topLeftPcAgentIds
      .map((agentId) => {
        const element = document.querySelector<HTMLElement>(`.office-floor-agent[data-agent-id='${agentId}']`)
        const box = element?.getBoundingClientRect()

        if (!box) {
          return `${agentId}: missing`
        }

        const x = ((box.left + box.width / 2 - officeBox.left) / officeBox.width) * 100
        const y = ((box.top + box.height / 2 - officeBox.top) / officeBox.height) * 100

        return x >= 2 && x <= 34 && y >= 18 && y <= 58
          ? ''
          : `${agentId}: ${Math.round(x)},${Math.round(y)} outside top-left PC cluster`
      })
      .filter(Boolean)
  })

  assert.deepEqual(
    topLeftPcClusterIssues,
    [],
    `Only dev/research home agents should remain in the top-left PC cluster: ${topLeftPcClusterIssues.join('; ')}`,
  )

  const redistributedRoleIssues = await page.evaluate(() => {
    if (window.innerWidth <= 430) {
      return []
    }

    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officeBox = office?.getBoundingClientRect()

    if (!officeBox) {
      return ['missing office bounds']
    }

    const getCenter = (agentId: string) => {
      const element = document.querySelector<HTMLElement>(`.office-floor-agent[data-agent-id='${agentId}']`)
      const box = element?.getBoundingClientRect()

      return box
        ? {
            x: ((box.left + box.width / 2 - officeBox.left) / officeBox.width) * 100,
            y: ((box.top + box.height / 2 - officeBox.top) / officeBox.height) * 100,
          }
        : undefined
    }

    const checks = [
      ['agent-verstalnyk', getCenter('agent-verstalnyk'), 62, 84, 42, 66],
      ['agent-varta', getCenter('agent-varta'), 24, 48, 58, 78],
      ['agent-spec', getCenter('agent-spec'), 20, 42, 28, 48],
    ] as const

    return checks.map(([id, center, minX, maxX, minY, maxY]) => {
      if (!center) {
        return `${id}: missing`
      }

      return center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY
        ? ''
        : `${id}: ${Math.round(center.x)},${Math.round(center.y)} outside redistributed home zone`
    }).filter(Boolean)
  })

  assert.deepEqual(
    redistributedRoleIssues,
    [],
    `Layout/QA/Spec agents should be distributed to role-appropriate furniture: ${redistributedRoleIssues.join('; ')}`,
  )

  const stationaryCentralWalkwayIssues = await page.evaluate(() => {
    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officeBox = office?.getBoundingClientRect()

    if (!officeBox) {
      return ['missing office bounds']
    }

    return [...document.querySelectorAll<HTMLElement>(".office-floor-agent[data-physical-agent='true']")]
      .map((agent) => {
        const posture = agent.dataset.agentPosture

        if (posture === 'walking' || posture === 'handoff') {
          return ''
        }

        const box = agent.getBoundingClientRect()
        const x = ((box.left + box.width / 2 - officeBox.left) / officeBox.width) * 100
        const y = ((box.top + box.height / 2 - officeBox.top) / officeBox.height) * 100
        const inCentralWalkway = x >= 38 && x <= 62 && y >= 47 && y <= 64

        return inCentralWalkway
          ? `${agent.dataset.agentId ?? 'unknown'}: ${Math.round(x)},${Math.round(y)}`
          : ''
      })
      .filter(Boolean)
  })

  assert.deepEqual(
    stationaryCentralWalkwayIssues,
    [],
    `Inactive/home agents should not occupy the central wooden movement corridor: ${stationaryCentralWalkwayIssues.join('; ')}`,
  )

  assert.equal(await page.locator('.office-core, .command-core').count(), 0, 'Large central core/card block should not render in the office scene')
  assert.equal(await page.locator('.office-zones, .office-zone, .office-zone-label, .debug-rect, [data-debug-rect]').count(), 0, 'Office zone/debug overlays should not render')
  assert((await page.locator('.office-desk').count()) >= 4, 'Expected multiple office stations')
  assert((await page.locator('.office-agent-sprite').count()) >= 4, 'Expected office agent sprites')
  assert((await page.locator('.office-agent-floor').count()) === 1, 'Expected physical agent floor layer')
  assert((await page.locator('.office-floor-agent[data-physical-agent="true"]').count()) >= 4, 'Expected physical agent sprites on the office floor')
  assert((await page.locator('.office-floor-agent[data-agent-posture][data-agent-activity][data-agent-path][data-agent-target]').count()) >= 4, 'Expected simulation metadata on physical floor agents')
  const isReducedMotion = await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const walkingAgentCount = await page.locator(".office-floor-agent[data-agent-posture='walking']").count()
  const routeActiveAgentCount = await page.locator(".office-floor-agent[data-agent-posture='walking'], .office-floor-agent[data-agent-posture='handoff']").count()
  if (isReducedMotion) {
    assert(routeActiveAgentCount <= 4, `Reduced-motion Office should keep route/handoff fallback capped, found ${routeActiveAgentCount}`)
  } else {
    assert(walkingAgentCount >= 2, `Expected at least two simulation walking postures in default/mock view, found ${walkingAgentCount}`)
    assert(routeActiveAgentCount <= 4, `Expected active moving/handoff agents to stay capped, found ${routeActiveAgentCount}`)
  }
  assert((await page.locator(".office-floor-agent[data-agent-posture='working'], .office-floor-agent[data-agent-posture='sitting']").count()) >= 1, 'Expected at least one calmer desk posture')
  assert((await page.locator(".office-floor-agent[data-agent-posture='handoff']").count()) >= 1, 'Expected at least one handoff posture')
  assert((await page.locator(".office-floor-agent[data-agent-posture='blocked'], .office-floor-agent[data-agent-activity='monitoring']").count()) >= 1, 'Expected blocked or monitoring status marker state')
  assert((await page.locator('.office-agent-route-map').count()) === 1, 'Expected simulation route SVG overlay')
  const routePathCount = await page.locator('.office-agent-route[data-agent-path] polyline').count()
  assert(routePathCount >= 1, 'Expected focused agent path cues keyed by path id')
  assert(routePathCount <= 4, `Expected routes to stay focused and not clutter the floor, found ${routePathCount}`)
  assert((await page.locator(".office-agent-route--walking, .office-agent-route--handoff").count()) >= 1, 'Expected active movement or handoff route cues')
  if (!isReducedMotion) {
    assert((await page.locator(".office-floor-agent[data-agent-posture='walking'] .office-agent-trail").count()) >= 1, 'Expected walking agents to expose movement trails')
  }
  assert((await page.locator(".office-floor-agent[data-agent-posture='walking'] .office-agent-direction-arrow, .office-floor-agent[data-agent-posture='handoff'] .office-agent-direction-arrow").count()) >= 1, 'Expected moving/handoff agents to expose direction arrows')
  assert((await page.locator(".office-floor-agent[data-agent-posture='handoff'] .office-agent-document-transfer").count()) >= 1, 'Expected handoff agents to expose document transfer marker')
  assert((await page.locator('.office-agent-status-cue').count()) >= 10, 'Expected compact status cues on simulation agents')
  assert((await page.locator('.office-agent-action-cue').count()) >= 10, 'Expected role-specific action cues on simulation agents')
  assert((await page.locator(".office-floor-agent[data-activity-state='coding'] .office-agent-action-cue").count()) >= 1, 'Expected coding spark cue')
  assert((await page.locator(".office-floor-agent[data-activity-state='checking'] .office-agent-action-cue, .office-floor-agent[data-profession-prop='qa'] .office-agent-action-cue").count()) >= 1, 'Expected QA/check cue')
  assert((await page.locator(".office-floor-agent[data-activity-state='filming'] .office-agent-action-cue").count()) >= 1, 'Expected filming record cue')
  assert((await page.locator(".office-floor-agent[data-profession-prop='trading'] .office-agent-action-cue").count()) >= 1, 'Expected market chart cue')
  assert((await page.locator('.office-desk .office-agent-sprite').count()) === 0, 'Office agents should not be rendered inside desk blocks')
  assert.equal(await page.locator('.office-walkers, .office-walker').count(), 0, 'Standalone walking overlay should not render')
  assert.equal(
    await page.locator('.office-terminal, .office-keyboard-tray, .office-profession-prop, .office-monitor-stand, .office-chair, .office-desk-worklog, .office-activity-chip').count(),
    0,
    'Duplicate desk/PC/furniture prop overlays should not render over the generated office background',
  )
  const loudPcOverlayIssues = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.office-desk')]
      .map((element) => {
        const box = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const backgroundVisible =
          style.backgroundImage !== 'none' ||
          style.backgroundColor !== 'rgba(0, 0, 0, 0)'
        const framed =
          Number.parseFloat(style.borderTopWidth) > 0 ||
          style.boxShadow !== 'none'

        return (backgroundVisible || framed) && box.width * box.height > 1_120
          ? `${element.dataset.agentId ?? element.className}: ${Math.round(box.width)}x${Math.round(box.height)} ${style.backgroundImage} ${style.boxShadow}`
          : ''
      })
      .filter(Boolean),
  )

  assert.deepEqual(
    loudPcOverlayIssues,
    [],
    `Station hit targets should be visually transparent because the generated background already has furniture: ${loudPcOverlayIssues.join('; ')}`,
  )
  const zoneLikeTextIssues = await page.evaluate(() => {
    const forbiddenText = /\b(scan|scope|visual|grid|shot|ops\s+one|handoff)\b/i

    return [...document.querySelectorAll<HTMLElement>('.isometric-office *')]
      .map((element) => {
        const text = element.textContent?.trim() ?? ''
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        const visible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number.parseFloat(style.opacity || '1') > 0.03 &&
          box.width > 0 &&
          box.height > 0

        return visible && forbiddenText.test(text)
          ? `${element.className}: ${text.slice(0, 32)} (${Math.round(box.width)}x${Math.round(box.height)})`
          : ''
      })
      .filter(Boolean)
  })

  assert.deepEqual(
    zoneLikeTextIssues,
    [],
    `Old zone-like overlay labels should not be visibly rendered over the office: ${zoneLikeTextIssues.join('; ')}`,
  )
  assert((await page.locator('.office-task-bubble').count()) >= 10, 'Expected small action bubbles on physical agents')
  for (const activityState of [
    'coding',
    'monitoring',
    'researching',
    'reviewing',
    'checking',
    'filming',
    'designing',
    'presenting',
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

  const agentsMissingSimulationPosition = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.office-floor-agent[data-physical-agent="true"]')]
      .map((agent) => {
        const style = getComputedStyle(agent)
        const x = style.getPropertyValue('--office-agent-x').trim()
        const y = style.getPropertyValue('--office-agent-y').trim()
        const targetX = style.getPropertyValue('--office-agent-target-x').trim()
        const targetY = style.getPropertyValue('--office-agent-target-y').trim()

        return x.endsWith('%') && y.endsWith('%') && targetX.endsWith('%') && targetY.endsWith('%')
          ? ''
          : `${agent.dataset.agentId ?? 'unknown'}: ${x}/${y} -> ${targetX}/${targetY}`
      })
      .filter(Boolean),
  )

  assert.deepEqual(
    agentsMissingSimulationPosition,
    [],
    `Floor agents should expose simulation position and target CSS variables: ${agentsMissingSimulationPosition.join('; ')}`,
  )

  if (!isReducedMotion) {
    const firstMovementSample = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".office-floor-agent[data-agent-posture='walking']")]
        .slice(0, 4)
        .map((agent) => {
          const box = agent.getBoundingClientRect()

          return {
            id: agent.dataset.agentId ?? 'unknown',
            progress: agent.dataset.agentProgress ?? '',
            x: Math.round(box.left + box.width / 2),
            y: Math.round(box.top + box.height / 2),
          }
        }),
    )

    await page.waitForTimeout(900)

    const secondMovementSample = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".office-floor-agent[data-agent-posture='walking']")]
        .slice(0, 4)
        .map((agent) => {
          const box = agent.getBoundingClientRect()

          return {
            id: agent.dataset.agentId ?? 'unknown',
            progress: agent.dataset.agentProgress ?? '',
            x: Math.round(box.left + box.width / 2),
            y: Math.round(box.top + box.height / 2),
          }
        }),
    )
    const movingEvidence = firstMovementSample.some((first) => {
      const second = secondMovementSample.find((sample) => sample.id === first.id)

      return second
        ? second.progress !== first.progress || Math.hypot(second.x - first.x, second.y - first.y) >= 2
        : false
    })

    assert(
      movingEvidence,
      `Expected walking agents to change route progress/position over time; before ${JSON.stringify(firstMovementSample)}, after ${JSON.stringify(secondMovementSample)}`,
    )
  }

  const deskSpreadIssues = await page.evaluate(() => {
    if (window.innerWidth <= 430) {
      return []
    }

    const office = document.querySelector<HTMLElement>('.isometric-office')
    const officeBox = office?.getBoundingClientRect()
    const desks = [...document.querySelectorAll<HTMLElement>('.office-desk[data-agent-id]')]
      .map((desk) => {
        const box = desk.getBoundingClientRect()

        return {
          id: desk.dataset.agentId ?? 'unknown',
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
        }
      })

    if (desks.length < 8) {
      return [`only ${desks.length} desks visible`]
    }

    const topLeftPcAgentIds = new Set([
      'agent-dev',
      'agent-shturman',
    ])
    const xs = desks.map((desk) => desk.x)
    const ys = desks.map((desk) => desk.y)
    const spreadX = Math.max(...xs) - Math.min(...xs)
    const spreadY = Math.max(...ys) - Math.min(...ys)
    const closePairs = desks.flatMap((firstDesk, firstIndex) =>
      desks.slice(firstIndex + 1).map((secondDesk) => {
        const distance = Math.hypot(firstDesk.x - secondDesk.x, firstDesk.y - secondDesk.y)
        const expectedPcClusterPair =
          topLeftPcAgentIds.has(firstDesk.id) && topLeftPcAgentIds.has(secondDesk.id)
        const minimumDistance = expectedPcClusterPair ? 36 : 92

        return distance < minimumDistance
          ? `${firstDesk.id}-${secondDesk.id}: ${Math.round(distance)}px`
          : ''
      }),
    ).filter(Boolean)

    return [
      !officeBox || spreadX < officeBox.width * 0.68
        ? `x-spread ${Math.round(spreadX)}px of ${Math.round(officeBox?.width ?? 0)}px`
        : '',
      !officeBox || spreadY < officeBox.height * 0.54
        ? `y-spread ${Math.round(spreadY)}px of ${Math.round(officeBox?.height ?? 0)}px`
        : '',
      ...closePairs,
    ].filter(Boolean)
  })

  assert.deepEqual(
    deskSpreadIssues,
    [],
    `Office desks should use the full room with readable spacing: ${deskSpreadIssues.join('; ')}`,
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

  const oversizedSourceChip = await page.evaluate(() =>
    [...document.querySelectorAll('.office-source-chip')]
      .map((element, index) => {
        const box = element.getBoundingClientRect()

        return box.width > 112 || box.height > 30
          ? `source ${index + 1}: ${Math.round(box.width)}x${Math.round(box.height)}`
          : ''
      })
      .filter(Boolean),
  )

  assert.deepEqual(
    oversizedSourceChip,
    [],
    `Office status source indicator should stay small and unobtrusive: ${oversizedSourceChip.join('; ')}`,
  )

  const noisyHandoffElements = await page.evaluate(() =>
    window.innerWidth <= 430
      ? []
      : [...document.querySelectorAll<HTMLElement>('.office-handoff-hub, .office-transfer--handoff, .office-floor-agent[data-activity-state="coordinating"] .office-task-bubble, .office-floor-agent[data-action-phase="signal-transfer"] .office-task-bubble')]
          .map((element, index) => {
            const box = element.getBoundingClientRect()

            return box.width > 136 || box.height > 32
              ? `${element.className} ${index + 1}: ${Math.round(box.width)}x${Math.round(box.height)}`
              : ''
          })
          .filter(Boolean),
  )

  assert.deepEqual(
    noisyHandoffElements,
    [],
    `Coordinator/handoff route notes should stay staged and compact: ${noisyHandoffElements.join('; ')}`,
  )

  const crampedTopLeftPcStations = await page.evaluate(() => {
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

        return distance < 36
          ? `${firstDesk.state}-${secondDesk.state}: ${Math.round(distance)}px`
          : ''
      }),
    ).filter(Boolean)
  })

  assert.deepEqual(
    crampedTopLeftPcStations,
    [],
    `Top-left coding/QA/layout PC stations should stay separated inside the cluster: ${crampedTopLeftPcStations.join('; ')}`,
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
