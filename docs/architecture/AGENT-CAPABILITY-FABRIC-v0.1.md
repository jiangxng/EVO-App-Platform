# EVO Agent Capability Fabric v0.1

**Status:** CURRENT_AUTHORITY / implementation baseline  
**Date:** 2026-10-01  
**Milestone:** Agent Capability Fabric v0.1

## 1. Purpose

External Agent interoperability proved that a capable model is still bounded by the capabilities the Host makes discoverable.

Projecting every business Capability Operation as a top-level MCP tool works for a small catalog but does not scale to a large ERP capability surface.

Target architecture:

    External / Personal Agent
            ↓
    small generic capability gateway
            ↓
    current authorized Capability Operation catalog
            ↓
    search / describe / invoke
            ↓
    ActionHost
            ↓
    owning plugin/application/provider

MCP is one projection of the Fabric. MCP is not the business capability registry.

## 2. Canonical distinction

    Capability Operation
    = business-semantic callable contract

    Agent Capability Fabric
    = authorized discovery + description + invocation service

    MCP tool
    = protocol projection of either a Capability Operation
      or the generic Fabric gateway

The Fabric never becomes a second business API.

## 3. v0.1 generic operations

The first Agent-facing gateway contains exactly three generic operations:

    evo.capabilities.search
    evo.capabilities.describe
    evo.capabilities.invoke

Search searches only the caller's current effective delegated Capability Operations. Input supports natural-language or machine search terms, optional exact Capability filter, READ/PLAN effect filter, and bounded result limit up to 20. Ranking is deterministic lexical ranking and requires no model dependency.

Describe returns the public semantic contract for one currently authorized operation: operationId, capability, operationVersion, title, description, effect, dataScope, inputSchema and outputSchema. It does not expose Host Action binding, authorization implementation, provider internals or package-private routing.

Invoke executes one currently authorized READ/PLAN operation through the existing ActionHost binding. It never invokes a private handler directly.

## 4. Authority derivation

Fabric visibility and invocation remain bounded by:

    active Agent
    ∩ active Client
    ∩ active/unexpired Grant
    ∩ active Human authorizer
    ∩ current Enterprise Context membership
    ∩ current plugin/Feature lifecycle
    ∩ Capability Operation exposure
    ∩ current authorization.check
    ∩ Grant allowedOperationIds
    ∩ Grant effectConstraints
    ∩ Access Token operationIds
    =
    current Fabric-visible/invokable operation

Search, describe and invoke re-evaluate current delegated authority. The Fabric does not turn an OAuth token into frozen authority.

## 5. No unauthorized discovery

An operation that is not currently authorized is not returned by search.

Guessing an operation id through describe or invoke yields the same bounded not-available behavior whether the operation never existed, exists but is not granted, is currently denied, belongs to a disabled Feature, or is WRITE in the v0.1 Fabric profile.

This avoids capability-name side channels.

## 6. Token remains an upper bound

Even if current Grant or policy could expose a broader catalog than when an Access Token was issued, the token's operationIds remain an additional upper bound.

Current authority may shrink a token. Current authority does not silently expand an existing token.

## 7. Effect boundary

v0.1 supports READ and PLAN. v0.1 does not expose WRITE through evo.capabilities.invoke.

Future governed WRITE requires explicit WRITE eligibility, Human approval where policy requires it, Host idempotency, durable execution receipt, and readback or verification where appropriate.

The generic Fabric must not become a WRITE bypass.

## 8. Search semantics

v0.1 uses deterministic bounded lexical ranking over operationId, capability id, title, description, effect and dataScope.

The Host does not call an LLM to decide what the caller is authorized to see.

A future semantic-search Provider may improve ranking, but authorization filtering must happen before semantic ranking and unauthorized operations must never enter the candidate set.

## 9. Protocol projection modes

MCP supports an explicit migration mode.

DIRECT means one currently delegated Capability Operation becomes one MCP tool.

HYBRID means the three Fabric gateway tools plus current direct Capability Operation tools. This is the v0.1 production migration default.

FABRIC means only evo.capabilities.search, evo.capabilities.describe and evo.capabilities.invoke are exposed. This is the target for large catalogs once client behavior is proven.

Environment variable:

    APP_PLATFORM_EXTERNAL_AGENT_MCP_CAPABILITY_MODE
    = DIRECT | HYBRID | FABRIC

## 10. Why HYBRID first

HYBRID preserves existing standards-client and Agent interoperability proofs while introducing the Fabric.

Migration is reversible:

    DIRECT → HYBRID → FABRIC

No business plugin contract changes during this migration.

## 11. Important remaining authority problem

The Fabric solves capability discovery scale. It does not by itself solve capability delegation scale.

The current Grant contract still uses allowedOperationIds, so a Human still has to delegate the operations that may enter the Agent's authorized search space.

A future slice should introduce explicit, governable Capability-level selectors such as specific operation ids, specific capability ids, or bounded capability-prefix selectors, combined with effect constraints, data/context constraints, Human policy and current authorization.check.

This must be designed as an authority feature, not hidden inside search. No wildcard authority is introduced in v0.1.

## 12. Toward conversational Agent parity

Tool-count reduction alone does not create a ChatGPT-like collaboration model.

The next layers are expected to be:

    Capability Fabric
    + Context read
    + durable Task / Run
    + Observation / Receipt
    + governed Memory
    + capability-level delegation

Target behavior:

    Human states goal
    → Agent understands current Context
    → searches current authorized capabilities
    → reads precise contracts
    → invokes bounded capabilities
    → observes results
    → continues the task
    → records receipts / durable Run state

Cognitive discovery can be open-ended. Authority remains closed and Host-governed.

## 13. Ownership

EVO-App-Platform owns Fabric contracts, authorized catalog derivation, protocol projection, delegated Agent boundary, and invocation routing/security.

Owning business plugins own capability meaning, operation ids and versions, schemas, effect, data scope and business execution.

EVO Core owns Ledger runtime semantics, not Agent protocol plumbing. Eidos owns Human Experience. Experience Compiler may later contribute knowledge/ranking/context assistance but must not become the authority source for operation visibility.

## 14. v0.1 acceptance

Machine acceptance requires search to return only current delegated READ/PLAN operations, bounded deterministic search, public-only describe, non-disclosing guessed/ungranted/WRITE behavior, invocation-time current-authority checks, ActionHost execution, token operationIds as upper bound, three-tool FABRIC mode, HYBRID compatibility, and DIRECT rollback.

Live acceptance should prove an Agent can receive a natural-language business goal, search for a capability without being told operation ids, describe the chosen operation, invoke it, and form a correct answer.
