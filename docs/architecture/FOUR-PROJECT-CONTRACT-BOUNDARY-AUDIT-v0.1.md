# Four-Project Contract Boundary Audit v0.1

**Status:** CURRENT CROSS-PROJECT AUDIT  
**Date:** 2026-10-02

## Project ownership matrix

| Project | Canonical ownership | Current result |
| --- | --- | --- |
| EVO | deterministic BusinessData / Posting / Ledger / Balance runtime with minimal ApplicationAnchor/applicationId | PASS — convergence active |
| EVO App Platform | Package/Feature lifecycle, capability/provider resolution, Enterprise Context definition governance, authorization/integration control plane | PASS after EC/Enterprise-Agent wording correction |
| Eidos | deterministic reusable Human Experience / 2D / 3D interaction framework | PASS |
| Experience Compiler | persistent advisory intelligence, knowledge, memory, learning, research/reasoning and governed proposals | PASS with minor wording cleanup recommended |

## Cross-project dependency rule

```text
private repository implementation  X  cross-project import

public contract / capability / stable identifier / adapter  ✓
```

No project gains authority merely because it integrates or renders another project's data.

## EVO ↔ App Platform

EVO's target Core is the deterministic Ledger Runtime.

The current EVO work packet is converging rich Application routing to the minimal:

`ApplicationAnchor / applicationId`

App Platform's generic Application Runtime Binding Provider is the matching adapter:

```text
Host Application semantic ref
  ↓
enterprise.application-runtime-binding
  ↓
runtime provider + runtimeApplicationId
  ↓
EVO applicationId where EVO is the selected runtime provider
```

This adapter does not move rich Application lifecycle back into EVO.

Current EVO Command/capability APIs remain compatibility/current-implementation assets while the target minimal runtime API converges. EVO `project.status.json` and target Core boundary remain authoritative for that transition.

## App Platform ↔ Eidos

App Platform owns product/lifecycle semantics and supplies Experience definitions.

Eidos owns reusable deterministic interaction and rendering.

Current EOG usage is aligned:

- 2D Viewer / Designer consume the public Eidos 2D Workspace boundary;
- 3D Viewer consumes the public Eidos 3D Core boundary;
- Eidos contains no Application/Ledger/EOG/SOP publication authority;
- product projects must not bypass Eidos with a parallel business-UI framework.

Result: `PASS`.

## App Platform ↔ Experience Compiler

Experience Compiler is not an Enterprise Agent package.

Correct boundary:

```text
Experience Compiler
  ↓ versioned public advisory/proposal contracts
Enterprise Agent / other governed integration package
  ↓ App Platform admission / authorization
Eidos Experience and/or deterministic owning runtime
```

App Platform may host lifecycle/integration packages for EC-facing workflows, but must not absorb EC knowledge, memory, learning or reasoning ownership.

The stale App Platform architecture wording that conflated EC with Enterprise Agent is corrected by this audit.

## EC ↔ Eidos

EC may propose Experience intent/contracts.

Eidos validates and deterministically realizes supported Experience contracts.

EC does not own Eidos renderer/runtime and Eidos does not own EC learning/intelligence.

Result: `PASS`.

## EC ↔ EVO

EC may observe governed runtime outcomes and produce advice/proposals.

It is never on the mandatory posting/ledger transaction path.

EVO remains deterministic when EC/LLMs are unavailable.

Result: `PASS`.

## Deferred SOP boundary

SOP remains a separate peer domain.

```text
SOP boundary = preserved
SOP extraction/product development = DEFERRED
SOP private implementation -> EOG = forbidden target direction
```

This audit does not reopen SOP work.

## Audit findings

1. **Resolved now:** App Platform architecture incorrectly described Experience Compiler as being redefined into Enterprise Agent Package.
2. **Aligned:** Application Runtime Binding Provider cleanly maps App Platform semantic Application identity into EVO's minimal applicationId runtime boundary.
3. **Aligned:** Eidos public 2D/3D boundaries remain domain-neutral.
4. **Minor EC wording drift:** EC architecture still contains wording such as “EVO Truth” / “published EVO enterprise definitions”; the intended authority is broader governed enterprise/runtime evidence and Enterprise Context-owned Business Definitions. Fix in EC repository without changing EC responsibility.
5. **Transition note:** EVO PUBLIC-API still documents compatibility Command/platform semantics while EVO `project.status.json` explicitly converges toward the minimal runtime plugin. Do not treat compatibility API text as reversal of the target Core boundary.

## Canonical four-project statement

> EVO executes deterministically; App Platform governs composition and enterprise definitions; Eidos realizes deterministic Human Experiences; Experience Compiler knows, learns, reasons and proposes.
