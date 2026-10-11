# B9r — Formal 39-item verification gate and device-test operator protocol (2026-10-11)

## Evidence hierarchy (never conflate)

1. Unit/integration tests: contracts only, no UI assertion unless actually exercised.
2. Native browser automation: exact Chrome/Firefox/WebKit implementation, action and SHA; this is not a physical OS.
3. **Physical device + authorized data + human observation**: original §14 row-specific execution, reproducible records and explicit reviewer acknowledgement.
4. Production rollout: separate production identity, persistence, data-permission and deployment approvals.

This branch keeps the existing 39-row matrix unchanged to avoid writing in other windows. New `tools/diagram-formal-acceptance-audit-b9r.mjs` reads it in CI, enforces exact ID inventory (V01-06, M01-09, T01-07, E01-07, D01-06, A01-02, P01-02), exactly four columns, unique IDs and legal statuses. Formal PASS requires an explicit human-signoff reference in the row. **A marker alone does not validate the signer.** The current documented 39 items all remain NOT TESTED; this gate must not turn Chrome into customer acceptance.

## Physical test ledger — fill one record per §14 ID and target system

- Permission & data: authorization grant ID (private), redaction reviewer (private), fixture SHA256 only in public log, scenario S2C/P2P, whether actual customer vs synthetic.
- Hardware: make/model, input devices, physical or simulator, physical OS version/patch, browser name/version, scale and viewport, accessibility technology and version.
- Setup: independent clean browser profile, logged-in enterprise role vs readonly Viewer, network state, projection ID alias (not real customer ID), definition revision and CAS initial token.
- Actual procedure: follow the original §14 scenario exactly (including mouse gestures, pointercancel/regrab, one/two touch, no-drag single-pointer alternative, undo/redo, edge path endpoints, node hide/recover).
- Observed result: PASS/FAIL/NOT TESTED + timestamp + repeat count, before/after graph geometry, missing relation count, route-congested actual Eidos counter distinct from B9o proxy, screenshot/video private secure reference.
- Persistence: click Save only by actual permitted UI, check CAS token, refresh and reopen a separate Designer and readonly Viewer, verify same data and no business revision change, test stale conflict and denied identity.
- Accessibility: meaningful focus sequence, keyboard-only navigation, screen-reader control names and aria status, touch target sizes, no-drag single-pointer alternative; do not infer WCAG PASS from automated DOM.
- Reviewer: signoff named/role, date/time zone, evidence reference, explicit exclusions; a failed or untested system remains FAIL / NOT TESTED.

## Device matrix (targets, not completed checks)

| Device | Required manual modes | Important comparison |
| --- | --- | --- |
| Windows 11 Chrome / Edge | physical left/right/middle mouse, wheel, Space, Shift drag, mouseout, Ctrl+A input focus | compare actual selection, pan vs context-menu behavior |
| macOS Safari / Chrome | Mac trackpad two-finger, secondary-click, pinch, shortcuts, Escape, input focus | isolate browser-specific pointer / wheel semantics |
| iOS Safari (iPhone/iPad) | physical single touch, two-finger pan/pinch, pointercancel, screen rotation, soft keyboard, VoiceOver | no mouse-emulation substitution |
| Android Chrome | physical single/two touch, browser back, rotation, keyboard overlay, TalkBack | no CDP synthetic touch substitution |

Do not store customer data or private screen recordings in GitHub PR artifacts. For any current fail, document anonymized reproduction and avoid claiming a pass. Machines running Linux WebKit cannot substitute for physical iOS Safari.

## Outstanding research + context

Preserve preexisting B8t actual 21/900, 27/1200 `route-congested`, and B9o straight corridor proxy as **different types** of evidence. B9p demonstrates isolated Handler stale CAS after actual Chrome Save, B9q tests Chrome emulated responsive viewport; neither signs physical device acceptance.

Original docs and S1–S7 are inherited from GitHub [B9j research archive](https://github.com/jiangxng/EVO-App-Platform/pull/623). This round has NOT reopened those seven official sites; no design change needed. TR-01, Eidos and main untouched, Draft only, not deployed. Future windows should append device results to a separate B-Class evidence file until explicit signoff, never overwrite authoritative master status.
