# Final Office Blueprint

## Target

Orbit Office is the default center-stage scene. It should read as a compact living office where
each agent is an original 2D office character working inside a shared command workspace, not as an
abstract graph node and not as a copied game sprite.

## Zones

- Desk/PC zone: active workstations, monitors, chairs, status lamps, and typing/monitoring ticks.
- Rest zone: sofa/rest bay for completed or idle recovery states.
- Command core: central coordination table that mirrors selected-agent context.
- Paths/routes: calm walking paths and workflow packets that connect agents to the core.
- Hologram/status zone: subtle read-only system context without becoming a control surface.

## Agent Actions

- `working`: terminal/tool posture, active desk pulse, typing terminal ticks.
- `walking`: faster leg cadence, subdued terminal, path movement language.
- `resting`: sofa/rest prop, relaxed pose, calmer desk tone.
- `handoff`: signal dots plus shifted tool, delegated-work route tone.
- `alert`: restrained beacon, danger lamp, blocked/failed route tone.
- `monitoring`: sweep signal, monitoring terminal ticks, waiting/external-progress posture.

## Animation Rules

- Motion must be deterministic from mock snapshot state: agent/task status maps to semantic
  actions first, then visual classes.
- Reduced-motion mode must disable sprite, route, and desk animation while preserving state.
- Animations stay slow, readable, and professional; no frantic arcade behavior.
- The scene remains read-only: no deploy hooks, no real runtime actions, no mutation controls.

## Visual Language

- Original retro/mini-game-inspired office characters are allowed.
- Do not copy Mario, Nintendo, or any recognizable game character proportions, colors, outfits,
  silhouettes, animation cadence, or named visual language.
- Keep the dashboard palette: graphite surfaces, warm gold, cyan signals, green/online, calm red
  for blockers.
- Use CSS/SVG-vector primitives and tokens; avoid raster sprite sheets, WebGL, Three.js, browser
  engines, or heavy visual dependencies unless explicitly approved later.

## Final Enough

The Office scene is final enough for this planned milestone when:

- Office is the default scene and Graph remains the read-only alternate.
- Every visible agent maps through typed station data -> office view model -> visual sprite tokens.
- The six canonical actions above are visually distinct at a glance.
- Zones and props make the space feel like an office, not only labels on a floor grid.
- Selection stays synchronized with the shared inspector and remains keyboard accessible.
- Source-level tests protect the blueprint, action definitions, token map, and default scene.
- Local verification passes with `npm ci`, smoke, tests, build, lint, and `git diff --check`.

## Phase Progress

- Step 45: richer CSS/SVG-free office props are now represented by maintained tokens: PC monitor
  stand, keyboard/tool tray, lounge sofa, command-core status surface, floor walking lanes, and
  handoff/data-transfer hub. The scene remains read-only and mock-first.
- Step 46: deterministic agent choreography is now represented in the office view model. Each
  visible agent carries an action phase, route-involvement flag, intensity, tempo, and stable
  animation timing derived from station index/action/status; CSS consumes those tokens for
  type/monitor, path/step, sofa idle, signal transfer, scan/check, and resolve-pulse loops.
