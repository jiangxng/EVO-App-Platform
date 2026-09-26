# Platform Provider Plugin Model v0.1

**Status:** Architecture reservation  
**Date:** 2026-09-24  
**Authority:** EVO App Platform platform-service extension boundary

## 1. Purpose

EVO App Platform is plugin-first. Platform capabilities that may vary by deployment, vendor, policy, enterprise or future product direction MUST enter through replaceable provider plugins rather than become hard-coded App Platform Core behavior.

This document reserves the common provider boundary for:

- LLM/model providers;
- identity/authentication/session providers;
- enterprise/organization/membership providers;
- future policy, notification, search, storage, workflow and similar platform services.

The goal is additive long-term growth without turning App Platform Core into a monolith.

## 2. Canonical layering

```text
Human / App / Agent
        ↓
public capability contract
        ↓
App Platform capability + provider resolution
        ↓
installed PLATFORM_PROVIDER Package
        ↓
provider binding / external service / declarative resource
```

App Platform Core owns only:

- Package / Feature lifecycle;
- dependency + capability graph;
- provider registration/discovery;
- provider selection hooks;
- scope/policy enforcement hooks;
- lifecycle durability;
- health/availability visibility;
- generic invocation boundaries.

Provider-specific business semantics, vendor SDKs, credentials, data models and user interfaces stay in plugins.

## 3. Provider contribution contract

A Feature that implements a platform capability may contribute:

```text
kind = platform.service-provider
providerId
capability
providerContract
providerContractVersion
binding
health
metadata
```

Consumers depend on the **capability contract**, not on a concrete provider package.

Example:

```text
Feature: enterprise-agent.runtime
requiresCapabilities:
  - llm.inference

Installed providers:
  - openai-provider → llm.inference
  - local-model-provider → llm.inference
```

Which provider becomes effective is a policy/scope decision, not a source-code dependency.

## 4. LLM as plugins

LLM integration MUST NOT be hard-coded into App Platform Core.

Candidate capability vocabulary:

```text
llm.inference
llm.streaming
llm.embedding
llm.structured-output
llm.tool-calling
llm.model-catalog
llm.usage-metering
```

Candidate packages:

```text
openai-provider
anthropic-provider
local-llm-provider
enterprise-model-gateway
```

A provider may expose one or multiple capabilities.

The platform must allow:

- multiple installed providers;
- multiple models per provider;
- scope-aware default selection;
- explicit provider/model override where policy allows;
- health and availability reporting;
- credentials/configuration outside source code;
- usage/cost telemetry through public contracts;
- replacement without changing consuming Apps/Agents.

Agents consume `llm.*` capabilities, never vendor SDKs directly.

## 5. Identity and multi-user login as plugins

Authentication is a platform capability family, not a hard-coded login implementation.

Candidate capability vocabulary:

```text
identity.authenticate
identity.session
identity.user-directory
identity.password
identity.mfa
identity.oauth
identity.oidc
identity.saml
identity.passkey
identity.provisioning
```

Possible provider packages:

```text
local-identity-provider
google-oidc-provider
microsoft-entra-provider
enterprise-saml-provider
passkey-provider
```

The Core may define generic authenticated-principal/session contracts, but MUST NOT own provider-specific login flows.

Login Experiences are Eidos Experiences contributed by the provider or a composition plugin.

Disabling/removing an identity provider must be dependency-safe and must not silently orphan active sessions or users; transition policy must be explicit.

## 6. Enterprise / organization capabilities as plugins

Enterprise semantics MUST NOT be permanently embedded in App Host or App Platform Core.

Candidate capability vocabulary:

```text
enterprise.directory
enterprise.organization
enterprise.membership
enterprise.scope
enterprise.policy
enterprise.profile
enterprise.hierarchy
enterprise.settings
```

A deployment may use:

- a built-in reference enterprise provider;
- an external HR/Directory adapter;
- an ERP/master-data provider;
- a customer-specific enterprise model plugin.

Apps depend on stable enterprise capability contracts rather than concrete enterprise table layouts.

This allows enterprise semantics to evolve without rewriting App Host, Eidos or EVO Ledger Runtime.

## 7. Localization boundary

Localization itself is **not** a platform Provider requirement.

Eidos/App Host owns locale-aware rendering contracts and deterministic resource resolution. Each human-facing Package owns its own language resources through `eidos.localization-bundle` Contributions.

A future locale preference/policy service may become a Provider only if a concrete independent lifecycle is needed (for example enterprise-enforced locale policy or roaming user preferences). Do not create such a Provider speculatively.

See `docs/architecture/APP-OWNED-LOCALIZATION-v0.1.md`.

## 8. Scope and provider selection

Provider selection may vary by activation scope:

```text
SYSTEM
INSTALLATION
ENTERPRISE
COMPANY
WORKSPACE
USER
```

Example:

```text
SYSTEM default LLM = openai-provider
ENTERPRISE A override = enterprise-model-gateway
USER locale = zh-CN
ENTERPRISE B identity = entra-provider
```

Scope selection is policy-driven and deterministic. Capability consumers must not guess which provider to use.

## 9. Multiple providers are normal

The platform MUST assume that several providers for the same capability may be installed simultaneously.

Therefore provider resolution eventually needs:

- provider identity;
- capability + contract version compatibility;
- scope;
- priority/default policy;
- explicit binding where required;
- health/availability;
- deterministic conflict handling;
- auditability.

Installing a second provider must not silently replace the first without an explicit resolution rule.

## 10. Security and secrets

Provider credentials are not Package Manifest data.

The provider contract may refer to configuration/secret keys, but secret material belongs to a secure configuration/secrets boundary.

Plugins MUST NOT require secrets to be committed into source code or package manifests.

## 11. Eidos boundary

All human-facing provider configuration uses Eidos.

Examples:

- login screens;
- LLM provider/model settings;
- enterprise settings;
- language selector;
- provider health/configuration pages.

If Eidos cannot express the required interaction, Eidos is extended first and the provider plugin consumes the new capability.

## 12. EVO boundary

EVO Ledger Runtime does not own:

- users/sessions;
- identity providers;
- enterprise directory;
- LLM providers;
- localization.

EVO may receive stable scope identifiers or actor/context values through public contracts when required for routing/audit, but these platform services remain outside Ledger Runtime.

## 13. Reserved package examples

```text
openai-provider
type: PLATFORM_PROVIDER
provides:
  - llm.inference
  - llm.streaming
  - llm.structured-output
  - llm.tool-calling

local-identity-provider
type: PLATFORM_PROVIDER
provides:
  - identity.authenticate
  - identity.session
  - identity.user-directory

enterprise-directory-provider
type: PLATFORM_PROVIDER
provides:
  - enterprise.directory
  - enterprise.membership
  - enterprise.scope
```

## 14. Admission test for Core changes

Before adding any new App Platform Core feature, answer:

1. Can an existing plugin/capability satisfy it?
2. Can a new PLATFORM_PROVIDER Package satisfy it?
3. Is the missing part actually an Eidos Experience capability?
4. Is the requested logic vendor/domain/policy specific?
5. Would putting it in Core reduce replaceability or create a permanent dependency?

Only the smallest generic provider-hosting mechanism may enter Core.

## 15. Long-term target

```text
                   App Platform Core
                         │
          capability/provider resolution
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
 Identity Providers   LLM Providers   Enterprise Providers
      │                  │                  │
      └──────────────────┼──────────────────┘
                         ▼
                Apps / Agents / Eidos
                         │
                         ▼
                     EVO Runtime
              (only when business facts
                require ledger execution)
```

This model is intentionally open-ended. Future platform capabilities should extend the same provider mechanism rather than creating new privileged subsystems.


### First executable LLM provider

The first reference implementation is:

```text
package: openai-llm-provider
type: PLATFORM_PROVIDER
providerId: openai.responses
provides:
  - llm.inference
  - llm.tool-calling
binding: IN_PROCESS
secret boundary:
  - OPENAI_API_KEY
model configuration:
  - OPENAI_MODEL
  - OPENAI_BASE_URL
```

Enterprise Agent consumes the generic `evo.llm.inference@0.1.0` contract and does not import the OpenAI runtime. A generic Provider Runtime Registry resolves active provider descriptors to configured runtimes. An installed descriptor without configured credentials is not considered an executable provider.


## Remote executable credential providers

REMOTE plugin authentication is also a Provider capability.

P0 capability:

```text
plugin.remote-credential
contract: evo.plugin.remote-credential@0.1.0
```

Reference Provider:

```text
host-remote-credential-provider
providerId: host.remote-bearer
binding: IN_PROCESS
secret boundary: APP_PLATFORM_REMOTE_BEARER_TOKENS_JSON
```

The reference Provider is intentionally simple and deployment-scoped. It proves the contract without making static bearer tokens the long-term identity architecture.

Future interchangeable Provider Packages may implement:

- OAuth 2.1 client credentials;
- workload identity federation;
- cloud IAM tokens;
- enterprise vault/KMS-issued credentials;
- mTLS workload credentials.

REMOTE Runtime consumes only the generic credential Provider contract.


## Provider resolution policy v0.1

Provider runtime selection is now explicit and scope-aware.

Resolution order is:

```text
USER
→ WORKSPACE
→ COMPANY
→ ENTERPRISE
→ INSTALLATION
→ SYSTEM
```

Rules:

- a matching explicit binding wins;
- a single executable candidate may be selected automatically;
- multiple executable candidates without an explicit binding fail closed with `PROVIDER_RESOLUTION_AMBIGUOUS`;
- an explicit binding whose Provider runtime is unavailable fails closed and MUST NOT silently fall back;
- binding state is Host-owned and may be persisted separately from Package manifests;
- consumers receive the resolved Provider runtime, not selection heuristics.

The default file-backed store is configured by `APP_PLATFORM_PROVIDER_BINDINGS_FILE`, or colocated with lifecycle state when available.

This policy is shared by LLM, Remote Credential and future Identity/Enterprise Provider families.


## Provider health posture and management

Provider resolution is health-aware, but health MUST NOT become an implicit failover policy.

Runtime health states:

```text
HEALTHY
DEGRADED
UNAVAILABLE
UNKNOWN
```

Rules:

- explicit binding + UNAVAILABLE runtime → fail closed;
- explicit binding + DEGRADED/UNKNOWN runtime → preserve the binding and expose health posture;
- multiple executable candidates without binding remain ambiguous even when one candidate appears healthier;
- the Host MUST NOT silently switch a governed binding because another Provider is healthier;
- a single unbound candidate may resolve and returns its health posture.

The App Host exposes Provider management through the existing Eidos settings/catalog capabilities:

```text
Settings
→ Provider Bindings
→ capability
→ Provider
→ scope
→ scopeId
→ priority
```

Binding policy remains Host-owned state and does not modify Package manifests.


## Active health probes and Provider administration governance

Health posture is observable runtime state, not Provider selection policy.

P0 active probe behavior:

- probes run only after an explicit Host administration request; App Platform does not perform hidden startup polling;
- a Provider Runtime may register a Host-owned executable health probe;
- probe results update the runtime registry as HEALTHY / DEGRADED / UNAVAILABLE / UNKNOWN;
- failed probes become UNAVAILABLE with a checkedAt timestamp;
- health never rewrites or silently fails over an explicit binding.

Binding mutation is a privileged Host operation. P0 now separates **authentication** from **authorization**:

- `APP_PLATFORM_PROVIDER_ADMIN_TOKEN` authenticates only the transitional `bootstrap-admin` Principal;
- the Host resolves the active `authorization.check` Provider through the same deterministic Provider resolution policy;
- the Authorization Provider receives `AuthorizationCheckV010` with Principal, Scope, action and resource;
- missing, ambiguous, unavailable or denying Authorization Providers fail closed;
- a correct bootstrap credential does not authorize an operation by itself.

The first executable reference implementation is the installable `host-static-authorization-provider`. Its policy is Host-owned JSON supplied through `APP_PLATFORM_AUTHORIZATION_POLICY_JSON`. Rules are explicit ALLOW/DENY, DENY overrides ALLOW, and unmatched requests deny by default.

The bootstrap secret remains transitional authentication only. It is not Package Manifest data, Provider state, policy state or audit data. A future Identity Provider/session boundary may replace bootstrap authentication without changing the authorization contract.

Provider governance audit is Host-owned and records only non-secret operational facts:

```text
eventId
occurredAt
action
outcome
actorId
correlationId
capability
providerId
scope / scopeId
reason
```

A JSONL audit sink may be configured with `APP_PLATFORM_PROVIDER_AUDIT_FILE`; when lifecycle state is file-backed, the default audit file is colocated with that state. Governance audit reads are themselves governed by `authorization.check`. The bootstrap credential may be presented through the `Authorization: Bearer ...` boundary to authenticate the Principal, but the policy Provider still decides whether `provider.governance.audit.read` is allowed. The credential is never returned or written to audit storage.

Reference governance actions are:

```text
provider.binding.update
provider.health.probe
provider.governance.audit.read
```

Example static policy:

```json
{
  "contractVersion": "0.1.0",
  "rules": [
    {
      "id": "provider-admin",
      "effect": "ALLOW",
      "actions": [
        "provider.binding.update",
        "provider.health.probe",
        "provider.governance.audit.read"
      ],
      "subjectIds": ["bootstrap-admin"]
    }
  ]
}
```

This example is reference policy data, not a universal role model. Enterprises may replace the Provider with their own policy engine while preserving the public authorization contract.
