import { useState } from 'react'
import { getCommandCenterSnapshot } from '../../adapters'
import type { Agent, Task, WorkflowNode } from '../../shared/types'

type StageView = 'room' | 'graph'

const roomAgentPositions: Record<string, { x: number; y: number }> = {
  'agent-krab': { x: 50, y: 12 },
  'agent-dev': { x: 78, y: 25 },
  'agent-bastion': { x: 89, y: 50 },
  'agent-shturman': { x: 74, y: 80 },
  'agent-spec': { x: 50, y: 88 },
  'agent-varta': { x: 24, y: 78 },
  'agent-rezhyser': { x: 10, y: 50 },
  'agent-verstalnyk': { x: 21, y: 25 },
  'agent-desk': { x: 93, y: 70 },
}

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
  blocked: 'danger',
  done: 'online',
  error: 'danger',
}

const priorityLabel: Record<Task['priority'], string> = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
}

const roleLabel: Record<string, string> = {
  'main/orchestrator': 'оркестрація',
  coding: 'розробка',
  ops: 'операції',
  research: 'дослідження',
  requirements: 'вимоги',
  QA: 'якість',
  video: 'відео',
  'UI/layout': 'інтерфейс',
  trading: 'трейдинг',
}

function getAgentMarker(agent: Agent) {
  return agent.name.match(/\p{Extended_Pictographic}/u)?.[0] ?? agent.name.slice(0, 1)
}

function getAgentRole(agent: Agent) {
  return roleLabel[agent.role] ?? agent.role
}

function getWorkflowAgent(node: WorkflowNode, agents: Agent[]) {
  return agents.find((agent) => agent.id === node.agentId)
}

function getRoomAgentPosition(agent: Agent, index: number) {
  const fallbackAngle = (index / 9) * Math.PI * 2 - Math.PI / 2

  return (
    roomAgentPositions[agent.id] ?? {
      x: 50 + Math.cos(fallbackAngle) * 39,
      y: 50 + Math.sin(fallbackAngle) * 39,
    }
  )
}

export function CommandRoomPage() {
  const snapshot = getCommandCenterSnapshot()
  const [selectedAgentId, setSelectedAgentId] = useState(snapshot.agents[0]?.id)
  const [stageView, setStageView] = useState<StageView>('room')
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
  const blockedTasks = snapshot.tasks.filter((task) =>
    ['blocked', 'failed'].includes(task.status),
  )
  let globalStatus = 'Стабільно'
  let globalStatusDetail = 'Read-only mock snapshot'

  if (snapshot.agents.some((agent) => agent.status === 'error')) {
    globalStatus = 'Потрібна увага'
    globalStatusDetail = 'Є mock-помилка агента'
  } else if (snapshot.agents.some((agent) => agent.status === 'blocked')) {
    globalStatus = 'Є блокери'
    globalStatusDetail = 'Частина задач очікує рішення'
  }

  return (
    <main className="command-room">
      <header className="command-bar" aria-label="Статус командної кімнати">
        <div className="command-bar__identity">
          <img
            alt="OpenClaw Command Center logo"
            className="command-mark"
            src={`${import.meta.env.BASE_URL}logo-command-center.png`}
          />
          <div>
            <p className="eyebrow">OpenClaw Command Center</p>
            <h1>Командна кімната</h1>
            <p className="command-subtitle">Read-only панель координації агентів</p>
          </div>
        </div>
        <div className="command-bar__telemetry" aria-label="Глобальний стан">
          <div className="telemetry-pill telemetry-pill--live" title={globalStatusDetail}>
            <span />
            {globalStatus}
          </div>
          <div className="telemetry-pill">Mock режим</div>
          <div className="telemetry-readout">
            <span>Знімок</span>
            <strong>{snapshot.generatedAt}</strong>
          </div>
        </div>
      </header>

      <section className="command-room__grid" aria-label="Command Room dashboard">
        <aside className="panel agent-roster" aria-label="Список агентів">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Команда</p>
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
                    <p>{getAgentRole(agent)}</p>
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
              <p className="eyebrow">{stageView === 'room' ? '2D Hologram' : 'Workflow Graph'}</p>
              <h2>{stageView === 'room' ? 'Орбіта агентів' : 'Маршрут задач'}</h2>
            </div>
            <div className="stage-actions">
              <div className="stage-toggle" aria-label="Режим центральної панелі">
                <button
                  aria-pressed={stageView === 'room'}
                  onClick={() => setStageView('room')}
                  type="button"
                >
                  Room
                </button>
                <button
                  aria-pressed={stageView === 'graph'}
                  onClick={() => setStageView('graph')}
                  type="button"
                >
                  Graph
                </button>
              </div>
              <div className="stage-stats" aria-label="Метрики активних задач">
                <span>{activeTasks.length} активних</span>
                <span>{blockedTasks.length} ризики</span>
                <span>{snapshot.activity.length} події</span>
              </div>
            </div>
          </div>

          {stageView === 'room' ? (
            <div className="hologram" aria-label="Карта вузлів агентів">
              <div className="hologram__ring hologram__ring--outer" />
              <div className="hologram__ring hologram__ring--inner" />
              <div className="hologram__axis hologram__axis--vertical" />
              <div className="hologram__axis hologram__axis--horizontal" />
              <div className="room-grid" aria-hidden="true" />
              <div className="hologram__beacon hologram__beacon--top">Control</div>
              <div className="hologram__beacon hologram__beacon--right">Ops</div>
              <div className="hologram__beacon hologram__beacon--bottom">QA</div>
              <div className="hologram__beacon hologram__beacon--left">Research</div>
              <div className="hologram__core">
                <span>{selectedAgent.name}</span>
                <strong>{statusLabel[selectedAgent.status]}</strong>
                <p>{selectedTask?.title ?? 'Немає активної задачі'}</p>
              </div>
              {snapshot.agents.map((agent, index) => {
                const position = getRoomAgentPosition(agent, index)

                return (
                  <button
                    aria-label={`Обрати ${agent.name}`}
                    className={`agent-node${
                      agent.id === selectedAgent.id ? ' agent-node--selected' : ''
                    }`}
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                    }}
                    type="button"
                  >
                    <span>{getAgentMarker(agent)}</span>
                    <small className={`node-signal node-signal--${statusTone[agent.status]}`} />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="workflow-graph" aria-label="Read-only workflow graph">
              <svg aria-hidden="true" className="workflow-graph__edges" viewBox="0 0 100 100">
                <defs>
                  <marker
                    id="workflow-arrow"
                    markerHeight="6"
                    markerWidth="6"
                    orient="auto"
                    refX="5"
                    refY="3"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" />
                  </marker>
                </defs>
                {snapshot.workflow.edges.map((edge) => {
                  const from = snapshot.workflow.nodes.find((node) => node.id === edge.from)
                  const to = snapshot.workflow.nodes.find((node) => node.id === edge.to)

                  if (!from || !to) {
                    return null
                  }

                  return (
                    <g key={edge.id}>
                      <line
                        className="workflow-graph__edge"
                        markerEnd="url(#workflow-arrow)"
                        x1={from.x}
                        x2={to.x}
                        y1={from.y}
                        y2={to.y}
                      />
                      <text
                        className="workflow-graph__edge-label"
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 2}
                      >
                        {edge.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
              {snapshot.workflow.nodes.map((node) => {
                const agent = getWorkflowAgent(node, snapshot.agents)
                const tone = agent ? statusTone[agent.status] : 'standby'
                const isSelected = agent?.id === selectedAgent.id

                return (
                  <button
                    aria-label={`Обрати workflow вузол ${node.label}`}
                    className={`workflow-node workflow-node--${tone}${
                      isSelected ? ' workflow-node--selected' : ''
                    }`}
                    key={node.id}
                    onClick={() => {
                      if (agent) {
                        setSelectedAgentId(agent.id)
                      }
                    }}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                    }}
                    type="button"
                  >
                    <span>{agent ? getAgentMarker(agent) : node.label.slice(0, 1)}</span>
                    <strong>{node.label}</strong>
                    <small>{node.lane}</small>
                  </button>
                )
              })}
            </div>
          )}

          <div className="stage-legend" aria-label="Пояснення станів">
            <span><i className="legend-dot legend-dot--online" />В роботі / готово</span>
            <span><i className="legend-dot legend-dot--caution" />Очікує</span>
            <span><i className="legend-dot legend-dot--danger" />Блокер / помилка</span>
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
              <p className="eyebrow">Інспектор</p>
              <h2>Обраний агент</h2>
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
              <p>{getAgentRole(selectedAgent)}</p>
            </div>
          </div>
          <dl>
            <div>
              <dt>Поточна задача</dt>
              <dd>{selectedTask?.title ?? 'Немає активної задачі'}</dd>
            </div>
            <div>
              <dt>Стан задачі</dt>
              <dd>{selectedTask ? taskLabel[selectedTask.status] : 'Резерв'}</dd>
            </div>
            <div>
              <dt>Пріоритет</dt>
              <dd>{selectedTask ? priorityLabel[selectedTask.priority] : 'Немає'}</dd>
            </div>
            <div>
              <dt>Задач у роботі</dt>
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
                <strong>Backlog порожній</strong>
                <span>Готовий до делегування</span>
              </article>
            )}
          </div>
        </aside>

        <section className="panel timeline" aria-label="Таймлайн активності">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Активність</p>
              <h2>Таймлайн</h2>
            </div>
            <span>{snapshot.activity.length} оновлення</span>
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
