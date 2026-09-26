# Enterprise Software Foundation — Plugin-First Boundaries v0.1

**Status:** Enterprise-context foundation; person-first root superseded by PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1  
**Date:** 2026-09-24  
**Authority:** EVO-family enterprise platform direction  
**Applies to:** EVO App Platform, Apps/Agents, Eidos integration, EVO Runtime integration

**Superseding root-world-model authority:** `docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`

## 1. Product purpose

EVO's root product perspective is now **Person-first**. Enterprise remains a first-class governed Context and business-data/knowledge domain.

Plugin architecture, Eidos, LLMs and Ledger Runtime are implementation means. They are not the product purpose.

Every accepted platform capability should eventually be able to answer:

- which human workflow or decision it supports;
- which Personal or Enterprise Context it applies to;
- which Principal/Agent uses it;
- which business truth it reads or owns;
- which side effects it may cause;
- which audit/security obligations apply.

The canonical architecture priority is:

```text
Person-first
    ↓
Personal Agent + governed Context
    ↓
Plugin-first extension
    ↓
Eidos-first human experience
    ↓
public capability/provider contracts
    ↓
EVO Ledger Runtime when ledger/business-fact execution is required
```

Enterprise-specific identity, membership, policy and provider material in this document remains valid as **Enterprise Context foundation**, but it no longer makes Enterprise the owner/root of human identity.

## 2. Stepwise development rule

Enterprise foundations are high-leverage boundaries. They MUST be built step by step.

Do not implement a large speculative identity/organization/LLM subsystem merely because interfaces have been reserved.

Preferred sequence:

```text
stable Package/Feature lifecycle
→ stable Provider contribution mechanism
→ one low-risk reference Provider
→ common request/principal/scope context
→ Identity/Auth contracts
→ concrete Identity Providers
→ Authorization
→ Enterprise directory/organization/membership
→ LLM Providers
→ additional cross-cutting enterprise services
```

Each layer must leave:

- versioned public contracts;
- tests/CI evidence;
- lifecycle behavior;
- failure semantics;
- repository documentation;
- migration/versioning rules before the next layer relies on it.

## 3. Plugin-first enterprise platform

New platform behavior is presumed to be a plugin unless it is itself required to host/manage plugins.

Core owns the minimal generic substrate:

- Catalog;
- Package/Feature lifecycle;
- capability dependency graph;
- provider registration/discovery;
- Contribution composition;
- App Host;
- lifecycle durability;
- generic security/provider resolution hooks.

Platform/domain capabilities preferentially remain plugins:

- identity/authentication;
- authorization/policy;
- enterprise directory/organization;
- LLM/model providers;
- audit;
- notifications;
- workflow/SOP;
- reporting;
- industry capabilities.

## 4. Stable enterprise request context

Business Apps and runtimes MUST NOT depend directly on a concrete user/session/organization database schema.

Cross-module context is expressed through stable contracts such as:

```text
PlatformPrincipal
PlatformScope
PlatformRequestContext
IdentitySession
AuthorizationCheck
AuthorizationDecision
EnterpriseContext
ServiceProviderRef
LlmExecutionContext
```

This makes provider implementation replaceable.

## 5. Identity and authentication boundary

Authentication answers:

> Who is this actor and how was the identity established?

Authorization answers:

> Is this principal allowed to perform this action on this resource in this scope?

They MUST remain separate contracts.

The platform must be capable of multiple simultaneous identity providers.

Core recognizes normalized identity/session contracts, never vendor-specific login objects.

### 5.1 Protocol families

The Identity Provider boundary is intended to accommodate, where appropriate:

- OAuth 2.x / OAuth-based vendor flows;
- OpenID Connect;
- SAML 2.0;
- LDAP / Active Directory adapters;
- passkeys / WebAuthn;
- username/password reference provider;
- MFA/challenge providers;
- provisioning/directory synchronization protocols.

Protocol support belongs to provider plugins or reusable provider libraries, not business Apps.

### 5.2 International provider examples

Concrete plugins may later include:

- Google Identity / Google Workspace;
- Microsoft Entra ID;
- Okta;
- Auth0;
- Keycloak;
- enterprise SAML IdPs;
- LDAP / Active Directory;
- customer-specific OIDC/SAML gateways.

These names are examples of provider implementations, not Core dependencies.

### 5.3 China-region provider examples

The same platform contracts must accommodate provider plugins for ecosystems commonly used by enterprises in China, such as:

- 企业微信 / WeCom;
- 钉钉 / DingTalk;
- 飞书 / Feishu / Lark;
- 微信开放平台 where enterprise scenarios require it;
- customer/private-cloud IAM;
- domestic enterprise SSO gateways supporting OIDC/SAML/LDAP or vendor-specific protocols.

China-region support MUST NOT fork App Platform into a separate architecture. Provider plugins normalize external identities into the same Principal/Session/EnterpriseContext contracts.

## 6. Multi-user and enterprise membership

A user identity is not itself enterprise membership.

The model must allow:

```text
External Identity
    ↓
Platform Principal
    ↓
one or more Enterprise Memberships
    ↓
Company / Workspace / Role / Policy scope
```

Therefore:

- the same person may belong to multiple enterprises;
- one enterprise may have multiple identity providers;
- membership lifecycle may differ from identity lifecycle;
- disabling an identity provider must not silently destroy business history;
- changing enterprise membership must not rewrite historical BusinessData/Ledger facts.

## 7. Authorization boundary

Authorization is provider/capability based.

Candidate capabilities:

```text
authorization.check
authorization.policy
authorization.role
authorization.data-scope
```

The public decision contract should remain independent of whether implementation uses:

- RBAC;
- ABAC;
- relationship-based rules;
- enterprise policy engine;
- a composition of these approaches.

Required safety semantics:

- explicit scope;
- deny/fail closed when required authorization capability is unavailable;
- auditable reason codes;
- obligations/masking constraints where applicable;
- authentication success never means automatic authorization.

## 8. Enterprise/organization provider boundary

Enterprise semantics are plugins/providers.

Candidate capabilities:

```text
enterprise.directory
enterprise.organization
enterprise.membership
enterprise.scope
enterprise.profile
enterprise.hierarchy
enterprise.settings
```

Potential implementations include:

- EVO reference enterprise directory;
- HR/HCM adapter;
- external master-data system;
- customer-specific organization model;
- multi-company/group organization provider.

Apps consume capability contracts rather than concrete enterprise tables.

## 9. Localization boundary

Localization is an Eidos/App Host framework responsibility plus app-owned resources.

```text
Eidos/App Host
→ locale context + deterministic resolver + rendering standard

Each Package/Experience
→ owns its own localization namespace + bundles
```

No central `evo-localization` Package is required or retained. The experimental package was retired because it had no independent product responsibility.

A future enterprise locale preference/policy service may become a Provider only if a concrete independent lifecycle is required. Do not pre-create that Provider.

## 10. LLM provider boundary

LLM/model access is a platform Provider capability.

Candidate capabilities:

```text
llm.inference
llm.streaming
llm.embedding
llm.structured-output
llm.tool-calling
llm.model-catalog
llm.usage-metering
```

Apps/Agents consume these contracts and do not import provider SDKs directly.

The design must support:

- multiple installed LLM providers;
- multiple models;
- enterprise/user-scoped selection;
- model replacement;
- credentials outside manifests/source;
- availability/health;
- usage/cost telemetry;
- explicit policy constraints.

## 11. Provider selection

Multiple providers for one capability are normal.

Provider resolution eventually considers:

- capability;
- provider contract/version;
- activation scope;
- explicit configuration;
- priority/default policy;
- enterprise/user override;
- provider health;
- security policy.

A newly installed provider MUST NOT silently replace an existing provider.

## 12. Secrets and credentials

Secrets are not Package Manifest data.

Examples:

- OAuth client secrets;
- SAML private keys;
- LDAP passwords;
- LLM API keys;
- enterprise gateway credentials.

Provider packages reference a secure secrets/configuration boundary. They do not embed secrets in source or manifests.

## 13. Eidos boundary

Every human-facing provider experience uses Eidos:

- login/provider selection;
- MFA/challenge;
- enterprise selection;
- organization management;
- permissions settings;
- language selector;
- LLM provider/model configuration;
- provider health/status.

If Eidos lacks a required interaction capability, Eidos is extended first.

## 14. EVO Ledger Runtime boundary

EVO Ledger Runtime is deliberately narrower.

It does not own:

- login/authentication;
- user directory;
- authorization policy engine;
- organization directory;
- LLM provider integration;
- localization.

When needed, EVO receives stable actor/scope identifiers through public contracts for routing/audit while retaining its deterministic BusinessData → PostingRule → Ledger → Balance responsibility.

## 15. Enterprise audit direction

Enterprise platform actions should become auditable through a future `audit.*` provider contract.

High-value events include:

- login/logout/session changes;
- provider configuration changes;
- Package lifecycle operations;
- permission decisions/changes;
- enterprise membership changes;
- LLM provider/model selection changes;
- Ledger Runtime configuration Burn/replay operations.

Audit is cross-cutting but should still enter behind stable plugin/provider contracts.

## 16. What is frozen now vs deferred

### Frozen now

- Person-first purpose; Enterprise remains a first-class governed Context.
- Plugin-first extension rule.
- Provider Plugin concept.
- separation of Authentication / Authorization / Enterprise / LLM, plus localization ownership between Eidos/App Host and each Package.
- normalized Principal/Scope/ProviderRef-style boundary.
- multiple providers are supported conceptually.
- vendor implementations do not enter Core.
- Eidos is mandatory for human-facing provider Experiences.
- EVO Runtime remains outside these responsibilities.

### Deferred until the relevant implementation step

- exact OAuth/OIDC/SAML callback APIs;
- exact token/session storage architecture;
- exact RBAC/ABAC policy schema;
- concrete enterprise organization schema;
- provider selection algorithm/priority syntax;
- specific vendor SDK choices;
- secret manager implementation;
- exact LLM request/response contract;
- advanced locale policy/preference service contracts, if a concrete enterprise requirement later needs them.

Deferring these details is intentional: reserve the boundary now, freeze detailed contracts only when the immediately preceding layer is proven.

## 17. Architectural admission question

Before implementing any enterprise platform feature:

> Does this belong to the minimal plugin host, or can it be expressed as a replaceable Provider/Package/Feature/Contribution?

If it can be a plugin, it should not enter Core.
