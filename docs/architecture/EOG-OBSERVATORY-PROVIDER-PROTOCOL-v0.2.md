# EOG Observatory Provider Protocol v0.2

**Status:** IMPLEMENTATION FOUNDATION  
**Date:** 2026-09-28

## Purpose

Make Enterprise Operating Graph operational observations and analysis replaceable Host Providers rather than hard-coded App Platform integrations.

The Host owns:

- Principal / Enterprise Context resolution;
- Provider selection and scoped binding;
- EOG semantic target validation;
- Runtime Fact validation;
- Analysis evidence validation;
- fail-closed ambiguity and health behavior.

A Provider owns only its declared observation or analysis capability.

## Capabilities

### Runtime Fact Provider

```text
capability:
enterprise.operating-graph.runtime-facts

providerContract:
evo.enterprise-operating-graph.runtime-facts

providerContractVersion:
0.2.0
```

Runtime:

`EnterpriseOperatingGraphRuntimeFactProviderV020`

The Provider receives a bounded graph/window/target/metric query and returns Runtime Facts. It must not widen the requested target or metric scope.

### Analysis Provider

```text
capability:
enterprise.operating-graph.analysis

providerContract:
evo.enterprise-operating-graph.analysis

providerContractVersion:
0.2.0
```

Runtime:

`EnterpriseOperatingGraphAnalysisProviderV020`

The Provider receives already Host-validated Runtime Facts and may return evidence-backed derived overlays.

## Example contribution

```json
{
  "kind": "platform.service-provider",
  "provider": {
    "contractVersion": "0.1.0",
    "providerId": "evo.runtime-observatory",
    "capability": "enterprise.operating-graph.runtime-facts",
    "providerContract": "evo.enterprise-operating-graph.runtime-facts",
    "providerContractVersion": "0.2.0",
    "binding": {
      "type": "IN_PROCESS",
      "ref": "runtime://evo.runtime-observatory"
    }
  }
}
```

The example declares a protocol shape only. No provider with that ID is installed by default.

## Binding

Existing App Platform Provider binding semantics apply.

A Runtime Fact or Analysis Provider may be bound at Enterprise scope. Therefore different Enterprise Contexts may select different observation or analysis backends while sharing the same EOG contracts.

If multiple candidate Providers exist without a resolving binding, Provider resolution fails closed.

## No default fake Provider

App Platform intentionally ships no fabricated Runtime Fact or Analysis Provider in this slice.

Without a real Runtime Fact Provider:

- Human Observatory read returns `EOG_RUNTIME_PROVIDER_REQUIRED`;
- Personal Agent Observatory tools are not advertised when there is no registered runtime candidate.

This prevents demo data from being mistaken for enterprise operational truth.

## Future EVO adapter

The Host-owned generic EVO BusinessData/Ledger adapter should implement the Runtime Fact Provider contract rather than exposing EVO-private persistence to EOG or Eidos.

Examples:

- ledger balances -> WIP / backlog / amount observations;
- BusinessData occurrence counts -> event frequency;
- posting / transaction timing -> throughput or lead-time observations.

Mapping must remain generic and canonical. Business-specific interpretation belongs in Application metadata, templates, or replaceable Providers.

## Future Analysis Providers

Possible replaceable providers include:

- deterministic bottleneck analysis;
- SOP conformance / process-mining analysis;
- statistical anomaly detection;
- EC-informed industry analysis;
- model-assisted analysis.

Model-assisted output remains derived analysis and must cite validated Runtime Fact evidence. It never becomes enterprise semantic truth merely because a model generated it.

## Rendering

Neither Provider contract depends on Eidos, maxGraph, Three.js, WebGL or any specific renderer.

```text
Runtime Fact Provider ─┐
                       ├→ Host validation → Observatory Snapshot
Analysis Provider ─────┘                         │
                                                ├→ 2D
                                                ├→ 3D
                                                └→ Personal Agent
```
