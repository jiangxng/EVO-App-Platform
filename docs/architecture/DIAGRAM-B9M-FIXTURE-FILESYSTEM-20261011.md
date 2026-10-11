# B9m — Safe local graph fixture filesystem intake (2026-10-11)

Stacked on B9l [Draft #626](https://github.com/jiangxng/EVO-App-Platform/pull/626), preserving B9j CAS and enterprise graph semantics. No TR-01, main or Eidos writes.

## Change

B9k's `readAuthorizedEnterpriseFixtureV010` now rejects checkout-local paths using both lexical and canonical path checks, rejects final-component symlinks, verifies the opened file descriptor refers to a regular file, bounds reads to 2 MiB, and reads using the **same file handle**. O_NOFOLLOW/O_NONBLOCK are used where supported to avoid leaf symlink/FIFO attacks. Nested directory symlink into the repository is rejected even if the supplied path appears outside checkout. Caller still bears responsibility for authorization, de-identification, directory security and not echoing sensitive text.

This is a **file intake hardening test**, not a production security penetration audit or customer data validation. Added negative symlink and alias tests to the B9k synthetic Node suite. Existing B9k & B9l logic remains unchanged apart from safer fixture intake.

## Evidence boundaries

CI must pass at the final B9m commit; a prior green B9l run proves only its own SHA. Real S2C/P2P customers, deployment, physical devices, accessibility technologies, production identity/storage and original §14 39 formal cases all remain NOT TESTED.
