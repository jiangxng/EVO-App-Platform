# AI Project Bootstrap

This file is the stable entry point for every fresh ChatGPT / LLM / Agent conversation working on EVO App Platform.

Architecture authority: `docs/architecture/PROJECT-CONTINUITY-PROTOCOL-v0.1.md`.

Do not reconstruct project state from chat memory.

## Mandatory startup order

A fresh session MUST read, in order:

1. `AI-BOOTSTRAP.md`
2. `project.status.json`
3. the file referenced by `project.status.json.handoff`
4. `LLM.md`
5. `llm.foundation-map.json`
6. only the architecture / roadmap authority files referenced by the current task or by `project.status.json`

Do not load the entire repository by default.

## Source-of-truth rule

Conversation history, ChatGPT Memory, model memory, and prior assistant summaries are helpful context only.

They are never the authority for:

- the current milestone;
- what is already implemented;
- what already passed Human validation;
- the current production deployment;
- which Proposal / Memory / migration must not be repeated;
- the next live acceptance gate.

Those facts come from the repository, primarily `project.status.json` and the current handoff.

If chat memory conflicts with repository state, repository state wins.

## Project development delivery rule (owner-approved 2026-10-14)

Before starting or continuing code work, read `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` and follow its contract-first reuse and short-delivery workflow. One independent delivery loop defaults to one active branch and PR with successive commits; merge and retire after the loop passes its relevant CI, then continue from latest main. A large milestone may contain sequential PRs, never requires one permanently open branch. Inspect existing code/PR/test evidence before implementation; never repeat completed research or copy verified functionality. Merge conflicts are resolved in the existing PR rather than starting a duplicate branch. Production authorization stays separate.

## Fresh-window execution continuity (owner-confirmed 2026-10-21)

After the mandatory startup set and before any new implementation/research cycle, read `docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md` **and** its execution supplement `docs/governance/FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0.md`. The latter is binding on fresh ChatGPT/Codex/LLM windows; do not silently revert to one-micro-fix/one-push/full-CI loops.

For the task's **current** owner PR, review its latest head SHA, base/dependencies, relevant tests/artifacts and short *route-pivot/failed-attempt log*, if present. Do not assume the previous window's proposed solution was correct. Separate proven facts from hypotheses. Before editing, state (briefly): **remaining real user-visible gap; accepted baseline; last failed/abandoned path and why; next smallest discriminating test; pivot criterion; authorized file/owner boundary**. If no failed path is recorded, say `none recorded`; do not invent one. If a newer commit supersedes the handoff, use latest verified facts.

Two consecutive attempts without measurable progress (or two CI failures caused by test harness/selector/environment) trigger the runbook's short four-line reassessment before a third similar patch. Persist this reassessment as a **small incremental PR comment or task-scoped handoff**, not a separate sprawling retrospective. The work may change branches or split owners only under the existing delivery rules. Keep exact HEAD CI and Human/production gates unchanged.

## 认可原型源码优先（Owner 2026-10-21）

**凡目标 UI 已提供可读取的、经用户确认的交互式原型源文件（HTML/CSS/JS 等），先读取并固定原型的文件路径、Git ref/blob 和源代码，直接按 DOM、样式变量/颜色、事件与状态机整理功能/布局/颜色的完整差异，再决定如何在真实 Host/Eidos 中实现。** 截图仅用于改后真实浏览器/手机和 Human 的最终校验，不得因截图易取就绕过现有原型源码、反复猜 CSS/行高/像素。

- 按 [开发工作流 §5](docs/architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md#5-认可原型源码优先的高保真交付) 和 [快速反馈规程 §5](docs/governance/FAST-FEEDBACK-AND-ROUTE-PIVOT-v1.0.md)；界面工作另按 [Human UI 检查规则](.clinerules/03-human-ui-design-review.md)。
- 三个独立验收维度：**功能 100%（真实可操作）、布局 100%（结构/阅读顺序/控件/响应式意图）、颜色 100%（批准的颜色与状态语义）**；响应式允许设备差异，不要求不同分辨率行高和逐像素尺寸相同。
- 原型里 demo 的 localStorage、模拟数据、假提交/权限不构成 Host 生产语义；必须通过真实契约/授权/预检/保存。若原型与业务真实性或 Eidos 通用权威冲突，列出并解决冲突，不可假装达标、擅自改共享主题或降低原目标。
- 新窗口先复用上个 owner PR 的**已读原型源码、差异索引、失效尝试**，只检查新变更，不重新根据截图猜测已提供源码的设计。

## Continuation rule

Before proposing or implementing work, answer these from repository evidence:

```text
Where are we now?
What is already PASS?
What is still OPEN?
What must NOT be repeated?
What is the next smallest real gate?
```

If these cannot be answered, inspect the referenced authority documents before acting.

## Current product model

The Person-first root remains authoritative, with the 2026-09-30 enterprise-definition correction:

```text
Human
  └── Personal Agent
        ├── Personal Context
        │     └── Personal Context Memory
        └── authorized Enterprise Context(s)
              └── authoritative Business Definitions

Experience Compiler
  └── enterprise/industry knowledge + learning + experience
```

The product-facing Agent is Personal Agent. The machine/package name `enterprise-agent` remains compatibility debt.

Read `docs/architecture/ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md` before Enterprise Context, EOG, SOP, EC or Ledger Runtime ownership work.

Target ownership:

- EC knows, learns and proposes;
- Enterprise Context defines and governs;
- EOG designs/navigates the enterprise graph and aggregates peer-plugin views;
- EVO Ledger Runtime executes deterministic business effects;
- Eidos realizes deterministic human interaction.

Existing Enterprise Context Memory / SOP / Observatory implementations are preserved compatibility assets where noted; do not mistake historical implementation location for target ownership.

For Personal Agent state, long conversations, memory, Context Assembly, Agent Runs, retrieval, EC learning evidence or storage decisions, `docs/architecture/AI-NATIVE-AGENT-STATE-CONTEXT-CONSTITUTION-v1.0.md` is the project constitution. AI-native is a semantic/governance architecture, not a JSON/JSONL storage mandate. Keep Conversation, Working State, Personal Context Memory and EC learning distinct; preserve source evidence; treat summaries as derived/versioned; prefer mature production storage for durable queryable state; keep models replaceable.

## Human authority rule

The user has delegated ordinary engineering leadership and execution to the LLM.

Proceed without asking for confirmation when the next step is bounded, reversible, and already implied by the accepted goal.

Stop only when a real Human authority decision is required, including:

- accepting/rejecting governed durable Memory;
- destructive or irreversible action;
- business trade-off or requirement reinterpretation;
- credential/security decision;
- material production data mutation not already authorized.

## Durable progress rule

Every accepted project step must leave repository evidence.

At minimum, when project state materially changes:

1. update the structured `project.status.json.projectContinuity` snapshot;
2. run `npm run continuity:render` to regenerate `docs/roadmap/HANDOFF-LATEST.md`;
3. run `npm run continuity:validate`;
4. update or add the relevant architecture/live-certification authority document;
5. add regression/CI evidence when behavior changed.

Do not hand-edit HANDOFF-LATEST as an independent source of truth.

A chat-only decision is not durable project state.

## New-chat anti-amnesia acceptance

A fresh ChatGPT/LLM session is considered project-continuous only if, after reading the startup set above, it can correctly state:

- current milestone;
- latest closed live slice;
- current open live gate;
- current deployed revision;
- latest important implementation PRs;
- any dangerous stale action that must not be repeated.

No previous conversation transcript should be required.

## Scope

This protocol solves engineering/project continuity.

It is separate from Personal Agent product-level Context Memory recall. Personal Agent cross-session recall is validated through its own Host Memory tools and governance contracts.
