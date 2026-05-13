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
    description: 'Agent leans into a terminal/tool posture while active task work is in progress.',
  },
  walking: {
    action: 'walking',
    pose: 'walking',
    prop: 'none',
    motion: 'walk',
    terminalMode: 'idle',
    description: 'Agent uses faster leg cadence while moving toward queued work.',
  },
  resting: {
    action: 'resting',
    pose: 'resting',
    prop: 'sofa',
    motion: 'rest',
    terminalMode: 'idle',
    description: 'Agent settles into a sofa/rest pose after completed work.',
  },
  handoff: {
    action: 'handoff',
    pose: 'handoff',
    prop: 'signal',
    motion: 'handoff',
    terminalMode: 'typing',
    description: 'Agent shows signal dots and a shifted tool while delegated work is handed off.',
  },
  alert: {
    action: 'alert',
    pose: 'alert',
    prop: 'signal',
    motion: 'alert',
    terminalMode: 'monitoring',
    description: 'Agent uses a restrained alert beacon for blocked or failed work.',
  },
  monitoring: {
    action: 'monitoring',
    pose: 'monitoring',
    prop: 'signal',
    motion: 'calm',
    terminalMode: 'monitoring',
    description: 'Agent watches a monitoring sweep while waiting on external progress.',
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
  chair: 'office-chair',
  avatar: 'office-agent-avatar',
  marker: 'office-agent-marker',
  sprite: 'office-agent-sprite',
  head: 'office-agent-sprite__head',
  body: 'office-agent-sprite__body',
  legs: 'office-agent-sprite__legs',
  restProp: 'office-agent-rest-prop',
  signalProp: 'office-agent-signal-prop',
  tool: 'office-agent-tool',
  statusLamp: 'office-status-lamp',
  label: 'office-desk__label',
} as const

export const OFFICE_ZONE_TOKENS = {
  desk: 'office-area--desk',
  sofa: 'office-area--sofa',
  hologram: 'office-area--hologram',
  core: 'command-core',
  route: 'office-transfer',
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
  isSelected: boolean,
) {
  return [
    OFFICE_SPRITE_TOKENS.station,
    OFFICE_SPRITE_TOKENS.workstation,
    `office-desk--${lane}`,
    `office-desk--${activity}`,
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
