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
- `src/adapters/mockCommandCenterAdapter.ts` is the active data source for the MVP.
- `src/adapters/openClawCommandCenterAdapter.ts` is a future real-adapter stub only; it does not call real APIs.

Real adapter rules:

- Read-only snapshots only.
- Redact sensitive payloads before UI rendering.
- Do not add secrets, tokens, credentials, or private URLs to this repo.
- Keep user-facing time in Kyiv time through the UI formatting layer.
- Do not add control actions until the product scope explicitly allows them.

## Local commands

```sh
npm install
npm run build
npm run lint
```
