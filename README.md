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

All UI data flows through the local adapter in `src/adapters/`.

## Local commands

```sh
npm install
npm run build
npm run lint
```
