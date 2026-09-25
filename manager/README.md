# App Manager

App Manager is the backend lifecycle authority for Packages and Features.

It remains generic: it may understand manifests, dependencies, capabilities, compatibility, Contributions and lifecycle state, but not Finance, Trading, Manufacturing or other app-specific semantics.

## Current MVP — 2026-09-23

Implemented:

- deterministic in-memory Package Catalog;
- Package/Feature contracts;
- side-effect-free `planInstall`;
- dependency/capability resolution foundation;
- Package installation state;
- default Feature activation;
- effective capability calculation;
- effective Eidos Experience Contribution discovery;
- effective page-asset loading;
- minimal HTTP API;
- Company Notes reference package;
- CI build/test validation.

Current persistence is intentionally in-memory. Durable persistence is required before production use, but is not blocking the first Agent-driven installation proof.

## Boundary

App Manager owns lifecycle state.

It does not own:

- EVO business truth;
- Eidos rendering;
- Enterprise Agent reasoning;
- business-app domain state.


## Local MVP run

For the current browser proof:

```bash
npm install
npm run build
npm start
```

Default App Manager URL: `http://localhost:4100`.

The MVP server currently defaults `CORS_ORIGIN=*` only to make the local cross-repository Eidos proof frictionless. Production deployment must replace this with an explicit trusted origin/authentication policy.


## Plugin Runtime execution

Executable plugin invocation is centralized in `plugin-runtime-dispatcher.ts`.

The dispatcher enforces Package installation and Feature activation before routing to a PROCESS or REMOTE Runtime Host. Consumers must not instantiate runtime-specific hosts or bypass lifecycle admission.

There is intentionally no generic unauthenticated HTTP "execute arbitrary plugin method" endpoint. Product-facing actions must enter through governed public Action/Capability contracts and then use the dispatcher internally when executable plugin code is the admitted implementation.

## Runtime observability export

`plugin-runtime-observability.ts` keeps bounded in-memory diagnostics and supports pluggable sinks.

Set:

`APP_PLATFORM_RUNTIME_EVENTS_FILE=/path/runtime-events.jsonl`

to append structured runtime events as JSONL. Sink failure is non-fatal to plugin execution. OpenTelemetry-compatible export belongs behind the same sink boundary rather than changing Runtime Host semantics.
