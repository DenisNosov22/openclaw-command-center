import type {
  ActivityEvent,
  Agent,
  AgentStatus,
  CommandCenterSnapshot,
  Task,
  TaskStatus,
} from '../shared/types'

const DEFAULT_TIMESTAMP = '1970-01-01T00:00:00.000Z'
const MAX_TEXT_LENGTH = 220

const agentStatuses = new Set<AgentStatus>([
  'idle',
  'working',
  'waiting',
  'blocked',
  'done',
  'error',
])

const taskStatuses = new Set<TaskStatus>([
  'queued',
  'in_progress',
  'delegated',
  'waiting',
  'blocked',
  'completed',
  'failed',
])

const priorities = new Set<Task['priority']>(['low', 'medium', 'high'])
const activityCategories = new Set<ActivityEvent['category']>([
  'system',
  'task',
  'agent',
  'blocker',
  'deploy',
])
const activitySeverities = new Set<ActivityEvent['severity']>([
  'info',
  'warning',
  'critical',
  'success',
])

function getSafeTimestamp(value: string | undefined, fallback = DEFAULT_TIMESTAMP) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toISOString()
}

function truncateText(value: string) {
  if (value.length <= MAX_TEXT_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_TEXT_LENGTH - 3).trimEnd()}...`
}

export function redactCommandCenterText(value: string) {
  return truncateText(
    value
      .replace(/https?:\/\/[^/\s:@]+:[^/\s@]+@[^/\s)]+(?:[^\s)]*)?/gi, '[redacted-url]')
      .replace(
        /https?:\/\/(?:localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|[^/\s)]+\.local)(?:[^\s)]*)?/gi,
        '[redacted-url]',
      )
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi, 'Bearer [redacted]')
      .replace(
        /\b(api[_-]?key|authorization|password|secret|token)(\s*[:=]\s*)(["']?)[^\s"',;)]+/gi,
        '$1$2$3[redacted]',
      )
      .replace(/\b(?:sk-[A-Za-z0-9_-]{10,}|gh[pousr]_[A-Za-z0-9_]{10,})\b/g, '[redacted-token]'),
  )
}

function normalizeOptionalText(value: string | undefined) {
  return value ? redactCommandCenterText(value) : undefined
}

function normalizeAgent(agent: Agent, fallbackTimestamp: string): Agent {
  return {
    ...agent,
    name: redactCommandCenterText(agent.name),
    role: redactCommandCenterText(agent.role),
    status: agentStatuses.has(agent.status) ? agent.status : 'waiting',
    summary: normalizeOptionalText(agent.summary),
    lastSeen: getSafeTimestamp(agent.lastSeen, fallbackTimestamp),
    blockerReason: normalizeOptionalText(agent.blockerReason),
  }
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    title: redactCommandCenterText(task.title),
    status: taskStatuses.has(task.status) ? task.status : 'queued',
    priority: priorities.has(task.priority) ? task.priority : 'medium',
    dependency: normalizeOptionalText(task.dependency),
    nextStep: normalizeOptionalText(task.nextStep),
    blockerReason: normalizeOptionalText(task.blockerReason),
  }
}

function normalizeActivityEvent(event: ActivityEvent, fallbackTimestamp: string): ActivityEvent {
  return {
    ...event,
    timestamp: getSafeTimestamp(event.timestamp, fallbackTimestamp),
    summary: redactCommandCenterText(event.summary),
    category: activityCategories.has(event.category) ? event.category : 'system',
    severity: activitySeverities.has(event.severity) ? event.severity : 'info',
  }
}

export function normalizeCommandCenterSnapshot(
  snapshot: CommandCenterSnapshot,
): CommandCenterSnapshot {
  const generatedAt = getSafeTimestamp(snapshot.generatedAt)

  return {
    generatedAt,
    agents: snapshot.agents.map((agent) => normalizeAgent(agent, generatedAt)),
    tasks: snapshot.tasks.map(normalizeTask),
    activity: snapshot.activity.map((event) => normalizeActivityEvent(event, generatedAt)),
    workflow: {
      nodes: snapshot.workflow.nodes.map((node) => ({
        ...node,
        label: redactCommandCenterText(node.label),
        lane: redactCommandCenterText(node.lane),
      })),
      edges: snapshot.workflow.edges.map((edge) => ({
        ...edge,
        label: redactCommandCenterText(edge.label),
      })),
    },
  }
}
