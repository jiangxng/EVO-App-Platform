# Resumable Agent Runs — P1.5C v0.1

**Status:** ACTIVE DESIGN  
**Milestone:** Personal Agent P1.5 — Durable Agent Operations  
**Predecessor:** P1.5B Human LIVE PASS

## 1. Problem

The current Personal Agent runtime executes an entire model/tool loop inside one synchronous request.

That creates a fragile coupling:

```text
browser request lifetime
≈ server request lifetime
≈ model/tool loop lifetime
```

P1.4X live testing already exposed a practical ~60 second ceiling for long synchronous Agent work.

For a durable Agent platform, transport lifetime must not equal work lifetime.

## 2. Core invariant

```text
Browser connections are transport.
Agent Runs are durable state.
```

A run must survive:

- browser disconnect;
- page refresh;
- a new browser request;
- a new Personal Agent chat surface;
- process restart when file-backed persistence is enabled.

The Human should need only a `runId` plus current authorization to inspect or continue the run.

## 3. Relationship to existing layers

```text
Conversation History
= discourse context supplied to the run

Context Memory
= durable knowledge

Action Receipt
= durable evidence for material WRITE execution

Agent Run
= durable orchestration state across model/tool slices
```

Do not make one layer impersonate another.

## 4. Run identity and ownership

Each run has an immutable:

- `runId`;
- Principal subject and actor type;
- active Context;
- source interaction ID;
- source action ID;
- original user message;
- bounded conversation history snapshot;
- LLM Provider ID and model ID used to start the run;
- createdAt.

The LLM does not choose `runId`.

Resume must re-resolve the current Principal/Context and verify ownership before executing another slice.

## 5. State machine

v0.1 states:

```text
READY
→ RUNNING
→ PAUSED
→ RUNNING
→ ...
→ SUCCEEDED

or FAILED
or CANCELLED
or BLOCKED
```

Semantics:

- `READY`: created, no slice running yet;
- `RUNNING`: one Host slice is actively executing;
- `PAUSED`: durable non-terminal state; another resume may continue;
- `BLOCKED`: continuation requires a Human/authority decision or unresolved indeterminate side effect;
- `SUCCEEDED`: terminal final Agent reply exists;
- `FAILED`: terminal unrecoverable run error;
- `CANCELLED`: terminal Human/Host cancellation.

Terminal states are immutable.

## 6. Append-only run events

The materialized run is derived from append-only events.

Minimum event types:

```text
RUN_CREATED
SLICE_STARTED
MODEL_DECISION_RECORDED
TOOL_OBSERVATION_RECORDED
SLICE_PAUSED
RUN_SUCCEEDED
RUN_BLOCKED
RUN_FAILED
RUN_CANCELLED
```

Important ordering invariant:

For a tool decision:

```text
MODEL_DECISION_RECORDED
must be durable
before
tool execution
```

Why:

If the process dies after the model chose a WRITE but before the run records the observation, resume can safely replay the already-recorded tool decision.

- READ may be repeated;
- WRITE is protected by P1.5B Action Receipt idempotency;
- an orphan `REQUESTED` receipt remains fail-closed.

## 7. Bounded slice

One resume request executes at most a small, explicit number of model decisions.

v0.1 default:

```text
maxModelDecisionsPerSlice = 1
```

A slice may therefore do:

```text
one model decision
+ zero or one tool invocation
+ durable event writes
```

If the decision is final, the run becomes `SUCCEEDED`.

If the decision is a tool call and the observation is recorded, the run becomes `PAUSED` and returns control to the caller.

This deliberately trades one long HTTP request for multiple short resumable requests.

## 8. Tool continuity

A durable tool step stores:

- tool ID;
- canonical arguments;
- decision timestamp;
- resulting observation;
- Action Receipt ID when present.

On resume:

- completed observations are fed back to the model;
- completed WRITEs are never repeated merely because chat context was lost;
- if a recorded tool decision has no observation, the Host may replay the tool invocation;
- P1.5B receipt semantics determine whether a WRITE replay is safe, successful replay, denied, failed or indeterminate.

## 9. Model/provider continuity

A run records its starting Provider ID and model ID.

v0.1 resume rule:

- prefer the same Provider/model;
- if the Provider is unavailable, mark the run `BLOCKED` rather than silently switching model behavior;
- a future explicit migration/rebind operation may relax this.

This keeps one run's reasoning path auditable.

## 10. Conversation history

The run persists the same bounded conversation-history snapshot accepted by the current Personal Agent contract.

This snapshot is immutable run input.

Do not depend on the browser resending prior conversation history on every resume.

## 11. Human authority

Resume never implies new authority.

Every resumed WRITE must still pass:

- current Principal/Context resolution;
- Host authorization;
- Action Receipt safety;
- domain-specific Human approval rules.

A run may become `BLOCKED` when continuation crosses a Human authority boundary.

Resume must never silently Accept/Reject Memory governance merely because an earlier slice proposed it.

## 12. Readback API

The Host must expose run READs scoped to current Principal + active Context:

```text
run.get(runId)
run.list(...)
```

Readback includes:

- state;
- step/slice count;
- created/updated timestamps;
- last durable event;
- tool progress summary;
- Action Receipt refs;
- final reply if terminal;
- blocker/error if present.

## 13. Resume API

A resume request supplies only:

```text
runId
```

plus normal request/session authorization.

It does not resubmit the original user message or prior tool state.

The Host reconstructs durable state and advances one bounded slice.

## 14. Persistence

Reference persistence is append-only JSONL.

Default path when lifecycle state is file-backed:

```text
agent-runs.jsonl
```

An explicit override may be provided by:

```text
APP_PLATFORM_AGENT_RUN_FILE
```

## 15. Crash recovery cases

### Crash before model decision is recorded

Resume re-runs model inference for the same durable pre-decision state.

### Crash after model decision, before READ observation

Resume may safely repeat the READ.

### Crash after model decision, during/after WRITE

Resume replays the same tool invocation.

P1.5B Action Receipt decides:

- existing SUCCEEDED → return receipt replay, no duplicate WRITE;
- REQUESTED without terminal → `BLOCKED` / indeterminate;
- FAILED / DENIED → preserve terminal result;
- no receipt → ordinary authorized execution.

### Crash after observation, before pause event

Materialization can infer the slice has durable progress and resume from the recorded observation rather than repeating the tool.

## 16. Concurrency

Only one active slice may advance a run at a time.

v0.1 Host must reject concurrent resume attempts with a deterministic conflict code.

A later distributed implementation may use optimistic versioning/leases.

## 17. Security/privacy

Run state is scoped to Principal + active Context.

Run storage may contain:

- original user message;
- bounded conversation history;
- tool arguments;
- tool observations.

Therefore run persistence is sensitive Host state and must not be exposed cross-Principal/Context.

Secrets should remain represented through existing secret handles/contracts rather than copied into run state where possible.

## 18. v0.1 API direction

Backend contract:

```text
AgentRunService.create(...)
AgentRunService.get(...)
AgentRunService.list(...)
AgentRunExecutor.resume(runId, current authorization)
```

Product actions:

```text
enterprise-agent.run.start
enterprise-agent.run.resume
enterprise-agent.run.get
```

The existing `enterprise-agent.chat` remains compatibility behavior until Eidos switches to run-backed chat orchestration.

## 19. Machine acceptance

P1.5C machine gate requires at minimum:

1. append-only run store + materializer;
2. file-backed reconstruction after process restart;
3. immutable run ownership/input;
4. one-decision-per-slice execution;
5. durable model decision before tool execution;
6. durable tool observation after invocation;
7. pause/resume across multiple requests;
8. successful final reply after resume;
9. WRITE replay deduped by Action Receipt;
10. orphan REQUESTED WRITE blocks/fails closed;
11. current Principal/Context checked on every get/resume;
12. concurrent resume rejected;
13. existing `enterprise-agent.chat` behavior remains green.

## 20. Human live gate

Human browser validation should deliberately force a multi-step Agent task.

Expected proof:

```text
start run
→ PAUSED with runId
→ browser/new request reads run
→ resume
→ another PAUSED or SUCCEEDED
→ refresh/reconnect
→ get(runId)
→ final state/result survives
```

At least one run should include a material WRITE so P1.5B receipt linkage is exercised during resume.

## 21. Non-goals

P1.5C v0.1 does not require:

- background cron/worker execution without explicit resume;
- distributed multi-worker scheduling;
- arbitrary model switching mid-run;
- infinite retention;
- autonomous approval of Human governance actions.

Those can follow after the durable run contract is proven.
