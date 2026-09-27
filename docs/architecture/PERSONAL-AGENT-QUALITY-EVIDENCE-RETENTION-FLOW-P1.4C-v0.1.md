# Personal Agent Quality Evidence + Retention Policy Flow P1.4C v0.1

**Status:** CI-verified implementation candidate  
**Date:** 2026-09-27  
**Depends on:** P1.4A Responsibility Policy, P1.4B Quality Evaluation + Retention Simulation

## 1. Purpose

P1.4C turns the P1.4B evaluation model into real product evidence and closes retention policy management into a formal Human-authorized flow.

Two boundaries remain authoritative:

> Quality evidence can describe Agent behavior but cannot grant Agent authority.

> Retention Draft is planning state, not Memory governance truth.

## 2. Real Personal Agent quality evidence

Every successful Personal Agent interaction can emit a Host-observed evidence event.

The Host currently observes objective facts only:

- interaction identity;
- principal identity;
- active Context;
- tool call count;
- successful tool call count;
- failed tool call count;
- occurrence time.

The Host does **not** infer subjective collaboration judgments from weak heuristics.

Therefore the following remain `UNKNOWN` until explicit Human/lab evidence exists:

- whether clarification was unnecessary;
- whether a choice menu was avoidable;
- whether executable work was pushed back to the Human;
- whether correction preserved the Human goal;
- whether completion was truly verified;
- whether an authorization should have been followed by more work.

## 3. Evidence store

Quality evidence is append-only.

Production persistence:

- `APP_PLATFORM_PERSONAL_AGENT_QUALITY_FILE`, or
- sibling `personal-agent-quality.jsonl` when `APP_PLATFORM_STATE_FILE` is used.

Sources:

- `HOST_OBSERVED`;
- `HUMAN_EVALUATED`;
- `LAB_EVALUATED`.

Only `HOST_OBSERVED` is automatically emitted in P1.4C.

Later Human/lab evidence may add subjective labels without rewriting historical Host observations.

## 4. Scoped quality surface

Personal Agent exposes:

- `/enterprise-agent/quality`

The page only reads evidence matching:

- current Principal;
- current active Context.

It does not expose cross-user or cross-Context evidence.

If no evidence exists, the UI explicitly states that no real evidence exists. It does not render sample metrics or fabricated scores.

The completed Setup flow links to the quality surface.

## 5. Retention Draft

A retention policy change now has a non-authoritative planning lifecycle:

```text
Prepare Draft
→ simulate candidate policy
→ inspect impact
→ Human confirmation
→ verify preview is still current
→ append formal Retention Policy event
```

Draft state is append-only:

- `PREPARED`;
- `COMMITTED`;
- `DISCARDED`.

Production persistence:

- `APP_PLATFORM_CONTEXT_MEMORY_RETENTION_DRAFT_FILE`, or
- sibling `context-memory-retention-drafts.json` when `APP_PLATFORM_STATE_FILE` is used.

## 6. Draft is not governance authority

Preparing a Draft:

- does not create a Retention Policy;
- does not change Memory;
- does not change Memory governance;
- does not change Legal Hold;
- does not execute expiration;
- does not require material-write confirmation.

It is planning evidence only.

The authoritative policy state remains the append-only Retention Policy store.

## 7. Preview-before-commit safety

A prepared Draft stores the simulation that the Human reviewed.

Immediately before commit, the Host re-runs simulation against current:

- Memory;
- governance state;
- Retention Policies;
- Legal Holds.

The Host compares the material impact fingerprint.

If impact changed, commit fails closed with:

`CONTEXT_MEMORY_RETENTION_DRAFT_STALE_REPREVIEW_REQUIRED`

The Human must preview a fresh Draft before committing.

This prevents approval of one impact followed by execution against a materially different state.

## 8. Commit authority

Commit requires:

1. Human Principal;
2. Personal owner or Enterprise OWNER/ADMIN governance role;
3. Eidos/ActionHost confirmation;
4. Host material-write authorization;
5. fresh preview;
6. append-only Retention Policy event.

The model cannot self-approve a Draft.

## 9. Eidos surfaces

Memory Governance now exposes:

- `/memory/retention-drafts/new` — formal UIDL prepare form;
- `/memory/retention-drafts` — prepared/committed/discarded Drafts;
- `/memory/retention-simulation` — current-policy dry-run from P1.4B.

Prepared Draft items expose:

- **Confirm and commit** — formal command, confirmation required;
- **Discard** — planning-state action, no governance mutation.

The flow uses Eidos public UIDL/CatalogBrowser contracts and ActionHost.

There is no demo-only editor.

## 10. Relationship to the Responsibility Policy

This is the intended responsibility split:

- Agent/Host performs PLAN work and impact calculation;
- Human sees the important consequence;
- Human provides the material authorization;
- Host executes the append-only policy commit;
- stale evidence blocks execution rather than shifting revalidation responsibility to the Human.

## 11. Next work

After CI verification:

- add explicit Human/lab evaluation ingestion for subjective quality dimensions;
- add quality trend windows only after enough real evidence exists;
- add Memory-quality evidence such as provenance freshness, source trust and contradiction lifecycle;
- refine retention editor filters (Memory kind/privacy class) without weakening the preview/commit invariant;
- use Human browser feedback before expanding the same governance interaction pattern elsewhere.
