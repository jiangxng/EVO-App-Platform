# Local MVP Run — Agent-Driven App Installation v0.1

**Status:** Development proof  
**Date:** 2026-09-23

This runbook validates the current short-term mainline:

```text
User message
→ Enterprise Agent
→ App Manager tools
→ Package install / Feature activation
→ effective Eidos Experience
→ Eidos App Host refresh
→ Company Notes appears
```

## 1. Start App Manager

In `jiangxng/EVO-App-Platform`:

```bash
npm install
npm run build
npm start
```

Default:

```text
http://localhost:4100
```

## 2. Start Enterprise Agent development service

In a second terminal, same repository:

```bash
npm run start:agent
```

Default:

```text
http://localhost:4300
```

Two modes are available.

Offline deterministic proof:

```bash
npm run start:agent
```

Real LLM proof:

```bash
OPENAI_API_KEY=... npm run start:agent
```

Optional model override:

```text
OPENAI_MODEL=gpt-5.6-luna
```

The model boundary remains the same `AgentModel` contract.

## 3. Start Eidos App Host MVP

Use branch:

```text
eidos/pure-frontend-positioning-v0.1
```

In `jiangxng/eidos`:

```bash
npm install
npm run demo:app-host
```

Open:

```text
http://localhost:4200
```

## 4. User-visible proof

In the Enterprise Agent input, send:

```text
帮我安装 Company Notes
```

Expected visible sequence:

```text
app.catalog.list
✓
app.install.plan
✓
app.install.execute
✓
App Host refresh
✓
Company Notes appears in navigation
✓
Company Notes page opens
```

## 5. What this proves

This proves:

- App Manager is the Package/Feature lifecycle backend;
- install planning is separated from execution;
- Enterprise Agent uses public tools rather than private lifecycle implementation;
- App Host does not install Apps;
- Eidos discovers effective active Experience Contributions dynamically;
- a newly installed App can become visible without modifying Eidos source code.

## 6. What it does not yet prove

It does not yet prove:

- a live real-LLM run in the user's deployment environment/API account;
- durable App Manager persistence after process restart;
- production authentication/authorization;
- production CORS/security policy;
- Company Notes business-command persistence;
- Trading Lite → EVO Core dependency installation;
- uninstall/deactivate end-to-end UI.

These are intentionally separate milestones.

## 7. Next increment

Run the same end-to-end proof once with the real LLM adapter enabled, then proceed to the Trading Lite → EVO dependency proof.

No App Manager or Eidos architecture change is required to switch model adapters.
