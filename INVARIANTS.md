# EVO App Platform Invariants

- **APP-01** App Manager must not import private implementation from any App.
- **APP-02** Apps must not depend on EVO private implementation.
- **APP-03** Apps must not depend on Eidos private implementation.
- **APP-04** Every installable Package has a versioned Package Manifest; every activatable Feature has a versioned Feature Manifest.
- **APP-05** Install planning is side-effect free.
- **APP-06** Install/upgrade/deactivate/uninstall are explicit lifecycle transitions.
- **APP-07** A failed lifecycle operation must expose deterministic status and recovery information.
- **APP-08** Official and third-party Apps use the same compatibility model.
- **APP-09** Generic UI primitives belong to Eidos; Apps provide business-specific composition.
- **APP-10** Removing an App must not silently delete authoritative business history owned elsewhere.
- **APP-11** Cloud tenancy/storage topology is outside this repository's core responsibility.
- **APP-12** A capable LLM must reconstruct architecture and current status without prior chat history.

- **APP-13** Package topology and repository topology are independent; App Manager must not infer lifecycle semantics from source-repository location.
- **APP-14** An Agent Package may use EVO, Eidos and App Platform only through public contracts/tools.
- **APP-15** Agent model replacement must not silently redefine durable role, memory semantics, knowledge provenance, methods or tool contracts.
- **APP-16** Knowledge/memory required by an Agent does not automatically justify a separate platform/project; separation requires an independent lifecycle or ownership boundary.

- **APP-17** Package installation and Feature activation are separate lifecycle concepts and must not be collapsed into one boolean state.
- **APP-18** Feature dependencies and provided/required capabilities are machine-readable and form a resolvable dependency graph.
- **APP-19** Activation Scope is an application/business activation boundary and must not imply cloud tenant or database topology.
- **APP-20** Lifecycle is declarative-first; arbitrary in-process installer/activation code is not the default extension mechanism.
- **APP-21** Generic consumers should depend on capabilities rather than concrete Feature identities when substitutability is intended.
- **APP-22** Contribution is the canonical term for concrete content/runtime registrations produced by a Feature.
