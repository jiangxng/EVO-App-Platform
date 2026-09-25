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
- **APP-31** Production Package/Feature lifecycle state MUST survive process restarts and deployments. In-memory lifecycle storage is test/development-only evidence and cannot satisfy production product acceptance.
- **APP-32** Plugin-First Extension: every new platform capability MUST first be evaluated as a Package/Feature/Capability/Contribution extension. App Platform Core may grow only with the smallest generic mechanism required to host, resolve, secure, lifecycle-manage or compose plugins; product/domain behavior must remain in plugins.
- **APP-33** Replaceable platform services such as LLM/model access, identity/authentication/session and enterprise/organization/membership MUST enter as provider plugins behind public capability contracts; vendor/domain-specific implementations MUST NOT be hard-coded into App Platform Core. Localization itself is an Eidos/App Host rendering standard with app-owned resources, not a mandatory Provider.
- **APP-34** Multiple providers for the same capability are a normal supported state. Provider selection MUST be explicit, scope-aware, version-compatible and deterministic; installing a new provider must not silently replace an existing provider.
- **APP-35** Provider credentials/secrets are never Package Manifest content or source-code constants. Provider packages reference secure configuration boundaries through public contracts.
- **APP-36** Enterprise software cross-cutting context uses public contracts such as Principal, Scope, AuthorizationDecision, EnterpriseContext and ProviderRef. Business Apps, Agents, Eidos Experiences and EVO integration code MUST NOT couple to provider-specific user/session/organization table layouts.
- **APP-37** Authorization is evaluated through an explicit authorization capability/provider boundary. Authentication success alone never implies authorization; policy decisions are scoped, auditable and deny-by-default when the required provider/capability is unavailable.
- **APP-38** Enterprise/customer scope is explicit context, not inferred from database placement, hostname or UI route. Enterprise/company/workspace/user scope identifiers cross module boundaries only through declared public contracts.
- **APP-39** Human-facing localization resources are owned by the package/Experience that owns the vocabulary. A central localization package MUST NOT own unrelated application strings. Locale policy/preferences may become a Provider only when a concrete independent lifecycle/ownership requirement exists.
- **APP-40** EVO App Platform human interaction is Agent-first by default: the canonical App Host may provide persistent assistant/chat and workspace panes, while installed applications remain directly inspectable/operable through Eidos. Agent-first MUST NOT hide or bypass the underlying public app/action contracts.
- **APP-41** Enterprise Agent ordinary user configuration is zero-config. Model/provider, identity, enterprise scope, locale and tool availability are resolved through platform contracts. Vendor-specific settings belong to the owning Provider Package, not the Agent Experience.
- **APP-42** Desktop multi-pane UX MUST have a coherent mobile single-pane equivalent. Normal Menu/Chat/Workspace workflows cannot require desktop-only width or pointer interactions.
- **APP-43** EVO App Platform Workbench uses a compact Activity Bar to select contexts/View Containers; application navigation remains a separate Side Panel view. Selecting the active side activity toggles the Side Panel rather than duplicating navigation chrome.
- **APP-44** Workbench Side Panel visibility/width/current workspace are user-interface state and SHOULD persist independently of business data. The main Workspace must remain usable when the Side Panel is hidden.
- **APP-45** A Package receives a standard Configure entry only when it declares an `eidos.settings` Contribution or an explicit advanced settings Experience. Plugins without configuration MUST NOT show decorative Settings affordances.
- **APP-46** Ordinary plugin Settings are declarative, typed and non-secret. Credentials/API keys/passwords MUST remain in the secure Secrets boundary and MUST NOT be persisted in the ordinary Settings store.

- **APP-47** Workbench Activity entries owned by installable products MUST be contributed through versioned `eidos.workbench-activity` Contributions. App Host MUST NOT hard-code product-specific Activity entries such as Enterprise Agent, Search or Notifications.
- **APP-48** The effective Workbench Activity set is lifecycle-derived. Install/enable may add Activities; disable/uninstall MUST remove them without requiring a shell remount. If the active Activity disappears, Eidos MUST reconcile to a deterministic host fallback and persisted UI state MUST NOT keep the removed capability effective.
- **APP-49** Workbench Activity IDs are globally unique within one effective host composition. Conflicts fail closed; extension-owned localized Activity labels use the owning Package namespace.

- **APP-50** Plugin Protocol is the stable integration boundary between App Platform and independently developed plugins. Ordinary plugin work MUST NOT require loading, building or testing unrelated plugins.
- **APP-51** Plugin CI is owner-local: manifest conformance + the plugin's own unit/integration/lifecycle tests + only its direct public-contract adapters. A plugin change MUST NOT recursively trigger unrelated plugin CI.
- **APP-52** App Platform PR CI validates platform core, Plugin Protocol and synthetic reference fixtures. Full plugin-portfolio compatibility belongs to a separate Ecosystem Certification gate, not the ordinary platform feedback loop.
- **APP-53** EVO Ledger Runtime, Eidos, Enterprise Agent/EC and other large capabilities are consumed by plugins only through public versioned contracts/capabilities. Their private implementations and full CI suites are never implicit plugin test dependencies.
- **APP-54** A material Plugin Protocol change requires explicit versioning and ecosystem certification. Until protocol 1.0, plugins pin the exact protocol version rather than assuming pre-1.0 compatibility.

- **APP-55** Until Plugin Platform foundation reaches a stable compatibility baseline, the primary integration mainline is EVO App Platform + Eidos. EVO Ledger Runtime, Enterprise Agent/EC, providers and business plugins are not default mainline CI dependencies.
- **APP-56** A change to one plugin MUST NOT trigger unrelated plugin projects. The default cross-project integration gate is App Platform ↔ Eidos only; broader ecosystem runs are explicit certification.
- **APP-57** Human-facing plugin discovery/lifecycle management uses Eidos public Extension Manager/Workbench capabilities. App Platform owns data and lifecycle semantics but MUST NOT create a parallel bespoke UI framework.

- **APP-58** EVO Plugin Protocol is the native internal plugin/mini-app protocol. MCP is an external interoperability protocol and MUST NOT become a mandatory hop for ordinary native plugin execution.
- **APP-59** OAuth/OIDC belong to delegated external authorization/identity boundaries. Native first-party plugins MUST NOT be forced through OAuth merely to call same-platform public capabilities.
- **APP-60** Internal plugin runtime, permissions, storage/events and Eidos Contributions evolve as App Platform/Eidos public contracts. External MCP/HTTP adapters remain separable plugins or provider capabilities behind those contracts.

- **APP-61** EVO App Platform does not own ordinary App Host/Workbench visual language. It consumes Eidos public design tokens/styles and supplies lifecycle/content data. Plugin products inherit Eidos standard spacing, button hierarchy, focus and shell geometry unless a domain-specific Eidos capability explicitly permits otherwise.

- **APP-62** Standard App Host/Workbench icons are semantic Eidos Icon Registry names. App Platform and ordinary plugins MUST NOT use raw Unicode glyphs, arbitrary copied SVG, or independent icon-library dependencies for standard host chrome when an Eidos semantic icon exists.
