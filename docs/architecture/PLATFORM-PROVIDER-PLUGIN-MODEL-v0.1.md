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
- localization/language providers;
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

## 7. Localization as a plugin

Localization is a PLATFORM_PROVIDER capability.

Eidos owns only localization-aware Experience contracts/rendering hooks. It does not own product translation resources.

Candidate capabilities:

```text
localization.locale
localization.resources
localization.format
```

A localization plugin owns:

- available locales;
- locale selection policy;
- translation bundles;
- fallback chain;
- number/date/currency formatting profile;
- persistence of user/enterprise locale preference where appropriate.

Initial reference package:

```text
evo-localization
locales:
  - zh-CN
  - en
```

Additional languages are installed or upgraded as resources/features without changing business logic.

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
evo-localization
type: PLATFORM_PROVIDER
provides:
  - localization.locale
  - localization.resources
  - localization.format

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
