# Agent Draft source convergence — 2026-10-11
Seven Platform Drafts remain active after 2D cleanup: six Personal Agent and one TR-01. This PR only adopts **13 brand-new, unowned paths** from the two latest stable Agent Draft heads: #691 (PA-01B3) and #692 (PA-02A). No existing Agent handlers, App Host overlays, Eidos runtime, global authorities, current session/tenant authorization or business files are replaced.

The new code includes assistance request contracts, optional async durability test seams, synthetic Chromium test assets and research handoffs. **It is not equivalent to full Agent delivery**: `agents/enterprise-agent/thread-turn-action-handlers.ts`, `contracts/agent-run.ts`, and several vendored Eidos host files differ from latest main and require independent non-regressive integration. Original PRs #575/#577/#579/#638/#691/#692 remain open until their functional and security behavior is validated against latest main.

The on-disk files in this PR are immutable Git blobs from #691/#692. No claim of customer testing, identity-provider deployment or Railway release. This source inclusion does not automatically activate new features or authorize mutation.
