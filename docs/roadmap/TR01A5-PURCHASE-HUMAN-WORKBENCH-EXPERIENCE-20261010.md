# TR-01A5 — Human and Workbench purchase operational reference view

**Date:** 2026-10-10  
**Owner:** EVO-App-Platform Trading Reference Application  
**Contract maturity:** candidate, gated by acceptance evidence  
**Official gate:** TR-01A operational Experience acceptance remains OPEN until Human/Agent/Workbench production acceptance is observed and explicitly recorded.

## Purpose

TR-01A3/#562 proved the shared authorized purchase Work/Inventory/Payable read against real EVO PostgreSQL. TR-01A4/#564 exposed the same service as an optional application-owned READ Capability Operation through the existing lifecycle-gated, lazy Action Host, with an explicit Host Enterprise → EVO runtime binding.

This slice adds a **bounded Eidos Human journey**:

```text
optional evo-trading-reference install + policy
  → authorized BI Workbench entry (no persistent Applications navigation)
  → purchase lookup Eidos form: order/supplier/Item/warehouse stable IDs
  → same governed trading-reference.purchase-operations.read Action Host
  → result navigateTo: /trading-reference/purchase-position?...
  → Eidos read-only derived Work + Inventory Position + Payable view
```

Agent uses the **same** read Capability Operation and Action Host, not a separate balance implementation. Both direct read and Eidos detail page repeat the tenant, lifecycle, operation authorization and explicit business-references checks. No browser-controlled EVO enterprise ID is accepted.

## Authorization and lifecycle

The optional package now declares two operations:

- `trading-reference.purchase-operations.entry.open`: enterprise-scoped **navigation-only** READ. Independently permissioned; admits the Workbench entry or standalone lookup form. It **does not** fetch business data.
- `trading-reference.purchase-operations.read`: input-scoped READ of one PO and Supplier/Item/Warehouse; requires its own policy and a specific explicit Host → EVO runtime enterprise binding. The service performs a second authorization check with the stable business reference attributes before hitting EVO public Work and Ledger APIs.

Workbench item visibility is tied to `entry.open` through existing capability-operation authorization and package activation. The Eidos Experience has **no persistent Applications navigation**. The feature is never installed merely because it is present in the catalog. No general `ALLOW` policy is baked in.

## Proof boundaries

- The lookup is **not** a procurement order directory, an accounting subsystem, or a new import target.
- The user must supply stable references. Order discovery is outside this bounded slice; no second Purchase Order identity index is introduced.
- Inventory Position remains EVO-derived. Warehouse owns where, Item owns identity, Counterparty owns supplier; the read facade owns no state.
- READ operation can report pending RECEIVE Work, inventory quantity/cost and pending PAY Work and supports full reversal re-opening; **not** generalized partial/multiple reversal or concurrency controls.
- A successful GitHub CI run and Railway build **do not automatically constitute a Human product acceptance**. Actual installation/policy/runtime mapping and an Eidos Human journey must be observed before closing official TR-01A acceptance #6.
- An entry permission alone never authorizes the PO detail. Read authorization must explicitly guard both the order and allowed business scope; the current reference form is a proof surface, not generalized cross-object row-level policy.

## Verification and follow-up

Tests cover valid Eidos UIDL, locale, encoded/strict routes, open/closed RECEIVE/PAY and inventory cost, Agent/Human action parity, permission-filtered Workbench home contribution, missing enterprise context, no demo fallback, and authorization re-check on server-generated detail pages. Cross-project PostgreSQL CI continues certification against actual EVO HTTP ledger reads.

For final acceptance: verify actual package installation and feature activation, operator policy with appropriately scoped orders, explicit tenant mapping, Human browser journey, Agent operation search/invoke, Workbench home entry visibility and disabled/denied states, plus production observations. Do not modify `project.status.json` or generated `HANDOFF-LATEST.md` until that evidence exists. TR-01B remains PLANNED_NOT_STARTED.
