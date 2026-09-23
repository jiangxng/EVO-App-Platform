# EVO App Platform Invariants

- **APP-01** App Manager must not import private implementation from any App.
- **APP-02** Apps must not depend on EVO private implementation.
- **APP-03** Apps must not depend on Eidos private implementation.
- **APP-04** Every installable App has a versioned machine-readable manifest.
- **APP-05** Install planning is side-effect free.
- **APP-06** Install/upgrade/deactivate/uninstall are explicit lifecycle transitions.
- **APP-07** A failed lifecycle operation must expose deterministic status and recovery information.
- **APP-08** Official and third-party Apps use the same compatibility model.
- **APP-09** Generic UI primitives belong to Eidos; Apps provide business-specific composition.
- **APP-10** Removing an App must not silently delete authoritative business history owned elsewhere.
- **APP-11** Cloud tenancy/storage topology is outside this repository's core responsibility.
- **APP-12** A capable LLM must reconstruct architecture and current status without prior chat history.
