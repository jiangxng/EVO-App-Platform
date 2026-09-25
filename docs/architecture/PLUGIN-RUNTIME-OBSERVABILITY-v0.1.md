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

Eidos Extension Manager renders the App Platform-provided runtime health and aggregate metrics.

Eidos owns presentation only. It does not infer health from browser state.

## P0 boundary

The current store is process-local and bounded.

P0 does not claim:

- durable historical telemetry;
- distributed tracing;
- cross-node aggregation;
- metrics retention/SLO management;
- OpenTelemetry export.

Those belong to the next observability layer.

## Next

The next compatible layer should add an observability sink interface so events/metrics can be exported to OpenTelemetry-compatible collectors or enterprise monitoring systems without changing Plugin Runtime semantics.
