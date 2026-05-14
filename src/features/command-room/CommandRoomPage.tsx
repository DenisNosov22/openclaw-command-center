import { useEffect, useMemo, useState } from 'react'
import {
  createCommandCenterAdapterDiagnostics,
  createCommandCenterSnapshotState,
  createLoadingCommandCenterSnapshotState,
  getCommandCenterAdapterSelection,
} from '../../adapters'
import type { ActivityEvent, Agent, Task, WorkflowNode } from '../../shared/types'
import { formatKyivTime } from '../../shared/time/kyivTime'
import { IsometricOfficeScene } from './IsometricOfficeScene'
import { createOfficeAgentStatusSimulationOverrides } from './OfficeAgentStatusAdapter'
import {
  useOfficeAgentStatus,
  type OfficeAgentStatusDataSourceState,
} from './OfficeAgentStatusDataSource'

type StageView = 'office' | 'graph'
type ActivityFilter = 'all' | 'selected' | 'critical' | 'system'
type LiveSnapshot = ReturnType<typeof createLoadingCommandCenterSnapshotState>['snapshot'] & {
  lastUpdated: Date
  stateKind: ReturnType<typeof createLoadingCommandCenterSnapshotState>['kind']
  stateTitle: string
  stateDetail: string
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

const activityCategoryLabel: Record<ActivityEvent['category'], string> = {
  system: 'System',
  task: 'Task',
  agent: 'Agent',
  blocker: 'Blocker',
  deploy: 'Deploy',
}

const activitySeverityLabel: Record<ActivityEvent['severity'], string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
  success: 'Success',
}

type OfficeSourceIndicator = {
  label: 'error' | 'fixture' | 'json' | 'loading' | 'stale'
  title: string
}

const heartbeatSummaries = [
  'Mock live heartbeat: активні агенти синхронізовані без real backend.',
  'Mock live heartbeat: task timeline оновлено read-only знімком.',
  'Mock live heartbeat: operator panel тримає Kyiv-time telemetry.',
]

const roleLabel: Record<string, string> = {
  'main/orchestrator': 'оркестрація',
  coding: 'розробка',
  ops: 'операції',
  research: 'дослідження',
  requirements: 'вимоги',
  QA: 'якість',
  video: 'відео',
  'UI/layout': 'інтерфейс',
  marketing: 'вітрина',
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

function isRiskTask(task?: Task) {
  return task?.status === 'blocked' || task?.status === 'failed'
}

function getRiskReason(agent: Agent, task?: Task) {
  return (
    agent.blockerReason ??
    task?.blockerReason ??
    task?.dependency ??
    'Потрібна увага оператора перед наступним кроком.'
  )
}

function getSuggestedAction(agent: Agent, task?: Task, hasRisk = false) {
  if (task?.nextStep) {
    return task.nextStep
  }

  if (hasRisk || agent.status === 'waiting') {
    return 'Очікує input'
  }

  if (agent.status === 'idle' || agent.status === 'done') {
    return 'Перевірити timeline'
  }

  return 'Відкрити Graph'
}

function getOfficeSourceIndicator(
  officeAgentStatus: OfficeAgentStatusDataSourceState,
): OfficeSourceIndicator {
  if (officeAgentStatus.kind === 'ready' && !officeAgentStatus.isFallback) {
    return {
      label: 'json',
      title: `Office status source: loaded JSON from ${officeAgentStatus.sourceUrl ?? 'agent-status.json'}`,
    }
  }

  if (officeAgentStatus.kind === 'fallback') {
    return {
      label: 'fixture',
      title: 'Office status source: deterministic fixture fallback',
    }
  }

  if (officeAgentStatus.kind === 'stale') {
    return {
      label: 'stale',
      title: `Office status source: stale or missing JSON, using fixture fallback${
        officeAgentStatus.error ? ` (${officeAgentStatus.error})` : ''
      }`,
    }
  }

  if (officeAgentStatus.kind === 'error') {
    return {
      label: 'error',
      title: `Office status source: JSON error, using fixture fallback${
        officeAgentStatus.error ? ` (${officeAgentStatus.error})` : ''
      }`,
    }
  }

  return {
    label: 'loading',
    title: `Office status source: loading ${officeAgentStatus.sourceUrl ?? 'agent-status.json'}`,
  }
}

function getInspectorEvents(events: ActivityEvent[], agentId: string) {
  const latestEvents = sortActivityByNewest(events)
  const relatedEvents = latestEvents.filter((event) => event.agentId === agentId)

  if (relatedEvents.length >= 2) {
    return relatedEvents.slice(0, 3)
  }

  const fallbackEvents = latestEvents.filter(
    (event) =>
      event.category === 'system' &&
      !relatedEvents.some((relatedEvent) => relatedEvent.id === event.id),
  )

  return [...relatedEvents, ...fallbackEvents].slice(0, 3)
}

function sortActivityByNewest(events: ActivityEvent[]) {
  return [...events].sort(
    (firstEvent, secondEvent) =>
      new Date(secondEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime(),
  )
}

function getFilteredActivity(
  events: ActivityEvent[],
  filter: ActivityFilter,
  selectedAgentId: string,
) {
  const sortedEvents = sortActivityByNewest(events)

  if (filter === 'selected') {
    return sortedEvents.filter((event) => event.agentId === selectedAgentId)
  }

  if (filter === 'critical') {
    return sortedEvents.filter(
      (event) => event.category === 'blocker' || event.severity === 'critical',
    )
  }

  if (filter === 'system') {
    return sortedEvents.filter(
      (event) => event.category === 'system' || event.category === 'deploy',
    )
  }

  return sortedEvents
}

const fallbackAgent: Agent = {
  id: 'agent-fallback',
  name: 'Read-only fallback',
  role: 'system',
  status: 'waiting',
  summary: 'Snapshot data unavailable; panel remains read-only.',
}

const adapterSelection = getCommandCenterAdapterSelection()
const adapterDiagnostics = createCommandCenterAdapterDiagnostics(adapterSelection)
const initialSnapshotState = createLoadingCommandCenterSnapshotState()

function getInitialLiveSnapshot(): LiveSnapshot {
  return {
    ...initialSnapshotState.snapshot,
    lastUpdated: new Date(initialSnapshotState.snapshot.generatedAt),
    stateKind: initialSnapshotState.kind,
    stateTitle: initialSnapshotState.title,
    stateDetail: initialSnapshotState.detail,
  }
}

function getLiveSnapshot(tick: number): LiveSnapshot {
  const snapshotState = createCommandCenterSnapshotState(() =>
    adapterSelection.adapter.getSnapshot(),
  )
  const baseSnapshot = snapshotState.snapshot
  const lastUpdated = new Date()
  const formattedLastUpdated = formatKyivTime(lastUpdated, { includeDate: true })
  const activeAgentIds = new Set(['agent-krab', 'agent-dev', 'agent-varta'])
  const heartbeatAgentId = ['agent-krab', 'agent-dev', 'agent-varta'][tick % 3]
  const heartbeatEvent: ActivityEvent = {
    id: 'mock-heartbeat-live',
    timestamp: lastUpdated.toISOString(),
    agentId: heartbeatAgentId,
    category: tick % 3 === 1 ? 'task' : 'system',
    severity: tick % 3 === 2 ? 'success' : 'info',
    summary: heartbeatSummaries[tick % heartbeatSummaries.length],
  }

  if (snapshotState.kind !== 'ready') {
    return {
      ...baseSnapshot,
      generatedAt: lastUpdated.toISOString(),
      lastUpdated,
      stateKind: snapshotState.kind,
      stateTitle: snapshotState.title,
      stateDetail: snapshotState.detail,
    }
  }

  return {
    ...baseSnapshot,
    generatedAt: lastUpdated.toISOString(),
    agents: baseSnapshot.agents.map((agent) =>
      activeAgentIds.has(agent.id)
        ? {
            ...agent,
            lastSeen: lastUpdated.toISOString(),
          }
        : agent,
    ),
    activity: sortActivityByNewest([
      heartbeatEvent,
      ...baseSnapshot.activity.map((event, index) =>
        index === 0
          ? {
              ...event,
              summary: `${event.summary} Оновлено mock live: ${formattedLastUpdated}.`,
            }
          : event,
      ),
    ]),
    lastUpdated,
    stateKind: snapshotState.kind,
    stateTitle: snapshotState.title,
    stateDetail: snapshotState.detail,
  }
}

export function CommandRoomPage() {
  const [liveTick, setLiveTick] = useState(-1)
  const snapshot = useMemo(
    () => (liveTick < 0 ? getInitialLiveSnapshot() : getLiveSnapshot(liveTick)),
    [liveTick],
  )
  const officeAgentStatus = useOfficeAgentStatus(snapshot.agents, {
    fallbackUpdatedAt: snapshot.generatedAt,
  })
  const snapshotAnchor = snapshot.generatedAt
  const [selectedAgentId, setSelectedAgentId] = useState(snapshot.agents[0]?.id)
  const [stageView, setStageView] = useState<StageView>('office')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')
  const selectedAgent =
    snapshot.agents.find((agent) => agent.id === selectedAgentId) ??
    snapshot.agents[0] ??
    fallbackAgent
  const selectedTask = snapshot.tasks.find((task) => task.id === selectedAgent.currentTaskId)
  const selectedAgentTasks = snapshot.tasks.filter(
    (task) => task.ownerAgentId === selectedAgent.id,
  )
  const selectedRiskTask =
    (isRiskTask(selectedTask) ? selectedTask : selectedAgentTasks.find(isRiskTask)) ?? undefined
  const hasSelectedRisk =
    selectedAgent.status === 'error' ||
    selectedAgent.status === 'blocked' ||
    Boolean(selectedRiskTask)
  const inspectorEvents = getInspectorEvents(snapshot.activity, selectedAgent.id)
  const suggestedAction = getSuggestedAction(selectedAgent, selectedTask, hasSelectedRisk)
  const activeTasks = snapshot.tasks.filter((task) =>
    ['in_progress', 'delegated', 'waiting', 'blocked', 'queued'].includes(task.status),
  )
  const onlineAgents = snapshot.agents.filter((agent) =>
    ['working', 'done'].includes(agent.status),
  )
  const blockedTasks = snapshot.tasks.filter((task) =>
    ['blocked', 'failed'].includes(task.status),
  )
  const filteredActivity = getFilteredActivity(
    snapshot.activity,
    activityFilter,
    selectedAgent.id,
  )
  const liveSimulation = useMemo(
    () =>
      createOfficeAgentStatusSimulationOverrides(
        snapshot.agents,
        officeAgentStatus.snapshots,
      ),
    [officeAgentStatus.snapshots, snapshot.agents],
  )
  const formattedLastUpdated = formatKyivTime(snapshot.lastUpdated, { includeDate: true })
  const officeSourceIndicator = getOfficeSourceIndicator(officeAgentStatus)
  const hasSnapshotWarning = snapshot.stateKind !== 'ready'
  let globalStatus = hasSnapshotWarning ? snapshot.stateTitle : 'Стабільно'
  let globalStatusDetail = hasSnapshotWarning
    ? snapshot.stateDetail
    : `${adapterSelection.label}, ${officeAgentStatus.isFallback ? officeAgentStatus.kind : 'status JSON'}, read-only. Оновлено: ${formattedLastUpdated}`

  useEffect(() => {
    const firstSnapshotId = window.setTimeout(() => {
      setLiveTick(0)
    }, 0)

    const intervalId = window.setInterval(() => {
      setLiveTick((currentTick) => currentTick + 1)
    }, 15_000)

    return () => {
      window.clearTimeout(firstSnapshotId)
      window.clearInterval(intervalId)
    }
  }, [])

  if (hasSnapshotWarning) {
    globalStatus = snapshot.stateTitle
    globalStatusDetail = snapshot.stateDetail
  } else if (snapshot.agents.some((agent) => agent.status === 'error')) {
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
          <div
            className={`telemetry-pill telemetry-pill--live${
              hasSnapshotWarning ? ' telemetry-pill--warning' : ''
            }`}
            aria-label={`Глобальний стан: ${globalStatus}. ${globalStatusDetail}`}
            role="status"
            title={globalStatusDetail}
          >
            <span aria-hidden="true" />
            {globalStatus}
          </div>
          <div
            className={`adapter-diagnostics${
              adapterDiagnostics.warningLabel ? ' adapter-diagnostics--warning' : ''
            }`}
            aria-label={`Adapter diagnostics: ${adapterDiagnostics.activeLabel}${
              adapterDiagnostics.requestedModeLabel
                ? `. ${adapterDiagnostics.requestedModeLabel}`
                : ''
            }${
              adapterDiagnostics.warningLabel
                ? `. Warning: ${adapterDiagnostics.warningLabel}`
                : ''
            }`}
            role="status"
            title={adapterDiagnostics.warningLabel ?? adapterDiagnostics.activeLabel}
          >
            <span className="adapter-diagnostics__label">
              {adapterDiagnostics.activeLabel}
            </span>
            {adapterDiagnostics.requestedModeLabel ? (
              <span className="adapter-diagnostics__mode">
                {adapterDiagnostics.requestedModeLabel}
              </span>
            ) : null}
            {adapterDiagnostics.warningLabel ? (
              <span className="adapter-diagnostics__warning">
                {adapterDiagnostics.warningLabel}
              </span>
            ) : null}
          </div>
          <div
            aria-label={`Read-only mode: ${adapterDiagnostics.readOnlyLabel}`}
            className="telemetry-pill telemetry-pill--readonly"
          >
            {adapterDiagnostics.readOnlyLabel}
          </div>
          <div className="telemetry-readout">
            <span>Оновлено</span>
            <strong>{formattedLastUpdated}</strong>
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
            {snapshot.agents.length > 0 ? (
              snapshot.agents.map((agent) => {
                const isSelected = agent.id === selectedAgent.id

                return (
                  <button
                    aria-label={`Обрати агента ${agent.name}: ${statusLabel[agent.status]}`}
                    aria-pressed={isSelected}
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
              })
            ) : (
              <div className="empty-state empty-state--compact">
                <strong>Roster порожній</strong>
                <p>Snapshot has no agents.</p>
              </div>
            )}
          </div>
        </aside>

        <section
          className={`panel center-stage${stageView === 'office' ? ' center-stage--office' : ''}`}
          aria-label="Центральна панель"
        >
          <div className="stage-header">
            <div>
              <p className="eyebrow">
                {stageView === 'office' ? 'Office Floor' : 'Workflow Graph'}
              </p>
              <h2>
                {stageView === 'office' ? 'Офіс агентів' : 'Маршрут задач'}
              </h2>
            </div>
            <div className="stage-actions">
              <div className="stage-toggle" aria-label="Режим центральної панелі" role="group">
                <button
                  aria-label="Показати office floor"
                  aria-pressed={stageView === 'office'}
                  onClick={() => setStageView('office')}
                  type="button"
                >
                  Office
                </button>
                <button
                  aria-label="Показати workflow graph"
                  aria-pressed={stageView === 'graph'}
                  onClick={() => setStageView('graph')}
                  type="button"
                >
                  Graph
                </button>
              </div>
              {stageView === 'office' ? (
                <span
                  aria-label={`Office status source: ${officeSourceIndicator.label}`}
                  className={`office-source-chip office-source-chip--${officeSourceIndicator.label}`}
                  data-office-status-source={officeSourceIndicator.label}
                  role="status"
                  title={officeSourceIndicator.title}
                >
                  <span>src</span>
                  <strong>{officeSourceIndicator.label}</strong>
                </span>
              ) : null}
              <div className="stage-stats" aria-label="Метрики активних задач">
                <span>{activeTasks.length} активних</span>
                <span>{blockedTasks.length} ризики</span>
                <span>{snapshot.activity.length} події</span>
                <span>Оновлено {formatKyivTime(snapshot.lastUpdated)}</span>
              </div>
            </div>
          </div>

          {stageView === 'office' ? (
            <IsometricOfficeScene
              activity={snapshot.activity}
              agents={snapshot.agents}
              liveSimulation={liveSimulation}
              onSelectAgent={setSelectedAgentId}
              selectedAgentId={selectedAgent.id}
              tasks={snapshot.tasks}
              workflow={snapshot.workflow}
            />
          ) : null}

          {stageView === 'graph' ? (
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
                    aria-pressed={isSelected}
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
              {snapshot.workflow.nodes.length === 0 ? (
                <div className="snapshot-state snapshot-state--center">
                  <strong>Workflow порожній</strong>
                  <p>Snapshot has no workflow nodes.</p>
                  <span>Read-only</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="stage-legend" aria-label="Пояснення станів">
            <span><i className="legend-dot legend-dot--online" />В роботі / готово</span>
            <span><i className="legend-dot legend-dot--caution" />Очікує</span>
            <span><i className="legend-dot legend-dot--danger" />Блокер / помилка</span>
          </div>

          <div className="task-strip">
            {snapshot.tasks.length > 0 ? (
              snapshot.tasks.slice(0, 4).map((task) => {
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
              })
            ) : (
              <article className="task-chip task-chip--empty">
                <div>
                  <strong>Tasks порожні</strong>
                  <span>No read-only tasks in snapshot.</span>
                </div>
                <div className="task-chip__meta">
                  <span>Read-only</span>
                  <span>Empty</span>
                </div>
              </article>
            )}
          </div>
        </section>

        <aside className="panel inspector" aria-label="Інспектор">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Інспектор</p>
              <h2>Operator card</h2>
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
          <p className="inspector-brief">
            {selectedAgent.summary ?? 'Read-only agent snapshot без live керування.'}
          </p>
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
            <div>
              <dt>Останній сигнал</dt>
              <dd>
                {formatKyivTime(selectedAgent.lastSeen ?? snapshot.generatedAt, {
                  fallbackDate: snapshotAnchor,
                })}
              </dd>
            </div>
          </dl>
          {hasSelectedRisk ? (
            <section className="inspector-risk" aria-label="Risk or blocker">
              <span>Risk / blocker</span>
              <strong>{selectedRiskTask?.title ?? statusLabel[selectedAgent.status]}</strong>
              <p>{getRiskReason(selectedAgent, selectedRiskTask)}</p>
            </section>
          ) : null}
          <section className="inspector-block" aria-label="Related tasks">
            <div className="inspector-block__heading">
              <h3>Related tasks</h3>
              <span>{selectedAgentTasks.length}</span>
            </div>
            <div className="inspector-summary">
              {selectedAgentTasks.length > 0 ? (
                selectedAgentTasks.map((task) => (
                  <article key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      {task.dependency ? <small>Dependency: {task.dependency}</small> : null}
                    </div>
                    <span className={`task-state task-state--${task.status}`}>
                      {taskLabel[task.status]}
                    </span>
                  </article>
                ))
              ) : (
                <article>
                  <div>
                    <strong>Backlog порожній</strong>
                    <small>Немає активних залежностей</small>
                  </div>
                  <span className="task-state task-state--completed">Резерв</span>
                </article>
              )}
            </div>
          </section>
          <section className="inspector-block" aria-label="Agent activity">
            <div className="inspector-block__heading">
              <h3>Activity</h3>
              <span>{inspectorEvents.length}</span>
            </div>
            <ol className="inspector-events">
              {inspectorEvents.length > 0 ? (
                inspectorEvents.map((event) => (
                  <li key={event.id}>
                    <time>
                      {formatKyivTime(event.timestamp, {
                        fallbackDate: snapshotAnchor,
                      })}
                    </time>
                    <p>{event.summary}</p>
                  </li>
                ))
              ) : (
                <li>
                  <time>Read-only</time>
                  <p>No events for this snapshot.</p>
                </li>
              )}
            </ol>
          </section>
          <section className="inspector-next" aria-label="Next suggested read-only action">
            <span>Next read-only action</span>
            <strong>{suggestedAction}</strong>
          </section>
        </aside>

        <section className="panel timeline" aria-label="Таймлайн активності">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Активність</p>
              <h2>Таймлайн</h2>
            </div>
            <span>{filteredActivity.length}/{snapshot.activity.length} події</span>
          </div>
          <div className="timeline-filters" aria-label="Read-only timeline filters" role="group">
            <button
              aria-label="Показати всі події timeline"
              aria-pressed={activityFilter === 'all'}
              onClick={() => setActivityFilter('all')}
              type="button"
            >
              All
            </button>
            <button
              aria-label={`Показати події вибраного агента ${selectedAgent.name}`}
              aria-pressed={activityFilter === 'selected'}
              onClick={() => setActivityFilter('selected')}
              type="button"
            >
              {selectedAgent.name.replace(/\s*\p{Extended_Pictographic}/gu, '')}
            </button>
            <button
              aria-label="Показати blockers та critical події"
              aria-pressed={activityFilter === 'critical'}
              onClick={() => setActivityFilter('critical')}
              type="button"
            >
              Blockers / critical
            </button>
            <button
              aria-label="Показати system та deploy події"
              aria-pressed={activityFilter === 'system'}
              onClick={() => setActivityFilter('system')}
              type="button"
            >
              System / deploy
            </button>
          </div>
          <ol>
            {filteredActivity.length > 0 ? (
              filteredActivity.map((event) => {
                const agent = snapshot.agents.find((item) => item.id === event.agentId)

                return (
                  <li
                    className={`timeline-event timeline-event--${event.category} timeline-event--${event.severity}${
                      event.id === 'mock-heartbeat-live' ? ' timeline-event--live' : ''
                    }`}
                    key={event.id}
                  >
                    <time dateTime={event.timestamp}>
                      {formatKyivTime(event.timestamp, {
                        fallbackDate: snapshotAnchor,
                      })}
                    </time>
                    <div className="timeline-event__tags">
                      <span className="timeline__type">
                        {activityCategoryLabel[event.category]}
                      </span>
                      <span className={`timeline__severity timeline__severity--${event.severity}`}>
                        {activitySeverityLabel[event.severity]}
                      </span>
                    </div>
                    <div>
                      <strong>{agent?.name ?? 'Система'}</strong>
                      <p>{event.summary}</p>
                    </div>
                  </li>
                )
              })
            ) : (
              <li className="timeline-event timeline-event--empty">
                <time>Read-only</time>
                <div className="timeline-event__tags">
                  <span className="timeline__type">Snapshot</span>
                  <span className="timeline__severity timeline__severity--warning">Empty</span>
                </div>
                <div>
                  <strong>Timeline порожній</strong>
                  <p>No events in this read-only snapshot.</p>
                </div>
              </li>
            )}
          </ol>
        </section>
      </section>
    </main>
  )
}
