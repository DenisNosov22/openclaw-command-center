import type { Agent, Task } from '../../shared/types'
import { createOfficeAgentStations, getStationTone } from './IsometricOfficeSceneModel'

interface IsometricOfficeSceneProps {
  agents: Agent[]
  tasks: Task[]
  selectedAgentId: string
  onSelectAgent: (agentId: string) => void
}

export function IsometricOfficeScene({
  agents,
  tasks,
  selectedAgentId,
  onSelectAgent,
}: IsometricOfficeSceneProps) {
  const stations = createOfficeAgentStations(agents, tasks)
  const selectedStation = stations.find((station) => station.agentId === selectedAgentId)

  return (
    <div className="isometric-office" aria-label="Orbit Office read-only view">
      <div
        aria-label="Isometric orbital office scene"
        className="office-floor"
        role="img"
      />
      <div className="office-core" aria-label="Central orbital command core">
        <span>Orbit Core</span>
        <strong>{selectedStation?.name ?? 'Command'}</strong>
        <p>{selectedStation?.taskTitle ?? 'Mock-first coordination table'}</p>
      </div>
      <div className="office-routes" aria-hidden="true">
        <span className="office-route office-route--north" />
        <span className="office-route office-route--east" />
        <span className="office-route office-route--south" />
        <span className="office-route office-route--west" />
      </div>
      {stations.map((station) => {
        const isSelected = station.agentId === selectedAgentId

        return (
          <button
            aria-label={`Select office station ${station.name}: ${station.role}, ${station.action}`}
            aria-pressed={isSelected}
            className={`office-desk office-desk--${station.lane}${
              isSelected ? ' office-desk--selected' : ''
            }`}
            key={station.id}
            onClick={() => onSelectAgent(station.agentId)}
            style={{
              left: `${station.x}%`,
              top: `${station.y}%`,
            }}
            type="button"
          >
            <span className="office-terminal">
              <i />
            </span>
            <span className="office-chair" aria-hidden="true" />
            <span className={`office-agent-marker office-agent-marker--${station.action}`}>
              {station.marker}
            </span>
            <span className={`office-status-lamp office-status-lamp--${getStationTone(station.status)}`} />
            <span className="office-desk__label">
              <strong>{station.name}</strong>
              <small>{station.role}</small>
            </span>
          </button>
        )
      })}
    </div>
  )
}
