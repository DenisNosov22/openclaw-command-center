import type {
  OfficeStationAction,
  OfficeStationActivity,
  OfficeStationPulse,
  OfficeStationTone,
  OfficeTerminalMode,
} from './IsometricOfficeSceneModel'

export type OfficeSpritePose =
  | 'alert'
  | 'handoff'
  | 'monitoring'
  | 'resting'
  | 'standby'
  | 'walking'
  | 'working'

export type OfficeSpriteProp = 'none' | 'sofa' | 'signal' | 'tool'
export type OfficeSpriteMotion = 'alert' | 'calm' | 'handoff' | 'rest' | 'walk' | 'work'
export type OfficeActivityState =
  | 'checking'
  | 'coding'
  | 'coordinating'
  | 'designing'
  | 'filming'
  | 'monitoring'
  | 'presenting'
  | 'researching'
  | 'reviewing'
  | 'trading'

export interface OfficeSpriteActionDefinition {
  action: OfficeStationAction
  pose: OfficeSpritePose
  prop: OfficeSpriteProp
  motion: OfficeSpriteMotion
  terminalMode: OfficeTerminalMode
  description: string
}

export const OFFICE_SPRITE_ACTIONS = {
  working: {
    action: 'working',
    pose: 'working',
    prop: 'tool',
    motion: 'work',
    terminalMode: 'typing',
    description: 'Agent loops through typing, tool use, and a short monitor glance while active work is in progress.',
  },
  walking: {
    action: 'walking',
    pose: 'walking',
    prop: 'none',
    motion: 'walk',
    terminalMode: 'idle',
    description: 'Agent follows a deterministic path/step cycle while moving toward queued work.',
  },
  resting: {
    action: 'resting',
    pose: 'resting',
    prop: 'sofa',
    motion: 'rest',
    terminalMode: 'idle',
    description: 'Agent settles into a sofa idle loop after completed work.',
  },
  handoff: {
    action: 'handoff',
    pose: 'handoff',
    prop: 'signal',
    motion: 'handoff',
    terminalMode: 'typing',
    description: 'Agent prepares a signal, transfers work, then returns to a receive-ready handoff pose.',
  },
  alert: {
    action: 'alert',
    pose: 'alert',
    prop: 'signal',
    motion: 'alert',
    terminalMode: 'monitoring',
    description: 'Agent uses a calm resolve pulse for blocked or failed work.',
  },
  monitoring: {
    action: 'monitoring',
    pose: 'monitoring',
    prop: 'signal',
    motion: 'calm',
    terminalMode: 'monitoring',
    description: 'Agent alternates scan and check poses while waiting on external progress.',
  },
} satisfies Record<string, OfficeSpriteActionDefinition>

export const OFFICE_SPRITE_ACTION_ALIASES: Partial<
  Record<OfficeStationAction, keyof typeof OFFICE_SPRITE_ACTIONS>
> = {
  blocked: 'alert',
  coordinating: 'working',
  signaling: 'handoff',
  standby: 'monitoring',
}

function isCanonicalOfficeSpriteAction(
  action: OfficeStationAction,
): action is keyof typeof OFFICE_SPRITE_ACTIONS {
  return action in OFFICE_SPRITE_ACTIONS
}

export const OFFICE_SPRITE_TOKENS = {
  station: 'office-desk',
  workstation: 'office-workstation',
  terminal: 'office-terminal',
  terminalTicks: 'office-terminal__ticks',
  professionProp: 'office-profession-prop',
  taskBubble: 'office-task-bubble',
  monitorStand: 'office-monitor-stand',
  keyboardTray: 'office-keyboard-tray',
  worklog: 'office-desk-worklog',
  activityChip: 'office-activity-chip',
  chair: 'office-chair',
  avatar: 'office-agent-avatar',
  marker: 'office-agent-marker',
  sprite: 'office-agent-sprite',
  head: 'office-agent-sprite__head',
  body: 'office-agent-sprite__body',
  hands: 'office-agent-sprite__hands',
  legs: 'office-agent-sprite__legs',
  restProp: 'office-agent-rest-prop',
  signalProp: 'office-agent-signal-prop',
  tool: 'office-agent-tool',
  statusLamp: 'office-status-lamp',
  label: 'office-desk__label',
} as const

export const OFFICE_ROUTE_TOKENS = {
  path: 'office-lane',
  handoff: 'office-handoff-hub',
} as const

export function getOfficeSpriteActionDefinition(
  action: OfficeStationAction,
): OfficeSpriteActionDefinition {
  if (isCanonicalOfficeSpriteAction(action)) {
    return OFFICE_SPRITE_ACTIONS[action]
  }

  const alias = OFFICE_SPRITE_ACTION_ALIASES[action]

  return OFFICE_SPRITE_ACTIONS[alias ?? 'monitoring']
}

export function getOfficeStationClassName(
  lane: string,
  activity: OfficeStationActivity,
  pulse: OfficeStationPulse,
  activityState: OfficeActivityState,
  isSelected: boolean,
) {
  return [
    OFFICE_SPRITE_TOKENS.station,
    OFFICE_SPRITE_TOKENS.workstation,
    `office-desk--${lane}`,
    `office-desk--${activity}`,
    `office-desk--state-${activityState}`,
    `office-desk--pulse-${pulse}`,
    isSelected ? 'office-desk--selected' : '',
  ].filter(Boolean).join(' ')
}

export function getOfficeTerminalClassName(mode: OfficeTerminalMode) {
  return `${OFFICE_SPRITE_TOKENS.terminal} office-terminal--${mode}`
}

export function getOfficeAgentMarkerClassName(action: OfficeStationAction) {
  const definition = getOfficeSpriteActionDefinition(action)

  return [
    OFFICE_SPRITE_TOKENS.marker,
    OFFICE_SPRITE_TOKENS.avatar,
    `office-agent-marker--${definition.pose}`,
  ].join(' ')
}

export function getOfficeStatusLampClassName(tone: OfficeStationTone) {
  return `${OFFICE_SPRITE_TOKENS.statusLamp} office-status-lamp--${tone}`
}
