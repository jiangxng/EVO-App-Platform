# Help Center Main Workspace — stale PR #385 convergence (2026-10-11)

Original branch: `fix/help-center-workspace-surface` at `5c4d4a209d390c930101441ab31016687f1e225e`. This is a source-history-preserving merge of the old Help Center fix onto the latest `main` tree.

The older PR introduced the Help Center transition from an Activity Side Panel to Main Workspace, with APP-226 and a navigation regression check. **Current `main` already contains that behavior** in `manager/desktop-workbench-runtime.ts`, where `id: "help"`, `kind: "workspace-route"`, and `route: "/help"` coexist. Its newer `tests/app-host/navigation-information-architecture.test.mjs` checks the Help workspace route, and its updated Eidos validator enforces the same rule.

The old versions of `manager/desktop-workbench-runtime.ts`, `INVARIANTS.md`, `tools/eidos-design-language-validate.mjs` and navigation tests are not copied over current sources because they lag modern Platform/Agent/2D work. Source commits remain in Git ancestry. No `project.status.json` mutation or Agent/2D work is performed. This note documents why PR #385 can be closed via normal merge without overwriting current implementation.
