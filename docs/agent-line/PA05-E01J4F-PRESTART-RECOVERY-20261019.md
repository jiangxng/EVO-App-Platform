# PA05-05/E01J4F — SQL-fenced operator-led prestartup UNINSTALL recovery

**2026-10-19 · DECISION_RECORD · initial ENGINEERING_CANDIDATE, exact-HEAD CI pending. Full E01J4/W06 NOT_SIGNED.**

## Fixed milestone progress / no scope extension

| Milestone | Baseline status | E01J4F relevance |
|---|---|---|
| E01A–J1 | Previous accepted bounded research / engineering | Do not repeat |
| E01J2 | BOUNDED_PASS 17/17 | Authenticated Host SQL READ |
| E01J3 | BOUNDED_PASS 18/18 | TCP cut; postgres.js 3.4.9 crash P0 OPEN |
| E01J4A | BOUNDED_PASS 19/19 | Two file-backed Workers, fresh Host reattestation |
| E01J4B | BOUNDED_PASS 20/20 | Central revoke first; OS Worker crash / idempotent repair |
| E01J4C | BOUNDED_PASS 21/21 | Original AppManager Host-only lifecycle adapter |
| E01J4D | BOUNDED_PASS 22/22 | Original Host HTTP/Action integration, default OFF |
| E01J4E | BOUNDED_PASS 23/23 | DBA function-only least privilege and real Host |
| **E01J4F** | **IN_PROGRESS / NOT_SIGNED** | Operator-led **prestartup** fenced UNINSTALL repair, original E01I quarantine unchanged, real Host restarts and three-PG18 24/24 zero skips |
| Full E01J4 | **OPEN / NOT_SIGNED** | Production real operator identity, DBA provisioning, unattended repair + cross-Worker authoritative states and atomicity |
| PA05-05 E01–E05 | NOT_SIGNED | Enterprise/Human/Agent/Provider/browser still not certified |
| PA-05/W06 | IN_PROGRESS / NOT_SIGNED | #988/#979/#913 OPEN |
| Production material WRITE | OFF | No Railway |

## Existing source-grounded risk and decision

Direct original code inspected 2026-10-19: [`manager/server.ts`](../../manager/server.ts) **E01I** synchronous restored-package guard throws `PA05_E01I_RESTORED_READ_OWNER_RECERTIFICATION_REQUIRED` before Host is listening if a local persisted Purchase Attention package is installed or active. [E01I decision](PA05-E01I-RESTART-READ-OWNER-QUARANTINE-20261016.md) deliberately forbids bypass. [E01J4E merged decision](PA05-E01J4E-LEAST-PRIVILEGED-SQL-OPERATOR-20261019.md) proves real Host `DISABLE/UNINSTALL` using a DBA `SECURITY DEFINER` function, but has no operation-discovery/recovery for a Host unable to boot. [E01J4C adapter](../../manager/pa05-read-owner-host-lifecycle.ts) already has `recover(operation,operationId)` with original AppManager and central ASSERT/COMPLETE; **reuse** instead of inventing a second lifecycle authority. Read [Delivery Workflow](../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md), [Extension Boundary Constitution](../architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md) and [Documentation Lifecycle Governance](../architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md). Historic PostgreSQL privilege/role knowledge is indexed in [graded E01J research](PA05-E01J-WINDOW-RESEARCH-REFERENCE-INDEX-20261019.md), not relabeled as a fresh official-page read.

**Chosen smallest safe gate:** Build a **default-unwired Host-internal** one-shot prestartup `recoverPa05ReadOwnerPrestartupUninstallV010` helper, not a new public HTTP endpoint, command/Agent tool or automatic boot activation. Its caller must supply trusted out-of-band operator authorization, the original file-backed AppManager and a dedicated PostgreSQL LOGIN with **only** EXECUTE on two DBA-owned protected functions. The new `pa05_read_lifecycle_operator_pending(hostId)` returns at most two **FENCED** intent records for the authenticated SQL `session_user`/pinned Host, only after confirming approved_epoch=0. No request/local JSON supplies operation ID or type. No rows, disabled-only intent, another Host, ambiguous operations, DB unreachable, untrusted operator, stale approved epoch and missing DBA function **all fail closed without mutating local state**.

Only exactly one fenced **UNINSTALL** intent allows the original J4C `recover` to reverify the central operation ID/type, recheck operator authorization, apply original AppManager uninstall only if still installed and commit SQL COMPLETE. If the process died **after local JSON UNINSTALL but before SQL COMPLETE**, a second separately spawned operator process may idempotently complete the existing intent without reinstalling. Original E01I guard remains unchanged; actual Host can boot afterward because owner was removed, but Owner READ approval stays revoked (approved_epoch=0). An external production runbook/CLI, operator identity assertion, secrets provisioning and unattended start are **not** implemented. Separate throwaway OS worker fixture injects a simulated authorization predicate and optional true `SIGKILL` **for CI only**; that predicate must not be mistaken for a live Human identity.

## Required actual PostgreSQL18 test and limitations

The real three-PG18 workflow reuses old E01J1–J4E security checks, appends one new suite with genuine original AppManager JSON, disposable DBA schema, dedicated Host SQL operator, separate ordinary Worker, actual `dist/manager/server.js` E01I startup pre/post, and independent real Node recovery processes. It asserts rejected untrusted operator, absent fence, disabled-only intent, spoofed Host, unprivileged Worker, conflicting intents, E01I file untouched before proof, actual SIGKILL **after local uninstall and before SQL COMPLETE**, persisted central FENCED record and second process idempotently completing without recreation, then successful real Host HTTP start and central approved_epoch still zero. Target **24/24 PASS, 0 failed/skipped**; marker `PA05_E01J4F_PRESTART_RECOVERY_PG` required. Existing operator function still `SECURITY DEFINER` with fixed search_path; only the disposable DBA provisions SQL, not default Host.

**Explicitly NOT a signoff:** actual production Human/operator identity/Provider authorization of external one-shot maintenance, verifiable credential custody, installed repair CLI, automatic recovery of any process, all Host nodes converging, distributed JSON+PG ACID, writable source READ restoration, model/browser/enterprise acceptance, real crash-containment of postgres 3.4.9, third-party admin table owner compromise, or PA05-05 E01–E05/W06. Production material WRITE OFF. No Railway, global `project.status.json` or TR-01/HANDOFF-LATEST, BEX/CP03/Eidos/2D changes.

## Final evidence

**Engineering candidate** pending accurate final PR-HEAD physical 24/24 CI and all affected workflow checks; append original failed attempts, exact HEAD, merge SHA and safe branch retirement only when separately verified. Do not treat the test-only recovery Worker as a production utility.
