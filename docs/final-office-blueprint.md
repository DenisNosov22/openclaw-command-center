# Final Office Blueprint

## Target

Orbit Office is the default center-stage scene. It should read as a compact living office where
each agent is an original 2D office character working inside a shared command workspace, not as an
abstract graph node and not as a copied game sprite.

## Zones

- Desk/PC zone: active workstations, monitors, chairs, status lamps, and typing/monitoring ticks.
- Rest zone: sofa/rest bay for completed or idle recovery states.
- Command desk: small coordinator workstation for the main agent; no large central Orbit Core card.
- Paths/routes: calm walking paths and workflow packets that connect agent workstations.
- Screens/status zone: subtle read-only system context without becoming a control surface.
- Profession props: server rack, code terminal, research board, blueprint table, QA/security
  monitor, visual canvas, trading chart, and camera/shot-list station.

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
- Zones and props make the space feel like a 2D office, not labels or cards on a floor grid.
- Selection stays synchronized with the shared inspector and remains keyboard accessible.
- Source-level tests protect the blueprint, action definitions, token map, and default scene.
- Local verification passes with `npm ci`, smoke, tests, browser visual QA screenshots, build, lint,
  and `git diff --check`.

## Phase Progress

- Step 45: richer CSS/SVG-free office props are now represented by maintained tokens: PC monitor
  stand, keyboard/tool tray, lounge sofa, profession props, floor walking lanes, and
  handoff route hub. The scene remains read-only and mock-first.
- Step 46: deterministic agent choreography is now represented in the office view model. Each
  visible agent carries an action phase, route-involvement flag, intensity, tempo, and stable
  animation timing derived from station index/action/status; CSS consumes those tokens for
  type/monitor, path/step, sofa idle, signal transfer, scan/check, and resolve-pulse loops.
- Step 47: browser visual QA is available through `npm run qa:visual`. It builds the app, serves the
  built preview, verifies the default Office DOM surface in Chromium, and captures desktop plus
  narrow responsive screenshots into the gitignored `artifacts/visual-qa/` directory.
- Step 48: screenshot-driven Office polish gives desktop desks more label width and uses stable
  responsive layout slots so narrow side stations stay readable. Browser visual QA now includes a
  composition assertion that the removed Orbit Core/card block does not return.
- Step 51: the Office scene adds a lightweight live status board, per-station desk worklog props,
  and animated worker hands on the 2D sprites. This keeps the same CSS-only/read-only direction while
  making agents read more clearly as active office workers at their stations.
- Step 52: agents are no longer children of the workstation blocks. The live scene renders desks,
  monitors, chairs, and labels as the selectable station layer, then renders agent sprites on a
  separate physical office-floor layer with lane offsets and a walking route animation. Reduced
  motion disables the new route motion while preserving the readable office layout.
