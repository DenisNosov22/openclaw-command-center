# OpenClaw Command Center

Private web dashboard prototype for OpenClaw agents.

## MVP scope

- Read-only dashboard.
- Mock-only data source.
- No real OpenClaw runtime data yet.
- No credentials, tokens, or private API URLs.
- No GitHub remote configured at this stage.

## First screen

The initial screen is `Dashboard / Command Room`:

- agent roster
- center-stage Office scene with optional workflow Graph
- inspector panel
- activity timeline

All UI data flows through the adapter boundary in `src/adapters/`.

## Adapter boundary

- `src/adapters/commandCenterAdapter.ts` is the UI-facing contract.
- `src/adapters/createCommandCenterAdapter.ts` defines safe selection/fallback metadata.
- `src/adapters/getCommandCenterAdapter.ts` wires the selected runtime adapter for the UI.
- `src/adapters/mockCommandCenterAdapter.ts` is the active data source for the MVP.
- `src/adapters/openClawCommandCenterAdapter.ts` is a future real-adapter stub only; it does not call real APIs.

Adapter mode is selected with `VITE_COMMAND_CENTER_ADAPTER`:

- unset or `mock` renders the mock adapter.
- `openclaw` or `openclaw-disabled` shows `OpenClaw adapter disabled` and safely falls back to mock data.
- unknown values show a safe warning metadata state and fall back to mock data instead of crashing.

Do not place secrets in adapter mode values or client-side env vars.

Real adapter rules:

- Read-only snapshots only.
- Redact sensitive payloads before UI rendering.
- Do not add secrets, tokens, credentials, or private URLs to this repo.
- Keep user-facing time in Kyiv time through the UI formatting layer.
- Do not add control actions until the product scope explicitly allows them.

## Normalization/redaction boundary

Adapter snapshots pass through `normalizeCommandCenterSnapshot(...)` before UI rendering. The boundary keeps display data safe by redacting common tokens, credentials, private URLs, and emails; trimming long display strings; normalizing unknown statuses to read-only fallbacks; and coercing timestamps to ISO strings that the UI can format in Kyiv time.

Snapshot UI state is resolved through `createCommandCenterSnapshotState(...)`. Loading, empty, and
adapter-error paths render compact read-only fallback copy instead of assuming a happy-path roster,
task list, timeline, or workflow graph.

## Local commands

```sh
npm install
npm run build
npm run lint
npm run test:redaction
npm run test:adapter-selection
npm run test:adapter-diagnostics
npm run test:snapshot-state
npm run test:keyboard-accessibility
npm run test:responsive-accessibility
npm run test:content-density
npm run test:state-copy
npm run test:visual-polish
npm run test:composition-qa
npm run test:office-scene
npm run smoke:html
npm run qa:visual
```

## CI checks

Pull requests and pushes to `master` run the separate `Checks` workflow before any Pages deploy
workflow. It uses Node 24 with `npm ci`, `npm run smoke:html`, `npm run test:all`,
`npm run build`, and `npm run lint`.

## Visual smoke runbook

Local browser visual QA uses Playwright Chromium as a dev-only tool. It is not part of the GitHub
Pages deploy flow and should be run when changing the Office scene, stage layout, or responsive
composition.

The command room visual direction is CSS-only 2.5D: layered graphite panels, projected hologram
floor/rings, ambient scanlines, and gold/red/cyan/green glows around read-only command nodes. Keep
this pass dependency-light: no WebGL, no canvas requirement, and no heavy rendering packages.

Office Scene phase 1 adds a static CSS/SVG-free isometric orbital office skeleton inside the
central stage. It maps the existing mock agents into read-only desks with terminals, abstract agent
markers, status lamps, and a central command core. Future phases should add walking, typing, and
signal-transfer animations plus richer state mapping, while keeping the surface mock-first and
dependency-light.

Office Scene phase 2 adds the first lightweight CSS-only animation layer: deterministic station
activity classes, subtle typing/monitor pulses, two calm orbital walker markers, signal packets
between the core and stations, and reduced-motion fallbacks. The scene remains mock-first,
read-only, SVG-free, and dependency-light.

Office Scene phase 3 binds those animations to the existing mock dashboard snapshot more directly:
agent/task health drives lamp tone and pulse intensity, current task state drives typing vs
monitoring terminal ticks, and workflow edges plus timeline severity drive deterministic signal
route labels/classes. The scene is still mock/read-only only: no real runtime actions, no controls,
no deploy hooks, and no real data source.

Office Scene phase 4 makes the office a dashboard interaction surface: clicking an office station updates the shared selected agent inspector exactly like roster cards, room nodes, and workflow nodes. The selected desk gets a quiet visual/accessibility state, and related mock workflow packets can receive a subtle selected-route emphasis while remaining read-only.

Office Scene phase 5 is a professional polish/maturity pass: the room now reads more like a premium command office, with grounded workstations, clearer tiny office agent avatars, a stronger command-core table, quieter route support, glass/depth surfaces, and calmer status/activity motion. It remains CSS-only, mock-first, read-only, dependency-light, and aligned with the graphite/gold/cyan/green/calm-red dashboard language.

Office Scene phase 6 is the Step 42 foundation: Office is now the main/default scene and the old
Room view is no longer exposed as a separate center-stage mode. The office adds richer desk/PC,
rest/sofa, command-core, path, status-lamp, and subtle hologram zones, plus original lightweight
2D mini-game-style agent sprites for working, monitoring, walking, handoff, and signaling states.
Graph remains available as a read-only alternate workflow view. The slice stays CSS-only,
mock-first, read-only, dependency-light, and avoids Mario/Nintendo-specific IP or exact sprite
language.

Office Scene phase 7 polishes those sprites into clearer office actions: working agents lean into
terminal/tools, queued agents walk with faster legs, completed agents visibly rest against the sofa
prop, delegated work shows handoff signal dots, and blocked/failed work uses an alert beacon. The
surface remains mock-first, read-only, CSS-only, and dependency-light.

Office Scene phase 8 defines the durable final Office blueprint and sprite system foundation.
The target is a living, original 2D office where station data maps to an office view model and then
to maintained sprite/action tokens for working, walking, resting, handoff, alert, and monitoring.
The explicit rule is retro/mini-game inspiration only: no Mario, Nintendo, or recognizable game-IP
copying. See `docs/final-office-blueprint.md` for final-enough criteria, zones, animation rules,
visual constraints, and source-level guardrails.

Office Scene phase 9 makes the planned zones and props more visible on the live surface: desks now
carry clearer PC monitor stands and keyboard/tool trays, the lounge reads as a sofa bay, the command
core has a subtle status surface, walking routes are rendered as floor lanes, and the handoff area
has a small data-transfer hub. The slice remains CSS-only, read-only, mock-first, and dependency-light.

Office Scene phase 10 is a screenshot-driven responsive polish pass. Desktop stations have a little
more label room, narrow Office viewports use stable station layout slots to keep side desks off the
command core, and browser visual QA now fails if responsive stations overlap the core panel. The
slice stays dependency-light and uses the existing Playwright Chromium QA tool from phase 9.

Manual viewport widths:

- Desktop: `1366` and `1440`
- Tablet: `768`
- Mobile: `390`

Manual states:

- Default/mock: `VITE_COMMAND_CENTER_ADAPTER` unset or `mock`
- OpenClaw disabled: `VITE_COMMAND_CENTER_ADAPTER=openclaw-disabled`
- Unknown fallback: any unsupported value, for example `VITE_COMMAND_CENTER_ADAPTER=future-mode`

Acceptance criteria:

- Top bar: logo, title, live/global status, adapter diagnostics, read-only badge, and Kyiv-time
  update readout stay visible without overlap. Disabled and unknown states show the requested mode
  and warning in the diagnostics pill.
- Accessibility/readability: Office/Graph toggles, timeline filters, selectable agents, adapter
  diagnostics, and read-only status expose accessible labels/states and visible keyboard focus.
- Office/Graph: Office is the default center-stage view; the Office and Graph toggles remain
  reachable; office stations/workflow nodes stay inside the stage and do not cover labels or
  controls. On narrow mobile, Office stations must not overlap the command core panel.
- Inspector: selected agent, risk/next-action block, task chips, and recent activity stay readable
  and scroll/stack cleanly on tablet and mobile.
- Timeline: filters remain usable; newest events are readable; warning/critical styles remain
  distinct from normal and success events.
- Composition: the center-stage heading, Office/Graph controls, stats, Office, Graph, task strip, and
  timeline stay contained and wrap/stack cleanly between desktop, tablet, and narrow mobile widths.

Lightweight automated smoke:

```sh
npm run smoke:html
```

The script builds three adapter modes, starts `vite preview` on local ephemeral ports, checks HTTP
`200` for the HTML and linked assets, and verifies that the built bundle contains the expected
adapter diagnostics labels. It does not execute React in a browser and does not create screenshots,
so it complements but does not replace the manual viewport pass above.

Browser visual QA:

```sh
npx playwright install chromium
npm run qa:visual
```

The visual QA script builds the app, starts a local `vite preview`, opens the default Office scene in
Chromium, verifies that the Office/Graph toggles, Office scene, zones, stations, sprite props, and
behavior choreography classes are present, then captures screenshots into `artifacts/visual-qa/`:

- `office-desktop.png` at `1366x900`
- `office-responsive-390.png` at `390x900`

`artifacts/visual-qa/` is gitignored; keep screenshots local unless a review explicitly asks for a
specific image artifact.
