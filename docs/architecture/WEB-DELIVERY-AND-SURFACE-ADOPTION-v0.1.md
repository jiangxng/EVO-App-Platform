# Web Delivery and Surface Adoption v0.1

**Status:** Implementation baseline  
**Owner:** EVO App Platform / App Host  
**Upstream authority:** Eidos `docs/architecture/WEB-DELIVERY-AND-SURFACE-ARCHITECTURE-v0.1.md`

## 1. Product rule

EVO App Platform adopts:

> **Same enterprise truth and Actions; surface-specific Experience.**

Desktop and mobile do not have to share one page implementation.

The platform may expose different Experience Surfaces for the same semantic capability while keeping:

- the same Principal / Context authority;
- the same business resources;
- the same Host Action contracts;
- the same audit/evidence semantics;
- deterministic cross-Surface deep-link mapping.

Mobile support is explicit per Experience. A desktop-only Experience is valid.

## 2. Browser cache classes

The Host uses four cache classes.

### Versioned static modules

Production module URLs use:

```text
/assets/<deployment-or-build-revision>/...
```

with:

```text
Cache-Control: public, max-age=31536000, immutable
ETag: <content validator>
```

Because ESM imports are relative, the revision prefix propagates through the module graph.

### Legacy static module URLs

Legacy `/assets/...` URLs remain temporarily compatible but use:

```text
Cache-Control: public, max-age=0, must-revalidate
ETag: <content validator>
```

This path must not remain the preferred production entry.

### App shell

The root App Host shell is immediately revalidated:

```text
Cache-Control: no-cache
ETag: <representation validator>
```

The shell points to the current immutable module graph.

### Authenticated snapshots

Principal/Context-specific snapshots remain private and version validated:

```text
Cache-Control: private, max-age=0, must-revalidate
ETag: <representation validator>
```

Sensitive secret/credential responses remain `no-store`.

## 3. Mobile is a Surface, not a breakpoint

The existing desktop Workbench remains a desktop-class Surface.

Future mobile entry is resolved independently through Eidos Surface metadata.

Initial product direction:

- `DESKTOP_WORKBENCH` — full enterprise Workbench;
- `MOBILE_TASK` — task/decision/Agent-first interactions;
- `MOBILE_READ` — compact evidence/entity/KPI inspection;
- `TABLET_WORKBENCH` — admitted only when a vertical proves it useful.

The exact contract is frozen in the Eidos P1 Surface Resolver slice.

## 4. Mobile support levels

Each Experience must eventually declare one of:

- `FULL`
- `TASK_FOCUSED`
- `READ_ONLY`
- `UNSUPPORTED`

The Host must not infer mobile support from CSS width alone.

An unsupported mobile operation resolves to a deterministic handoff Surface. It does not squeeze a desktop editor until it becomes unusable.

## 5. Initial mobile priorities

The first mobile verticals should be:

1. Personal / Enterprise Agent;
2. approval and Review Queue;
3. notifications / exceptions / assigned tasks;
4. KPI and entity inspection.

The following are not required to support mobile initially:

- full EOG graph authoring;
- full 3D Observatory;
- dense Ledger/Posting configuration;
- bulk enterprise administration;
- other high-density desktop authoring surfaces.

A mobile read-only summary may exist even when mobile authoring is unsupported.

## 6. Browser lifecycle

The realtime baseline remains authoritative.

In addition:

- support browser bfcache where practical;
- avoid unnecessary `unload`;
- suspend non-critical realtime/render work while hidden/frozen;
- reconnect from cursor/version after restore;
- preserve mounted local state;
- abort superseded route queries.

## 7. Weak-network and offline policy

Offline-first is not a blanket platform requirement.

Default rules:

- cached reads may be shown only with correct freshness semantics;
- material writes fail closed when current authority/state cannot be proved;
- there is no generic browser-side write queue;
- offline writes require an explicit idempotent/synchronizable Action contract;
- mobile Surfaces should request smaller task-focused representations.

Service Worker/PWA is deferred until a specific mobile vertical needs installability/offline behavior.

## 8. Loading and prefetch

Target loading sequence:

```text
small shell
 -> chosen Surface
 -> route code
 -> page definition
 -> required resources
```

Desktop-only 3D/editor capability must not be downloaded by a mobile Agent Surface.

Future prefetch is intent-aware and must respect Save-Data/constrained network conditions.

## 9. Web foundation backlog

### P0 — Cache correctness

- versioned immutable JS module graph;
- shell ETag/revalidation;
- legacy asset validators;
- production cache-header proof.

### P1 — Surface contract / resolver

- Eidos Surface metadata contract;
- explicit support matrix;
- device capability profile;
- deterministic resolver;
- user override;
- deep-link mapping;
- unsupported handoff.

### P2 — Surface-scoped loading

- code splitting;
- lazy heavy components;
- route data boundaries;
- mobile/desktop transfer budgets;
- intent-aware prefetch.

### P3 — Browser lifecycle / resilience

- bfcache certification;
- background/freeze recovery;
- weak-network behavior;
- stale-read UI;
- route cancellation.

### P4 — First mobile Experience verticals

- Agent;
- Review Queue;
- notifications/tasks;
- KPI/entity inspector.

### P5 — Advanced delivery only when measured

- selected PWA/offline Surface;
- cross-tab BroadcastChannel/SharedWorker coordination;
- CDN/edge tuning;
- request-bound LLM token streaming;
- surface-specific installability.

## 10. Additional Web foundation requirements

The platform must progressively cover:

- CSP and script/content isolation;
- XSS-safe rendering / Trusted Types direction;
- CSRF boundaries for cookie-authenticated writes;
- clickjacking/frame policy;
- safe CORS;
- compression and connection reuse;
- stable deep links;
- frontend/backend version-skew window;
- browser storage quotas and non-authoritative local state;
- accessibility by supported Surface;
- RUM/performance/network telemetry;
- first-load vs warm-load budgets;
- long-task/render budgets;
- multi-tab correctness;
- error boundaries and deterministic recovery;
- Chrome/Safari/Firefox and mobile browser lifecycle testing.

## 11. Acceptance principle

A Web foundation improvement is complete only when it has both:

1. deterministic contract/tests; and
2. browser/production evidence where the behavior depends on real HTTP/browser semantics.

Visual fit alone is not acceptance for mobile, and a local unit test alone is not acceptance for cache delivery.
