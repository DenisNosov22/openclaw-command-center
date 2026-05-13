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
- center stage hologram placeholder
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
npm run smoke:html
```

## Visual smoke runbook

This project intentionally avoids a real browser dependency in local smoke checks. Do not install
Playwright browsers, Puppeteer, or screenshot tooling just for the MVP visual smoke pass.

The command room visual direction is CSS-only 2.5D: layered graphite panels, projected hologram
floor/rings, ambient scanlines, and gold/red/cyan/green glows around read-only command nodes. Keep
this pass dependency-light: no WebGL, no canvas requirement, and no heavy rendering packages.

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
- Accessibility/readability: Room/Graph toggles, timeline filters, selectable agents, adapter
  diagnostics, and read-only status expose accessible labels/states and visible keyboard focus.
- Room/Graph: Room is the default center-stage view; the Room and Graph toggles remain reachable;
  agent nodes/workflow nodes stay inside the stage and do not cover labels or controls.
- Inspector: selected agent, risk/next-action block, task chips, and recent activity stay readable
  and scroll/stack cleanly on tablet and mobile.
- Timeline: filters remain usable; newest events are readable; warning/critical styles remain
  distinct from normal and success events.
- Composition: the center-stage heading, Room/Graph controls, stats, Room, Graph, task strip, and
  timeline stay contained and wrap/stack cleanly between desktop, tablet, and narrow mobile widths.

Lightweight automated smoke:

```sh
npm run smoke:html
```

The script builds three adapter modes, starts `vite preview` on local ephemeral ports, checks HTTP
`200` for the HTML and linked assets, and verifies that the built bundle contains the expected
adapter diagnostics labels. It does not execute React in a browser and does not create screenshots,
so it complements but does not replace the manual viewport pass above.
