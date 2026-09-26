# EVO Workbench v0.1

**Status:** Architecture baseline  
**Date:** 2026-09-24  
**Owner split:** Eidos owns Workbench/Settings UI contracts; EVO App Platform owns activities, plugin lifecycle, settings persistence and provider semantics.

## 1. Product intent

EVO is a long-lived enterprise operating environment, not a collection of independent pages.

The canonical desktop shell is a Workbench:

    Activity Bar | Side Panel | splitter | Main Workspace
    ----------------------------------------------------
    context      | current    |    ↔     | Eidos App / Configurator / Browser
    ----------------------------------------------------
    Status Bar

The design is influenced by mature IDE/workbench patterns, but EVO keeps its own enterprise/Agent semantics.

## 2. Activity Bar

Activity Bar is narrow and persistent.

Platform-owned Activities:

- Apps → navigation View Container
- Plugins → Plugin Store workspace route
- Workspace → maximize/focus current workspace
- Settings → Settings workspace route

Product Activities are lifecycle contributions. For example, Enterprise Agent contributes its own `eidos.workbench-activity` entry targeting `/enterprise-agent`; App Host does not hard-code an Agent slot. The same mechanism is the required path for future Search, Notifications, approvals or knowledge tools.

An Activity is a **context selector**, not a duplicated App navigation entry.

Selecting the currently active side-panel Activity toggles the Side Panel closed/open.

The effective Activity set is recomputed from active Features. Install/enable can add entries and disable/uninstall removes them at runtime without remounting the Workbench. If the active contributed Activity disappears, Eidos falls back deterministically to the host default Activity. Duplicate IDs and malformed route Activities fail closed.

## 3. Side Panel

Side Panel hosts contextual views such as installed App navigation, Enterprise Agent, future Search, Notifications, Outline and context views.

It is hideable, draggable, keyboard-resizable and its width/active Activity may persist as non-authoritative UI state. When hidden, Workspace consumes the available width.

## 4. Main Workspace

Workspace is the dominant product surface. It can render internal Eidos routes, Configurators, business Apps, Plugin Store, Settings and allowed external http(s) content.

External pages never bypass App Platform identity/authorization and never become enterprise business truth.

## 5. Status Bar

Status Bar is lightweight context only. Initial responsibilities are App Host/workbench state and current workspace/page title. Future contributions require a versioned contract; arbitrary DOM injection is not allowed.

## 6. Mobile

At narrow widths the model becomes Activity Bar + one visible working surface. Apps/Agent Activities open Side Panel; selecting an App/Plugins/Settings opens Workspace. State is preserved and no desktop pointer-only step may be required for a normal workflow.

## 7. Workbench state persistence

Persistable UI state:

- activeActivityId
- sidePanelVisible
- sidePanelWidth
- workspaceTarget
- locale (existing App Host preference)

This is user-interface state only. It must never be business truth, authorization input, enterprise scope, or Package lifecycle state. Failure to persist layout is non-fatal.

## 8. Plugin configuration

A Package does **not** automatically get a Configure button.

### Simple configuration

Package contributes `kind: eidos.settings` with its own namespace and typed properties.

Flow: installed Package → Settings Contribution discovered → /settings/<packageId> → Eidos Settings Editor → ActionHost → durable SettingsStore → owning runtime reload when needed.

### Complex configuration

Complex domain configuration remains a dedicated Eidos Experience, for example Ledger Runtime Configurator, workflow designer, or industry-specific rule editor.

### Secrets

Secrets are not Settings. API keys, OAuth secrets, private keys, passwords and tokens remain in the secure Secrets boundary.

The first real Settings sample is `openai-llm-provider`: model and baseUrl are ordinary settings; OPENAI_API_KEY is a secret and never ordinary Settings.

## 9. Provider reload

When a non-secret setting affects an in-process Provider runtime:

    save Settings
    → validate against declared schema
    → persist
    → rebuild/replace Provider runtime
    → next Agent request sees new configuration

A successful Settings save must not falsely imply a runtime update if the Provider still uses stale configuration.

## 10. Plugin Store integration

Plugin Store lifecycle actions remain primary: Install / Enable / Disable / Uninstall.

Configure appears only when configuration actually exists. No decorative gear icon is permitted for a Package with nothing to configure.

## 11. Agent relationship

Enterprise Agent remains zero-config for ordinary users. Agent activity opens the Chat Experience in Side Panel. Provider/vendor settings belong to the Provider Package and Settings system, not Enterprise Agent.

Target operating loop: Human intent → Agent inspects/reasons → right Workspace opens evidence/configuration → Agent prepares change → human confirms material side effect → platform executes through public contract.

## 12. Acceptance gate

Workbench v0.1 is accepted only when:

1. Activity Bar is visibly narrow;
2. Apps and any installed side-view contribution (including Enterprise Agent when enabled) can switch Side Panel content;
3. selecting the active side Activity hides the Side Panel;
4. dragging splitter changes Side Panel/Workspace proportions;
5. layout restores after reload;
6. Plugin Store and Settings open in Workspace;
7. only configurable plugins show Configure;
8. OpenAI model/base URL Settings persist;
9. API key is absent from ordinary Settings;
10. mobile remains operable with Activity Bar + one visible surface;
11. all surfaces still use Eidos public contracts;
12. Enterprise Agent is absent from Activity Bar before install, appears after activation, disappears after disable/uninstall, and returns after enable without shell remount;
13. App Host source contains no product-specific Enterprise Agent Activity constant;
14. transient Activity refresh failure keeps the last known good Activity set instead of erasing extension UI.


## 13. Platform Help

Platform Help is a stable secondary Workbench activity.

```text
Activity Bar (secondary)
  Help
    ↓
Side Panel
  searchable Help catalog
    ↓ select article
Main Workspace
  Eidos help-document
```

The Help Side Panel reuses Eidos `catalog-browser` with deterministic local filtering. App Platform supplies only documents already admitted to the Help corpus; client-side filtering is presentation behavior and never an authorization boundary.

Help article rendering uses Eidos `help-document@0.1.0`. App Platform compiles repository-owned Help Markdown into safe semantic blocks; arbitrary Help HTML/JavaScript is not executed.

P0 Help remains available without Agent, embedding service or external network search.

Authority: `docs/architecture/PLATFORM-HELP-SYSTEM-v0.1.md`.
