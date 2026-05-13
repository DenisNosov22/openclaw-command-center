import type { ActivityEvent, Agent, CommandCenterSnapshot, Task } from '../../shared/types'
import { createOfficeSceneViewModel } from './IsometricOfficeSceneModel'

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
        <span className="office-area office-area--desk" data-label="Desks + PCs" />
        <span className="office-area office-area--sofa" data-label="Rest bay" />
        <span className="office-area office-area--hologram" data-label="Hologram UI" />
      </div>
      <div className="office-core command-core" aria-label="Central orbital command core">
        <span>Orbit Core</span>
        <strong>{selectedStation?.name ?? 'Command'}</strong>
        <p>{selectedStation?.taskTitle ?? 'Mock-first coordination table'}</p>
      </div>
      <div className="office-routes" aria-hidden="true">
        <span className="office-route office-route--north" />
        <span className="office-route office-route--east" />
        <span className="office-route office-route--south" />
        <span className="office-route office-route--west" />
        <span className="office-transfer office-transfer--core" />
        <span className="office-transfer office-transfer--handoff" />
        {signalRoutes.map((route) => (
          <span
            className={`office-transfer office-transfer--${route.lane} office-transfer--${route.activity} office-transfer--${route.tone}${
              route.isSelected ? ' office-transfer--selected' : ''
            }`}
            data-label={route.label}
            key={route.id}
          />
        ))}
      </div>
      <div className="office-walkers" aria-hidden="true">
        <span className="office-walker office-walker--inner" />
        <span className="office-walker office-walker--outer" />
      </div>
      {stations.map((station) => {
        const isSelected = station.agentId === selectedAgentId

        return (
          <button
            aria-label={`${isSelected ? 'Selected' : 'Select'} read-only office station ${station.name}: ${station.role}, ${station.activity} activity, ${station.terminalMode} terminal`}
            aria-pressed={isSelected}
            className={`office-desk office-workstation office-desk--${station.lane} office-desk--${station.activity} office-desk--pulse-${station.pulse}${
              isSelected ? ' office-desk--selected' : ''
            }`}
            data-agent-id={station.agentId}
            key={station.id}
            onClick={() => onSelectAgent(station.agentId)}
            style={{
              left: `${station.x}%`,
              top: `${station.y}%`,
            }}
            type="button"
          >
            <span className={`office-terminal office-terminal--${station.terminalMode}`}>
              <i />
              <span className="office-terminal__ticks" aria-hidden="true" />
            </span>
            <span className="office-chair" aria-hidden="true" />
            <span className={`office-agent-marker office-agent-avatar office-agent-marker--${station.action}`}>
              <span className="office-agent-rest-prop" aria-hidden="true" />
              <span className="office-agent-sprite" aria-hidden="true">
                <span className="office-agent-sprite__head" />
                <span className="office-agent-sprite__body">{station.marker}</span>
                <span className="office-agent-sprite__legs" />
              </span>
              <span className="office-agent-signal-prop" aria-hidden="true" />
              <span className="office-agent-tool" aria-hidden="true" />
            </span>
            <span className={`office-status-lamp office-status-lamp--${station.tone}`} />
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
