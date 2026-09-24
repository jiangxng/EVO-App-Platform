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
- **APP-23** Product-level validation of an installable Package MUST begin from a state where the target Package/Feature is not already installed/active, inspect the side-effect-free install plan, execute lifecycle installation/activation through public App Manager contracts, verify Contributions/capabilities become effective, and only then validate business behavior. Skipping installation invalidates product-level acceptance evidence.\n- **APP-24** Human-facing EVO App/Configurator/business product surfaces MUST use Eidos public contracts/capabilities and supported renderer/runtime boundaries. Bespoke look-alike HTML/JS may be diagnostic tooling but cannot satisfy product UX acceptance.\n- **APP-25** App-specific product APIs and Experience assets MUST remain unavailable until their owning Feature is active; direct API access must not bypass Package/Feature lifecycle validation.\n- **APP-26** Eidos App Host is the canonical human-facing application container for EVO App Platform; installable Apps contribute Experiences into that Host instead of creating independent shells.
- **APP-27** Accepted MVP/proof work must converge into the long-lived main system with tests, CI and repository documentation; disposable parallel demo architecture is prohibited.
- **APP-28** Before implementing a new shell/runtime/capability, search for existing project assets and converge/reuse them when compatible; historical implementation is project capital.
- **APP-29** Standard product lifecycles MUST be closed-loop by default. When a conventional inverse/recovery transition is inherent to the capability (for example install/enable/disable/uninstall), engineering must implement or explicitly and safely block that transition without waiting for the human to enumerate it.
- **APP-30** An effective Experience is not product-accepted merely because its backend manifest/page asset exists; after lifecycle transitions it MUST be discoverable, navigable and renderable through the canonical Eidos App Host.
