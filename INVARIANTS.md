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

- **APP-63** A Package that declares incompatible App Platform/Eidos/Plugin Protocol host ranges MUST fail admission. Missing ranges are backward-compatible but explicitly reported as unknown compatibility.
- **APP-64** User-facing confirmation is not authorization by itself. Publisher-trust and permission approval MUST be enforced server-side and persisted with installation state.
- **APP-65** Executable plugin runtimes fail closed until an actual isolated Runtime Host exists. DECLARATIVE/HOST is the only executable P0 runtime; WORKER/REMOTE declarations are recognized but not silently executed in-process.
- **APP-66** Plugin Storage and Events are accessed through package-scoped Host API facades. A plugin MUST NOT choose another package namespace or publish/subscribe undeclared event topics.
- **APP-67** ON_DEMAND Feature activation keeps the Feature inactive at install time and activates only from declared host activation events.

- **APP-68** App Platform MUST NOT import PROCESS plugin entrypoints into the Host process. PROCESS plugins execute in a supervised child process and interact with the Host only through a package-scoped IPC capability facade.
- **APP-69** WORKER isolation is not a hostile-code security boundary and MUST NOT be described or admitted as one. Local executable PROCESS runtime is limited to FIRST_PARTY/VERIFIED publishers; UNVERIFIED executable code remains fail-closed.
- **APP-70** PROCESS runtime failure is contained: invocation timeout/crash terminates or loses only the plugin process, pending calls fail deterministically, and a later invocation may start a clean process.
- **APP-71** Host secrets are not inherited wholesale by plugin processes. PROCESS runtime environment is minimized and privileged state crosses only explicit scoped Host APIs.
- **APP-72** PROCESS runtime resource budgets are explicit. P0 timeout and V8 heap budgets MUST NOT be misrepresented as complete OS/container resource isolation.

- **APP-73** Package publisher identity is not self-authenticating. Signed Package admission MUST verify against a Host-owned trusted publisher key store; a Package-provided key cannot establish its own trust.
- **APP-74** PROCESS runtime execution requires a trusted cryptographic Package signature and a signed PROCESS_ENTRYPOINT digest. The Host MUST re-hash the actual entrypoint bytes before execution.
- **APP-75** Invalid, tampered, unknown-key or revoked-key signed Packages fail closed. Unsigned declarative Packages are only a pre-1.0 compatibility allowance and MUST NOT be inferred as the long-term distribution trust model.
- **APP-76** Provenance metadata is signed evidence metadata, not proof by itself. External OIDC/Sigstore provenance is considered verified only after its own verification procedure is implemented.
- **APP-77** Plugin Runtime observability is structured Host data, not console-log parsing. Runtime lifecycle/invocation events and aggregate health are owned by App Platform; Eidos only renders supplied diagnostics.
- **APP-78** Runtime observability storage is bounded by default. P0 in-memory diagnostics MUST NOT be represented as durable audit history, distributed tracing or an SLO system.

- **APP-79** REMOTE runtime credentials are Host-provided capabilities. Package Manifests MUST NOT contain bearer tokens or long-lived authentication secrets.
- **APP-80** REMOTE P0 uses `hostAccess: NONE`. A remote plugin receives only explicit invocation input and MUST NOT receive generic callbacks into Host Storage, Events, Secrets, Catalog or lifecycle internals.
- **APP-81** REMOTE invocation fails closed on unsigned/untrusted Package metadata, non-HTTPS production endpoints, empty credentials, redirects, timeout, HTTP failure or response-correlation mismatch.
- **APP-82** The existence of the REMOTE adapter does not imply platform install readiness. App Manager admission remains blocked until the required remote credential-provider capability is deterministically bound.

- **APP-83** Plugin Protocol MUST expose portable, versioned Package/Feature manifest schemas that do not require importing App Platform private implementation. Independent plugin repositories and LLM tooling may use these schemas as their structural contract.
- **APP-84** JSON Schema structural validity is necessary but not sufficient. Canonical semantic validation remains responsible for cross-field ownership, namespace, runtime-security and admission rules that cannot be safely inferred from structure alone.
- **APP-85** Package/Feature schema and semantic validator versions MUST move together. An incompatible manifest-schema change requires an explicit Plugin Protocol version change rather than silent drift.

- **APP-89** Executable plugin invocation MUST pass through the Host-owned Plugin Runtime Dispatcher. Product/plugin code MUST NOT instantiate PROCESS/REMOTE runtime mechanics directly when the dispatcher can provide the admitted path.
- **APP-90** Runtime Dispatcher invocation requires an installed Package and at least one active Feature owned by that Package. Runtime execution MUST NOT bypass lifecycle state.
- **APP-91** App Platform MUST NOT expose a generic unauthenticated arbitrary plugin-method HTTP endpoint. Human/product actions enter through governed Action/Capability contracts; executable runtime dispatch remains an internal implementation boundary.
- **APP-92** Runtime observability exporters are sinks, not execution dependencies. Telemetry sink failure MUST NOT break plugin execution or mutate runtime admission semantics.

- **APP-93** SLSA provenance carried by a Package is admission evidence, not descriptive metadata. When present, its in-toto Statement subject MUST bind the declared artifact digest and Host-configured builder/build-type expectations MUST fail closed on mismatch.
- **APP-94** Supply-chain roots of trust are Host-owned. Package manifests MUST NOT self-authorize builder identity, signing key trust or accepted build type.
- **APP-95** External Sigstore/SLSA tooling may provide evidence, but EVO Plugin Protocol remains provider-neutral. Transparency-log/OIDC verification must enter through an explicit verifier boundary rather than becoming an implicit network dependency of ordinary plugin loading.

- **APP-96** REMOTE runtime credentials are provided through the generic `plugin.remote-credential` Provider capability. REMOTE Package manifests MUST NOT contain bearer tokens or long-lived credential material.
- **APP-97** A REMOTE Package is runtime-ready only when both an active credential Provider descriptor and a registered matching Provider Runtime exist. Descriptor-only or runtime-only state MUST remain fail-closed.
- **APP-98** Extension Manager runtime history is an operator projection of App Platform runtime facts. Eidos MUST NOT synthesize runtime health/history from browser state.

- **APP-99** A Package declaring `SIGSTORE_BUNDLE` provenance MUST pass external Sigstore verification before PROCESS execution. Missing verifier configuration or failed verification MUST fail closed.
- **APP-100** Sigstore certificate issuer and identity expectations are Host-owned trust policy. Package-provided evidence MUST NOT define its own acceptance policy.
- **APP-101** Sigstore evidence augments, rather than replaces, native EVO Package signature and artifact-digest verification. Native integrity MUST verify first.

- **APP-86** App Platform dependency resolution is lockfile-authoritative. `package-lock.json` MUST be committed and CI/container builds MUST use `npm ci`; unconstrained dependency resolution is not an accepted build path.
- **APP-87** Dependency lockfiles are generated by the package manager and verified by a frozen install. LLMs MUST NOT synthesize or hand-edit resolved dependency graphs as a substitute for package-manager resolution.
- **APP-88** Dependency and runtime-toolchain changes belong to Platform CI only unless a public contract change independently requires ecosystem certification.

- **APP-102** Provider resolution MUST be deterministic and scope-aware. Specific scope bindings override broader bindings in USER → WORKSPACE → COMPANY → ENTERPRISE → INSTALLATION → SYSTEM order.
- **APP-103** Multiple executable Providers for the same capability without an applicable explicit binding MUST fail closed as ambiguous. ProviderId lexical order MUST NOT silently choose business/platform behavior.
- **APP-104** An explicit Provider binding whose runtime is unavailable MUST fail closed; resolution MUST NOT silently fall back to a different Provider.

- **APP-105** Provider health informs readiness and operator visibility but MUST NOT silently rewrite Provider policy. An unhealthy explicitly bound Provider fails closed rather than causing automatic failover.
- **APP-106** Provider management state is Host-owned policy. Binding edits MUST NOT mutate Package manifests or provider package source.
- **APP-107** Provider management UI MUST expose capability, candidate Provider, scope and effective health/resolution posture using Eidos capabilities rather than a parallel host-specific UI framework.


- **APP-108** Provider health probes are explicit Host-executed operations. Probe results update observable runtime posture but MUST NOT silently change Provider binding policy or selection.
- **APP-109** Provider binding mutation is a privileged Host administration action. Authorization MUST be enforced server-side and fail closed when no administration authorization mechanism is configured.
- **APP-110** Provider governance changes and active health probes MUST emit bounded/durable operator audit records with correlation, actor, target and outcome; secrets and raw authorization credentials MUST NOT be recorded.
- **APP-111** The P0 bootstrap administrator secret is transitional authentication only. It MUST remain outside Package manifests, Provider binding state, authorization policy state and audit history; possession of the secret alone MUST NOT imply authorization.

- **APP-112** Privileged Provider governance actions MUST resolve through the generic `authorization.check` Provider after Principal authentication. Missing, ambiguous, unavailable, errored or denying authorization resolution MUST fail closed.
- **APP-113** App Platform MUST NOT convert authentication success into an allow decision. The Authorization Provider owns the allow/deny decision and the Host may only enforce it more strictly, never upgrade DENY to ALLOW.
- **APP-114** Reference authorization policy is Host-owned configuration supplied to an installable Provider Package. A Package MUST NOT self-authorize its own policy, Principal, Provider binding or administrative action.
- **APP-115** Provider governance audit MUST record the policy Provider identity and non-secret reason codes used for each allow/deny decision when available.
- **APP-116** The reference static authorization Provider is deny-by-default and uses explicit policy rules. Its concrete rule syntax is replaceable implementation detail; consumers depend only on `AuthorizationCheckV010` / `AuthorizationDecisionV010`.

- **APP-117** Platform Help is governed product knowledge, not chat memory or an unversioned FAQ. Human and LLM consumers SHOULD converge on the same canonical version-aware Help sources.
- **APP-118** Eidos owns generic Help rendering semantics; App Platform owns Help aggregation, indexing, context and governance; each Package owns Help for the behavior and vocabulary it introduces.
- **APP-119** Help content is declarative and non-executable. Arbitrary HTML/JavaScript from Help sources MUST NOT execute in the App Host.
- **APP-120** Client-side Help/catalog search is presentation filtering only and MUST NOT be treated as an authorization boundary. Restricted Help must be filtered by the Host before it reaches Eidos.
- **APP-121** A material user-visible behavior, contract, setting, error, compatibility, security or migration change is incomplete until Help impact is classified and required Help changes pass governance validation.

- **APP-122** Help localization is variant-based and identity-stable. Locale variants of one Help document MUST share the same document ID, route and machine semantics; locale resolution is per document with deterministic fallback, so one missing translation MUST NOT remove unrelated Help from the effective index.
- **APP-123** Eidos Productive Design Language is mandatory for ordinary App Platform human surfaces. App Platform supplies semantics/content/lifecycle data but MUST NOT add parallel Workbench/Help CSS, inline visual styling, raw replacement controls or non-Eidos standard icons. A missing reusable visual/interaction pattern MUST be implemented in Eidos first.

- **APP-124** Package Secret declarations contain metadata only. Plaintext, encrypted credential payloads and default Secret values MUST NOT be Package Manifest content.
- **APP-125** Secret values cross runtime boundaries only through the Host-owned `secrets.resolve` Provider contract. Ordinary SettingsStore, Help, logs, lifecycle state and Package source MUST NOT become Secret storage.
- **APP-126** Stored Secret plaintext MUST NOT be returned to the browser after save. Workbench may display configured/not-configured metadata and accept replacement/removal input through Eidos secret controls.
- **APP-127** Secret mutation is a privileged server-side administration action and MUST fail closed without authentication + `authorization.check` approval. Secret audit records MUST contain target metadata/outcome but never the Secret or raw authentication credential.
- **APP-128** The P0 Host encrypted Secret store uses authenticated encryption and a Host-owned master key separate from encrypted state. Production file-backed Secrets require durable Host storage; process-local/ephemeral storage is development-only.
- **APP-129** LLM/provider credentials are runtime configuration, not deployment configuration. Provider Packages SHOULD resolve them through `secrets.resolve`; environment-variable credentials may exist only as explicit compatibility/migration paths, not the normal Workbench UX.

- **APP-130** Personal Agent's effective platform/business tool set is Host-owned runtime state. Agent core and Provider-backed model MUST NOT hard-code the authoritative list of available tools.
- **APP-131** Every Agent tool exposed to a model MUST have a stable Host tool id, LLM-safe model name, owner, input schema and effect classification. A tool absent from the effective Host catalog MUST fail closed when invoked.
- **APP-132** Agent tool safety rules are Host execution policy, not prompt policy. In particular, Package installation execution MUST retain the successful side-effect-free preflight requirement regardless of model behavior.
- **APP-133** Tool discovery is not authorization. Principal/Scope-aware visibility and privileged WRITE authorization MUST be enforced by the Host as those contexts become executable; an LLM tool call can never upgrade a Host deny into allow.
- **APP-134** New Package/EC Agent tools enter through explicit Host/protocol registration boundaries. Credentials and stored Secret plaintext MUST NOT be exposed as tool catalog metadata, tool observations or model prompt context.

- **APP-135** EVO is Person-first in the frozen MVP world model. Human identity is not a child object owned by Enterprise; Enterprise is an accessible governed Context, not the root of the person.
- **APP-136** The MVP has exactly one Agent ontology: Personal Agent. Enterprise Context MUST NOT be represented as a second Enterprise Agent merely to provide data, memory, policy or tools.
- **APP-137** Personal Context Memory remains a distinct long-lived personal asset. Existing Enterprise Context Memory records are preserved compatibility/governance assets pending EC knowledge convergence; they MUST NOT be treated as the target enterprise knowledge authority. Access to Enterprise Context for reasoning MUST NOT imply permission to persist enterprise-confidential facts into Personal Context Memory.
- **APP-138** Personal Agent output is analysis/opinion/proposal, not the final material decision. Material decisions remain with the human unless an explicit future delegation contract grants bounded authority.
- **APP-139** Durable memory/evidence assets are independent of any LLM Provider or model hidden state. Replacing the model MUST NOT erase Personal Context Memory or preserved Enterprise Context Memory evidence; target enterprise knowledge authority is Experience Compiler under APP-146.
- **APP-140** The `enterprise-agent` Package/Feature/Experience/route/command identifiers are compatibility identifiers for the Personal Agent implementation. Product-facing naming is Personal Agent; machine identifier migration requires an explicit versioned compatibility plan.

- **APP-141** Active Context is Host-resolved state. Browser/request/model input may select only among Context references offered by a Host-owned source; arbitrary client-supplied enterprise/context identifiers MUST NOT create or authorize an Enterprise Context.
- **APP-142** Before executable Identity/Session/Grant resolution exists, Personal Agent defaults to a Host-owned Personal Context. Unknown or unavailable Enterprise Context selection MUST fail closed.
- **APP-143** Context Memory P0.3 exposes read contracts only. A generic memory write/learn API MUST NOT be introduced before ownership, provenance, Memory Attribution and cross-context persistence policy are explicit.
- **APP-144** `PlatformScopeV010` remains a compatibility projection, not the Person-first root ontology. New Personal Agent context-aware code SHOULD use `ResolvedContextSetV010` / `ActiveContextRefV010` and must not recreate `Enterprise -> User` ownership through legacy scope fields.

- **APP-145** Enterprise Context is the authoritative enterprise Business Definition space. A standalone BDR product/plugin MUST NOT be introduced as a duplicate authority; repository interfaces may remain internal/public capabilities of the Enterprise Context plugin.
- **APP-146** Experience Compiler owns durable enterprise/industry knowledge, learning, research and experience assets. Enterprise Context MUST NOT grow into a parallel knowledge platform.
- **APP-147** Enterprise Context is definition-first and headless. Specialized definition editors/designers MUST be separate peer plugins and MUST communicate through public definition contracts rather than private Context implementation imports.
- **APP-148** Business Definition revisions are append-only governed assets. Draft, Published and Effective state, provenance and publication authority belong to Enterprise Context; definition-kind-specific semantic validation belongs to the owning domain plugin.
- **APP-149** EOG Core is a CI-gated first-class plugin boundary consisting of enterprise graph semantics, graph design/navigation, renderer-independent View State, graph actions and aggregation extension points. EOG MUST NOT be treated as the parent package of SOP, reporting or analysis plugins.
- **APP-150** Existing SOP definition/edit/publish, SOP analysis, Observatory, Runtime Fact adapters and Bottleneck analysis are preserved implementation assets pending plugin extraction. They MUST NOT be deleted to simplify current ownership boundaries and are NON_GATING_FOR_CURRENT_EOG_CORE_CI.
- **APP-151** Project SOP semantics mean APQC process structure plus time dimension. Conventional step-by-step work instructions/checklists are a different possible Definition Kind and MUST NOT be silently conflated with this model.
- **APP-152** EVO Ledger Runtime owns deterministic BusinessData execution, posting, reconciliation, calculation and replay. It MUST NOT own Business Definition Draft/Published/history/version lifecycle.
- **APP-153** App Platform is the control plane for component lifecycle, discovery, binding and governance. After resolution, peer components SHOULD exchange ordinary data through stable public interfaces rather than forcing all business payloads through App Platform.
- **APP-154** Future report/analysis plugin ownership is intentionally undecided. Current EOG aggregation capability MUST NOT be used to infer a mandatory monolithic Reporting Layer or a fixed report-plugin taxonomy.



## External Agent Access Constitution

- **APP-155** External Agent identity MUST remain distinguishable from the authorizing Principal, client application and Enterprise Context. External Agents MUST NOT impersonate Human Principals in audit or execution evidence.
- **APP-156** Callable business/platform operation semantics belong to the owning plugin. App Platform may govern visibility/execution but MUST NOT invent plugin business meaning.
- **APP-157** One semantic capability operation may be projected into MCP, OpenAPI, Personal Agent tools, Human Actions or future A2A Skills. Product/protocol adapters MUST NOT create divergent business semantics.
- **APP-158** External capability exposure is lifecycle-derived. An uninstalled Package or inactive Feature MUST NOT remain discoverable or callable through External Agent interfaces.
- **APP-159** Capability discovery is authorization-aware. Hidden/unauthorized operations SHOULD NOT appear in effective discovery and MUST fail closed if directly invoked by a guessed identifier.
- **APP-160** External Agent authentication success is not authorization. Final invocation MUST resolve Host authority through current Principal, Context, Grant and authorization policy.
- **APP-161** Delegated External Agent authority only attenuates. Effective Agent authority MUST be a subset of current authorizing Principal authority and MUST NOT be expanded by sub-delegation, protocol metadata or model output.
- **APP-162** External Agent Enterprise Context is Host-resolved. Caller-supplied context identifiers are selectors only and MUST NOT manufacture membership or cross-enterprise access.
- **APP-163** Protocol and Product Adapters are translation/convenience boundaries, not authority boundaries. ChatGPT-, Claude-, MCP-, OpenAPI- or A2A-specific code MUST NOT grant enterprise permission or own domain truth.
- **APP-164** External Agent WRITE MUST converge on the same governed Host Action/domain Command path as other clients. External protocols MUST NOT create a second authoritative mutation path.
- **APP-165** Material External Agent WRITE MUST produce durable Host-owned execution evidence with Principal, Agent/client, Context, Grant, operation, outcome and correlation sufficient for audit/recovery; receipts remain evidence rather than domain source of truth.
- **APP-166** Access tokens are not the canonical authority database. Revoked Grants, removed Context access, deactivated Features or current policy DENY MUST remain effective even while a transport credential would otherwise be unexpired.
- **APP-167** Stored Secret plaintext MUST NOT be exposed through external capability discovery, Agent schemas, prompts, observations, receipts, examples or Package manifests.
- **APP-168** Generic standards support is primary; Agent-specific adapters are optional convenience. Absence of a ChatGPT/Claude adapter MUST NOT prevent a conforming generic MCP/OpenAPI client from using supported capabilities.
- **APP-169** External Agent product use MUST NOT require GitHub, source code, database access, private endpoint knowledge or other developer-only implementation knowledge.
- **APP-170** Production Human-delegated External Agent authorization MUST use request-bound production Identity/Session. The static/dev Session fallback MUST NOT satisfy the production login gate.
- **APP-171** External Agent support preserves owner-scoped CI. Plugin CI validates the plugin's semantic operations; adapter/vendor certification remains separate and MUST NOT become a dependency of every plugin PR.
- **APP-172** External Agent authorization does not imply Personal Context Memory, EC knowledge or unrelated Enterprise Context access. Intelligence/memory/data capabilities remain separately authorized and least-disclosed.


## Capability Operation Constitution

- **APP-173** Feature `providesCapabilities` declares dependency/availability semantics; `platform.capability-operation` declares stable callable operations. These concepts MUST NOT be collapsed.
- **APP-174** A Capability Operation MUST be owned by a Capability the same Feature explicitly provides, and its operation id MUST remain capability-namespaced.
- **APP-175** Capability Operation exposure metadata is eligibility only, never authorization. EXTERNAL_AGENT exposure MUST NOT make an operation externally visible without current Principal/Context/delegated-authority filtering.
- **APP-176** App Manager derives effective Capability Operations only from active Features. Disabling or uninstalling a Feature MUST remove its operations without ghost API compatibility paths.
- **APP-177** Duplicate operation ids among active Features fail closed. App Platform MUST NOT choose an owner by install order, lexical order, version, repository or adapter preference.
- **APP-178** A Capability Operation classified WRITE MUST declare Host-owned idempotency and durable receipt requirements before it can enter Plugin Protocol; protocol/product adapters MUST NOT weaken those requirements.


- **APP-179** Every Capability Operation MUST declare its semantic data scope and authorization action/resource contract. Exposure eligibility, data scope and authorization are distinct concepts and MUST NOT be collapsed.
- **APP-180** Capability Operation data scope is Host-resolved. Caller-, browser-, model- or adapter-supplied identifiers MUST NOT manufacture ENTERPRISE, COMPANY, WORKSPACE or USER authority.
- **APP-181** Capability Operation authorization MUST protect both discovery and invocation. Hiding an operation from discovery is not sufficient; guessing an operation id or ACTION_HOST command MUST NOT bypass `authorization.check`.
- **APP-182** Missing, ambiguous, unavailable, errored or denying authorization, or an unavailable required data scope, MUST fail closed for Capability Operation discovery and execution. App Platform may restrict a Provider ALLOW but MUST NOT upgrade DENY.
- **APP-183** `EXTERNAL_AGENT` exposure is semantic eligibility only. Until a specific External Agent/client has explicit attenuated delegated authority, External Agent discovery MUST remain empty even when the authorizing Human could perform the operation.
- **APP-184** Effective ACTION_HOST bindings for Capability Operations MUST be unique. Two active operations claiming the same command code MUST fail closed; install order or adapter preference MUST NOT select semantics.
- **APP-185** External/public Capability Operation metadata MUST expose semantic contracts rather than Host routing or policy internals. ACTION_HOST command codes, internal authorization wiring and policy implementation details MUST NOT become protocol authority.
- **APP-186** Installation-scoped and Enterprise-scoped business semantics MUST NOT be silently conflated. An enterprise-specific Ledger Runtime template answer requires an explicit, queryable and auditable Enterprise Context → Ledger Template binding or inheritance contract.


## External Agent Delegation Constitution

- **APP-187** External Agent registration, External Agent Client registration and delegated Authority Grant are distinct Host-owned facts. Registering or trusting an Agent/client MUST NOT itself grant business capability authority.
- **APP-188** Human-created External Agent registrations MUST NOT self-assert elevated trust such as VERIFIED, ENTERPRISE_APPROVED or FIRST_PARTY. Trust posture and delegated business authority remain separate.
- **APP-189** A delegated External Agent Grant MUST bind to a Host-resolved active Context. Caller-supplied enterprise/context identifiers MUST NOT create the Grant's authority scope.
- **APP-190** Grant creation MUST attenuate to the authorizing Human's current allowed Capability Operations and MUST additionally require explicit EXTERNAL_AGENT exposure eligibility. A Grant MUST NOT contain an operation unavailable to the Human at creation time.
- **APP-191** External Agent WRITE delegation remains denied until the governed WRITE phase explicitly activates approval, idempotency, durable receipt and ambiguous-outcome handling. A Human ALLOW alone MUST NOT enable External Agent WRITE early.
- **APP-192** External Agent Authority Grants MUST have explicit bounded validity. The first delegated-authority contract MUST NOT create implicit permanent grants.
- **APP-193** Agent, Client and Grant creation facts are immutable; revocation is terminal; governance events are append-only. New authority relationships require new durable records rather than reactivating revoked objects.
- **APP-194** Revoking an Agent or Client, or expiration of a Grant, MUST immediately make delegated authority ineffective without rewriting the historical Grant creation fact.
- **APP-195** Grant creation-time authorization is insufficient for runtime use. Every delegated discovery/invocation decision MUST intersect the Grant with current plugin lifecycle, current Context authority and the authorizing Principal's current authorization.
- **APP-196** Delegated authority MUST NOT depend on a live Human browser Session as the only way to know current Human authority, and MUST NOT freeze stale Session/token claims into a Grant as permanent Principal truth. A governed current-identity resolution boundary is required before EA-4 network authorization is opened.
- **APP-197** EA-3A governance state MUST NOT store OAuth client secrets, bearer/access/refresh tokens or authorization codes. Credential transport/authentication belongs to the later OAuth/client-authentication layer.


## Current Human Identity Constitution

- **APP-198** Browser Session, OIDC authentication and current Human identity directory are separate authorities. Delegated Agent authorization MUST NOT require or reuse an old Human browser Session as the durable Principal source.
- **APP-199** Successful Human authentication MUST update/confirm the current identity directory before Host-managed Session issuance. Directory failure MUST fail closed with no newly issued Session.
- **APP-200** Durable identity directory state MUST NOT persist browser Session credentials, OIDC ID/access/refresh tokens, authorization codes or client secrets.
- **APP-201** A Human subject already bound to one identity Provider MUST NOT be silently seized or merged by another Provider. Account linking requires a separate explicit governed contract.
- **APP-202** Identity directory DISABLED state is terminal in v0.1. A later successful login MUST NOT silently reactivate a disabled Human subject.


## Effective Delegated Authority Constitution

- **APP-203** A durable External Agent Authority Grant is historical delegation evidence, not permanent executable authority. Every delegated discovery and invocation decision MUST recompute current effective authority.
- **APP-204** Effective delegated authority MUST intersect current ACTIVE Human identity, current Context membership, current plugin/Feature lifecycle, current Capability Operation contract, current `authorization.check`, Grant operation ids and Grant effect constraints.
- **APP-205** Human disablement, Context membership removal, policy DENY, Feature disablement, Agent/Client revocation or Grant expiration MUST take effect without rewriting the historical Grant creation fact.
- **APP-206** Delegated capability discovery and direct invocation MUST use the same current-authority derivation. Knowing or guessing an operation id MUST NOT bypass the delegated catalog boundary.
- **APP-207** Missing current identity, Context membership, authorization or other required authority sources MUST fail closed. Protocol/token layers may further restrict current authority but MUST NOT upgrade a failed EA-3B2 derivation.

## Extension Boundary Constitution

- **APP-208** Every material new capability MUST be classified before implementation as Core, Platform Provider, Application, Integration Adapter or Experience, with an explicit owner for authoritative facts. Repository architecture authority wins over current-chat convenience.
- **APP-209** A capability with an independent supplier, independent lifecycle, replaceable implementation, implementation-specific configuration/secrets/health or deployment difference SHOULD default to a PLATFORM_PROVIDER behind a public capability contract rather than enter App Platform Core.
- **APP-210** Logic that exists only to translate or make an external product/protocol compatible is an Integration Adapter concern. Product/protocol adapters MUST NOT own domain truth, enterprise membership, authorization or divergent business semantics.
- **APP-211** Human-facing product UI, navigation, setup, review, forms, dashboards, work queues and product vocabulary belong to Eidos Experience ownership. Experience/Designer output MUST reach authoritative data only through public commands, queries or capabilities.
- **APP-212** Designer/Experience assets MUST NOT directly own or mutate private Provider/Application stores. Replacing, disabling or uninstalling a UI Experience MUST NOT silently delete provider-owned authoritative facts.
- **APP-213** APPLICATION Packages own coherent business/product composition and MAY contribute Experiences and Capability Operations, but MUST NOT absorb replaceable infrastructure that belongs to Provider Plugins.
- **APP-214** App Platform Core may grow only for the smallest generic hosting, lifecycle, resolution, security, routing, composition or protocol-parsing mechanism that cannot be owned by a plugin/provider/adapter/Experience.
- **APP-215** Repeated vendor-specific branches indicate a missing Provider boundary; repeated external-product compatibility branches indicate a missing Integration Adapter boundary; repeated bespoke Human UI indicates a missing Eidos Experience capability or contribution boundary.
- **APP-216** The active ecosystem owner projects are EVO-App-Platform, EVO, Eidos and Experience-Compiler. Historical convergence repositories MUST NOT become new product authority or receive new product functionality.

## Documentation Lifecycle Constitution

- **APP-217** Project documentation is not globally append-only. Historical evidence MUST be preserved selectively while current authority MUST be allowed to evolve in place.
- **APP-218** Decision Records, completed Historical Snapshots and released Versioned Contract semantics MUST be preserved and superseded rather than silently rewritten.
- **APP-219** CURRENT_AUTHORITY, LIVING_RUNBOOK, CURRENT_STATUS and GENERATED_CURRENT_VIEW documents MAY be maintained or regenerated in place according to their purpose.
- **APP-220** A material change to current architecture SHOULD preserve its rationale in a Decision Record when future engineering will need to know why the rule changed; typo/format/link/current-pointer maintenance does not require permanent historical artifacts.
- **APP-221** Fresh LLM work MUST load current authority/status first and load historical records only when rationale, migration, compatibility, archaeology or forensic evidence is relevant.



- **APP-222** Package installation, Feature activation, Capability availability and persistent navigation visibility are separate concerns. A routable/agent-discoverable professional tool MAY intentionally contribute no Workbench navigation and instead be launched from a relevant business context. Hosts MUST NOT infer navigation visibility merely from installation, activation, defaultRoute or capability presence.


- **APP-223** App Platform persistent navigation MUST optimize frequent Human work rather than mirror installed Packages, active Features or system-management capabilities. The Applications side panel MAY be empty; Hosts MUST NOT fill it with low-frequency administration merely to avoid empty space.
- **APP-224** Plugins, Template Store, Provider configuration, Memory governance and comparable low-frequency platform capabilities belong to explicit Settings/administration placement unless a later Human-validated workflow proves a distinct frequent-work destination. Enterprise/Ledger business administration remains semantically distinct from system infrastructure even when reached through the common Settings/management surface.
- **APP-225** The default App Host landing MUST be a neutral work surface or a real Human work destination. A system-management page such as Plugin Store MUST NOT become the default landing solely because no business application is currently open.


- **APP-226** Help remains a secondary Workbench utility, but substantive Help Center catalogs and article content MUST render in the primary workspace rather than the narrow side panel. Side-panel Help is reserved for lightweight navigation or contextual assistance. Business-facing Help cards MUST prioritize Human-readable title, summary, category and action; technical metadata is progressively disclosed.
