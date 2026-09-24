# EVO Family Product Validation Constitution

**Status:** Founder-confirmed  
**Authority:** Project-level validation gate  
**Effective:** 2026-09-24

## 1. Installation-first validation

An installable Package/plugin/Feature is not product-validated by beginning from an already installed state.

A valid product acceptance journey MUST demonstrate:

```text
discover in Catalog
→ inspect side-effect-free installation plan
→ resolve dependencies/capabilities
→ install Package(s)
→ activate Feature(s)
→ verify Contributions/effective capabilities
→ verify Eidos Experience becomes available
→ enter the product surface
→ execute the representative business scenario
```

Skipping these stages may still produce component/API evidence, but it MUST NOT be reported as end-to-end product acceptance.

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
