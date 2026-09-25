# EVO Family Product Validation Constitution

**Status:** Founder-confirmed  
**Authority:** Project-level validation gate  
**Effective:** 2026-09-24

## 1. Installation-first validation

An installable Package/plugin/Feature is not product-validated by beginning from an already installed state.

A valid product acceptance journey MUST demonstrate:

```text
discover in Catalog
→ system runs side-effect-free preflight / installation plan automatically
→ resolve dependencies/capabilities
→ install Package(s)
→ activate Feature(s)
→ verify Contributions/effective capabilities
→ verify Eidos Experience becomes available
→ enter the product surface
→ execute the representative business scenario
```

The preflight stage is mandatory for the system, not a mandatory human ritual. Normal low-risk installation SHOULD be one-click. Human review is required only when blockers, elevated risk, permissions, migrations, charges, destructive effects or other material decisions require it.

Skipping lifecycle/preflight execution may still produce component/API evidence, but it MUST NOT be reported as end-to-end product acceptance.

## 2. Eidos-first human experience

Human-facing EVO-family App, Configurator and business product surfaces MUST be realized through Eidos public contracts/capabilities and supported Eidos runtime/renderer boundaries.

A handwritten HTML/JS page that imitates the desired appearance is not an Eidos product surface and cannot satisfy UX/product acceptance.

Host-owned transport, authentication, routing and outer chrome are allowed. Semantic business controls/actions claimed as product UI must remain traceable to Eidos contracts.

## 3. No lifecycle bypass

Before the owning Feature is active:

- its Eidos Experience is not effective;
- its product route is not enterable;
- its app-specific product APIs are not usable as a bypass.

## 4. Evidence labeling

Validation reports distinguish:

- component/API evidence;
- lifecycle evidence;
- Eidos experience evidence;
- end-to-end product evidence.

Only the final class may claim the complete plugin product journey has been validated.

## 5. Continuous integration and accumulation

Product validation is cumulative. Passing a scenario is not sufficient if the implementation exists only in a throwaway page or isolated branch.

A validated slice is considered integrated only when:

1. it uses the canonical owner/boundary;
2. it is covered by automated tests and repository CI;
3. its architecture/contract decision is documented;
4. it composes with previously accepted capabilities;
5. later packages can extend the same App Host / lifecycle / Eidos framework without replacing the slice.

The intended growth model is:

```text
small vertical slice
→ mainline capability
→ regression gate
→ next vertical slice composes with it
→ ...
→ large integrated enterprise system
```

Demos and diagnostic pages may prove internals, but they do not define a new product shell or substitute for mainline integration.

## 6. Closed-loop lifecycle acceptance

A lifecycle feature is not complete when only its happy-path creation/install transition works.

For standard Package lifecycle, acceptance covers:

```text
install
→ Experience visible in App Host
→ disable
→ Experience disappears / APIs become unavailable
→ enable
→ Experience returns
→ uninstall
→ Package state and Experience disappear
```

Disable/uninstall must fail closed when active dependents would lose required Features or Capabilities. Authoritative business history is preserved unless a separate explicit data-retention operation exists.

These are default platform expectations and do not require the human to request each transition separately.


## 7. Plugin CI isolation

Continuous integration follows ownership boundaries.

```text
App Platform change
→ Platform Core + Plugin Protocol tests
→ no implicit full plugin portfolio

Plugin A change
→ Plugin A protocol conformance + Plugin A tests
→ no Plugin B/C/... tests

Plugin Protocol change / nightly / release
→ separate Ecosystem Certification
```

Full-system validation remains valuable, but it is a certification layer rather than the default development loop.

A plugin may use lightweight public-contract fixtures/fakes for ordinary CI. A real EVO/Eidos/provider runtime is started only when that plugin's direct integration contract materially requires it.

Changing one plugin must not trigger repository-wide or ecosystem-wide CI merely because other plugins share the same host.


## 8. Proactive architecture completeness

A platform milestone is not complete merely because all explicitly requested features pass.

Before broadening a shared platform capability, the owning LLM MUST review `llm.foundation-map.json` and the proactive-engineering constitution and ask whether current work is creating a standard platform concern that has not yet been made explicit.

A NOW-class gap blocks broad horizontal feature expansion until it is either:

- implemented at the correct owner boundary;
- explicitly downgraded with evidence to SOON/WATCH; or
- rejected because it belongs to another owner/standard.

The human is not required to know the engineering name of the missing foundation.

Fresh-LLM clean-room architecture review is valid acceptance evidence for context/architecture health.
