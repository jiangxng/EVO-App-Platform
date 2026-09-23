# Handoff — Agent-Driven App Installation MVP — 2026-09-23

**Status:** Local Proof A confirmed by user  
**Short-term mainline:** `docs/roadmap/SHORT-TERM-MAINLINE-AGENT-APP-INSTALL-v0.1.md`

## 1. What was proven locally

On 2026-09-23 the user successfully ran the local MVP with the deterministic Enterprise Agent development model.

Confirmed user-visible path:

```text
Eidos Browser Harness
→ user sends "帮我安装 Company Notes"
→ Enterprise Agent
→ app.catalog.list
→ app.install.plan
→ app.install.execute
→ App Manager installs Package and activates default Feature
→ effective Experience Contribution becomes visible
→ Eidos App Host refreshes
→ Company Notes appears in the UI
```

This is **Proof A**: Agent + App Platform + Eidos with an application that does not require EVO.

Do not interpret this as the whole short-term milestone being finished. Production persistence, real-LLM live validation, uninstall/deactivate UI, and the EVO-dependent Proof B remain.

## 2. Repositories and branches used

### EVO App Platform

Repository:

```text
jiangxng/EVO-App-Platform
```

Branch:

```text
main
```

Contains the current MVP implementations of:

- App Manager backend;
- Package/Feature lifecycle contracts;
- Catalog;
- Company Notes reference Package;
- side-effect-free install planning;
- Feature activation;
- effective Experience API;
- Enterprise Agent Runtime;
- App Manager Agent tool adapter;
- deterministic Development AgentModel;
- OpenAI Responses AgentModel adapter;
- Runtime-enforced plan-before-install policy.

Default local ports:

```text
App Manager      http://localhost:4100
Enterprise Agent http://localhost:4300
```

### Eidos

Repository:

```text
jiangxng/eidos
```

Branch:

```text
eidos/pure-frontend-positioning-v0.1
```

Contains:

- `src/app-host`;
- backend-independent `ExperienceSource`;
- `AppManagerExperienceSource`;
- dynamic Experience discovery;
- deterministic navigation/route assembly;
- Browser App Host Shell;
- Enterprise Agent chat MVP harness.

Default local port:

```text
Eidos App Host http://localhost:4200
```

EVO repository is **not required for Proof A**.

## 3. Local run

### Terminal 1 — App Manager

In `EVO-App-Platform`:

```bash
npm install
npm run build
npm start
```

### Terminal 2 — Enterprise Agent

Deterministic proof:

```bash
npm run start:agent
```

With a real OpenAI model:

```bash
OPENAI_API_KEY=... npm run start:agent
```

On Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="..."
npm run start:agent
```

### Terminal 3 — Eidos

On branch `eidos/pure-frontend-positioning-v0.1`:

```bash
npm install
npm run demo:app-host
```

Open:

```text
http://localhost:4200
```

Then send:

```text
帮我安装 Company Notes
```

## 4. Important local bug discovered and fixed

Initial root-page load returned:

```text
GET http://localhost:4200/main.js 404
```

Cause:

- root URL serves `examples/app-host-mvp/index.html`;
- HTML used relative `./main.js`;
- browser therefore requested `/main.js`.

Fix:

- script source changed to `/examples/app-host-mvp/main.js`.

Eidos commit:

```text
4e4d4ed3fc8cf2f61ccd9b80e1646e3249c8ff6c
```

Latest Eidos CI after the fix: PASS.

## 5. Architectural facts now demonstrated

The local proof supports these boundaries:

1. App Manager is the Package/Feature lifecycle backend.
2. Eidos App Host does not install Packages.
3. Enterprise Agent does not directly modify Package state; it calls App Manager public tools.
4. Install planning and install execution are distinct.
5. Agent Runtime mechanically requires a successful side-effect-free plan before install execution.
6. Eidos discovers newly active Experience Contributions without application-specific Eidos source changes.
7. An App can exist without EVO when it declares no EVO capability dependency.
8. Model selection is behind `AgentModel`; App Manager and Eidos do not change when the LLM adapter changes.

## 6. Current limitations — do not overstate

Still not production-complete:

- App Manager lifecycle state is in-memory;
- Company Notes command/data persistence is not implemented;
- authentication/authorization is not production-ready;
- local CORS policy is permissive;
- live real-LLM installation has not yet been confirmed in the user's API environment;
- uninstall/deactivate UI is not complete;
- Package Manifest / Feature Manifest JSON contracts are not frozen;
- Trading Lite → EVO dependency graph proof is not complete.

## 7. Next mainline step

Proceed in this order:

```text
A. Real LLM live proof
   Company Notes through same AgentModel boundary

B. Trading Lite Package
   declares EVO capability requirements

C. App Manager dependency resolver
   resolve required capabilities/providers

D. EVO Foundation Package integration
   evo.business-data
   evo.posting
   evo.ledger
   evo.balance
   (only required Features)

E. User says "帮我安装 Trading Lite"
   → system installs dependency graph
   → Trading Lite appears in Eidos
```

The key next proof is:

> **The user installs an App; the system installs the dependency graph.**

## 8. EC migration rule

Do not restart development of Experience Compiler as a separate broad platform.

Continue selective migration into Enterprise Agent only when a capability is required by the mainline.

The old `Experience-Compiler` repository remains a historical/asset source for:

- model replacement;
- memory;
- knowledge;
- provenance;
- context compilation;
- learning/research;
- industry knowledge.

Do not migrate all of these before the current product loop needs them.

## 9. Fresh-LLM instruction

A fresh LLM should first read:

1. `project.status.json`
2. `docs/roadmap/SHORT-TERM-MAINLINE-AGENT-APP-INSTALL-v0.1.md`
3. this handoff document;
4. `docs/architecture/PACKAGE-FEATURE-CONTRIBUTION-MODEL-v0.1.md`
5. `docs/architecture/AGENT-PACKAGE-MODEL-v0.1.md`
6. `agents/enterprise-agent/README.md`
7. Eidos `STATUS.md`
8. Eidos `docs/architecture/EIDOS-CORE-COMPONENTS-APP-HOST-v0.1.md`

Do not redesign already-proven boundaries unless new evidence requires it.
