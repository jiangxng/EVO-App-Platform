# Decision Record — Selective Documentation History

**Document class:** DECISION_RECORD  
**Status:** Accepted  
**Date:** 2026-10-01

## Context

The project previously used a broad rule that documentation should only be added and not modified, with the goal of preserving long-term project memory across chats and LLM changes.

As the system grew, that blanket rule created a competing risk: current architecture could become distributed across many progressively newer documents, forcing a fresh LLM to reconstruct which statements still apply.

The Enterprise Context / plugin-boundary discussion made the distinction clearer: some information must remain as historical memory, while other documents exist primarily to communicate the current canonical design.

## Decision

Replace blanket documentation immutability with class-based lifecycle governance.

Current authority may evolve in place. Material reasons for changes are preserved separately as immutable Decision Records or Historical Snapshots.

Historical evidence remains append-only in semantics. Generated views, current status and living runbooks may be replaced or updated according to their purpose.

## Consequences

- Fresh LLMs can load a small deterministic set of current authorities.
- Important founder/architecture decisions remain recoverable without relying on chat memory.
- Obsolete rules do not remain mixed into current standards merely to preserve history.
- Not every formatting, wording or routine operational change creates permanent documentation noise.
- Future documentation changes must classify whether the artifact is current truth, rationale/history, evidence, contract or operating procedure.