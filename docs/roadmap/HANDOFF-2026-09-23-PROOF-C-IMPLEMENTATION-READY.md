# Handoff — Proof C Implementation Ready — 2026-09-23

**Status:** CI-verified implementation ready; local browser proof pending  
**Mainline:** Trading Lite → real EVO public Command runtime  
**Repository:** `jiangxng/EVO-App-Platform`  
**Branch:** `main`

## 1. Baseline already proven

Proof A and Proof B remain user-confirmed locally with the deterministic Enterprise Agent development model.

Proof B established:

```text
Eidos
→ Enterprise Agent
→ App Manager
→ dependency graph
→ evo.core reference dependency
→ Trading Lite activation
→ Eidos refresh
→ Trading Lite page renders
```

## 2. Proof C implementation now merged

### EVO

EVO PR #52 is merged.

Public runtime boundary now includes:

```text
GET  /api/v1/enterprises/:enterpriseCode
GET  /api/v1/apps?enterprise_id=<id>
GET  /api/v1/capabilities?enterprise_id=<id>
POST /api/v1/commands
```

A dedicated PostgreSQL CI proof verifies:

```text
public enterprise lookup
→ public capability discovery
→ public command invocation
→ authoritative BusinessData
→ PostingInput
→ Posting
→ pending_production
→ pending_shipment
→ receivable
```

Trading Lite never receives private EVO application-instance IDs or database access.

### Eidos

Eidos App Host now uses the pre-existing backend-independent `ActionHost` port for rendered UIDL actions.

```text
UIDL form
→ createActionRequest()
→ ActionHost
→ host/backend adapter
```

The Eidos App Manager ActionHost adapter sends the ActionRequest to:

```text
POST App Manager /v1/actions
```

Eidos contains no Trading Lite or Sales Order business logic.

### EVO App Platform / Trading Lite

App Platform now has a generic lifecycle-gated application action router.

Trading Lite owns its own action adapter:

```text
trading-lite.create-order
→ resolve EVO enterprise scope
→ discover sales_order.approve-sales-order
→ map Trading Lite input
→ EVO POST /api/v1/commands
```

The router refuses to execute the Trading Lite handler unless `trading-lite.default` is ACTIVE.

App Manager lifecycle service remains business-semantic neutral.

## 3. Current proof boundary

CI proves all three repository contracts independently.

Do **not** yet mark Proof C local end-to-end PASS.

Still required:

```text
User browser
→ install Trading Lite
→ open Trading Lite
→ submit Create Order
→ Eidos ActionHost
→ App Manager /v1/actions
→ Trading Lite handler
→ EVO public capability discovery
→ EVO public command
→ BusinessData + PostingInput
→ EVO worker posting
```

The browser currently reports the accepted EVO Command result. EVO's separate PostgreSQL E2E proves the resulting posting/ledger behavior.

A public read/query projection back into the Trading Lite page is a subsequent slice; do not claim that balance query is already rendered in Eidos.

## 4. Architecture rules confirmed

- App Manager owns package/feature lifecycle, not Trading Lite business semantics.
- Trading Lite owns Trading Lite → EVO input mapping.
- EVO exposes governed public capabilities and Commands.
- Eidos owns frontend ActionRequest creation and delegates execution to ActionHost.
- No App/Pack may use EVO private tables/modules.
- Capability discovery does not grant execution authority.
- EVO authorization policy is metadata-owned and fails closed when missing.

## 5. Next action

Run the local Proof C browser validation in `docs/roadmap/LOCAL-MVP-RUN-v0.1.md`.

If user-confirmed PASS, then:

1. record Proof C local PASS;
2. add the first public read/query projection needed by Trading Lite;
3. show resulting authoritative business state back in Eidos;
4. only then expand Trading Lite to the next business command.
