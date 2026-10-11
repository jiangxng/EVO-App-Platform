# B9n — One-open immutable QA input handoff (2026-10-11)

Stacked on B9m Draft #628; separate Draft PR. B9l browser script formerly preflight-checked a fixture then reopened the pathname for JSON parse, introducing a local time-of-check/time-of-use window. This could allow a changed graph after successful check despite a non-matching digest being discovered later; digest checking cannot eliminate the intermediate file-read race.

B9n adds `loadAuthorizedEnterpriseFixtureV010` to the B9k guard: one opened regular file descriptor, bounded read, JSON parse, exact projection validation, then returns an in-process `{summary,preview2d}`. Browser consumes *that same validated object*, without rereading filesystem path or reprinting raw customer data. `readAuthorizedEnterpriseFixtureV010` remains aggregate-only for CLI. Added snapshot test: overwriting pathname after load does not change the loaded graph.

Security scope: requires trusted local operator permission and independently completed de-identification. A malicious input might still contain private labels and is forbidden for CI/log upload. No true customer graph was provided, no production database or OS device was tested, no acceptance promotion of original §14 39 lines. Commit/Actions on exact final head required for automated result; no main merge, TR-01 change or deployment.
