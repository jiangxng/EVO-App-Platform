# Scoped B9 Draft Branch Retirement — 2026-10-11

Merged [source consolidation PR #705](https://github.com/jiangxng/EVO-App-Platform/pull/705) preserves **54** original Draft PR source SHA records and **92** missing historical files on main.

**Delete only 53** source branches after each PR is closed *without merge*, all 53 exact head SHAs match the locked [retirement manifest](./DIAGRAM-B9-DRAFT-RETIREMENT-20261011.json), and every archived file remains on main. The cleanup checks that no other open PR depends on these branches as its base.

**Exception: #537** must remain untouched: active non-Draft PR [#547](https://github.com/jiangxng/EVO-App-Platform/pull/547) has its base set to `feat/diagram-projection-route-integration-20261009`. Do not close or delete this branch before #547 has been reconciled on latest main.

Personal Agent (6 Drafts), TR-01 Finance (1 Draft), and 8 non-Draft open PRs are outside this scope and must never be marked merged or cleaned by this workflow. 39 commercial formal cases remain untested. No Railway release.
