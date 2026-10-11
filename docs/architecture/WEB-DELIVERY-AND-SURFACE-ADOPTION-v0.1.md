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


## 12. P1 Surface Contract / Resolver adoption

Upstream Eidos authority:

- `docs/architecture/SURFACE-CONTRACT-AND-RESOLVER-v0.1.md`;
- Eidos App Host `surface.ts`.

App Platform vendors and adopts the same public contracts.

The first real Experience adoption is Personal Agent:

```text
semantic route: enterprise-agent.home

DESKTOP_WORKBENCH
  Surface: enterprise-agent.desktop
  Route: /enterprise-agent
  Page: enterprise-agent.home
  Source: app://enterprise-agent/pages/home
  Support: FULL

MOBILE_TASK
  Surface: enterprise-agent.mobile-task
  Route: /m/enterprise-agent
  Page: enterprise-agent.mobile-home
  Source: app://enterprise-agent/pages/mobile-home
  Support: TASK_FOCUSED

MOBILE_READ
  Surface: enterprise-agent.mobile-read
  Support: UNSUPPORTED
  Fallback: enterprise-agent.desktop
```

Desktop and mobile page definitions are deliberately different assets while both bind to the same `enterprise-agent.chat` command semantics.

Desktop-only secondary Agent routes such as setup/quality/memory review do not silently map to the mobile home page. They return a semantic handoff when requested on the mobile task Surface.

This proves the intended boundary:

```text
shared Principal / Context / Actions / durable Agent truth
                     |
          semantic route identity
                     |
       +-------------+-------------+
       |                           |
desktop page asset          mobile page asset
```

Browser entry integration and rendered handoff UX are the next P1 slice. The contract must be proven before mobile-shell specialization.


## 13. Browser Surface Gateway

The App Host browser bootstrap now evaluates Surface routing before mounting Workbench.

Resolution inputs:

- current semantic route from the URL hash;
- explicit `?surface=` presentation target;
- optional persisted user Surface target;
- Eidos browser capability profile;
- effective Experience manifests.

The Gateway only intervenes for Experiences that explicitly declare `surfaces[]`.

Legacy Experiences remain unchanged until they are explicitly classified. This avoids silently redefining existing responsive behavior as supported mobile product behavior.

### Bootstrap sequence

```text
browser URL
  -> fetch effective manifests once
  -> resolve Surface
     -> ROUTE same path: continue
     -> ROUTE mapped path: replace hash without new history entry
     -> HANDOFF: mount Eidos Surface Handoff only
  -> bootstrap manifests are consumed by first App Host refresh
  -> no duplicate manifest body fetch
```

When HANDOFF is active:

- Workbench is not mounted;
- Workbench activities are not fetched;
- realtime SSE is not connected;
- the page exposes explicit alternative Surface actions.

Choosing an alternative Surface is an explicit Human navigation action. The browser URL is updated with the selected `surface` target and semantic route, then the page reloads through the normal immutable browser cache path.

### Deep-link authority

Workbench startup now follows:

```text
explicit URL/hash route
  > Host initial route
  > persisted workspace layout
  > /
```

Persisted UI state cannot override a deliberate deep link.

### Personal Agent first live target

For `enterprise-agent.home`:

- compact/coarse-pointer profile -> `MOBILE_TASK` -> `/m/enterprise-agent`;
- explicit `?surface=desktop` -> `DESKTOP_WORKBENCH` -> `/enterprise-agent`;
- `/enterprise-agent/setup` on mobile task -> HANDOFF rather than mobile-home substitution.

The Surface Gateway is presentation routing only and does not change Principal, Context, authorization or Agent command semantics.


## 14. Reloadable detail routes and browser history

A Human-visible contextual page must be reconstructable from its browser route. A detail page must not depend exclusively on transient in-memory selection created by the previous click.

For contextual detail/deep-link routes:

- the declared Experience route remains the stable base path;
- reloadable item/revision identity may travel as a query-qualified route;
- App Host matches the declared base route while forwarding the exact qualified route to the owning page source;
- browser refresh, back/forward and Host process restart must be able to reconstruct the same readable page from authoritative data;
- transient session selection may remain only as a compatibility fallback, never as the sole locator.

This rule does **not** weaken the Web delivery cache policy. Qualified page reads use their full request URL as the cache key and continue to use ETag/conditional revalidation. Immutable revisioned JS/CSS remain long-lived and immutable; the shell remains revalidated; authenticated snapshots remain private and conditionally revalidated.

Browser history clearing the final hash must render the configured initial workspace rather than leaving an empty surface.


## Route identity must survive Host adapters

Every adapter between Workbench/App Host and the App Manager page source must forward `ExperienceReadOptionsV010` unchanged, including the exact qualified `routePath`.

A wrapper that forwards only the page descriptor but drops read options breaks reloadable detail/deep-link routes even when authentication and the underlying page source are correct. Regression coverage therefore treats read-option forwarding as part of the page-read contract.

Authentication failures remain distinct: expired or missing sessions use 401/403 and the managed login flow; a 409 page-selection conflict must not be interpreted as an authentication failure.


## Protected-request authentication recovery

All browser runtimes use the revision-aware transport for protected same-origin requests. The transport explicitly keeps same-origin credentials and treats HTTP 401 as an authentication-recovery signal, not as an ordinary page/action failure.

The browser login recovery preserves the exact current pathname, query and hash as `returnTo`. After authentication, the Human returns to the same Workbench detail/projection route instead of losing editing context.

This does not weaken action authorization. 401 means authentication/session recovery; 403 remains an authorization denial; domain conflicts such as revision or selection conflicts remain separate application errors.
