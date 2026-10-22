# PA05 / K0 工程整合候选（2026-10-22；NOT PRODUCTION SIGNOFF）

**Type:** ENGINEERING_INTEGRATION_CANDIDATE / DO_NOT_MERGE_OR_DEPLOY_UNTIL_OWNER_GATES_SIGNED.
**Baseline:** `main@60ba2e31139933148dd1c6d0e5f6d713fe03dfcd`.
**Inputs:** [PR #1074](https://github.com/jiangxng/EVO-App-Platform/pull/1074) and source head `c9a3f85c06093f8e6aa0c117e616e6fe14012e6a` (Host shutdown); [PR #1082](https://github.com/jiangxng/EVO-App-Platform/pull/1082) head `2b19d9f2c345a19e056884963ab7e7fcae1415b4` (PROCESS stop barrier). [PR #1081](https://github.com/jiangxng/EVO-App-Platform/pull/1081) intentionally failing old-runtime negative evidence is preserved via the closed PR, **not merged**.

## Scope and compatibility

- Take three bounded Host shutdown files from the #1074 source tree: `manager/server.ts`, `manager/host-shutdown.ts`, `tests/agent-line/pa05-host-shutdown-error-path.test.mjs`.
- Take the original 13 scoped PROCESS runtime and offline-only fixture/test files from #1082; these are separate from #1074.
- For `.github/workflows/lightweight-host.yml`, use the **current main original** including new `memory-intake-config-budget.test.mjs`, and add only the PA05 Host shutdown + J4J test step from #1074. Do **not** replace concurrent governance tests or provider code.
- Reuse existing local CI evidence and build on this combined exact-head; neither original branch's earlier green result alone proves cross-branch combination.

## Engineering pass ceiling / external signoff blockers

An isolated, directly spawned Node Host / PROCESS subprocess regression may prove bounded stop/reap/deny-new-admissions behavior, but does **not** prove production Railway PID1 to Node SIGTERM reachability, effective deployment drain/overlap, complete multi-Worker/runner/caller inventory, independently authorized external Supervisor, DBA/session absence, production IdP, credential custody, or signed centralized audit.

The [Owner issue #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) requires real and same-deployment R5-01/02 Operator receipts and authorized R5-03 external non-production Supervisor/TTL. At the time of this candidate, those remain `UNKNOWN/UNVERIFIED/BLOCKED`; complete K0, E01J4, PA05-05 E01–E05, and W06 remain **NOT_SIGNED**, production material WRITE stays **OFF**. Do not use a PR merge to claim otherwise.

**Release rule:** This is a draft integration branch for review and CI; **do not merge to main or deploy** until the #1092 Owner and actual deployment controls have been signed and exact final-head integration tests rechecked. No Railway, SQL, Secrets, locks, Validator or global status file changes permitted.

**Branch retirement rule:** superseded source refs #1074/#1081/#1082 may be retired only after confirming all source code/negative-evidence provenance and current SHA pins are preserved in this draft + GitHub PR history, there is no active PR using them, and a separately scoped CI deletion workflow produces actual `DELETED` logs. The active consolidated draft branch must remain until approved.
