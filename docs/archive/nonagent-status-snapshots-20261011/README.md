# Historical non-Agent branch state snapshots (2026-10-11)

This is a **source-history-preserving** selective merge for four abandoned/stale status and continuity branches. The old `project.status.json`, roadmap, and handoff variants are stored here as **historical evidence only**. They must never be loaded as runtime/project authority. The latest `main` versions of the canonical `project.status.json` and roadmap files are retained unchanged. No Agent, EOG/2D Designer, finance engine, Platform Core or deployed service is changed.

- `codex/cp-04-post-merge-status` original head `85d42578c5585e4b0a3ed7d3ab78baa5232e8b5d`; archive folder `codex-cp04/`; source changed: `project.status.json`.
- `docs/cp03d-import-fidelity-business-gate` original head `3c51a0c5d3057b7a25fe7885d95f4471a5ef14a2`; archive folder `cp03d-fidelity/`; source changed: `project.status.json`.
- `continuity/it01b-pass-it01c-active-20261009` original head `3b18d07c90a6cd152d96e68a283b077d62295207`; archive folder `it01b-continuity/`; source changed: `project.status.json`, `docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md`, `docs/roadmap/HANDOFF-LATEST.md`, `docs/roadmap/IT01-ITEM-SECOND-OBJECT-EVIDENCE-v0.1.md`.
- `continuity/it01e-platform-gaps-closed-rvc-active-20261009` original head `88c492394ab1d6a6ec882be6bffad973b1ef4623`; archive folder `it01e-continuity/`; source changed: `project.status.json`, `docs/roadmap/FOUNDATION-OBJECT-PROGRAM-v0.1.md`, `docs/roadmap/HANDOFF-LATEST.md`, `docs/roadmap/IT01-ITEM-SECOND-OBJECT-EVIDENCE-v0.1.md`.

Original commits are additional parents of the convergence commit. Branches can be retired only after merging the convergence PR and verifying that all original commits are reachable from `main`. If a future task needs a specific legacy decision, consult these exact snapshots, not the live authority files.
