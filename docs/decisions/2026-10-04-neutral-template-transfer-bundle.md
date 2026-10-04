# Decision Record — Neutral Template Transfer Bundle

**Document class:** DECISION_RECORD  
**Status:** Accepted  
**Date:** 2026-10-04

## Context

Template Store and Enterprise Context must remain independent plugins, while shared enterprise definitions still need to move in two directions:

```text
Enterprise Context -> Share -> Template Store
Template Store -> Copy -> Enterprise Context
```

Directly importing either plugin's private repository from the other would create a hidden runtime dependency and contradict the established ownership boundary.

The lifecycle vocabulary is also intentionally distinct:

```text
Save != Submit != Publish != Share
```

Therefore Share cannot be implemented as an alias for Enterprise Context Publish.

## Decision

Introduce a neutral public `TemplateTransferBundleV010` contract owned by the App Platform contract layer.

Enterprise Context exports an **exact definition revision** into the bundle.

Template Store stores the bundle as an immutable versioned snapshot.

Copy sends the stored bundle back through the Enterprise Context template-transfer Provider, which creates a new target-enterprise Draft.

Neither implementation imports the other plugin.

A Share bundle may represent either a Draft or a Published Enterprise Context revision. The source state is preserved as provenance, not imposed on the target copy.

Every target copy begins as:

```text
revision = 0
state = DRAFT
origin.type = TEMPLATE_COPY
```

The origin source reference is audit provenance only and MUST NOT create synchronization or a live parent/source dependency.

## Integrity

The portable bundle includes a deterministic SHA-256 content digest.

Template Store validates the digest when accepting a bundle. Content changed after bundle creation is rejected rather than silently becoming a different shared template.

## Consequences

- Template Store can exist and browse independently from Enterprise Context.
- Enterprise Context can exist and author/publish definitions without Template Store.
- Share remains distinct from Publish.
- Template snapshots do not drift when the source enterprise later edits its definition.
- Enterprise copies do not drift when the source template later changes or is removed.
- Future Host actions can orchestrate Share/Copy through public capabilities without reaching into either plugin's private persistence.
- Authorization, confirmation and durable Template Store Host wiring remain a separate next implementation gate.
