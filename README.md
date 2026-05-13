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

## Local commands

```sh
npm install
npm run build
npm run lint
npm run test:redaction
npm run test:adapter-selection
```
