# Personal Agent Product Experience v0.1

**Status:** Proposed implementation baseline  
**Date:** 2026-09-26  
**Owner split:** Eidos owns reusable visual/interaction patterns; EVO App Platform owns lifecycle/readiness/orchestration; Personal Agent owns reasoning behavior and product semantics.

## 1. Purpose

Personal Agent is a first-class EVO product surface, not a raw chat box.

The current implementation already uses Eidos public contracts, but its user experience is still too thin:

- chat@0.1.0 exposes only header, text transcript, textarea and Send;
- Personal Agent is rendered inside the Workbench Side Panel with no Context/readiness/tool/proposal semantics;
- installation can succeed before any usable llm.inference Provider is ready;
- users discover missing Provider/credential state only after attempting chat;
- Extension Manager permanently exposes large amounts of technical detail instead of progressively disclosing it;
- Provider configuration exists, but no product-level setup flow connects Personal Agent installation to Provider installation/configuration/readiness.

Passing the existing Eidos design-language CI is therefore necessary but not sufficient.

## 2. Design authority

All Personal Agent human surfaces MUST follow:

- Eidos Productive Design Language v0.1;
- Eidos semantic Icon Registry;
- Eidos Workbench;
- Eidos public Experience capabilities;
- Eidos localization/runtime patterns.

External reference principles already adopted by Eidos remain useful:

- VS Code: Activity Bar -> View Container -> Sidebar/View, minimal custom Webviews;
- Fluent 2: 4px spacing rhythm, proximity/grouping and responsive hierarchy;
- Carbon: one-primary-action discipline and enterprise productive density;
- WAI-ARIA APG: keyboard/focus behavior, dialogs and grouped toolbar semantics.

Personal Agent MUST NOT introduce product-owned CSS, a private component library, third-party standard icon set, handwritten shell or a parallel setup/settings UI.

If a reusable pattern is missing, implement it in Eidos first.

## 3. Product role

Frozen world model:

    Human
      └── Personal Agent
            ├── Personal Context
            └── authorized Enterprise Context(s)

Personal Agent is the human's work adviser.

It:

- observes;
- searches;
- analyzes;
- explains;
- prepares plans;
- expresses opinions/proposals;
- presents evidence;
- asks for human confirmation when a consequential decision/action is needed.

It is not the final material decision authority.

The responsibility relationship is:

> Human owns intent and authority; Personal Agent owns understanding, judgment, execution and follow-through within that authority.

This means Personal Agent should reduce human cognitive/coordination load rather than repeatedly returning routine investigation, implementation choices or follow-up steps to the human.

Enterprise Context is working/learning material, not a second Agent.

## 3.1 Responsibility and collaboration behavior

Personal Agent is expected to behave more like a responsible adviser/operator than a passive answer engine.

It should:

- inspect before asking;
- use READ/PLAN tools instead of requesting discoverable information from the human;
- make a professional recommendation when one path is materially better;
- correct incomplete/risky approaches without discarding the user's valid goal;
- execute low-risk/reversible work when authority is already sufficient;
- ask only for genuine human judgment or formal authorization;
- after authorization, continue the remaining executable work rather than returning a tutorial/checklist;
- verify authoritative outcomes before claiming completion.

It must not:

- create unnecessary multiple-choice decisions merely to transfer responsibility;
- mechanically agree with the human;
- hide material disagreement;
- use "human control" as an excuse to push ordinary coordination burden back to the human;
- infer or manufacture authority beyond Host contracts.

Detailed authority:

- `docs/architecture/PERSONAL-AGENT-RESPONSIBILITY-POLICY-v0.1.md`

## 4. Workbench placement

Keep Personal Agent as an Eidos Workbench Activity and Side Panel View Container.

Do not turn the Activity Bar entry into a custom full-page application merely because chat becomes richer.

Canonical desktop relationship:

    Activity Bar
      Personal Agent
            ↓
    Side Panel
      Agent conversation
      current Context
      task/activity feedback
      composer
            ↔
    Main Workspace
      evidence
      documents
      configuration
      provider setup
      proposed business object
      application pages

Why:

- Personal Agent should remain available while the user inspects business applications;
- rich evidence/configuration belongs in the dominant Workspace;
- the Side Panel should stay focused on conversation/context rather than becoming a miniature application shell.

The Side Panel remains user-resizable.

A future Eidos enhancement MAY support an activity-level preferred starting width, but user-resized width always wins.

## 5. Personal Agent Side Panel anatomy

Target composition:

    ┌──────────────────────────────────┐
    │ Personal Agent          [status] │
    │ [Personal / Enterprise Context]  │
    ├──────────────────────────────────┤
    │                                  │
    │ conversation                     │
    │                                  │
    │ assistant text                   │
    │ evidence/activity summary        │
    │ proposal summary                 │
    │                                  │
    ├──────────────────────────────────┤
    │ current context / optional tools │
    │ [ Ask or describe a task... ] [→]│
    └──────────────────────────────────┘

### 5.1 Header

Header should contain only stable high-value information:

- Personal Agent title;
- readiness indicator when attention is required;
- Context selector/current Context summary;
- small overflow/menu only when necessary.

Do not place Provider/model/API vendor controls here.

### 5.2 Empty / welcome state

When ready and transcript is empty:

- short explanation of what Personal Agent can do;
- current Context;
- 2-4 compact suggested prompts/actions;
- no marketing hero art;
- no giant page title;
- no setup details unless setup is required.

Example semantics:

    Personal Agent

    Current context: Personal

    I can inspect your available apps and Context,
    explain what is happening, and prepare an opinion or plan.

    [What needs my attention?]
    [Show available apps]
    [Explain this workspace]

Suggestions are optional convenience, not authoritative capabilities.

### 5.3 Transcript

Conversation should remain quiet and scan-friendly.

Human message:

- compact elevated/filled bubble;
- visually distinct but not oversized.

Agent message:

- mostly unboxed content;
- readable line length;
- supports structured subparts.

Do not render tool JSON, internal prompt text, raw stack traces or Secret/provider details into ordinary conversation.

### 5.4 Tool/activity feedback

Personal Agent needs observable work, but not noisy chain-of-thought.

Show concise Host observations such as:

    Checked current Context
    Read provider health
    Searched Platform Help
    Prepared installation plan

These are tool/activity facts, not hidden reasoning.

Detailed diagnostics can open in Workspace when useful.

### 5.5 Evidence

Agent opinions should be able to cite/open evidence.

A message may expose:

- source label;
- Context;
- object/document id;
- route/open action;
- freshness/time when material.

Selecting evidence opens the corresponding Eidos Workspace route.

### 5.6 Proposal / human decision

Consequential recommendations need a distinct proposal surface:

    Proposal
    Approve purchase exception

    Why
    - ...
    - ...

    Risk
    - ...

    [Review in workspace]   [Confirm]   [Reject]

Rules:

- proposal is visibly distinct from ordinary text;
- one primary forward action at most;
- destructive/reject actions are separated;
- human confirmation is an ActionHost/Host boundary, not prompt obedience;
- confirmation dialogs follow Eidos/WAI-ARIA focus semantics.

P0.4 MAY implement only "Review in workspace" before broad WRITE autonomy.

## 6. Readiness model

Personal Agent lifecycle must distinguish:

    Not installed
    Installed but needs setup
    Ready
    Disabled
    Unavailable / error

Installed and Ready are not equivalent.

### Ready

Personal Agent is Ready when:

1. Package/Feature is active;
2. at least one resolvable llm.inference Provider exists;
3. Provider runtime configuration/credential is usable;
4. Provider resolution is not ambiguous;
5. required Host foundations are healthy enough for the operation.

Context/permissions may later affect task-specific capability, but they should not be overloaded into basic LLM readiness.

## 7. Installation flow

### 7.1 Discovery

Plugin Store should present Personal Agent as a user-facing product first.

Primary content:

- name;
- concise purpose;
- lifecycle/readiness status;
- primary action;
- only immediately relevant trust/permission warnings.

Technical information such as protocol version, integrity digest, runtime isolation, contributions and raw Capability lists should move behind progressive disclosure.

The current Extension Manager's always-expanded technical sections should be redesigned in Eidos.

### 7.2 Install

Initial primary action:

    Install

Installation keeps ordinary automatic safety preflight.

Do not silently choose an LLM vendor merely because a Package provides llm.inference.

Provider/vendor choice may have:

- billing/cost consequences;
- data-handling implications;
- credential ownership implications;
- regional/compliance implications.

If a ready Provider already exists, Personal Agent can become Ready immediately after install.

If not, install succeeds but readiness becomes:

    Needs setup

Primary action becomes:

    Set up

not Open.

### 7.3 Why Personal Agent should not simply require llm.inference as an install dependency

The current Package dependency resolver can discover Capability Providers, but when several Providers exist it resolves the first deterministic catalog candidate.

That is correct for ordinary implementation dependency resolution, but not for a human-significant LLM vendor choice.

Therefore:

- Personal Agent remains provider-neutral;
- setup/readiness orchestrates Provider selection;
- Provider selection is explicit when multiple candidates exist;
- exactly-one-ready Provider may resolve automatically;
- no hidden lexical "first provider" becomes a product choice.

## 8. Setup flow

Eidos currently lacks a reusable declarative setup/onboarding capability.

Add a generic Eidos capability, working name:

    setup-flow@0.1.0

It is not Personal-Agent-specific.

### 8.1 Setup flow structure

    Personal Agent setup

    1  LLM Provider          Complete / Required
    2  Provider credentials  Complete / Required
    3  Provider readiness    Complete / Failed
    4  Ready                 Complete

Each step has:

- id/title/description;
- status: pending/current/complete/blocked/error;
- optional primary/secondary action;
- optional route;
- optional short diagnostic;
- no arbitrary HTML.

Only the current actionable step should visually dominate.

### 8.2 Step 1 — select/install LLM Provider

Cases:

**One ready Provider**
- mark complete;
- no extra user choice required.

**One installed but unconfigured Provider**
- select it;
- continue to configuration.

**No installed Provider, one catalog candidate**
- show the candidate and explicit Install Provider action.

**Multiple candidates**
- present a provider-neutral selection list;
- show human-relevant metadata;
- require explicit choice.

Do not expose API keys here.

### 8.3 Step 2 — configure selected Provider

Navigate the main Workspace to the selected Provider's Eidos Settings surface.

Personal Agent does not own:

- model settings;
- API Base URL;
- credentials;
- Provider-specific advanced options.

The setup flow only reports readiness and directs the user to the owning Provider configuration.

### 8.4 Step 3 — validate Provider readiness

After save, re-evaluate:

- Provider installed/active;
- credential configured;
- Provider runtime registered;
- resolution not ambiguous;
- health/readiness result available.

Expose a small "Check again" action when automatic refresh is not enough.

Do not reveal Secret values.

### 8.5 Step 4 — ready

Show:

    Personal Agent is ready

    [Open Personal Agent]

Return to the normal Workbench Activity.

## 9. Configuration ownership

Personal Agent ordinary configuration remains intentionally empty.

### Personal Agent owns

- conversation semantics;
- context-aware reasoning;
- tool selection;
- opinion/proposal behavior;
- future personal interaction preferences that truly belong to the Agent.

### LLM Provider owns

- provider selection implementation;
- model id;
- endpoint/base URL;
- provider-specific parameters;
- API credential declaration.

### Host Secrets owns

- credential storage;
- non-readback behavior;
- authorization for secret mutation;
- audit.

### App Platform owns

- lifecycle;
- readiness composition;
- Provider resolution/binding;
- setup orchestration;
- Context resolution;
- ActionHost execution.

This split must remain visible in the UX.

## 10. Provider Settings improvements

The current Eidos settings-editor@0.1.0 is functionally sufficient but visually primitive for mixed ordinary settings + credentials + bootstrap administration.

Eidos should evolve Settings with:

- sections/groups;
- status/read-only rows;
- optional callout/notice;
- advanced/collapsible section;
- stable trailing primary Save action;
- Secret field status that does not expose plaintext.

For the current bootstrap phase, "Administrator authorization" should be placed under an advanced/temporary administration section rather than visually competing with normal model/API fields.

Do not build a Personal-Agent-specific Provider settings form.

## 11. Eidos capabilities required before App Platform UI work

### Required — Chat/Assistant experience evolution

Upgrade generic Chat capability, working version chat@0.2.0, to support:

- header/context metadata;
- readiness/attention state;
- suggested prompts/actions in empty state;
- structured message parts;
- observable activity/tool-status parts;
- evidence links/navigation;
- proposal/review action parts;
- busy/pending state;
- accessible errors/notices;
- optional compact footer/context indicator.

This stays provider-neutral and product-neutral.

### Required — Setup Flow

Add setup-flow@0.1.0 as described above.

### Required — Extension Manager progressive disclosure/readiness

Eidos Extension Manager should support:

- separate lifecycle status and product readiness;
- readiness states such as ready / setup-required / blocked / error;
- primary action driven by readiness;
- technical details collapsed by default;
- trust/permission blockers promoted only when relevant.

### Recommended — Settings Editor v0.2

Add grouping/status/advanced sections for provider configuration and Secret UX.

### Later

- per-Activity preferred side-panel width;
- conversation history selector;
- streaming/token-progress UI;
- richer citations;
- multi-file/evidence composition;
- voice/video;
- autonomous execution dashboards.

None are required for the first Eidos-native Personal Agent correction.

## 12. App Platform changes after Eidos capability delivery

After Eidos release/CI:

1. update vendored/pinned Eidos baseline;
2. Personal Agent Experience consumes the new Chat contract;
3. add Host-computed Personal Agent readiness;
4. Extension Manager exposes readiness and Set up;
5. add Personal Agent setup Experience using Eidos setup-flow;
6. orchestrate Provider selection/configuration routes;
7. ship all Agent/setup product chrome in en / zh-CN / ja / zh-TW through package-owned localization;
8. update Help, preserving per-document English fallback where ja/zh-TW variants are not yet complete;
9. add design-language/localization CI asserting Personal Agent uses only these Eidos capabilities and has four-locale bundle coverage.

No App Platform CSS.

## 13. Suggested first production flow

    Plugins
      ↓
    Personal Agent
      [Install]
      ↓
    Installed
      ↓
    Host evaluates readiness
      ├─ ready
      │    ↓
      │  [Open]
      │
      └─ setup required
           ↓
         [Set up]
           ↓
    Main Workspace: Eidos Setup Flow
           ↓
    Select/install LLM Provider
           ↓
    Open Provider Settings
           ↓
    Enter API Key / model settings
           ↓
    Save
           ↓
    Re-evaluate Provider readiness
           ↓
    Ready
           ↓
    [Open Personal Agent]
           ↓
    Activity Bar → Personal Agent Side Panel

## 14. Normal chat flow

    Personal Agent Activity
      ↓
    Side Panel
      ↓
    Host-resolved Context visible
      ↓
    Human message
      ↓
    Personal Agent READ/PLAN tools
      ↓
    observable activity summaries
      ↓
    opinion / evidence / proposal
      ↓
    Human chooses next action
      ↓
    Main Workspace opens evidence/configuration when needed

## 15. Error-state design

### Provider missing

Do not append a raw conversational error as if the Agent spoke it.

Show an Eidos attention state:

    Personal Agent needs setup

    No usable LLM Provider is available.

    [Set up Personal Agent]

### Credential missing

    LLM Provider needs a credential

    [Configure provider]

### Ambiguous Provider

    Choose which LLM Provider Personal Agent should use.

    [Choose Provider]

### Provider unavailable

Show:

- human-readable state;
- last known readiness;
- retry/check action;
- Help link when useful.

Detailed diagnostics belong in Workspace/Provider Manager.

## 16. Mobile

Mobile preserves the same semantics:

- Activity Bar / activity selector remains reachable;
- Personal Agent uses one active surface at a time;
- setup runs in the main working surface;
- composer remains fixed/visible without covering transcript;
- Context selector remains discoverable;
- touch targets meet Eidos minimums;
- no hover-only operation.

Do not shrink the desktop multi-region layout.

## 17. Accessibility

Eidos owns keyboard/focus semantics.

Required:

- visible focus;
- transcript uses live-region semantics without repeatedly announcing the entire history;
- Context selector has a clear accessible name;
- tool/activity groups do not create excessive tab stops;
- proposal confirmation uses proper dialog/alert-dialog semantics when modal confirmation is needed;
- after a dialog or setup action, focus returns to a logical initiating/next element;
- icon-only buttons have semantic labels/tooltips.

## 18. Migration from current implementation

Keep:

- enterprise-agent compatibility Package/route/command ids;
- Dynamic Host Tool Catalog;
- Person-first Context plumbing;
- provider-neutral llm.inference;
- Secrets Provider;
- Workbench Activity contribution;
- Eidos Productive Design Language tokens;
- current Help/localization model.

Replace/evolve:

- Chat v0.1 visual/semantic contract;
- raw chat-error handling for setup dependencies;
- always-expanded Extension Manager technical presentation;
- disconnected "install Agent, discover setup failure later" journey;
- flat mixed Provider Settings layout.

Do not rewrite the Personal Agent backend to solve a frontend/product-flow problem.

## 19. Acceptance criteria

The Personal Agent product experience is considered Eidos-native when:

1. no Personal Agent CSS/custom component library exists in App Platform;
2. install flow communicates product purpose before technical protocol detail;
3. lifecycle and readiness are distinct;
4. an installed-but-unready Agent offers Set up, not a misleading Open;
5. multiple LLM Providers require explicit human selection;
6. Provider credential/model configuration stays on Provider-owned Eidos Settings surfaces;
7. opening Personal Agent never requires ordinary vendor/model configuration inside the Agent UI;
8. Agent Side Panel shows Host-resolved current Context;
9. setup problems render as Eidos attention/setup states, not raw chat errors;
10. tool execution is observable without revealing hidden reasoning;
11. evidence can open in Main Workspace;
12. consequential Agent proposals remain human-confirmed;
13. desktop and mobile preserve Eidos Workbench semantics;
14. en + zh-CN + ja + zh-TW product chrome is complete;
15. locale changes preserve the same stable routes/actions/Context semantics and the layout remains usable with text expansion;
16. Eidos CI and App Platform design-language CI encode the above structural rules.

## 20. Recommended implementation sequence

### P0.4A — Eidos foundations

1. design/implement Chat v0.2;
2. design/implement Setup Flow v0.1;
3. add Extension Manager readiness/progressive disclosure;
4. optionally add Settings Editor v0.2 grouping if needed for Provider setup quality;
5. Eidos release/check PASS.

### P0.4B — App Platform Personal Agent onboarding

1. pin new Eidos;
2. introduce Host Personal Agent readiness model;
3. introduce setup Experience;
4. connect Provider selection/install/settings;
5. change Plugin Store actions based on readiness;
6. update Personal Agent Chat Experience;
7. Help/localization/CI;
8. deploy and validate on Railway.

### P0.4C — Agent work quality

1. structured activity parts;
2. evidence links;
3. proposal/review surface;
4. Workspace navigation;
5. READ/PLAN-first enterprise-context tools.

Do not begin broad WRITE autonomy before P0.4A/B are coherent.


## 21. Four-locale product requirement

Personal Agent is planned for users working in English, Simplified Chinese, Japanese and Traditional Chinese.

Required P0.4 UI locales:

- `en`;
- `zh-CN`;
- `ja`;
- `zh-TW`.

This applies to Personal Agent chat chrome, readiness/setup states, Provider-selection/setup orchestration, Plugin Store labels specific to this flow, Settings labels owned by participating Packages, errors/notices and human-confirmation/proposal actions.

Machine semantics do not change by locale.

Design implications:

- no fixed-width assumptions based on English labels;
- no sentence construction from concatenated translation fragments;
- status labels and action verbs must be independently localizable;
- Context names that are user/business data are not UI translation strings;
- exact-locale bundles are preferred, with deterministic English fallback for resilience;
- Japanese and Traditional Chinese are first-class release targets for new P0.4 surfaces, not optional future polish.
