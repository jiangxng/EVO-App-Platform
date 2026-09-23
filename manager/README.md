# App Manager

App Manager is the backend lifecycle authority for Packages and Features.

It remains generic: it may understand manifests, dependencies, capabilities, compatibility, Contributions and lifecycle state, but not Finance, Trading, Manufacturing or other app-specific semantics.

## Current MVP — 2026-09-23

Implemented:

- deterministic in-memory Package Catalog;
- Package/Feature contracts;
- side-effect-free `planInstall`;
- dependency/capability resolution foundation;
- Package installation state;
- default Feature activation;
- effective capability calculation;
- effective Eidos Experience Contribution discovery;
- effective page-asset loading;
- minimal HTTP API;
- Company Notes reference package;
- CI build/test validation.

Current persistence is intentionally in-memory. Durable persistence is required before production use, but is not blocking the first Agent-driven installation proof.

## Boundary

App Manager owns lifecycle state.

It does not own:

- EVO business truth;
- Eidos rendering;
- Enterprise Agent reasoning;
- business-app domain state.
