import type { ActivityEvent, Agent, CommandCenterSnapshot, Task } from '../../shared/types'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createOfficeSceneViewModel } from './IsometricOfficeSceneModel'
import type {
  OfficeAgentLiveStatusInput,
  OfficeSimulationMode,
} from './OfficeSimulationModel'
import { canAgentMove } from './OfficeSimulationModel'
import {
  getOfficeAgentMarkerClassName,
  getOfficeStationClassName,
  getOfficeStatusLampClassName,
  OFFICE_SPRITE_TOKENS,
} from './IsometricOfficeSpriteSystem'

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
  const [elapsedMs, setElapsedMs] = useState(1_200)

  useEffect(() => {
    if (controlledElapsedMs !== undefined || mode === 'static') {
      return undefined
    }

    const startedAt = performance.now() - 1_200
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

export function IsometricOfficeScene({
  agents,
  tasks,
  activity,
  workflow,
  selectedAgentId,
  onSelectAgent,
  liveSimulation,
  simulationElapsedMs,
  simulationMode = 'animated',
}: IsometricOfficeSceneProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const effectiveSimulationMode = prefersReducedMotion ? 'static' : simulationMode
  const elapsedMs = useOfficeSimulationElapsedMs(effectiveSimulationMode, simulationElapsedMs)
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
        aria-label="2D game-like real office floor plan with agents working at profession stations"
        className="office-floor"
        role="img"
      />
      <div className="office-routes" aria-hidden="true">
        <svg
          className="office-agent-route-map"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
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
            const points = routePoints.map((point) => `${point.x},${point.y}`).join(' ')
            const isMoving = station.simulation.posture === 'walking'
            const isHandoff = station.simulation.posture === 'handoff'

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
                  x1={station.simulation.position.x}
                  x2={station.simulation.target.x}
                  y1={station.simulation.position.y}
                  y2={station.simulation.target.y}
                />
                <circle
                  className="office-agent-route__target"
                  cx={station.simulation.target.x}
                  cy={station.simulation.target.y}
                  r={isMoving || isHandoff ? 1.45 : 1.08}
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
              '--office-station-x': `${station.x}%`,
              '--office-station-y': `${station.y}%`,
            } as CSSProperties}
            type="button"
          >
            <span className={getOfficeStatusLampClassName(station.tone)} />
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
                '--office-agent-target-x': `${station.simulation.target.x}%`,
                '--office-agent-target-y': `${station.simulation.target.y}%`,
                '--office-agent-x': `${station.simulation.position.x}%`,
                '--office-agent-y': `${station.simulation.position.y}%`,
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
  )
}
