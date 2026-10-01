# Extension Boundary Constitution v0.1

**Status:** Active architecture authority  
**Date:** 2026-10-01  
**Scope:** placement of new platform capabilities, provider implementations, external-product compatibility and Human-facing UI

## 1. Purpose

As EVO App Platform grows, architecture placement MUST NOT depend on the current chat, model memory, repository familiarity or the fastest local implementation path.

Every material new capability MUST be classified before implementation.

The canonical rule is:

> Capabilities with an independent supplier, lifecycle, replaceable implementation or deployment difference default to Provider Plugin ownership. Logic that exists only to make an external product or protocol compatible belongs in an Integration Adapter. Human-facing UI belongs in the Experience layer. App Platform Core keeps only generic hosting, lifecycle, resolution, security, composition and protocol-parsing mechanisms.

This document consolidates rules already established across Plugin-First, Provider Plugin, External Integration and Eidos Experience architecture.

## 2. Canonical ownership model

~~~text
authoritative facts / state / business rules
        |
        | stable public contract / capability / command
        v
Application or Platform Provider
        |
        +------------------------+
        |                        |
        v                        v
Integration Adapter         Eidos Experience
external product/protocol   Human interaction / UIDL
translation only            design only
        |                        |
        +------------+-----------+
                     v
               App Platform Core
      generic lifecycle / resolution /
      authorization / routing / composition
~~~

Core is the host and governor. It is not the default owner of product, vendor or domain semantics.

## 3. Required classification before implementation

Before adding a new capability, answer in order:

1. **Is there already a public capability or plugin that owns this semantic?**
   - Reuse or extend the existing owner.

2. **Does the capability have an independent supplier, replaceable implementation, independent lifecycle, configuration/secrets, health posture or deployment difference?**
   - Default owner: **PLATFORM_PROVIDER Plugin**.

3. **Is the logic needed only because a specific external product/protocol has compatibility differences?**
   - Default owner: **Integration Adapter**.

4. **Is the work primarily Human-facing interaction, layout, navigation, form/review/workflow presentation or localization?**
   - Default owner: **Eidos Experience / Experience-owning plugin**.

5. **Is it domain/business behavior composed from public platform capabilities?**
   - Default owner: **APPLICATION Plugin**.

6. **Is it a generic mechanism required so all plugins/providers/adapters can be hosted, resolved, secured, lifecycle-managed or composed?**
   - Only then may it enter **App Platform Core**, and only at the smallest reusable boundary.

If more than one answer applies, split the implementation by ownership instead of collapsing layers.

## 4. Provider Plugin rule

A capability SHOULD be a Provider Plugin when one or more of the following are true:

- multiple vendors or implementations may exist;
- the implementation may be replaced without changing consumers;
- configuration or Secrets belong to the implementation;
- health/availability is implementation-specific;
- deployment may be local, remote, customer-specific or cloud-specific;
- scope-specific provider selection may differ;
- the capability has an independent release/lifecycle boundary.

Typical Provider families:

~~~text
identity.authenticate / identity.session / identity.user-directory
  -> Generic OIDC
  -> Microsoft Entra
  -> enterprise SAML
  -> passkey/local identity

llm.inference / llm.embedding / llm.tool-calling
  -> OpenAI
  -> Anthropic
  -> DeepSeek
  -> Gemini
  -> local model
  -> enterprise model gateway

enterprise.directory / enterprise.membership
  -> built-in reference provider
  -> HR/directory integration
  -> customer-specific enterprise provider

authorization.check
secrets.resolve
plugin.remote-credential
~~~

Consumers depend on public capability contracts, never vendor SDKs or provider-private schemas.

### 4.1 Google identity

Google authentication SHOULD normally be expressed as configuration/profile over a generic OIDC Provider when standard OIDC is sufficient.

Create a Google-specific Identity Provider only when meaningful Google-specific behavior exists beyond generic OIDC.

Avoid one Provider Package per brand when the implementations are semantically identical configuration variants.

## 5. Integration Adapter rule

An Integration Adapter exists to translate between EVO public semantics and an external product/protocol.

Examples:

- ChatGPT product compatibility;
- Claude product compatibility;
- MCP projection details;
- OpenAPI projection details;
- future A2A product/protocol differences;
- callback/metadata conventions required by a specific external client.

An Integration Adapter:

- MUST NOT own business/domain truth;
- MUST NOT grant authority;
- MUST NOT reinterpret Capability Operation semantics;
- MUST NOT become the source of Enterprise Context or identity membership;
- MUST NOT require owning plugins to implement product-specific business APIs;
- MAY translate metadata, transport shape, discovery shape, callback conventions and compatibility/security requirements.

Canonical model:

~~~text
plugin semantic operation
        |
        v
App Platform governance + authorization
        |
        v
generic protocol projection
        |
        v
optional product adapter
        |
        v
ChatGPT / Claude / other external client
~~~

One semantic operation is defined once. Product adapters do not fork the business model.

### 5.1 Integration Adapter is an architectural role

INTEGRATION_ADAPTER is currently an architectural role, not a new Plugin Protocol Package.type.

Until a versioned Plugin Protocol change explicitly introduces such a type, adapters MUST use existing Package / Feature / Capability / Contribution mechanisms or a clearly bounded Host compatibility module.

Do not change the Plugin Protocol type system merely to make this document look symmetric.

### 5.2 Current migration posture

Existing ChatGPT-specific compatibility code is preserved implementation capital.

Before adding multiple new product-specific adapters, it SHOULD converge toward an explicit package/capability-owned Integration Adapter boundary rather than proliferating product checks inside Core.

This is migration guidance, not permission to rewrite working production code without a bounded requirement.

## 6. Human UI / Experience rule

All Human-facing product UI belongs in the Eidos Experience layer.

This includes:

- forms;
- setup journeys;
- settings flows;
- review/decision surfaces;
- management screens;
- navigation;
- product-localized vocabulary;
- work queues;
- dashboards and visualizations.

Canonical separation:

~~~text
Provider / Application
  owns facts, rules, lifecycle and commands
        |
        v
public command / query / capability
        |
        v
Experience / UIDL
  owns Human interaction and design
        |
        v
Eidos
  owns rendering/runtime/design language
~~~

Human UI MUST NOT become the authoritative data owner merely because it initiates a mutation.

A Provider MAY contribute or be paired with an Experience, but provider runtime/data ownership and Human design ownership remain separable.

## 7. Data and Designer separation

Designer output is product design, not domain state.

Permanent rule:

~~~text
Designer output
-> Experience / UIDL artifact
-> public command / query / capability
-> authoritative Provider/Application data
~~~

Forbidden shortcut:

~~~text
Designer / Experience
-> private Provider store
-> direct authoritative data mutation
~~~

Consequences:

- replacing an Experience must not delete or redefine authoritative business facts;
- disabling/uninstalling a UI plugin must not silently delete provider-owned data;
- a future Eidos Designer may generate or edit Experience assets without gaining authority over provider storage;
- generated forms must use the same public contracts as Agents and other clients.

## 8. Application Plugin rule

An APPLICATION Plugin owns a coherent business/product capability composed from public platform contracts.

Examples:

- Ledger Runtime Configurator;
- Enterprise Context Governance Experience;
- business Apps;
- reporting/workflow/industry applications.

An Application Plugin MAY contribute Experiences and callable Capability Operations, but MUST NOT absorb replaceable infrastructure that belongs to Provider Plugins.

## 9. Core admission rule

App Platform Core MAY own only generic mechanisms that are necessary across owners, such as:

- Package / Feature lifecycle;
- capability and provider registration/resolution;
- Contribution composition;
- generic authorization invocation boundary;
- generic request/session/context plumbing;
- Plugin Runtime Dispatcher and isolation mechanisms;
- generic external protocol parsing/projection;
- durable generic audit/receipt infrastructure;
- generic Eidos Experience loading/composition;
- compatibility/version/schema validation.

Core MUST NOT own by default:

- Google/OpenAI/Anthropic/Claude/ChatGPT business-specific behavior;
- enterprise-specific tables or customer policy;
- application/domain semantics;
- provider-specific credentials/settings;
- Human product pages;
- product-specific external Agent business APIs.

Core growth requires an explicit explanation of why the requirement cannot be satisfied through existing public plugin/provider/adapter/Experience boundaries.

## 10. Boundary matrix

| Requirement shape | Default owner | Example |
| --- | --- | --- |
| Replaceable implementation / vendor | PLATFORM_PROVIDER | OpenAI, Generic OIDC, Authorization |
| External product/protocol compatibility only | Integration Adapter role | ChatGPT MCP compatibility |
| Human-facing UI/design | Experience-owning plugin | Enterprise Context creation UI |
| Business/domain composition | APPLICATION Plugin | Ledger Configurator |
| Durable enterprise/platform facts | owning Provider/Application service | Enterprise Context facts |
| Generic hosting/resolution/security mechanism | App Platform Core | provider resolution |
| Generic rendering/design runtime | Eidos | UIDL rendering / Workbench |

## 11. Examples

### Enterprise Context

~~~text
host-enterprise-context-provider
  -> data / lifecycle / OWNER / Grants

enterprise.context.create
  -> public command

evo-enterprise-context-governance
  -> installable Experience-owning APPLICATION

Eidos
  -> render / interaction
~~~

### Google login

~~~text
generic-oidc-identity-provider
  -> OIDC identity capability

Google
  -> provider configuration/profile

optional future Google-specific provider
  -> only if material Google-only semantics appear

login Experience
  -> Eidos Experience
~~~

### LLM access

~~~text
Personal Agent / Applications
  -> llm.inference capability

OpenAI / Anthropic / DeepSeek / Gemini / local model
  -> replaceable PLATFORM_PROVIDER packages
~~~

### External Agent

~~~text
owning plugin Capability Operation
        |
App Platform authorization/delegation
        |
generic MCP/OpenAPI/A2A projection
        |
optional ChatGPT / Claude Integration Adapter
~~~

The adapter does not own the Capability Operation.

## 12. Exceptions

A boundary exception requires all of:

1. a written reason tied to a concrete technical constraint;
2. identification of the intended long-term owner;
3. a migration or containment rule when the exception is transitional;
4. explicit tests preventing the exception from expanding accidentally;
5. architecture documentation update.

"Faster in this PR" or "the current chat already has the code open" are not valid architectural reasons.

## 13. LLM / fresh-chat rule

A fresh LLM MUST classify the task using this Constitution before selecting files to modify.

Repository authority wins over conversational memory.

The minimum pre-implementation question is:

> Is this Core, Provider, Application, Integration Adapter, or Experience—and who owns the authoritative facts?

If that answer is unclear, inspect existing public contracts and architecture authorities before coding.

## 14. Evolution rule

These boundaries are expected to become more precise as the platform grows.

Refinement is encouraged when real implementation evidence reveals a clearer reusable boundary.

However:

- new clarity SHOULD narrow ownership;
- new exceptions MUST NOT silently broaden Core;
- a new vendor/product integration MUST NOT duplicate business semantics;
- repeated compatibility logic is evidence that an Adapter boundary is missing;
- repeated provider-specific branches are evidence that a Provider capability boundary is missing;
- repeated bespoke Human UI is evidence that an Eidos Experience capability is missing.

Update this Constitution, machine-readable boundary policy and relevant invariants when the boundary changes.