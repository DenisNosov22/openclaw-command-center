import { useState } from 'react'
import { getCommandCenterSnapshot } from '../../adapters'
import type { Agent, Task } from '../../shared/types'

const statusLabel: Record<Agent['status'], string> = {
  idle: 'Вільний',
  working: 'В роботі',
  waiting: 'Очікує',
  blocked: 'Заблоковано',
  done: 'Готово',
  error: 'Помилка',
}

const taskLabel: Record<Task['status'], string> = {
  queued: 'У черзі',
  in_progress: 'В роботі',
  delegated: 'Делеговано',
  waiting: 'Очікує',
  blocked: 'Заблоковано',
  completed: 'Завершено',
  failed: 'Провалено',
}

const statusTone: Record<Agent['status'], string> = {
  idle: 'standby',
  working: 'online',
  waiting: 'caution',
  blocked: 'caution',
  done: 'online',
  error: 'danger',
}

const priorityLabel: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

function getAgentMarker(agent: Agent) {
  return agent.name.match(/\p{Extended_Pictographic}/u)?.[0] ?? agent.name.slice(0, 1)
}

export function CommandRoomPage() {
  const snapshot = getCommandCenterSnapshot()
  const [selectedAgentId, setSelectedAgentId] = useState(snapshot.agents[0]?.id)
  const selectedAgent =
    snapshot.agents.find((agent) => agent.id === selectedAgentId) ?? snapshot.agents[0]
  const selectedTask = snapshot.tasks.find((task) => task.id === selectedAgent.currentTaskId)
  const selectedAgentTasks = snapshot.tasks.filter(
    (task) => task.ownerAgentId === selectedAgent.id,
  )
  const activeTasks = snapshot.tasks.filter((task) =>
    ['in_progress', 'delegated', 'waiting', 'blocked', 'queued'].includes(task.status),
  )
  const onlineAgents = snapshot.agents.filter((agent) =>
    ['working', 'done'].includes(agent.status),
  )
  let globalStatus = 'Nominal'

  if (snapshot.agents.some((agent) => agent.status === 'error')) {
    globalStatus = 'Mock alert'
  } else if (snapshot.agents.some((agent) => agent.status === 'blocked')) {
    globalStatus = 'Needs attention'
  }

  return (
    <main className="command-room">
      <header className="command-bar" aria-label="Command Room status">
        <div className="command-bar__identity">
          <div className="command-mark" aria-hidden="true">
            OC
          </div>
          <div>
            <p className="eyebrow">OpenClaw Command Center</p>
            <h1>Командна кімната</h1>
          </div>
        </div>
        <div className="command-bar__telemetry" aria-label="Global command status">
          <div className="telemetry-pill telemetry-pill--live">
            <span />
            {globalStatus}
          </div>
          <div className="telemetry-pill">Mock mode</div>
          <div className="telemetry-readout">
            <span>Snapshot</span>
            <strong>{snapshot.generatedAt}</strong>
          </div>
        </div>
      </header>

      <section className="command-room__grid" aria-label="Command Room dashboard">
        <aside className="panel agent-roster" aria-label="Список агентів">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Roster</p>
              <h2>Агенти</h2>
            </div>
            <span>{onlineAgents.length}/{snapshot.agents.length}</span>
          </div>
          <div className="agent-list">
            {snapshot.agents.map((agent) => {
              const isSelected = agent.id === selectedAgent.id

              return (
                <button
                  className={`agent-card${isSelected ? ' agent-card--selected' : ''}`}
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  type="button"
                >
                  <span className={`agent-avatar agent-avatar--${statusTone[agent.status]}`}>
                    {getAgentMarker(agent)}
                  </span>
                  <div className="agent-card__body">
                    <h3>{agent.name.replace(/\s*\p{Extended_Pictographic}/gu, '')}</h3>
                    <p>{agent.role}</p>
                  </div>
                  <span className={`status status--${agent.status}`}>
                    {statusLabel[agent.status]}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="panel center-stage" aria-label="Центральна панель">
          <div className="stage-header">
            <div>
              <p className="eyebrow">2D Hologram</p>
              <h2>Agent Orbit</h2>
            </div>
            <div className="stage-stats" aria-label="Active task metrics">
              <span>{activeTasks.length} active</span>
              <span>{snapshot.activity.length} events</span>
            </div>
          </div>

          <div className="hologram" aria-label="Agent node map">
            <div className="hologram__ring hologram__ring--outer" />
            <div className="hologram__ring hologram__ring--inner" />
            <div className="room-grid" aria-hidden="true" />
            <div className="hologram__core">
              <span>{selectedAgent.name}</span>
              <strong>{statusLabel[selectedAgent.status]}</strong>
              <p>{selectedTask?.title ?? 'Немає активної задачі'}</p>
            </div>
            {snapshot.agents.map((agent, index) => (
              <button
                aria-label={`Select ${agent.name}`}
                className={`agent-node agent-node--${index + 1}${
                  agent.id === selectedAgent.id ? ' agent-node--selected' : ''
                }`}
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                type="button"
              >
                <span>{getAgentMarker(agent)}</span>
                <small className={`node-signal node-signal--${statusTone[agent.status]}`} />
              </button>
            ))}
          </div>

          <div className="task-strip">
            {snapshot.tasks.slice(0, 4).map((task) => {
              const agent = snapshot.agents.find((item) => item.id === task.ownerAgentId)

              return (
                <article className="task-chip" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{agent?.name ?? 'System'}</span>
                  </div>
                  <div className="task-chip__meta">
                    <span>{taskLabel[task.status]}</span>
                    <span>{priorityLabel[task.priority]}</span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="panel inspector" aria-label="Інспектор">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inspector</p>
              <h2>Selected Agent</h2>
            </div>
            <span className={`status status--${selectedAgent.status}`}>
              {statusLabel[selectedAgent.status]}
            </span>
          </div>
          <div className="inspector-hero">
            <span className={`agent-avatar agent-avatar--${statusTone[selectedAgent.status]}`}>
              {getAgentMarker(selectedAgent)}
            </span>
            <div>
              <h3>{selectedAgent.name.replace(/\s*\p{Extended_Pictographic}/gu, '')}</h3>
              <p>{selectedAgent.role}</p>
            </div>
          </div>
          <dl>
            <div>
              <dt>Поточна задача</dt>
              <dd>{selectedTask?.title ?? 'Немає активної задачі'}</dd>
            </div>
            <div>
              <dt>Task state</dt>
              <dd>{selectedTask ? taskLabel[selectedTask.status] : 'Standby'}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{selectedTask ? priorityLabel[selectedTask.priority] : 'None'}</dd>
            </div>
            <div>
              <dt>Owned tasks</dt>
              <dd>{selectedAgentTasks.length}</dd>
            </div>
          </dl>
          <div className="inspector-summary">
            {selectedAgentTasks.length > 0 ? (
              selectedAgentTasks.map((task) => (
                <article key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{taskLabel[task.status]}</span>
                </article>
              ))
            ) : (
              <article>
                <strong>Backlog empty</strong>
                <span>Ready for delegation</span>
              </article>
            )}
          </div>
        </aside>

        <section className="panel timeline" aria-label="Таймлайн активності">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Таймлайн</h2>
            </div>
            <span>{snapshot.activity.length} updates</span>
          </div>
          <ol>
            {snapshot.activity.map((event) => {
              const agent = snapshot.agents.find((item) => item.id === event.agentId)

              return (
                <li key={event.id}>
                  <time>{event.timestamp}</time>
                  <span className="timeline__type">{event.type}</span>
                  <div>
                    <strong>{agent?.name ?? 'Система'}</strong>
                    <p>{event.summary}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      </section>
    </main>
  )
}
