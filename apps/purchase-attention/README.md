# Purchase Attention — PA05-03 independent business plugin reference

**Status:** opt-in integration/certification candidate, NOT a globally registered production plugin or signed Agent capability. Package ID `evo-purchase-attention`; source dependency `trading-reference.purchase-operations` from the already-existing Trading Reference plugin. No BEX/CP-03 business-object modification.

## Business object and versioned operation

The read-only *purchase attention summary* is a derived, ephemeral view scoped to one explicitly selected purchase order. It is **not** a new persisted customer/supplier/item/warehouse object. The four business keys are `orderNo`, `supplierCounterpartyId`, `itemId`, `warehouseId`; references are constrained by Trading Reference and independent Host authorization. Its `platform.capability-operation` is `purchase.attention.read` v0.1.0 with `READ` effect and `ENTERPRISE` data scope. The complete machine-checkable input/output JSON subset is in `package.ts`.

Source binding: the owner calls the existing **governed Action Host** using `trading-reference.purchase-operations.read` at inputVersion 0.1.0. The source owner validates the actual authorized EVO read; the new plugin checks source identity/shape and computes `RECEIVE_PENDING` only for positive pending purchase quantity, `PAYMENT_PENDING` only for positive payable amount. It does not infer due dates, fraud, approvals, delinquency, credit, financial risk or payment authorization. It has no WRITE path, data store, idempotency semantics or side effects.

## Assistance and result bindings (owner guidance, not invented Host API)

- **Assistance intent:** `review.purchase-attention`; only when Human selects an explicit enterprise scope and supplies all four references. The existing `evo.capabilities.search` / `describe` / `invoke.read-plan` tools discover/execute the operation; no plugin-specific Agent tool or prompt is added.
- **Allowed context refs:** current Enterprise Context ID plus the four purchase reference IDs. No memory-derived supplier substitutions or cross-company fallbacks. Context is obtained from trusted Host request context, not generated input.
- **Result binding:** `contractVersion`, `summaryId`, `orderNo`, `sourceOperationId`, `attentionFlags`, `needsAttention`, `pendingPurchaseQuantity`, `payableAmount`. This is a structured READ result, not an executed proposal, approval, receipt, or new UI route. It is nonpersistent and makes no promise of always-fresh physical stock. UI may present plain standardized status components, but no Workbench integration is claimed here.
- **Task template:** not needed: one deterministic authorized read, no multi-step durable Agent Run.
- **Learning policy:** none; data may not be retained for future model training or memorized. Only existing Host auditing applies, not plugin-owned personal data storage.

## Installation, deactivation, recovery and safety

1. Administrator installs package using existing AppManager plan/install. The real dependency is installed/activated by the existing Capability resolution and cannot be bypassed by a direct source service call.
2. Host must explicitly bind the new package's owner Action handler and source Action router. This PR **does not register the package in production** or change `catalog/seed.ts` / `manager/server.ts`.
3. Host/owner authorize `purchase.attention.read` for the selected purchase-order resource, and source Operation separately authorizes `trading-reference.purchase-operations.read`. No grant, wrong tenant, obligations, missing source package/feature, or incomplete EVO pages => no business data returned.
4. Personal Agent gets operation metadata dynamically from installed package's Feature and reuses the same Action Host. The opt-in PA05-02B read gateway checks input/output schemas and post-flight permissions/lifecycle for this independent package in the deterministic certification harness.
5. Deactivate or uninstall via existing AppManager; no new persisted data requires migration. In-flight work and Host deployment/activation, signed supply-chain evidence, real Identity/Provider/browser and model behavior are **not** signed by this example. Version incompatibility is a denied installation/recovery path, never automatic upgrade by Agent.

## Evidence boundary

`tests/agent-line/pa05-independent-purchase-attention.test.mjs` uses actual Trading Reference owner/projection code, real dependency-aware AppManager and Action Host, the existing Personal Agent dynamic tool catalog, and the opt-in READ gateway; EVO rows and Authorization Provider are deterministic test ports, not production connectors. CI must pass before this is called an engineering proof. The testing sample is **third business plugin onboarding engineering proof only**. It is not a production-deployed, signed or independently published marketplace plugin; PA05-04 WRITE and PA05-05 real Human/model conditions remain open.
