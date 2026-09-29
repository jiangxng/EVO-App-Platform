# LLM-Native Realtime Transport Adoption v0.1

Status: Production-adopted baseline  
Owner: EVO App Platform / Host  
Upstream authority: Eidos `docs/architecture/LLM-NATIVE-REALTIME-TRANSPORT-v0.1.md`

## 1. Purpose

This document records the production adoption of the Eidos LLM-native realtime transport model by EVO App Platform.

The goal is not merely to reduce visible flicker. The Host must provide a communication substrate in which:

- idle pages do not generate application action traffic;
- server-side changes are signaled by events rather than guessed by polling;
- unchanged state is not retransmitted as full snapshots;
- mounted surfaces retain local UI state;
- Agent continuation does not require one browser round trip per durable slice;
- mobile/background clients do not waste data or battery;
- transport behavior is measurable and regression-testable.

## 2. Adopted transport lanes

### Command lane

`POST /v1/actions` is reserved for explicit Human/Agent intent.

It MUST NOT be used as a fixed polling mechanism.

### Query lane

Host topology/configuration reads use HTTP validators where supported:

- ETag;
- If-None-Match;
- 304 Not Modified;
- client-side cached representation reuse.

### Event lane

`GET /v1/events` is the Host SSE event stream.

It provides:

- Principal/Context-scoped event visibility;
- Last-Event-ID reconnect;
- replay from a bounded Host event ring;
- RESET_REQUIRED when replay continuity is unavailable;
- visibility-aware client suspension/reconnect;
- heartbeat frames for connection liveness.

### Runtime revision bridge

EVO Runtime does not need to push directly into the browser.

The Host maintains one shared conditional runtime-revision read per active EVO enterprise interest, then publishes a Host resource invalidation event when the runtime revision changes.

Unchanged runtime state should be represented by HTTP 304 rather than repeated runtime snapshots.

### Agent continuation

Ordinary durable multi-slice Agent continuation is drained inside the Host action boundary.

Each slice remains durably persisted, but the browser does not need to issue one `resume` command per normal slice.

The drain is bounded by advance count and elapsed time. A genuinely long/non-terminal run remains recoverable through the existing durable-run boundary.

## 3. Rendering/reconciliation contract

Communication and rendering are separate concerns.

For Diagram, Spatial Observatory and Chat:

- successful locally-applied actions use `preserveMountedPage`;
- Workbench must not convert such results into shell-wide remounts;
- realtime resource invalidations are coalesced;
- mounted pages refresh only if they declare the affected resourceId;
- SPATIAL_3D retains scene DOM and updates geometry;
- Chat retains historical message DOM and patches stable message identities;
- visual work is requestAnimationFrame-coalesced where appropriate.

A normal realtime update MUST NOT replace `data-eidos-side-panel-content` or `data-eidos-workspace-content`.

## 4. Background/mobile behavior

The browser realtime source pauses while the document is hidden and reconnects using its event cursor when visible again.

This is a product requirement, not an optional optimization.

Fallback fixed-interval sub-second polling is not permitted for idle enterprise state.

## 5. Traffic diagnostics

`GET /v1/realtime/diagnostics` exposes transport evidence including:

- requests by route;
- `/v1/actions` count;
- conditional-request count;
- 304 count;
- JSON response bytes;
- SSE open/closed/active connections;
- SSE event count/bytes;
- SSE heartbeat count/bytes;
- event bus subscriber/buffer state;
- EVO runtime revision bridge checks, 304s, changes and errors.

These counters exist to make communication performance objectively testable.

## 6. Production live proof — 2026-09-29

Production deployment:

- repository: `jiangxng/EVO-App-Platform`
- commit: `f154450b4cefd1c763573f9584f257083fcd2202`
- Railway deployment: `554c9f93-caab-40c9-a147-f63bf8b8f666`
- status: `SUCCESS`

A read-only validator opened one SSE connection and remained idle for 32 seconds.

Observed delta:

```json
{
  "actionRequests": 0,
  "totalRequests": 2,
  "eventsRoute": 1,
  "diagnosticsRoute": 1,
  "sseEvents": 0,
  "sseEventBytes": 0,
  "sseHeartbeats": 2,
  "sseHeartbeatBytes": 26,
  "bridgeChecks": 3,
  "bridgeNotModified": 2,
  "bridgeChanged": 0,
  "bridgeErrors": 0,
  "sseClientBytes": 26
}
```

The two counted HTTP requests are the SSE connection and the final diagnostics read. No application action was emitted during the idle window.

This proves the idle transport path is event-waiting rather than action-polling.

## 7. Product-level transport SLOs

The following are acceptance requirements:

1. **Idle action SLO**  
   After initial load, an unchanged idle surface produces zero repeated `POST /v1/actions`.

2. **Event efficiency SLO**  
   With no state change, SSE carries only bounded liveness traffic.

3. **Conditional runtime SLO**  
   Unchanged EVO runtime revision checks predominantly resolve as 304 after the initial validator is established.

4. **One-change/one-logical-refresh SLO**  
   One logical resource invalidation must not cascade into repeated shell remount/read loops.

5. **Agent round-trip SLO**  
   Ordinary multi-slice Agent turns complete without client-driven resume round trips. Durable resume remains a recovery/long-run boundary.

6. **Background SLO**  
   Hidden browser surfaces do not continue ordinary application polling or visual frame work.

7. **Mounted-state SLO**  
   Ordinary realtime changes preserve local selection, scroll, camera, composer and historical message DOM unless the underlying route contract itself changes.

## 8. Fail-closed recovery

If an SSE cursor falls outside the replay window, the client receives RESET_REQUIRED and performs canonical recovery.

If a durable Agent run exceeds Host drain budgets, it remains PAUSED and recoverable; the Host does not pretend it completed.

If runtime revision checks fail, no fabricated resource-change event is emitted.

## 9. Non-goals for v0.1

The baseline deliberately does not require:

- WebSocket for ordinary enterprise state;
- collaborative cursor/presence;
- direct EVO-to-browser sockets;
- speculative multi-region event infrastructure.

Those may be added only when an accepted vertical slice requires them.

## 10. Governing rule

```text
explicit intent
  -> command

canonical read/recovery
  -> versioned query

server-side change
  -> event

event
  -> resource reconciliation

resource reconciliation
  -> minimal mounted-state patch
```

Never use:

```text
action success
  -> shell refresh
  -> remount
  -> automatic read
  -> action success
  -> ...
```

as a synchronization protocol.
