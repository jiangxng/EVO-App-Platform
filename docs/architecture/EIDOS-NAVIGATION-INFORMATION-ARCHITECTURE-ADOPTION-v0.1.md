# Eidos Navigation & Information Architecture Adoption v0.1

**Status:** Current App Platform adoption authority
**Owner boundary:** Eidos owns generic navigation/Experience semantics; EVO App Platform owns product-specific placement decisions.

## Product rule

The App Platform does not expose every installed or active capability as persistent navigation.

Canonical placement:

- **Primary work:** frequent work only.
- **Application/domain:** ordinary business application navigation.
- **Business administration:** enterprise and ledger/business-definition management.
- **Settings / system administration:** plugins, Providers, credentials and other low-frequency platform configuration.
- **AI & knowledge:** Memory and future knowledge/AI infrastructure.
- **Contextual professional tools:** graph designers/viewers, Observatory, diagnostics and advanced editors.
- **Long tail:** Search / Agent / explicit deep link.

## Current Workbench projection

Primary Activity Bar:

- Applications
- Workspace

Secondary Activity Bar:

- Help
- Settings

The App Platform intentionally does **not** place Plugins or Memory in the Activity Bar.

The Applications side panel is allowed to be empty. It must not be filled with administration/system destinations merely to avoid empty space.

## Help Center placement

Help is a secondary utility entry, but the Help Center itself is a full workspace Experience.

- clicking Help opens `/help` in the primary workspace;
- the side panel must not host the complete Help catalog or article body;
- lightweight help navigation, outline, recent items or contextual suggestions may use a side panel in the future;
- ordinary Help cards use Human-facing title, summary, category and action first;
- package owner, locale, capability ids, error codes and similar technical metadata are progressively disclosed rather than placed on every business-facing card.

This keeps the left area for navigation/context and the main workspace for substantive reading and work.

## Current Settings hierarchy

```text
Settings
├─ Business administration
│  ├─ Enterprise
│  └─ Ledger management
├─ Applications & extensions
│  ├─ Plugins
│  └─ Template Store
├─ AI & knowledge
│  └─ Memory
└─ System
   ├─ Provider bindings
   └─ installed-package settings / credentials
```

Individual tools retain their routes/capabilities. Moving them in the information architecture does not delete functionality.

## Single-placement rule

A destination already assigned to a persistent Activity or Settings hierarchy must not also be contributed to the flat Applications navigation unless a distinct high-frequency Human goal justifies that duplicate.

## Capability is not navigation

```text
installed
≠ active
≠ capability available
≠ route exists
≠ Agent discoverable
≠ persistent navigation visible
```

## Default landing

The product opens a neutral Workspace route. It must not use Plugin Store, Provider administration, diagnostics or another system-management page as the default landing merely because no business application is currently open.

## Future evolution

When richer Eidos navigation placement contracts become available, migrate these product rules into declared placement semantics rather than rebuilding plugin-private menu systems.

Authority upstream: Eidos `EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md` and `EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`.
