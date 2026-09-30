# Enterprise–Personal Learning Loop — Long-Term Target v0.1

**Status:** LONG_TERM_TARGET  
**Implementation status:** ARCHITECTURE_RESERVED_ONLY  
**Date:** 2026-09-30  
**Scope:** Personal Agent, Personal Context Memory, Experience Compiler, Enterprise Context, EVO Runtime, LLM context assembly  
**MVP:** NO  
**Current CI gate:** NO  
**Current release blocker:** NO  
**Current mainline priority:** NO

> This document records a durable long-term product and architecture target. It MUST NOT be interpreted as authorization to interrupt the current mainline or prebuild speculative intelligence infrastructure. Current work should preserve only the minimum contracts, ownership boundaries and data semantics needed to make this target possible later.

## 1. Long-term product intent

EVO should eventually support a continuous learning relationship between:

- the Human;
- the Human's Personal Agent;
- Personal Context Memory accumulated through real work;
- Experience Compiler (EC) as the enterprise/industry intelligence and learning authority;
- Enterprise Context as the governed Business Definition authority;
- EVO Runtime as deterministic business truth and execution evidence;
- external knowledge sources such as public web, research, regulations, standards, industry practices and enterprise documents;
- replaceable LLM Providers.

The intended result is not merely a better chatbot.

The intended result is an enterprise system in which:

1. a person's Agent can use relevant personal experience when reasoning;
2. the same Agent can receive relevant enterprise experience and enterprise operating knowledge from EC;
3. the Agent can combine those with current business truth, current work state, authority and available capabilities;
4. useful real-world outcomes from people and Agents can become evidence for enterprise learning;
5. external knowledge can enter the enterprise only through evidence/provenance and validation rather than blind ingestion;
6. enterprise learning can later guide other authorized people and Agents;
7. changing the underlying LLM does not erase enterprise or personal accumulated experience.

Canonical direction:

```text
external world
      │
      ▼
Experience Compiler
enterprise / industry learning
      │
      ▼
enterprise experience
      │
      ├──────────────────────────────┐
      │                              │
      ▼                              │
Personal Agent                       │
      │                              │
      ▼                              │
real work / decisions / actions      │
      │                              │
      ▼                              │
outcomes                             │
      │                              │
      ├──→ Personal Context Memory   │
      │                              │
      └──→ governed learning evidence┘
```

This is a bidirectional learning loop, not a synchronization loop.

## 2. Core distinction: enterprise intelligence vs personal memory

The project should not create a second large "Personal Knowledge Platform" merely because a Human has local experience.

Preferred ontology:

```text
Personal Context Memory
= durable person-scoped memory and reusable experience

Experience Compiler
= enterprise/industry knowledge, learning, research, cases,
  patterns, methods, provenance and long-lived intelligence assets
```

Personal Context Memory may include permitted:

- work preferences;
- prior choices;
- reusable personal methods;
- task history;
- decisions and feedback;
- remembered outcomes;
- role-scoped observations;
- references to prior Runs or work artifacts.

EC may include:

- enterprise cases;
- cross-person and cross-role patterns;
- enterprise-validated practices;
- industry knowledge;
- external research;
- evidence/provenance/lineage;
- methods and reusable reasoning assets;
- knowledge conflicts;
- hypotheses;
- learned patterns from outcomes;
- model-independent intelligence assets.

A personal memory can be highly valuable without being enterprise knowledge. Enterprise knowledge can be useful to a person without being copied into that person's memory.

## 3. Perspective model

Different roles see different parts of the enterprise:

```text
sales       → customers / opportunities / negotiation / demand
procurement → suppliers / lead times / terms / sourcing risk
production  → capacity / quality / process / material constraints
finance     → cash / cost / accounting / control
management  → cross-domain outcomes / priorities / trade-offs
```

Therefore:

> Personal Context Memory is role-scoped, experience-scoped and intentionally incomplete.

EC is not omniscient truth. It is the enterprise's organization-level composite intelligence assembled from multiple governed sources and perspectives.

Canonical distinction:

```text
Personal memory = local perspective
EC              = organization-level composite learning
```

The system SHOULD preserve useful disagreement rather than force all perspectives into one prematurely normalized answer.

## 4. Ownership boundaries

### 4.1 Personal Agent / App Platform Host

The Personal Agent side owns or participates in:

- active Human / Principal;
- current Personal Context;
- authorized Enterprise Context selection;
- current Work / Run;
- retrieval of relevant Personal Context Memory;
- authorized tool/capability discovery;
- action governance;
- final LLM request assembly;
- model Provider resolution;
- execution receipts and outcome references.

The Personal Agent MUST NOT become the canonical enterprise knowledge store.

### 4.2 Experience Compiler

EC owns the long-term enterprise/industry intelligence domain:

- enterprise knowledge;
- industry knowledge;
- experience/case semantics;
- evidence/provenance;
- research acquisition;
- pattern extraction;
- learning strategies;
- hypothesis lifecycle;
- cross-case synthesis;
- model replacement/bootstrap intelligence;
- enterprise learning assets.

EC may consume governed evidence from Agent work and EVO Runtime. It does not own a Human's private Personal Context Memory by default.

### 4.3 Enterprise Context

Enterprise Context owns governed enterprise definition truth:

- Business Definitions;
- Draft / Published / Effective lifecycle;
- definition revisions;
- definition provenance and attribution;
- publication governance;
- enterprise identity/governance context.

Enterprise Context is not the target enterprise knowledge/learning authority.

EC may recommend definition changes. Enterprise Context governs whether definitions become effective.

### 4.4 EVO Runtime

EVO Runtime owns deterministic business truth and execution evidence:

- BusinessData;
- governed Commands;
- postings;
- Ledgers;
- balances;
- runtime events/traces where defined;
- deterministic calculations;
- replay/recalculation evidence.

LLM reasoning or EC knowledge MUST NOT replace deterministic runtime truth.

### 4.5 LLM Provider

The LLM is a replaceable reasoning engine.

It does not own:

- Personal Context Memory;
- enterprise knowledge;
- Business Definitions;
- business truth;
- durable learning;
- authorization;
- action state.

## 5. The key runtime problem: context assembly

The long-term problem is not "how do we put more knowledge into the model?"

The problem is:

> For this Human, this task, this enterprise, this moment and this authority boundary, what is the minimum sufficient context that should be provided to the selected model?

A future LLM request should conceptually be assembled from:

```text
System / Runtime rules
+
Human / Principal / Role
+
Delegated authority
+
Personal Context
+
relevant Personal Context Memory
+
authorized Enterprise Context
+
relevant EC enterprise experience
+
current Work / Goal / Task
+
current EVO business evidence
+
relevant EOG relationships
+
relevant SOP/time semantics
+
external evidence when explicitly needed
+
effective Capability / Tool contracts
+
safety / governance constraints
        ↓
LLM Provider
```

The system MUST NOT solve this by dumping all available memory and enterprise material into the context window.

## 6. Context Assembly / Context Compiler target

The project should reserve a future **Context Assembly** contract.

"Context Compiler" remains a useful term, but ownership must be precise.

Target split:

```text
App Platform / Personal Agent Host
→ owns authorization, source eligibility, active context,
  final request envelope and model-call governance

Experience Compiler
→ may provide enterprise-intelligence retrieval,
  ranking, synthesis and context-compilation capabilities

Personal Context Memory Provider
→ provides authorized person-scoped relevant memory

EVO / EOG / SOP / other components
→ provide their own contract-bound factual or semantic context

LLM Provider
→ receives the final compiled request
```

Existing EC Context Compiler assets are preserved and may later back the enterprise-intelligence portion of this contract.

The final Host MUST NOT silently send unrestricted personal memory to EC merely because EC helps compile enterprise knowledge.

## 7. Target context package

The long-term logical input to model inference should be structured before provider-specific serialization.

Illustrative shape:

```json
{
  "principal": {},
  "role": {},
  "authority": {},
  "personal_context": {},
  "personal_memory": [],
  "enterprise_context": {},
  "enterprise_experience": [],
  "work": {},
  "business_evidence": [],
  "graph_context": [],
  "temporal_context": [],
  "external_evidence": [],
  "constraints": [],
  "capabilities": []
}
```

This is an architectural shape, not a frozen schema.

Provider adapters may convert it into OpenAI, Anthropic, Gemini, local-model or future-provider request forms without changing source-of-truth ownership.

## 8. Enterprise → Personal guidance loop

Enterprise learning should guide the Personal Agent by projection, not replication.

Wrong model:

```text
copy entire EC
→ every Personal Agent
```

Target model:

```text
current task / role / business object / time
        ↓
authorized enterprise-intelligence retrieval
        ↓
task-relevant EC evidence / cases / practices
        ↓
Context Assembly
        ↓
Personal Agent
```

Selection may eventually consider:

- role;
- responsibility;
- current task;
- Business Object;
- current process;
- Enterprise Context;
- authorization;
- time;
- operating unit where allowed;
- relevance;
- freshness;
- evidence strength;
- provenance;
- model context budget.

The Personal Agent should receive only useful, authorized enterprise intelligence.

## 9. Personal → Enterprise learning loop

Personal experience MUST NOT be automatically copied into EC as enterprise knowledge.

A future governed path should look like:

```text
real Personal Agent work
      ↓
Run / decision / action / observation
      ↓
business outcome
      ↓
personal memory and/or durable run evidence
      ↓
experience extraction
      ↓
enterprise learning candidate
      ↓
evidence / provenance / scope / conflict evaluation
      ↓
hypothesis / hold / reject / promote
      ↓
EC enterprise learning
```

The governing principle is:

```text
OBSERVE ≠ KNOW
KNOW ≠ PROPOSE
PROPOSE ≠ APPROVE
APPROVE ≠ PUBLISH
```

A single Human's observation may be important while still being insufficient for organization-level promotion.

## 10. What should be learned from personal work

Future learning should prefer evidence-rich work records over raw chat text.

High-value learning inputs may include:

- task intent;
- business object references;
- relevant context references;
- decision taken;
- action performed;
- tool/capability used;
- preconditions;
- result;
- observed outcome;
- Human correction;
- Human approval/rejection;
- follow-up result;
- timestamp/time range;
- provenance;
- confidence;
- contradictory evidence.

The system should learn from:

> what happened, what was done, under what conditions, and what outcome followed.

It should not equate conversational fluency with enterprise learning.

## 11. External world → enterprise learning

External research is another evidence source, not an automatic enterprise truth source.

Potential sources include:

- public web;
- regulations;
- standards;
- academic/industry research;
- vendor documentation;
- market information;
- enterprise documents;
- licensed datasets;
- industry communities where permitted.

Target path:

```text
external claim
      ↓
source + provenance
      ↓
relevance assessment
      ↓
enterprise hypothesis / candidate
      ↓
local evidence / validation / Human governance
      ↓
EC learning
```

The system should distinguish at least conceptually between:

- external claim;
- internal observation;
- enterprise hypothesis;
- enterprise-validated experience;
- authoritative Business Definition;
- deterministic runtime fact.

These categories MUST NOT collapse into one generic "memory" bucket.

## 12. Two-speed learning model

The architecture should support two different feedback speeds.

### Fast loop — personal work loop

```text
enterprise experience
      ↓
Context Assembly
      ↓
Personal Agent
      ↓
action / decision / work
      ↓
outcome
      ↓
Personal Context Memory / Run evidence
      ↺
```

This may operate at conversation, task, hour or day timescales.

### Slow loop — enterprise learning loop

```text
Personal Agent evidence
+ Human outcomes
+ EVO Runtime evidence
+ enterprise documents
+ external knowledge
        ↓
Experience Compiler
        ↓
comparison / conflict / pattern / validation
        ↓
enterprise experience
        ↓
future guidance
        ↺
```

This may operate over days, weeks, months or years.

The loops should not be forced into one synchronous transaction.

## 13. Evidence, provenance and uncertainty

Every future enterprise-learning candidate should be able to answer:

- Where did this come from?
- Who or what observed it?
- What business object or process did it relate to?
- When did it happen?
- Is it personal observation, system fact, external claim or derived pattern?
- What evidence supports it?
- What contradicts it?
- How broad is the intended scope?
- How fresh is it?
- Has a Human reviewed it?
- Has the enterprise validated it in practice?

EC should be able to preserve disagreement:

```text
enterprise standard says X
recent personal observations suggest Y
runtime evidence currently shows Z
```

The difference itself may be valuable management intelligence.

## 14. Privacy, confidentiality and ownership

This long-term target MUST NOT imply that everything a Human tells a Personal Agent becomes enterprise property or enterprise learning.

Future memory/learning policy must preserve scope boundaries such as:

```text
PRIVATE
PERSONAL_WORK
TEAM
DOMAIN
ENTERPRISE
PUBLIC
```

Exact categories are not frozen by this document.

Required principle:

> Use for current reasoning does not imply permission to persist, share, promote or train.

Examples:

- authorized enterprise knowledge may be used in a task without being copied into Personal Context Memory;
- personal preferences may improve the Personal Agent without being submitted to EC;
- sensitive personal memory should not be exposed to enterprise learning by default;
- enterprise-confidential material must not leak into another Enterprise Context;
- external evidence must preserve source/licensing constraints.

## 15. Memory is not model hidden state

Personal or enterprise learning MUST remain model-independent.

Canonical model:

```text
Personal Context Memory
        │
        ├─────────┐
        │         │
        ▼         ▼
Experience Compiler     EVO Runtime
        │               │
        └──────┬────────┘
               ▼
        Context Assembly
               ▼
        LLM Provider
               ▼
         reasoning
```

Replacing GPT, Claude, Gemini, DeepSeek, a local model, an enterprise gateway or a future model must not delete accumulated enterprise or personal experience.

The LLM is a consumer of compiled context, not the durable memory authority.

## 16. Relationship to Enterprise Context

Enterprise Context answers:

> What is the governed enterprise definition now?

EC answers:

> What has the enterprise learned, observed, researched and inferred over time?

Personal Context Memory answers:

> What should this Personal Agent remember about this Human's permitted working history and experience?

EVO Runtime answers:

> What actually happened according to deterministic enterprise execution records?

These concerns are complementary.

A future EC recommendation may become:

```text
enterprise learning
      ↓
definition improvement proposal
      ↓
Business Definition Draft
      ↓
Human/governed review
      ↓
Enterprise Context publication
      ↓
effective definition
```

EC never directly rewrites published enterprise definition truth.

## 17. Relationship to EOG and SOP

Future Personal Agent context may use EOG and SOP through stable public capabilities.

Conceptually:

```text
EOG                     = enterprise relationship / operating graph perspective
SOP                     = process + temporal/behavioral perspective
EC                      = learned enterprise/industry intelligence
EVO Runtime             = deterministic business evidence
Personal Context Memory = person-scoped remembered experience
```

The Context Assembly layer may combine relevant results from these components without making the Personal Agent depend on their private implementation.

This long-term target does not change the current rule that EOG Core is not the parent owner of SOP/reporting/analysis plugins.

## 18. Relationship to Personal Work Runtime

The future learning loop becomes substantially more valuable when Personal Agent work is represented as durable work rather than only conversation.

Potential future inputs include:

- Goal;
- Plan;
- Task;
- Run;
- WAITING / BLOCKED / APPROVAL_REQUIRED states;
- actions;
- receipts;
- outcomes;
- follow-ups.

This document does not make Personal Work Runtime a current requirement. It records that durable work/outcome semantics are preferred future learning evidence.

## 19. Long-term capability phases

The following phases are planning labels, not committed releases.

### LT-1 — Relevant Personal Experience Retrieval

Personal Agent can retrieve relevant Personal Context Memory for the current task without loading all historical conversation.

### LT-2 — Enterprise Guidance Projection

EC can return task-relevant enterprise/industry experience to an authorized Personal Agent through a stable public capability.

### LT-3 — Governed Context Assembly

The Host can assemble a structured minimum-sufficient context package from Personal Memory, Enterprise Context, EC, Work and Runtime evidence before calling the LLM Provider.

### LT-4 — Experience Extraction

Durable Runs/outcomes can produce explicit learning candidates with provenance rather than silently mutating enterprise knowledge.

### LT-5 — Enterprise Learning

EC can compare candidates across people, roles, time and external evidence; preserve conflicts; and promote validated patterns through governance.

### LT-6 — Continuous Enterprise–Personal Learning Loop

Enterprise learning guides Personal Agents; their governed real-world outcomes create new enterprise evidence; the cycle continues independently of any one model vendor.

## 20. Current architecture reservation only

For the current mainline, the required action is deliberately small.

Preserve:

- Personal Context Memory as more than raw chat transcript;
- durable Run/action/outcome references where already present;
- model-independent LLM Provider boundary;
- EC as separate enterprise/industry learning authority;
- Enterprise Context as separate Business Definition authority;
- public capability/tool boundaries;
- provenance/ownership semantics;
- authorization before cross-context access.

Canonical current directive:

> Do not implement speculative infrastructure solely for the Enterprise–Personal Learning Loop. Preserve only the contracts and data semantics required to enable it later.

## 21. Explicit current non-goals

The following are NOT authorized by this document for current implementation:

- full automatic enterprise learning;
- generic Personal Knowledge Store;
- automatic personal-to-enterprise memory synchronization;
- unrestricted Context Memory writes;
- model fine-tuning from user conversations;
- autonomous web crawling as a default background process;
- enterprise-wide embedding of all documents and all memories;
- automatic cross-employee memory sharing;
- automatic promotion of personal observations to enterprise truth;
- multi-agent learning society;
- broad Agent-to-Agent delegation;
- replacement of EC with App Platform memory code;
- replacement of Enterprise Context with EC;
- replacement of deterministic EVO truth with LLM/EC conclusions.

## 22. Future activation gates

Before any phase becomes implementation mainline, it should have an explicit accepted vertical use case and answer at least:

1. Who owns the data?
2. What is the source of truth?
3. What may be persisted?
4. What may cross Personal/Enterprise boundaries?
5. What evidence/provenance is required?
6. How are contradictions represented?
7. How is authorization checked?
8. How is the model request bounded?
9. How is model replacement preserved?
10. How is incorrect learning corrected or revoked?
11. How is deletion/retention handled?
12. How is success evaluated against real outcomes?

No phase should enter CI merely because it appears in this roadmap.

## 23. Long-term invariants

### EPL-01 — Model independence

Durable personal and enterprise learning MUST survive LLM Provider replacement.

### EPL-02 — Personal experience is not enterprise truth

A Personal Context Memory item MUST NOT become enterprise knowledge merely by being remembered.

### EPL-03 — Enterprise knowledge is not Personal Memory

Using EC knowledge for reasoning MUST NOT silently copy it into Personal Context Memory.

### EPL-04 — Runtime facts remain deterministic

EC/LLM conclusions MUST NOT override authoritative EVO Runtime facts.

### EPL-05 — Definitions remain governed

EC may propose definition changes; Enterprise Context owns publication/effectiveness.

### EPL-06 — Context is selected, not dumped

LLM calls should receive task-relevant minimum-sufficient context, not unrestricted enterprise/personal memory.

### EPL-07 — Provenance survives learning

Enterprise learning should preserve enough lineage to explain why a learned pattern exists.

### EPL-08 — Cross-context access is authorized

Personal/enterprise boundaries cannot be bypassed by model prompts or caller-supplied IDs.

### EPL-09 — Learning may preserve disagreement

Conflicting perspectives should remain representable until evidence/governance resolves them.

### EPL-10 — No speculative mainline expansion

This long-term target does not authorize current feature expansion without an accepted vertical need.

## 24. Example future flow

Illustrative procurement example:

```text
Human asks Personal Agent:
"Supplier A may delay this order. What should I do?"

Context Assembly obtains:

Personal Context Memory
→ how this Human handled similar supplier issues before

EC
→ enterprise cases and validated supplier/lead-time experience

Enterprise Context
→ current procurement definitions/policies

EVO Runtime
→ current PO, inventory, demand and actual delivery evidence

EOG
→ affected customer/order/production relationships if relevant

SOP
→ applicable temporal/process expectations if relevant

Capability Registry
→ actions currently allowed for this Human/Agent

        ↓

LLM reasons over the bounded package

        ↓

Agent proposes actions

        ↓

Human / delegated authority governs execution

        ↓

EVO records deterministic result

        ↓

outcome becomes Personal Memory and/or learning evidence

        ↓

EC may later compare this with other evidence

        ↓

validated pattern may guide future authorized Agents
```

No single model call becomes enterprise truth by itself.

## 25. Project positioning

This long-term target explains how Personal Agent and EC should eventually cooperate:

```text
Personal Agent          = intelligent actor serving one Human in current work
Personal Context Memory = durable person-scoped memory/experience
Experience Compiler     = enterprise/industry learning and intelligence accumulation
Enterprise Context      = governed definition space
EVO Runtime             = deterministic business reality
Context Assembly        = governed bridge that gives a replaceable LLM the right context now
```

The long-term vision is:

> Personal experience and external knowledge continuously generate evidence for enterprise learning; enterprise learning continuously improves the guidance available to authorized individuals; every LLM call receives only the relevant combination of personal experience, enterprise intelligence, current business truth, work state, authority and capabilities.

That is the intended Enterprise–Personal Learning Loop.
