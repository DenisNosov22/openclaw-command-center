import type { CommandCenterSnapshot } from '../shared/types'

const snapshot: CommandCenterSnapshot = {
  generatedAt: '2026-05-13T12:30:00Z',
  agents: [
    {
      id: 'agent-krab',
      name: 'Краб 🦀',
      role: 'main/orchestrator',
      status: 'working',
      currentTaskId: 'task-command-center-step-3',
    },
    {
      id: 'agent-dev',
      name: 'Дев 🛠️',
      role: 'coding',
      status: 'working',
      currentTaskId: 'task-mock-identities',
    },
    {
      id: 'agent-bastion',
      name: 'Бастіон ⚙️',
      role: 'ops',
      status: 'waiting',
    },
    {
      id: 'agent-shturman',
      name: 'Штурман 🔎',
      role: 'research',
      status: 'idle',
    },
    {
      id: 'agent-spec',
      name: 'Спек 📐',
      role: 'requirements',
      status: 'done',
    },
    {
      id: 'agent-varta',
      name: 'Варта 🛡️',
      role: 'QA',
      status: 'blocked',
      currentTaskId: 'task-lint-build',
    },
    {
      id: 'agent-rezhyser',
      name: 'Режисер 🎬',
      role: 'video',
      status: 'idle',
    },
    {
      id: 'agent-verstalnyk',
      name: 'Верстальник 🎨',
      role: 'UI/layout',
      status: 'done',
    },
    {
      id: 'agent-desk',
      name: 'Деск 💹',
      role: 'trading',
      status: 'error',
    },
  ],
  tasks: [
    {
      id: 'task-command-center-step-3',
      title: 'Крок 3: foundation fix',
      status: 'in_progress',
      ownerAgentId: 'agent-krab',
      priority: 'high',
    },
    {
      id: 'task-mock-identities',
      title: 'Оновити agent identities',
      status: 'delegated',
      ownerAgentId: 'agent-dev',
      priority: 'high',
    },
    {
      id: 'task-lint-build',
      title: 'Перевірити lint і build',
      status: 'queued',
      ownerAgentId: 'agent-varta',
      priority: 'medium',
    },
    {
      id: 'task-ops-readiness',
      title: 'Ops readiness check',
      status: 'waiting',
      ownerAgentId: 'agent-bastion',
      priority: 'medium',
    },
    {
      id: 'task-research-notes',
      title: 'Research backlog notes',
      status: 'queued',
      ownerAgentId: 'agent-shturman',
      priority: 'medium',
    },
    {
      id: 'task-spec-mvp',
      title: 'MVP statuses погоджено',
      status: 'completed',
      ownerAgentId: 'agent-spec',
      priority: 'high',
    },
    {
      id: 'task-trading-feed',
      title: 'Trading feed disabled for MVP',
      status: 'failed',
      ownerAgentId: 'agent-desk',
      priority: 'low',
    },
    {
      id: 'task-video-later',
      title: 'Video workflows later',
      status: 'blocked',
      ownerAgentId: 'agent-rezhyser',
      priority: 'low',
    },
  ],
  activity: [
    {
      id: 'event-001',
      timestamp: '12:24 UTC',
      agentId: 'agent-krab',
      type: 'system',
      summary: 'MVP scope зафіксовано на read-only mock data.',
    },
    {
      id: 'event-002',
      timestamp: '12:28 UTC',
      agentId: 'agent-dev',
      type: 'task',
      summary: 'Локальний Vite React TypeScript workspace створено.',
    },
    {
      id: 'event-003',
      timestamp: '12:30 UTC',
      agentId: 'agent-varta',
      type: 'status',
      summary: 'Command Room layout підключено через adapter snapshot.',
    },
  ],
}

export function getCommandCenterSnapshot(): CommandCenterSnapshot {
  return snapshot
}
