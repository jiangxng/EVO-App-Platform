# Handoff — Current Mainline

**Status:** authoritative current continuation note  
**Date:** 2026-09-27  
**Authority:** `project.status.json`

This file is intentionally stable in name. Update it when the mainline materially changes so a fresh ChatGPT/LLM session does not need to guess which dated handoff is newest.

## Current milestone

```text
Personal Agent P1.4X — Vertical Experience Checkpoint
Status: LIVE_CERTIFICATION_IN_PROGRESS
```

P1.4X is not fully closed.

## Closed live slice — Memory canonicalization

The real duplicate 17:00 warehouse-cutoff case is closed:

```text
A (older duplicate)
memory:proposal:memory-proposal:bef0947e-4563-4618-9c1f-68f8452b0421

B (canonical)
memory:proposal:memory-proposal:cb145bad-bd4f-4bcd-b0b6-c4d105a5082a

A --canonicalized_to--> B
```

Human accepted:

```text
proposalId:
memory-canonicalization-proposal:534175fa-fde5-42f1-8a54-510f4fa7900a

canonicalizationId:
memory-canonicalization:4e1d97e8-1bad-4e4c-9591-a2117263eedc
```

Verified live:

- ordinary effective retrieval excludes A;
- ordinary retrieval returns B;
- B matched `仓库 17:00 截单` with score 0.7 / `SUMMARY_TOKENS_ALL`;
- exact-ID historical audit still returns A + B;
- Memory content was not rewritten;
- canonicalization created no third Memory.

Authority:

- `docs/roadmap/P1.4X-LIVE-CERTIFICATION-MEMORY-CANONICALIZATION.md`

Do not accept the old content Proposal
`memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f`
as a deduplication mechanism.

## Runtime defects found and closed during live certification

- PR #84 — repeated identical READ no longer clears the whole tool catalog; Memory Proposal readback added.
- PR #85 — `supersedesMemoryId` became effective in ordinary retrieval while exact-ID audit remains historical.
- PR #86 — append-only Human-reviewed existing-Memory canonicalization.
- PR #88 — paraphrased READ loops converge by returned authoritative evidence.
- PR #89 — exact-ID Memory audit tool.
- PR #90 — one-shot effective-vs-history audit to reduce sequential LLM/tool latency.
- PR #91 — deterministic multi-token lexical retrieval.
- PR #93 — bounded cross-session Memory recall through LLM-supplied short query expansion + Host-governed parallel lexical reads.

## Current open live gate

Fresh-session recall + qualified reasoning.

The user starts a fresh Personal Agent conversation and asks only:

```text
今天 18:00 的订单还能当天处理吗？
请根据你已经保存的 Context Memory 判断，并告诉我你用了哪条 Memory。
只做 READ，不要创建 Proposal，也不要执行任何 WRITE。
```

The Agent must, without prior conversation history or being told 17:00 / A / B:

1. recall canonical B from Personal Context Memory;
2. cite/use B as evidence;
3. reason that 18:00 is normally after the 17:00 cutoff;
4. preserve the word normally — exceptions may exist;
5. avoid claiming the cutoff is absolute;
6. avoid inventing that the fact belongs in Enterprise Context;
7. perform no WRITE.

PR #93 adds `context.memory.recall` specifically to close this gate without hard-coded business synonyms or repeated READ loops.

## Current production preview

Project:
`EVO Ledger Runtime MVP`

Service:
`Ledger Configurator`

Railway environment:
`production`

Expected source:
`jiangxng/EVO-App-Platform:main`

Current deployed code after PR #93:
`fc4d5e42135d2f6dbc25600b2363cd57e3f4c259`

Persistent state:
`/data`

## Important architectural distinction

```text
Conversation History
= session-local discourse continuity

Context Memory
= governed durable cross-session product knowledge

Project Bootstrap / Handoff
= durable engineering-project continuity for fresh ChatGPT/LLM sessions

Host READ
= current authoritative runtime/platform state
```

Do not use one layer as a substitute for another.

## Still-open infrastructure follow-ups

These are real, but do not replace the current live gate:

- ranked Memory retrieval is not exhaustive inventory; add a deterministic paginated governance inventory API;
- generic durable Agent Action Receipt is still needed across future side effects;
- synchronous Agent HTTP has shown an approximately 60-second practical ceiling; long-running work should become resumable/asynchronous rather than one long request;
- a configured semantic-retrieval Provider remains optional/replaceable; PR #93 provides a deterministic fallback recall path when no semantic Provider is configured.

## Fresh-session engineering rule

For any new ChatGPT/LLM development conversation, read:

```text
AI-BOOTSTRAP.md
→ project.status.json
→ docs/roadmap/HANDOFF-LATEST.md
→ LLM.md
→ llm.foundation-map.json
```

before continuing implementation.
