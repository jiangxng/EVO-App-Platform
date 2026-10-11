# Platform branch convergence and one-application acceptance — 2026-10-11

**Type: point-in-time branch/asset audit; does not change project.status.json.**
Baseline reviewed main: `a35d68ddef5abbf1adfa3290317e9a069ddc449f`.
At first check 71 branches total and 11 open PRs. 2D parallel work added #763 while auditing. This document records the more recent 72 branches **excluding this audit branch** and 12 open PRs; counts fluctuate with active work.

## Branch ownership summary

| Scope | Branches | Owner / treatment |
| --- | ---: | --- |
| main | 1 | sole integration authority |
| TR-01/B2D3 | 14 | this Platform window; semantic audit and guarded source preservation |
| Merged Platform tail | 5 | verified retirement candidate, not new product development |
| Agent | 11 | separate Agent window, protect all |
| EOG/2D/Diagram/Projection | 41 | separate Designer window, protect all |

Old functional source analysis: docs/roadmap/PLATFORM-CONVERGENCE-REMAINING-BRANCHES-20261011.md.
Frozen EVO governance: docs/governance/EVO-LEDGER-RUNTIME-AUTHORITY-AND-TR01-CORRECTION-GOAL-20261011.md.

## TR-01/B2D3 residual asset facts

Compared all 14 current TR-01 branch recursive Git trees with main blob identities. Exactly **24 distinct file paths** appear in one or more old branches yet do NOT appear in main; **23 have identical blob hashes** across their repeated old-branch occurrences. Only tools/certify-tr01b2d3-distinct-db-logins.mjs has THREE versions. Old business/Host paths already present in main have divergent blobs and require per-function semantic audits; a path being present is not proof of behavioral convergence.

Missing paths comprise 6 GitHub workflows, 12 test/harness/scripts under tools/, 3 isolated stage demo files, 2 protocol tests and 1 stage-demo research document.

| Recovery bundle | Sources and decision |
| --- | --- |
| F0 Six stage apps | Main #703 and #731 six independent preview packages remain; two older peer/stage branches must not reintroduce old Host Core or synthetic semantic claims; retain unique tests only |
| F1 Finance owner/Host delegation | #594 Draft and owner-admission/descriptor preflight branches; no whole-branch merge; EVO Runtime/public semantic result is unique financial authority, Host trust is only preflight |
| F2 Security/replay tools | 12 absent tools paths repeated across 14 histories: nonce/race, OIDC, scoped signing, separate PostgreSQL login, TLS, key rotation. Preserve best actual usable harness, dedupe, fail closed |
| F3 Demo/preflight evidence | Offline synthetic stage HTML/Railway function is a historical demonstration, NOT accepted business plugin or formal production environment |
| F4 six-/twelve-lane workflows | Eliminate duplicated admission gates only after checking currently installed public runtime contracts and true tests |

### 14 pinned TR-01 source tips (not ready for deletion)

| Branch | Pinned head SHA | Open PR |
| --- | --- | --- |
| `demo/tr01b2d3-isolated-live-stage-20261011` | `bd67f320dce5ed6d4a023b58546b619ce4a03aa0` | — |
| `docs/tr01b2d3-mainline-recovery-20261011` | `b67e84375c9247faa69b01a3cf93d3cf1daf9adb` | — |
| `docs/tr01b2d3-railway-runtime-preflight-evidence-20261011` | `3e7d5182bc5f4ae03ca638c76524872086a0cbec` | — |
| `feat/tr01-trading-peer-purchasing-receiving-20261011` | `7e23173250a23aa396555fed77a1470ebd099708` | — |
| `feat/tr01b2d3-definer-owner-strict-admission-20261011` | `0560386e0915ebb607f183e215fb0f728cfe3220` | — |
| `feat/tr01b2d3-deployment-descriptor-gate-20261011` | `c589f0bf1b79aed8700e601648ee335e913d5ba2` | — |
| `feat/tr01b2d3-finance-owner-prod-preflight-20261011` | `718215136f79efd79d7e755954d686d77cf73356` | — |
| `feat/tr01b2d3-four-peer-business-plugins-stage-20261011` | `fb3db99272ef047aa7686715fd495545f9342ccf` | — |
| `feat/tr01b2d3-host-owner-delegation-20261010` | `1d6149bd05136d642e49aab5196d12ab243cbe4e` | #594 |
| `feat/tr01b2d3-six-lane-production-admission-20261011` | `8a0a27dca96ac69cb1fcef2eaffca6a43bc75dc4` | — |
| `feat/tr01b2d3-twelve-lane-preprod-20261011` | `75e8565708433c3ed046016bc76bf45e054a03c0` | — |
| `test/tr01b2d3-cross-instance-nonce-revocation-race-20261011` | `33675b9e9ec739d8a50d60277731030abeb3b284` | — |
| `test/tr01b2d3-distinct-db-login-http-20261010` | `ff2fd23e83ebf72a5fc0c21757f729fd800594ac` | — |
| `test/tr01b2d3-isolated-finance-owner-credential-http-20261011` | `c8cfda818d5226086b6a9c0124b3187c0d8a7f9a` | — |

## Five Platform tail refs: safe retirement only

All five have been checked against main. One is strict ancestor (behind=0); four correspond to merged same-repository PR heads, and each actual merge commit is in the main Git ancestry. They do not currently serve any open PR head.

| Ref | Evidence |
| --- | --- |
| chore/prune-functionally-converged-nonparallel-20261011 | main ancestor pinned 56063b50802697fcbdddf772683a4b9d174907ba |
| chore/retire-merged-platform-squash-heads-20261011 | merged PR #743, main merge 8f32e0d348e5e9268612f1402afc72ab66d288cd |
| docs/platform-convergence-research-handoff-20261011 | merged PR #723, main merge a53edbc257d98e233b45d3ca55f73dfad99c554d |
| fix/plugin-title-localization-20261011 | merged PR #757, main merge a35d68ddef5abbf1adfa3290317e9a069ddc449f |
| fix/tr01-runtime-authority-guard-20261011 | merged PR #759, main merge f29a5e22053a23fca2c3f5dd8b89e822b470aef5 |

Deletion is ONLY by exact SHA lease + main ancestor OR verified merged PR head + verified merge SHA main ancestor + no open PR head/base + unprotected branch. Do not infer deletion solely from this document. Do not delete any Agent, 2D or TR-01 source branches in this batch.

## Product decision: one Application per user acceptance loop

**User explicitly rejects building six trading Applications for days before presenting a single acceptance.** ONE APPLICATION AT A TIME, with smallest functional PR and user-visible Railway acceptance, then await the user's actual acceptance or correction before starting the next.

Acceptance order: **1 Purchasing → 2 Receiving → 3 Sales → 4 Shipment → 5 Receivable → 6 Cash**.

For each app: define stable required business fields + Enterprise Context/Counterparty/Item/Warehouse references; expose owner Capability in its own Package, not Host Core; have the Host enforce principal/enterprise/permission; submit real typed BusinessData to the already near-frozen EVO Ledger Runtime public contract; observe actual Posting/Ledger/Work/Replay results, not shadow SQL; run targeted test + real PostgreSQL fail-closed cases; merge smallest reviewed PR; pin and deploy its SHA to existing Railway PUBLIC INTEGRATION TEST host; let user operate exactly one real business transaction in Eidos UI; record user verdict. CI green, synthetic List and Railway health are insufficient.

Do NOT initialize next app before current one is accepted. Cash REFERENCES is not financial Allocation; price/FIFO/valuation/settlement calculations belong to existing EVO-owned runtime/authorized owner plugins, not App Platform. If user requests a new chat because token limit, read this document + current app's single latest acceptance PR and evidence first; do not restart broad six-app design.

## Independent-window protected branch catalog

### AGENT (11 refs)

| Branch | Pinned SHA | Open PR |
| --- | --- | --- |
| `agent/pa01a-contextual-turn-identity-20261010` | `f5efab9b110b3e79635c7f904ef7a7d94fd6b137` | #575 |
| `agent/pa01b2-native-chromium-preflight-20261011` | `56a18615efdd6029ddf9057b85510b43b835fe8c` | #638 |
| `agent/pa01b2-page-assistance-20261010` | `db555162370b3c3c992c7aef88f605f9ebf2d0cd` | #579 |
| `agent/pa01b3-authorized-mapping-receipt-browser-20261011` | `4692555eaa730c013f7c044f1b25e2e61825e350` | #691 |
| `agent/pa01b-assistance-contract-20261010` | `15f059da4d841e2bc1b6b84b0171bb1be0827797` | #577 |
| `agent/pa02a-postgres-async-uniqueness-proof-20261011` | `9f794cf928d9a01e55a22c6d5742ea23fd7bc456` | #692 |
| `docs/external-agent-access-standard-20260930` | `661341eb87e8bfd8a5884c150267933c65b0c4b1` | — |
| `docs/external-agent-ea5-machine-foundation-20260930` | `8a4b5a0caecda26b90a4bfa60e17f9b5e23fb5d9` | — |
| `docs/personal-agent-blueprint-20261010` | `7c8d4f20acfa95899475cae23c842ec245e2d3dd` | #570 |
| `feat/ea4a-oauth-resource-profile-20260930` | `7eb802eb21230e2e5a2dcf863d1507c69f1f7b0f` | — |
| `feat/external-agent-access-experience-20260930` | `76b33e63ac7d1e282463cae46133d74f54c0b636` | — |

### DIAGRAM (41 refs)

| Branch | Pinned SHA | Open PR |
| --- | --- | --- |
| `accept/diagram-e01-obstacle-routing-20261011` | `18c303748da87c865d70f188651219961bb6e600` | — |
| `accept/diagram-e02-parallel-reverse-loop-20261011` | `6dcaa1e07fef7b2ad1e90f806fb0287aeea14382` | — |
| `accept/diagram-e03-route-handles-undo-20261011` | `4b7f876f1bb6abd15b571927f5edfedda7283d2f` | — |
| `accept/diagram-e04-curve-hit-20261011` | `3e76ab5652e83ecf6873704102f96b1ad64d9ddd` | — |
| `accept/diagram-e05-endpoint-move-20261011` | `99948e6a6202a77fd270041868a0362b6274b65f` | — |
| `accept/diagram-e06-route-reset-undo-20261011` | `a9ac32a1aa753f253670df0771b8493c11b7762d` | — |
| `accept/diagram-e07-edge-caption-drag-20261011` | `f9a7e253eb6a75226fdb04c084f3052b07b855e8` | — |
| `accept/diagram-m01-marquee-20261011` | `64fc3e97b19f729e58583aeafa8be6fa85f182a3` | — |
| `accept/diagram-m02-node-gesture-20261011` | `e774eca440873483d4d9c4e8ba318e05e08d3e36` | — |
| `accept/diagram-m03-current-main-20261011` | `dea5757fb6fff65021f3b4467c358fe7ad65959c` | — |
| `accept/diagram-m03-shift-additive-20261011` | `264f352e5efa5df183265f6d9945abf989802872` | — |
| `accept/diagram-m04-group-drag-20261011` | `b053d1a027b8c6ebe359ce765541f90679a32cff` | — |
| `accept/diagram-m05-current-main-20261011` | `72e056cc79d78e4d36fefd62ba48989a9c00bfb7` | — |
| `accept/diagram-m05-right-pan-20261011` | `6416cc110f1f830a6acdfb04e9bf627a82b70d77` | — |
| `accept/diagram-m06-stationary-context-menu-20261011` | `996debff30c6de601d591e30af9adf20fc3c267e` | — |
| `accept/diagram-m07-middle-space-pan-20261011` | `4bdfbde22445e3d596196ee2bb9a5b8a8ee97325` | — |
| `accept/diagram-m08-input-shortcuts-20261011` | `acc52cd9440ea260a6e62d0cb5c5e7ae1e42a232` | — |
| `accept/diagram-m09-blur-cancel-20261011` | `75ee0c449455e607538f62e39342a45fced21ae5` | — |
| `accept/diagram-t01-trackpad-wheel-20261011` | `6947bbe10774eae50a7ddb23bf8c3ed719d8c9f9` | — |
| `accept/diagram-t02-unselected-touch-pan-20261011` | `cfc9df150ae89ef0f13adf4cd3706b752f3eac61` | — |
| `accept/diagram-t03-selected-touch-drag-20261011` | `f73ae6995d3c38977692f32ec6ab50782a0ddf01` | — |
| `accept/diagram-t04-second-finger-cancel-20261011` | `9e3a23f740f234a1eef00076bda4ba1b16222cce` | — |
| `accept/diagram-t05-two-to-one-touch-20261011` | `498d65595c375c1ed48f9326eb4a509d8d7c9b3c` | — |
| `accept/diagram-t06-touch-selection-20261011` | `09487f1d24df3f52dff17087e963d8ed7b8b2841` | — |
| `accept/diagram-t07-phone-rotation-keyboard-20261011` | `a94cb323566b65812ae7b19d93bf52f427792100` | — |
| `accept/diagram-v06-current-main-20261011` | `ae721c83d7ac51005139a577e9aeac5dc14db062` | — |
| `accept/diagram-v06-state-layer-20261011` | `c05701bd4de8f7e27432dfa9f28df83e786d1a9a` | — |
| `architecture/sop-designer-package-identity` | `179d2f554fc9745d1a3f2f332cbbb53ab1a7475e` | — |
| `architecture/sop-designer-package-identity-v2` | `e45afa0634ec2b3c281367708c08410b85f095c9` | — |
| `docs/diagram-v1-batch1-window-handoff-20261011` | `5bee94dc00b93ce1d57a7a4d512c9fd39984302f` | #762 |
| `docs/diagram-v1-recovery-20261011` | `295a57939bf0cf96639aa6a24f56c78e0fea144b` | #715 |
| `eog/extract-2d-designer-semantic-actions` | `ffd34030aacc494858b88393ea76313e3047b73d` | — |
| `eog/extract-2d-observatory` | `f0d255626cd885faa082553e3ee985f76ffd73d0` | — |
| `feat/diagram-commercial-acceptance-v01-v03-20261011` | `000cb2f5b6bbb2264d390e52c61d5b9dfc852957` | — |
| `feat/diagram-commercial-acceptance-v04-zoom-20261011` | `e7e44e82f765d3d433a7f7c99efe728a41417a38` | — |
| `feat/enterprise-software-projection-designer` | `25448493485d40196fd87bd0b9b36135e94c3587` | — |
| `feat/eog-projection-edit-save-flow` | `9a0bac97c12e03d6c690f88d9fae871ada753d88` | #388 |
| `feat/projection-gallery-management-v0.1` | `cbbd78d1335c529e24b3b75d0a435de050c54571` | — |
| `feat/2d-viewer-map-controls` | `29342eaf1479b357689975ed8fc5e779a43face9` | — |
| `fix/eog-viewer-back-to-ledger-detail` | `525249c1682ca9dc1bea82f8f46a76419a953b1a` | — |
| `test/diagram-v1-d01-projection-hidden-save-20261011` | `a171f4203a410f68d8d206a2ad1b2cf301e8c453` | #763 |

## Next-window operational closure checklist

1. Re-fetch all branch refs and open PR head/base; this is a dated snapshot, not a live counter.
2. Complete the five tail refs retirement with no Agent/2D/finance operations; require execution logs and a post-delete branch count.
3. Finish TR-01 F0–F4 in small independent source-proof steps: preserve reusable missing tests, reject deprecated Host Core modifications, confirm Finance Owner runtime semantic source; then delete their legacy refs after SHA safety checks, not before.
4. Before implementing real business plugin #1, confirm this inventory and source preservation. Do not conflate branch cleanup with user acceptance.
