# Plugin Platform Mainline v0.1

**Status:** P0 mainline  
**Date:** 2026-09-25  
**Primary integration:** EVO App Platform + Eidos

## Decision

Until the plugin foundation is stable, the primary product/engineering mainline is:

    EVO App Platform
      owns Plugin Protocol / catalog / lifecycle / capability graph / compatibility
            |
            | public Eidos contracts
            v
    Eidos
      owns Workbench / Extension Manager / Contribution rendering / Settings / localization

EVO Ledger Runtime, Enterprise Agent/EC, providers, business Apps and configurators are consumers/plugins around this boundary. They are not default CI dependencies of the mainline.

## Mainstream reference model

The design follows the common architecture seen in mature extension systems:

1. Manifest first — plugin identity/version/compatibility are declared before runtime code.
2. Contribution Points — UI/settings/tools are registered declaratively.
3. Stable Host API — plugins consume public host contracts rather than host internals.
4. Lazy activation — executable plugin runtime starts only when a declared capability/action is needed.
5. Runtime isolation — a faulty plugin must not crash or block the host UI.
6. Lifecycle + trust — install/enable/disable/uninstall and authorization are explicit.
7. Independent packaging and CI — one plugin is one engineering/test unit.
8. Marketplace/catalog is separate from runtime — discovery metadata does not imply execution authority.

VS Code is the strongest reference for manifest + Contribution Points + Extension Host isolation. Cursor demonstrates the value of ecosystem compatibility. ChatGPT's current plugin model reinforces a small installable package composed from declared skills/tools/MCP/UI with authorization remaining separate.

We adopt these principles, not another product's exact schema.

## EVO mapping

| Mature extension concept | EVO |
| --- | --- |
| extension manifest | Package Manifest |
| contributes | Feature Contributions |
| extension dependencies | requiresCapabilities / requiresFeatures |
| extension API | App Platform + Eidos public contracts |
| activation | Feature/runtime activation |
| extension host | future isolated Plugin Runtime Host |
| Extensions view | Eidos Extension Manager |
| Marketplace | App Catalog / future Plugin Directory |

## Current Plugin Protocol v0.1

Package -> Feature -> requires/provides Capability -> Contribution.

Current first-class Contribution Points:

- eidos.experience
- eidos.localization-bundle
- eidos.workbench-activity
- eidos.settings
- platform.service-provider

More Contribution Points may be added only through a versioned protocol change.

## CI constitution

Default mainline integration is only App Platform protocol/lifecycle + Eidos public runtime/rendering.

For a Plugin X change: run Plugin X protocol conformance, its direct public-contract adapters and Plugin X tests. Do not run Plugin Y/Z or the whole ecosystem.

A material Plugin Protocol change triggers separate Ecosystem Certification. It does not turn full-portfolio testing into the ordinary PR loop.

Eidos runs Eidos CI. App Platform runs the focused App Platform ↔ Eidos integration when its pinned Eidos public snapshot changes.

## Testable product surface

`/store` is the canonical Plugin Platform test surface.

It is rendered by Eidos `extension-manager`, while App Platform supplies current Plugin Protocol version, lifecycle state, compatibility state, Contribution Point summary, required/provided capabilities and lifecycle actions.

This page is permanent product infrastructure, not a throwaway demo.

## Next protocol work

After the declarative App Platform + Eidos mainline is stable:

1. explicit host compatibility range (equivalent in purpose to VS Code engines.vscode);
2. runtime activation events;
3. isolated Plugin Runtime Host;
4. permission/trust declarations;
5. signed artifacts/integrity;
6. private/public catalog and update channels.

Do not implement these by coupling existing plugins back into App Platform Core.
