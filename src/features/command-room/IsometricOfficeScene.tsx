import type { ActivityEvent, Agent, CommandCenterSnapshot, Task } from '../../shared/types'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createOfficeSceneViewModel } from './IsometricOfficeSceneModel'
import type {
  OfficeAgentLiveStatusInput,
  OfficeSimulationMode,
} from './OfficeSimulationModel'
import {
  canAgentMove,
  OFFICE_WORLD,
  officePercentToWorldPoint,
} from './OfficeSimulationModel'
import {
  getOfficeAgentMarkerClassName,
  getOfficeTerminalClassName,
  getOfficeStationClassName,
  getOfficeStatusLampClassName,
  OFFICE_SPRITE_TOKENS,
} from './IsometricOfficeSpriteSystem'

const defaultCompactFloorAgentIds = new Set<string>()

function getOfficeFloorAgentClassName(station: ReturnType<typeof createOfficeSceneViewModel>['stations'][number]) {
  return [
    'office-floor-agent',
    `office-floor-agent--${station.lane}`,
    `office-floor-agent--posture-${station.simulation.posture}`,
    `office-floor-agent--activity-${station.simulation.activity}`,
    `office-floor-agent--path-${station.simulation.pathId}`,
    `office-floor-agent--zone-${station.simulation.zoneId}`,
    station.choreography.className,
  ].join(' ')
}

function getAgentStateBadgeLabel(station: ReturnType<typeof createOfficeSceneViewModel>['stations'][number]) {
  if (station.simulation.statusBadge) {
    return station.simulation.statusBadge
  }

  if (station.simulation.posture === 'walking') {
    return 'moving'
  }

  if (station.simulation.activity === 'blocked') {
    return 'blocked'
  }

  if (station.simulation.activity === 'monitoring') {
    return 'monitoring'
  }

  return station.simulation.activity
}

function getAgentStatusBadge(station: ReturnType<typeof createOfficeSceneViewModel>['stations'][number]) {
  return station.simulation.statusBadge ?? station.simulation.activity
}

function getDefaultFloorAgentRender(
  station: ReturnType<typeof createOfficeSceneViewModel>['stations'][number],
  simulationMode: OfficeSimulationMode,
) {
  if (
    simulationMode === 'static' &&
    station.simulation.posture !== 'walking' &&
    station.simulation.posture !== 'handoff' &&
    defaultCompactFloorAgentIds.has(station.agentId)
  ) {
    return 'badge'
  }

  return 'full'
}

function getWorldPoint(point: { x: number; y: number }) {
  return officePercentToWorldPoint(point)
}

interface IsometricOfficeSceneProps {
  agents: Agent[]
  tasks: Task[]
  activity: ActivityEvent[]
  workflow: CommandCenterSnapshot['workflow']
  selectedAgentId: string
  onSelectAgent: (agentId: string) => void
  liveSimulation?: Record<string, OfficeAgentLiveStatusInput>
  simulationElapsedMs?: number
  simulationMode?: OfficeSimulationMode
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

function useOfficeSimulationElapsedMs(mode: OfficeSimulationMode, controlledElapsedMs?: number) {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    if (controlledElapsedMs !== undefined || mode === 'static') {
      return undefined
    }

    const startedAt = performance.now()
    const intervalId = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - startedAt))
    }, 360)

    return () => window.clearInterval(intervalId)
  }, [controlledElapsedMs, mode])

  if (mode === 'static') {
    return 0
  }

  return controlledElapsedMs ?? elapsedMs
}

function useOfficeWorldScale() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport) {
      return undefined
    }

    const updateScale = () => {
      const box = viewport.getBoundingClientRect()
      const nextScale = Math.min(
        box.width / OFFICE_WORLD.width,
        box.height / OFFICE_WORLD.height,
      )

      setScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1)
    }
    const resizeObserver = new ResizeObserver(updateScale)

    updateScale()
    resizeObserver.observe(viewport)

    return () => resizeObserver.disconnect()
  }, [])

  return { scale, viewportRef }
}

export function IsometricOfficeScene({
  agents,
  tasks,
  activity,
  workflow,
  selectedAgentId,
  onSelectAgent,
  liveSimulation,
  simulationElapsedMs,
  simulationMode = 'static',
}: IsometricOfficeSceneProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const effectiveSimulationMode = prefersReducedMotion ? 'static' : simulationMode
  const elapsedMs = useOfficeSimulationElapsedMs(effectiveSimulationMode, simulationElapsedMs)
  const { scale: officeWorldScale, viewportRef } = useOfficeWorldScale()
  const { stations, signalRoutes } = useMemo(
    () =>
      createOfficeSceneViewModel(
        agents,
        tasks,
        activity,
        workflow,
        selectedAgentId,
        {
          elapsedMs,
          liveAgents: liveSimulation,
          mode: effectiveSimulationMode,
        },
      ),
    [activity, agents, effectiveSimulationMode, elapsedMs, liveSimulation, selectedAgentId, tasks, workflow],
  )
  const routedStations = stations.filter(
    (station) =>
      (station.simulation.posture === 'walking' || station.simulation.posture === 'handoff') &&
      canAgentMove(
        station.simulation.statusBadge,
        station.simulation.activity,
        station.simulation.posture,
      ),
  )
  const focusedSignalRoutes = signalRoutes.filter((route) => route.isSelected).slice(0, 2)

  return (
    <div
      className="isometric-office"
      aria-label="2D agent office read-only view"
      data-simulation-mode={effectiveSimulationMode}
    >
      <div
        className="office-world-viewport"
        ref={viewportRef}
      >
      <div
        className="office-world"
        data-office-world-scale={officeWorldScale.toFixed(4)}
        data-office-world-height={OFFICE_WORLD.height}
        data-office-world-width={OFFICE_WORLD.width}
        style={{
          '--office-world-scale': officeWorldScale,
          '--office-world-height': `${OFFICE_WORLD.height}px`,
          '--office-world-width': `${OFFICE_WORLD.width}px`,
        } as CSSProperties}
      >
      <div
        aria-label="2D game-like real office floor plan with agents working at profession stations"
        className="office-floor"
        role="img"
      />
      <div className="office-floor-fixtures" aria-hidden="true">
        <span className="office-floor-fixture office-floor-fixture--operations" />
        <span className="office-floor-fixture office-floor-fixture--studio" />
        <span className="office-floor-fixture office-floor-fixture--research" />
        <span className="office-floor-fixture office-floor-fixture--showroom" />
        <span className="office-floor-zone office-floor-zone--command">Command</span>
        <span className="office-floor-zone office-floor-zone--build">Build</span>
        <span className="office-floor-zone office-floor-zone--visual">Visual</span>
        <span className="office-floor-zone office-floor-zone--ops">Ops</span>
      </div>
      <div className="office-routes" aria-hidden="true">
        <svg
          className="office-agent-route-map"
          focusable="false"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${OFFICE_WORLD.width} ${OFFICE_WORLD.height}`}
        >
          <defs>
            <marker
              id="office-route-arrow"
              markerHeight="5"
              markerWidth="6"
              orient="auto"
              refX="5"
              refY="2.5"
            >
              <path d="M0,0 L6,2.5 L0,5 Z" />
            </marker>
          </defs>
          {routedStations.map((station) => {
            const routePoints = station.simulation.route.length
              ? station.simulation.route
              : [station.simulation.position, station.simulation.target]
            const points = routePoints.map((point) => {
              const worldPoint = getWorldPoint(point)

              return `${worldPoint.x},${worldPoint.y}`
            }).join(' ')
            const isMoving = station.simulation.posture === 'walking'
            const isHandoff = station.simulation.posture === 'handoff'
            const position = getWorldPoint(station.simulation.position)
            const target = getWorldPoint(station.simulation.target)

            return (
              <g
                className={`office-agent-route office-agent-route--${station.simulation.posture} office-agent-route--${station.simulation.activity}${
                  isMoving || isHandoff ? ' office-agent-route--visible' : ''
                }`}
                data-agent-path={station.simulation.pathId}
                key={`agent-route-${station.id}`}
              >
                <polyline points={points} />
                <line
                  className="office-agent-route__heading"
                  markerEnd="url(#office-route-arrow)"
                  x1={position.x}
                  x2={target.x}
                  y1={position.y}
                  y2={target.y}
                />
                <circle
                  className="office-agent-route__target"
                  cx={target.x}
                  cy={target.y}
                  r={isMoving || isHandoff ? 14.5 : 10.8}
                />
              </g>
            )
          })}
        </svg>
        {focusedSignalRoutes.map((route) => (
          <span
            className={`office-transfer office-transfer--${route.lane} office-transfer--${route.activity} office-transfer--${route.tone}${
              route.isSelected ? ' office-transfer--selected' : ''
            }`}
            data-label={route.label}
            key={route.id}
            style={{
              '--office-route-delay': route.animationDelay,
              '--office-route-duration': route.animationDuration,
            } as CSSProperties}
          />
        ))}
      </div>
      {stations.map((station) => {
        const isSelected = station.agentId === selectedAgentId
        const statusBadge = getAgentStatusBadge(station)
        const stationPoint = getWorldPoint(station)

        return (
          <button
            aria-label={`${isSelected ? 'Selected' : 'Select'} read-only office station ${station.name}: ${station.role}, ${statusBadge} status, ${station.activity} activity, ${station.terminalMode} terminal, ${station.currentTask}`}
            aria-pressed={isSelected}
            className={getOfficeStationClassName(
              station.lane,
              station.activity,
              station.pulse,
              station.activityState,
              isSelected,
            )}
            data-agent-id={station.agentId}
            data-action-phase={station.choreography.phaseLabel}
            data-activity-state={station.activityState}
            data-agent-posture={station.simulation.posture}
            data-current-task={station.currentTask}
            data-status-badge={statusBadge}
            data-office-slot={station.slot}
            data-office-zone={station.simulation.zoneId}
            data-route-involved={station.choreography.routeInvolvement}
            key={station.id}
            onClick={() => onSelectAgent(station.agentId)}
            style={{
              '--office-agent-delay': station.choreography.animationDelay,
              '--office-agent-duration': station.choreography.animationDuration,
              '--office-agent-tempo': station.choreography.tempo,
              '--office-station-x': `${stationPoint.x}px`,
              '--office-station-y': `${stationPoint.y}px`,
            } as CSSProperties}
            type="button"
          >
            <span className={getOfficeStatusLampClassName(station.tone)} />
            <span className={getOfficeTerminalClassName(station.terminalMode)}>
              <i />
              <span className={OFFICE_SPRITE_TOKENS.terminalTicks} />
            </span>
            <span className={OFFICE_SPRITE_TOKENS.monitorStand} />
            <span className={OFFICE_SPRITE_TOKENS.keyboardTray} />
            <span className={OFFICE_SPRITE_TOKENS.chair} />
            <span className={OFFICE_SPRITE_TOKENS.worklog} />
            <span
              className={`${OFFICE_SPRITE_TOKENS.professionProp} office-profession-prop--${station.professionProp}`}
            />
            <span className={OFFICE_SPRITE_TOKENS.activityChip}>
              {station.activityLabel}
            </span>
            <span className={OFFICE_SPRITE_TOKENS.label}>
              <strong>{station.name}</strong>
              <small>{station.role}</small>
            </span>
          </button>
        )
      })}
      <div className="office-agent-floor" aria-hidden="true">
        {stations.map((station) => {
          const statusBadge = getAgentStatusBadge(station)
          const floorRender = getDefaultFloorAgentRender(station, effectiveSimulationMode)
          const position = getWorldPoint(station.simulation.position)
          const target = getWorldPoint(station.simulation.target)

          return (
            <span
              className={getOfficeFloorAgentClassName(station)}
              data-action-phase={station.choreography.phaseLabel}
              data-activity-state={station.activityState}
              data-agent-id={station.agentId}
              data-agent-activity={station.simulation.activity}
              data-agent-path={station.simulation.pathId}
              data-agent-posture={station.simulation.posture}
              data-agent-progress={station.simulation.progress}
              data-agent-target={`${station.simulation.target.x},${station.simulation.target.y}`}
              data-current-task={station.currentTask}
              data-floor-render={floorRender}
              data-office-zone={station.simulation.zoneId}
              data-physical-agent="true"
              data-profession-prop={station.professionProp}
              data-route-involved={station.choreography.routeInvolvement}
              data-status-badge={statusBadge}
              key={`floor-agent-${station.id}`}
              style={{
                '--office-agent-delay': station.choreography.animationDelay,
                '--office-agent-duration': station.choreography.animationDuration,
                '--office-agent-tempo': station.choreography.tempo,
                '--office-agent-target-x': `${target.x}px`,
                '--office-agent-target-y': `${target.y}px`,
                '--office-agent-x': `${position.x}px`,
                '--office-agent-y': `${position.y}px`,
              } as CSSProperties}
            >
              <span className="office-agent-trail" />
              <span className="office-agent-target-pin" />
              <span className="office-agent-status-cue" />
              <span className="office-agent-action-cue" />
              <span className={getOfficeAgentMarkerClassName(station.action)}>
                <span className={OFFICE_SPRITE_TOKENS.restProp} />
                <span className={OFFICE_SPRITE_TOKENS.sprite}>
                  <span className={OFFICE_SPRITE_TOKENS.head} />
                  <span className={OFFICE_SPRITE_TOKENS.body}>{station.marker}</span>
                  <span className={OFFICE_SPRITE_TOKENS.hands} />
                  <span className={OFFICE_SPRITE_TOKENS.legs} />
                </span>
                <span className={OFFICE_SPRITE_TOKENS.signalProp} />
                <span className={OFFICE_SPRITE_TOKENS.tool} />
              </span>
              <span className="office-agent-document-transfer" />
              <span className="office-agent-direction-arrow" />
              <span className="office-agent-state-badge">{getAgentStateBadgeLabel(station)}</span>
              <span className={OFFICE_SPRITE_TOKENS.taskBubble}>{station.taskBubble}</span>
            </span>
          )
        })}
        </div>
      </div>
      </div>
    </div>
  )
}
