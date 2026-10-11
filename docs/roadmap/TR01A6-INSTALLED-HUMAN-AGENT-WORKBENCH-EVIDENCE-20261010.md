# TR-01A6 — Installed Human / AI / Workbench operational acceptance proof

**Date:** 2026-10-10  
**Scope:** Validation-only; no new ERP module, no revised Item/Warehouse import, no duplicate ledger.

## Why this is required

TR-01A3 (#562) proved a shared governed EVO Work/Position read; TR-01A4 (#564)
registered the opt-in application-owned Action Host operation; TR-01A5
(#565) added a scoped Eidos lookup/detail view plus an authorized Workbench
entry. At that point Platform CI and generic Eidos browser CI had passed,
but **nobody had yet exercised that installed purchase path in a real
browser against an actual EVO PostgreSQL-backed order**. Merely deploying
uninstalled routes did not close acceptance #6.

## This independently repeatable certification

`.github/workflows/cross-project-tr01a-installed-experience.yml`:

1. Pin a known-good EVO commit; PostgreSQL 18; migrate/seed; launch EVO API
   and posting worker.
2. Create a real Purchase Order → Receipt → immutable Receipt reversal
   using the existing TR-01 certified EVO public API proof.
3. Resolve the **real EVO enterprise ID** and explicitly map it to the test
   Host enterprise context; **no global demo-tenant fallback**.
4. Run **two independent Host processes**, one with a Human Principal and one
   with an AI Principal, using the same authorized Test Enterprise Context.
5. Install Trading Reference on both Host processes and BI Workbench for
   Human. The in-memory test authorization overlay restricts a single
   known order `TR01-PO-001`; other orders must remain forbidden.
6. Verify Workbench entry, lookup/form, Human/AI Action Host result parity,
   pending RECEIVE, zero inventory quantity/cost, and PAY still open
   **directly over HTTP** against EVO public Work/Ledger APIs.
7. Launch an actual headless Chrome/Eidos App Host session and interact with
   Workbench entry → lookup form → authoritative derived detail view.
8. Reject an uninstalled action, a forged order and a guessed deep link.
   A failed condition fails the CI workflow.

`tools/certify-tr01-purchase-installed-experience.mjs` prints a precise
`TR01A6_INSTALLED_HUMAN_AGENT_WORKBENCH_EVO_PROOF` marker only after all
these checks succeed. All test permissions, enterprise mapping, and demo
facts exist only in isolated GitHub CI; no production policy is widened.

## Acceptance and residual boundaries

If the new workflow passes, it demonstrates a **repeatable installed
Human-browser + AI-principal Action Host + governed Workbench** journey
against actual EVO PostgreSQL (far stronger than earlier model-only tests).
It is not proof of any arbitrary customer's production permissions,
live role administration, a user-operated production browser session, or
a generalized partial/multiple Receipt reversal.

The AI test Principal calls the shared Capability Operation through the
real Action Host. If Agent capability **search/invoke** is separately tested,
record the precise external Agent bridge route and result; do not claim
that simply using actorType `AI` tests model reasoning or LLM execution.

The official open gate in `project.status.json` must only change
after reviewing actual green run IDs and operational acceptance scope,
and producing the handoff via `npm run continuity:render`. Until then
TR-01A remains OPEN and TR-01B must not begin.

## Verified implementation and outcome — 2026-10-10

- App Platform PR [#567](https://github.com/jiangxng/EVO-App-Platform/pull/567), exact final head `ff758f219fd98b7a379778c362f9d7e1c0621d2c`, merged `main` at `399cbf5838626583599b441e3992e03fef9102c5`.
- Project Continuity CI [38012255960](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012255960): **PASS**.
- Existing Trading Lite / EVO PostgreSQL CI [38012255964](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012255964): **PASS**.
- New installed Chrome/Eidos / AI Principal Host / Workbench / EVO PostgreSQL CI [38012256000](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38012256000): **PASS**. The job emitted `TR01A6_INSTALLED_HUMAN_AGENT_WORKBENCH_EVO_PROOF` with `status=PASS`.
- The proof actually installed both application packages, used a scoped Host→EVO enterprise map and an explicitly one-order allow policy, clicked Workbench in Chrome, submitted the Eidos form, reached the authoritative Work/Position detail view, read the same position via a separate AI Principal Action Host, and rejected an unauthorized PO and guessed detail URL.
- After real Purchase → Receipt → immutable full Receipt reversal: RECEIVE reopens at 10, Inventory quantity and cost are 0, PAY remains open and Payable=125. No new master data authority or finance table.
- Railway [deployment `5a03ab99-2731-4a0d-91e4-9daa8c33a7dc`](https://railway.com): **SUCCESS** at exact merged `main` commit `399cbf5838626583599b441e3992e03fef9102c5`.
- **Acceptance boundary:** closed for the *reference implementation's automated installed Human-browser, AI-principal action and Workbench sharing of EVO Work/Position*; does **not** certify any customer's production installation, Agent natural-language reasoning, arbitrary purchase flows or generalized partial/multiple reversal. Test-only grant and tenant mapping remain isolated to CI. Customer production rollout needs separately scoped policy and operational acceptance.
