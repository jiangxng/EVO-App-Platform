# PA05-04D14C11 — Real SQL credential rollover session cutoff, actual Object Extension PG18

**2026-10-16 | bounded opt-in isolated three-PG18 engineering experiment only. PA-05/W06 NOT_SIGNED, #913 OPEN, material production WRITE OFF.**

## Actual source research and reading grades

- **Repo originals directly read in this continuation, 2026-10-16:** [Object Extension Host and Business SQL role installer / physical guard](../../apps/object-extension/pa05-physical-sql-guard.ts), [first-party original Owner + verifier](../../apps/object-extension/agent-owner-postgres.ts), [separate Host SQL command and permit issuer](../../apps/object-extension/pa05-host-sql-permit.ts), [existing three genuine physical PG18 test](../../tests/agent-line/pa05-object-extension-host-permit-pg.test.mjs), [actual CI](../../.github/workflows/agent-pa05-cross-database-admission.yml), and [D14C10 decision](PA05-D14C10-TRANSACTION-BOUND-PERMIT-20261016.md). Verified latest main and [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913).
- **New external original PostgreSQL18 pages actually opened (2026-10-16):** [ALTER ROLE, PASSWORD and role session default semantics](https://www.postgresql.org/docs/18/sql-alterrole.html) and [Statistics §27.2.3 `pg_stat_activity.backend_start` (time session connected, PID and logged-in user)](https://www.postgresql.org/docs/18/monitoring-stats.html). Specific original pages/sections read, not a blanket PostgreSQL handbook audit.
- **Source fact:** `ALTER ROLE PASSWORD` updates subsequent SQL authentication; it is **not** a PostgreSQL function that terminates each already authenticated server backend. `pg_stat_activity.backend_start` is PostgreSQL-provided session start time rather than a writable business application GUC.
- **Our engineering deduction:** a compromised password can remain useful through an already-authenticated connection after rotation, even though new authentication with that password is denied. A password-change operation and a DB-side admission cutoff should be committed together. High privilege DBA and uncoordinated external password changes remain separate organizational governance.

## Bounded decision and design

**Adopt only under explicit opt-in installer:** a Host/Business-opaque `pa05_object_sql_session_epochs` table with an administrator-owned `not_before` for exactly the two real, separate SQL LOGINs. Initial watermark is negative infinity so a fresh isolated install doesn't invalidate already existing test setup. The only rotation function `pa05_object_advance_sql_session_epoch(role)` is `SECURITY DEFINER`, protected from PUBLIC/Host/Business EXECUTE, and explicitly allows only the actual installation DBA login. It is not exposed to Agents, plugins, or default production routes.

**Trusted rollover protocol:** within **one actual PostgreSQL administrative transaction**, update the genuine SQL passwords with `ALTER ROLE ... PASSWORD` and advance the corresponding role's protected watermark. This atomic cutover is **required** for the engineering experiment. The original SQL authority attestor used by Host approve/issue/bind/revoke and the physical business SQL INSERT guard check PostgreSQL `pg_stat_activity` for the **actual currently authenticated backend**, database and login role; compare its `backend_start` to its protected `not_before`. The epoch SELECT uses `FOR SHARE` so administrator UPDATE cannot silently race an in-flight check: either a transaction using the earlier cutoff commits before the rollover, or old snapshot/transaction fails to acquire fresh row authority. Session identity does **not** come from user-supplied SQL GUC, JSON body, or raw token.

**Hard limits:** credential rotation with only `ALTER ROLE PASSWORD`, without the matching trusted epoch update, does **not** achieve this revocation property. No automatic production secret system or machine mTLS identity was installed. Older connections may stay open for ordinary SQL read queries; this gate denies their protected Host/Business PA05 effects, not generic database SELECT. A compromised DBA can override the guard, and an attacker controlling a valid newly authenticated Host session or the live Owner connection can still impersonate its execution. This is not a claim of zero-downtime production credential rotation or physical machine attestation.

**Alternatives explicitly excluded:** relying on `VALID UNTIL` or SQL password change alone to kill old active sessions; trusting an app-side reconnect flag/GUC; always terminating every business process with a privileged `pg_terminate_backend` call; bypassing real D9/D10, PA-02 Owner, D14C5–D14C10 or replacing plugin business execution. The accepted candidate keeps existing low-privilege Owner and independent Host login distinct.

## Acceptance on real three physical PG18 clusters

Extend the *existing* first-party Object Extension PG18 test and marker CI, without cloning an engine. Keep a genuine original Owner transaction open after authentic D10 ticket and real Host permit **and backend/XID bind**, then concurrently commit real admin `ALTER ROLE` for both Host and Business SQL logins and the two protected cutoffs. Prove:
- Existing **authenticated Host SQL backend** still connects but cannot bind/issue a token after cutover (`PA05_OBJECT_SQL_SESSION_ROTATED`).
- Existing **authenticated Business SQL backend** still connects but its physical table trigger denies after cutover, even if old D10 and Host permit are known.
- Original in-flight, once legitimate, Host-bound Owner transaction is rejected and rolls back when resumed after cutover; no immutable evidence is committed.
- A new SQL login using the previous password cannot connect; genuinely new Host/Business connections with rotated passwords can complete another separately Host-approved original Owner+receipt/verifier transaction.
- Ordinary Business SQL login cannot UPDATE the protected epoch table or invoke the admin rotator, and grants/membership audit stays fail-closed.
- Preserve prior D9–D14C10 and three distinct physical cluster IDs, 0 skipped tests. New marker: `PA05_ACTUAL_OBJECT_SQL_CREDENTIAL_ROTATION_PG`, no false machine identity or production WRITE claims.

**Verified preliminary engineering evidence (2026-10-16):** accurate test/code HEAD `dab4e6af8a48f631253f1d408fa77108136c30a6`; real [three physically independent PG18 Actions #38844841302](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38844841302), **12/12 PASS, 0 failures, 0 skips** with mandatory `PA05_ACTUAL_OBJECT_SQL_CREDENTIAL_ROTATION_PG`, including **pre-rotation REPEATABLE READ snapshot denied** by the row-lock guard; old Host and Business authenticated sessions blocked, in-flight Owner rolled back, old password login refused and new credentials/new Owner+verifier passed. Preserve old D9–D14C10 markers. The documentation update changes PR HEAD, so the **final exact-HEAD CI, main-sync and GitHub branch protection** must still be checked. This does not certify a production credential-management system.

## Remaining NOT_SIGNED

- Real production machine identity, certificate/secret management, governance of who requests an admin rollover, uncoordinated manual password alteration, compromised new/current Host or Business session and administrator/DBA replacing triggers/functions.
- In-flight DDL privilege race, disconnected ACTIVE remote with pre-staged D10 under partition, all other actual plugin SQL credential models, and real PA05-05 Provider/Human/Agent integration.
- `project.status.json`, generated HANDOFF-LATEST, BEX/CP03, Eidos/2D, production app routing/WRITE and production data remain unchanged.

PA05-W06 / PA-05 remain `IN_PROGRESS / NOT_SIGNED`; [#913](https://github.com/jiangxng/EVO-App-Platform/issues/913) stays OPEN.
