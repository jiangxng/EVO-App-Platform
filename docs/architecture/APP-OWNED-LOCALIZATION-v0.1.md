# App-owned Localization Model v0.1

**Status:** Architecture baseline  
**Date:** 2026-09-24  
**Authority:** EVO App Platform packaging and contribution rules; Eidos owns localization rendering contracts.

## 1. Correction to the first evo-localization experiment

The first `evo-localization` reference package registered:

```text
localization.locale
localization.resources
localization.format
```

but did not make App Host locale-aware and did not provide an ownership model for application strings. It therefore produced no visible product effect.

That model is superseded.

## 2. Canonical model

```text
Eidos
  LocalizedText + LocalizationBundle + resolver standard
        ↓
Eidos App Host
  current locale + fallback + rendering
        ↓
Installed plugin A ── owns namespace A bundles
Installed plugin B ── owns namespace B bundles
Installed plugin C ── owns namespace C bundles
        ↑
optional Locale Preference / Policy Provider
```

The host defines the protocol. Each plugin implements its own vocabulary.

## 3. Package contribution

App Platform adds a generic contribution:

```text
kind: eidos.localization-bundle
bundle:
  contractVersion
  namespace
  locale
  messages
```

Ordinary rule:

```text
bundle.namespace == contributing packageId
```

The bundle becomes effective only while its owning Feature is active.

## 4. Plugin responsibilities

Any package with human-facing Eidos Experience SHOULD provide:

- a stable namespace;
- one declared default language;
- bundles for supported locales;
- `LocalizedText` keys/fallbacks in navigation/pages/components;
- localized human-facing action labels and help text.

Business logic, command codes, field keys, semantic types and machine identifiers are never translated.

## 5. App Host responsibilities

App Host owns:

- current locale;
- fallback locale chain;
- language switch surface;
- bundle discovery from effective active packages;
- resolver assembly;
- locale propagation to Eidos renderers;
- locale-change rerender;
- host-shell vocabulary such as navigation/status/error chrome.

App Host does not author the translation content of installed applications.

## 6. evo-localization is retired

The experimental `evo-localization` Package has no independent product responsibility after the ownership model above is applied, so it is removed from the Catalog rather than repurposed.

Current rule:

- App Host/Eidos supplies the localization standard and current locale.
- Each Package supplies its own resource bundles.
- No separate localization Package is required.

If a future enterprise requirement introduces an independently lifecycle-managed locale policy/preference service, that service must be designed from the concrete requirement and may then become a Provider. The retired `evo-localization` package name/contract is not reserved as an architectural obligation.

## 7. Language packs

A package SHOULD ship its primary supported languages itself.

Future third-party/community language packs may extend another package only through an explicit extension contract with:

- target package/version;
- target namespace;
- precedence rule;
- provenance;
- compatibility validation.

Silent overriding is forbidden.

## 8. Host text vs plugin text

### Host-owned

Examples:

- "Applications"
- App Host status
- route-not-found
- generic execution states
- generic confirmation chrome

These belong to Eidos/App Host host resources.

### Plugin-owned

Examples:

- Plugin Store product-specific wording
- Ledger Configurator field/action names
- Enterprise Agent page labels
- Trading Lite vocabulary

These belong to the owning package namespace.

The Plugin Store is a host/platform Experience, so its platform-specific vocabulary is owned by App Platform, not by `evo-localization`.

## 9. Data values are not translation strings

Customer names, item descriptions, account names, user-entered text and backend business facts are data. They are not translated automatically by the UI localization layer.

If a domain wants multilingual master data, that is a separate business-data capability.

## 10. Migration

1. add Eidos localization contract/runtime;
2. add `eidos.localization-bundle` contribution to App Platform;
3. make App Host fetch effective bundles;
4. add locale switch and rerender;
5. migrate Plugin Store, Enterprise Agent and Ledger Configurator to localized text refs;
6. remove `evo-localization` from the Catalog and explicitly retire any experimental persisted lifecycle state;
7. add future locale policy/preference Providers only from a concrete independent requirement.

## 11. Acceptance gate

Do not call localization complete until this exact scenario works in Railway:

```text
open App Host
→ install Enterprise Agent and Ledger Configurator
→ switch zh-CN / en
→ host chrome changes
→ Enterprise Agent text changes from its own bundle
→ Ledger Configurator text changes from its own bundle
→ disable one plugin
→ its route/resources disappear
→ remaining plugin continues to localize
```
