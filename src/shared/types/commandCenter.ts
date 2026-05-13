export type AgentStatus = 'idle' | 'working' | 'waiting' | 'blocked' | 'done' | 'error'

export type TaskStatus =
  | 'queued'
  | 'in_progress'
  | 'delegated'
  | 'waiting'
  | 'blocked'
  | 'completed'
  | 'failed'

export interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTaskId?: string
  summary?: string
  lastSeen?: string
  blockerReason?: string
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  ownerAgentId: string
  priority: 'low' | 'medium' | 'high'
  dependency?: string
  nextStep?: string
  blockerReason?: string
}

export interface ActivityEvent {
  id: string
  timestamp: string
  agentId: string
  summary: string
  type: 'status' | 'task' | 'system'
}

export interface WorkflowNode {
  id: string
  agentId: string
  label: string
  lane: string
  x: number
  y: number
}

export interface WorkflowEdge {
  id: string
  from: string
  to: string
  label: string
}

export interface CommandCenterSnapshot {
  generatedAt: string
  agents: Agent[]
  tasks: Task[]
  activity: ActivityEvent[]
  workflow: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
}
