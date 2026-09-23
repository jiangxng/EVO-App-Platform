# Local MVP Run — Agent-Driven App Installation v0.1

**Status:** Local deterministic proof PASS; live real-LLM proof pending  
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

## 7. Proof B — Trading Lite with EVO dependency graph

After Proof A, restart App Manager if needed so the in-memory lifecycle state is clean, then run the same three services and send:

```text
帮我安装 Trading Lite
```

Expected tool trace:

```text
app.catalog.list
→ app.install.plan
→ app.install.execute
```

Expected install plan:

```text
installPackages:
- evo.core
- trading-lite

activateFeatures:
- evo.business-data
- evo.posting
- evo.ledger
- evo.balance
- trading-lite.default
```

Expected user-visible result:

```text
Trading Lite appears in Eidos navigation
→ open Trading Lite
→ Eidos renders the reference order form
→ Customer
→ Item
→ Quantity
→ Amount
→ Create Order
```

The current reference page proves Experience integration only. The `trading-lite.create-order` backend business command is not yet the real EVO business-flow implementation.

This proof demonstrates:

> The user installs an App; the system installs the dependency graph.

## 8. Real LLM validation

Repeat Company Notes and then Trading Lite with the OpenAI adapter enabled:

PowerShell:

```powershell
$env:OPENAI_API_KEY="..."
npm run start:agent
```

No App Manager or Eidos architecture change is required to switch model adapters.


## 9. Verified local result — 2026-09-23

The user confirmed the deterministic-model local MVP succeeds.

A static-resource issue was found during the first browser run (`/main.js` returned 404 from the root URL). It was fixed in Eidos by using the canonical App Host MVP module path.

After the fix, the local user-visible Proof A succeeded.

This result should be treated as a regression baseline: future changes to App Manager, Enterprise Agent or Eidos App Host should preserve this flow.


## 9.5 Proof C compatibility run is currently deferred

The steps below are retained as a compatibility runbook, but they are **not the preferred next local validation** after the minimal EVO Runtime Plugin architecture correction.

The user had not yet run this proof. Do not ask them to run it before CORE-MIN-02 generic BusinessDataSubmission convergence is implemented.

Once the new Host → BusinessDataSubmission path is ready, this runbook should be revised and the browser proof should be run once against the target architecture.

## 10. Proof C — Trading Lite → real EVO public Command

**Status:** implementation/CI PASS; local browser validation pending.

Proof C adds real EVO execution behind the existing Trading Lite page:

```text
Eidos form
→ ActionRequest
→ Eidos ActionHost
→ App Manager /v1/actions
→ Trading Lite action handler
→ EVO enterprise lookup
→ EVO capability discovery
→ EVO POST /api/v1/commands
→ BusinessData + PostingInput
→ EVO worker Posting
→ Ledger/Balance
```

### 10.1 Update all three local repositories first

#### EVO

```powershell
cd <your-path>\EVO
git checkout main
git pull
docker compose up -d --build
docker compose ps
```

The EVO bootstrap container runs migrations and `seed-demo`. The API is:

```text
http://localhost:3000
```

The worker runs in Docker and processes PostingInput asynchronously.

#### EVO-App-Platform

```powershell
cd <your-path>\EVO-App-Platform
git checkout main
git pull
npm install
npm run build
npm start
```

Default App Manager:

```text
http://localhost:4100
```

The default local Trading Lite EVO adapter configuration is:

```text
EVO_BASE_URL=http://localhost:3000
EVO_ENTERPRISE_CODE=EVO_DEMO
EVO_ACTOR_TYPE=HUMAN
EVO_ACTOR_ID=demo-user
```

These defaults match the seeded local reference environment.

In a second EVO-App-Platform terminal:

```powershell
cd <your-path>\EVO-App-Platform
npm run start:agent
```

Default Enterprise Agent:

```text
http://localhost:4300
```

#### Eidos

```powershell
cd <your-path>\eidos
git checkout eidos/pure-frontend-positioning-v0.1
git pull
npm install
npm run demo:app-host
```

Open:

```text
http://localhost:4200
```

### 10.2 Install Trading Lite

Because App Manager lifecycle state is still in-memory, install Trading Lite again after restarting App Manager.

In the Eidos Enterprise Agent input:

```text
帮我安装 Trading Lite
```

Expected trace:

```text
✓ app.catalog.list
✓ app.install.plan
✓ app.install.execute
```

Trading Lite should appear in navigation.

### 10.3 Execute the real business command

Open **Trading Lite** and enter for example:

```text
Customer: ACME
Item: P-100
Quantity: 3
Amount: 300
```

Press:

```text
Create Order
```

Expected browser action path:

```text
trading-lite.create-order
→ App Manager /v1/actions
→ sales_order.approve-sales-order
→ EVO /api/v1/commands
```

Expected UI action status:

```text
Completed: trading-lite.create-order
```

The browser log should show an action result containing values such as:

```text
orderNo
capabilityCode = sales_order.approve-sales-order
commandExecutionId
businessDataId
postingInputId
postingSequence
postingStatus
```

`postingStatus` may initially be `QUEUED`. This is a valid successful acceptance state: EVO has already automatically taken ownership of the posting lifecycle and the EVO worker continues processing independently. Do **not** call a second posting-start API from Trading Lite.

### 10.3.1 Posting status semantics

For this Proof C, the business Application submits the order once.

```text
Create Order
→ EVO accepts governed business fact
→ EVO automatically enters posting lifecycle
```

Both of these result shapes are architecturally valid:

```text
POSTED / COMPLETED
```

or:

```text
ACCEPTED / QUEUED / RUNNING
```

The second form means result delivery is asynchronous, not that posting is waiting for the caller to trigger it.

A future explicit EVO Posting / PostingRun API remains valid for re-posting, Replay, bulk processing, recovery and administrative control; Trading Lite must not use it to start the posting of a newly accepted order.

### 10.3.2 Recalculation note

This Proof C does not use a special recalculation mode.

If Trading Lite later exposes a user action called "Recalculate", EVO will not care about that label. Trading Lite may simply resubmit its data through the same ordinary API path.

For a full Application-driven rebuild, EVO's target platform contract is:

```text
POST /api/v1/runtime-cache/clear
→ scoped cache reset
→ Application resubmits data normally
```

EVO-internal recalculation is different: EVO may rebuild derived state directly from its current governed runtime data without asking Trading Lite to resubmit.

### 10.4 What counts as Proof C PASS

Local Proof C is PASS when all of these are observed:

1. Trading Lite installs through the existing Agent/App Manager dependency path.
2. Trading Lite page renders in Eidos.
3. Create Order returns `ok: true`.
4. The returned capability is `sales_order.approve-sales-order`.
5. A real EVO `businessDataId` and `postingInputId` are returned.
6. No EVO private database/module access is used by Eidos or Trading Lite.

The EVO repository separately contains a PostgreSQL CI proof that the same public command path reaches Posting and produces:

```text
pending_production += quantity
pending_shipment   += quantity
receivable         += amount
```

The public read/query projection of that resulting state back into Trading Lite is the next slice after local Proof C.
