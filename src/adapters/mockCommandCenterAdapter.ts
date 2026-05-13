import type { CommandCenterSnapshot } from '../shared/types'

const snapshot: CommandCenterSnapshot = {
  generatedAt: '2026-05-13T13:15:00Z',
  agents: [
    {
      id: 'agent-krab',
      name: 'Краб 🦀',
      role: 'main/orchestrator',
      status: 'working',
      currentTaskId: 'task-command-center-step-6',
    },
    {
      id: 'agent-dev',
      name: 'Дев 🛠️',
      role: 'coding',
      status: 'working',
      currentTaskId: 'task-visual-polish',
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
      id: 'task-command-center-step-6',
      title: 'Крок 6: visual QA',
      status: 'in_progress',
      ownerAgentId: 'agent-krab',
      priority: 'high',
    },
    {
      id: 'task-visual-polish',
      title: 'Polish першого екрану',
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
      timestamp: '13:04 UTC',
      agentId: 'agent-krab',
      type: 'system',
      summary: 'MVP scope зафіксовано на read-only mock data.',
    },
    {
      id: 'event-002',
      timestamp: '13:10 UTC',
      agentId: 'agent-dev',
      type: 'task',
      summary: 'Dashboard polish виконується без real OpenClaw data.',
    },
    {
      id: 'event-003',
      timestamp: '13:15 UTC',
      agentId: 'agent-varta',
      type: 'status',
      summary: 'QA gates: build, lint, diff check перед push.',
    },
  ],
}

export function getCommandCenterSnapshot(): CommandCenterSnapshot {
  return snapshot
}
