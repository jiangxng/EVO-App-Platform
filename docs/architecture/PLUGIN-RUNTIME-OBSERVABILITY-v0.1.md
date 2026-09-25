# Plugin Runtime Observability v0.1

**Status:** P0 implemented baseline  
**Date:** 2026-09-25  
**Owner:** EVO App Platform

## Purpose

Plugin Runtime behavior must be inspectable without parsing console logs.

App Platform records structured runtime facts and exposes bounded diagnostics for operators, Eidos Extension Manager and future Agent tooling.

## Structured events

P0 records:

- PROCESS_STARTING;
- PROCESS_READY;
- PROCESS_STOPPED;
- PROCESS_EXITED;
- PROCESS_ERROR;
- PROCESS_FATAL;
- INVOCATION_STARTED;
- INVOCATION_SUCCEEDED;
- INVOCATION_FAILED;
- INVOCATION_TIMEOUT.

Each event contains:

- monotonically increasing process-local sequence;
- timestamp;
- packageId;
- optional invocationId/method/duration/error message.

The in-memory event window is bounded. P0 default server capacity is 500 events.

## Aggregate diagnostics

Per Package diagnostics include:

- health: healthy / degraded / stopped / unknown;
- process starts;
- invocation count;
- successes;
- failures;
- timeouts;
- crashes;
- restart count;
- last event timestamp;
- last error.

Restart count is derived from repeated runtime starts.

## API

Read-only P0 diagnostics endpoints:

```text
GET /v1/runtime/diagnostics
GET /v1/runtime/diagnostics?packageId=<id>
GET /v1/runtime/events
GET /v1/runtime/events?packageId=<id>
```

These are operational facts, not business data.

## UI

Eidos Extension Manager renders the App Platform-provided runtime health, aggregate metrics and a bounded recent operational history.

The Extension Manager receives only the most recent runtime events per Package for operator context. Full bounded process-local events remain available from the read-only diagnostics API, while durable history belongs to configured observability sinks.

Eidos owns presentation only. It does not infer health from browser state.

## P0 boundary

The default in-memory store is process-local and bounded.

P0 now also exposes a pluggable sink boundary. The first durable sink appends structured runtime facts as JSONL when `APP_PLATFORM_RUNTIME_EVENTS_FILE` is configured.

Sink failure is isolated from plugin execution: runtime behavior and admission MUST NOT fail merely because telemetry export is unavailable.

P0 does not claim:

- managed historical telemetry retention;
- distributed tracing;
- cross-node aggregation;
- metrics retention/SLO management;
- a built-in OpenTelemetry SDK/exporter.

The sink boundary is the extension point for OpenTelemetry-compatible export.

Those belong to the next observability layer.

## Next

The next compatible layer should add a dedicated OpenTelemetry adapter behind the existing sink interface, preserving Plugin Runtime semantics and avoiding a monitoring-vendor dependency in Core.
