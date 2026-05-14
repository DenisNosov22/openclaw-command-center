import type { ActivityEvent, Agent, CommandCenterSnapshot, Task } from '../../shared/types'
import type { CSSProperties } from 'react'
import { createOfficeSceneViewModel } from './IsometricOfficeSceneModel'
import {
  getOfficeAgentMarkerClassName,
  getOfficeStationClassName,
  getOfficeStatusLampClassName,
  getOfficeTerminalClassName,
  OFFICE_SPRITE_TOKENS,
  OFFICE_ZONE_TOKENS,
} from './IsometricOfficeSpriteSystem'

interface IsometricOfficeSceneProps {
  agents: Agent[]
  tasks: Task[]
  activity: ActivityEvent[]
  workflow: CommandCenterSnapshot['workflow']
  selectedAgentId: string
  onSelectAgent: (agentId: string) => void
}

export function IsometricOfficeScene({
  agents,
  tasks,
  activity,
  workflow,
  selectedAgentId,
  onSelectAgent,
}: IsometricOfficeSceneProps) {
  const { stations, signalRoutes } = createOfficeSceneViewModel(
    agents,
    tasks,
    activity,
    workflow,
    selectedAgentId,
  )
  const selectedStation = stations.find((station) => station.agentId === selectedAgentId)

  return (
    <div className="isometric-office" aria-label="Orbit Office read-only view">
      <div
        aria-label="Isometric orbital office scene"
        className="office-floor"
        role="img"
      />
      <div className="office-zones" aria-hidden="true">
        <span className={`office-area ${OFFICE_ZONE_TOKENS.desk}`} data-label="Desks + PCs" />
        <span className={`office-area ${OFFICE_ZONE_TOKENS.sofa}`} data-label="Rest bay" />
        <span className={`office-area ${OFFICE_ZONE_TOKENS.hologram}`} data-label="Hologram UI" />
        <span className={OFFICE_ZONE_TOKENS.loungeSofa} />
        <span className={OFFICE_ZONE_TOKENS.statusBoard} data-label="Live board" />
      </div>
      <div className={`office-core ${OFFICE_ZONE_TOKENS.core}`} aria-label="Central orbital command core">
        <span className={OFFICE_ZONE_TOKENS.coreSurface} aria-hidden="true" />
        <span>Orbit Core</span>
        <strong>{selectedStation?.name ?? 'Command'}</strong>
        <p>{selectedStation?.taskTitle ?? 'Mock-first coordination table'}</p>
      </div>
      <div className="office-routes" aria-hidden="true">
        <span className={`${OFFICE_ZONE_TOKENS.path} office-lane--inner`} />
        <span className={`${OFFICE_ZONE_TOKENS.path} office-lane--outer`} />
        <span className="office-route office-route--north" />
        <span className="office-route office-route--east" />
        <span className="office-route office-route--south" />
        <span className="office-route office-route--west" />
        <span className="office-transfer office-transfer--core" />
        <span className="office-transfer office-transfer--handoff" />
        <span className={OFFICE_ZONE_TOKENS.handoff} data-link="agent data transfer to core" />
        {signalRoutes.map((route) => (
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
      <div className="office-walkers" aria-hidden="true">
        <span className="office-walker office-walker--inner">
          <span className={OFFICE_SPRITE_TOKENS.sprite}>
            <span className={OFFICE_SPRITE_TOKENS.head} />
            <span className={OFFICE_SPRITE_TOKENS.body} />
            <span className={OFFICE_SPRITE_TOKENS.hands} />
            <span className={OFFICE_SPRITE_TOKENS.legs} />
          </span>
        </span>
        <span className="office-walker office-walker--outer">
          <span className={OFFICE_SPRITE_TOKENS.sprite}>
            <span className={OFFICE_SPRITE_TOKENS.head} />
            <span className={OFFICE_SPRITE_TOKENS.body} />
            <span className={OFFICE_SPRITE_TOKENS.hands} />
            <span className={OFFICE_SPRITE_TOKENS.legs} />
          </span>
        </span>
      </div>
      {stations.map((station) => {
        const isSelected = station.agentId === selectedAgentId

        return (
          <button
            aria-label={`${isSelected ? 'Selected' : 'Select'} read-only office station ${station.name}: ${station.role}, ${station.activity} activity, ${station.terminalMode} terminal`}
            aria-pressed={isSelected}
            className={getOfficeStationClassName(station.lane, station.activity, station.pulse, isSelected)}
            data-agent-id={station.agentId}
            data-action-phase={station.choreography.phaseLabel}
            data-office-slot={station.slot}
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
            <span className={getOfficeTerminalClassName(station.terminalMode)}>
              <i />
              <span className={OFFICE_SPRITE_TOKENS.monitorStand} aria-hidden="true" />
              <span className={OFFICE_SPRITE_TOKENS.terminalTicks} aria-hidden="true" />
            </span>
            <span className={OFFICE_SPRITE_TOKENS.keyboardTray} aria-hidden="true" />
            <span className={OFFICE_SPRITE_TOKENS.worklog} aria-hidden="true" />
            <span className={OFFICE_SPRITE_TOKENS.chair} aria-hidden="true" />
            <span className={getOfficeStatusLampClassName(station.tone)} />
            <span className={OFFICE_SPRITE_TOKENS.label}>
              <strong>{station.name}</strong>
              <small>{station.role}</small>
            </span>
          </button>
        )
      })}
      <div className="office-agent-floor" aria-hidden="true">
        {stations.map((station) => (
          <span
            className={`office-floor-agent office-floor-agent--${station.lane} ${station.choreography.className}`}
            data-action-phase={station.choreography.phaseLabel}
            data-agent-id={station.agentId}
            data-physical-agent="true"
            data-route-involved={station.choreography.routeInvolvement}
            key={`floor-agent-${station.id}`}
            style={{
              '--office-agent-delay': station.choreography.animationDelay,
              '--office-agent-duration': station.choreography.animationDuration,
              '--office-agent-tempo': station.choreography.tempo,
              '--office-agent-x': `${station.x}%`,
              '--office-agent-y': `${station.y}%`,
            } as CSSProperties}
          >
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
          </span>
        ))}
      </div>
    </div>
  )
}
