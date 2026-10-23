## Summary

Describe the change and the real acceptance outcome.

## Validation

- [ ] Relevant build/tests pass.
- [ ] Human/runtime evidence is labeled separately from machine evidence.

## Project continuity impact

- [ ] I checked whether this PR changes the current milestone, live gate, deployment revision, latest LIVE PASS, or a do-not-repeat action.
- [ ] If yes, I updated `project.status.json.projectContinuity`.
- [ ] If yes, I ran `npm run continuity:render`.
- [ ] `npm run continuity:validate` passes.
- [ ] I did not treat a dated HANDOFF file as the current continuation pointer.

A behavior-changing PR may merge without changing the continuity snapshot only when it does not materially change how a fresh LLM should continue the project.

## Plugin architecture admission

For a new plugin or a loading/resource-boundary change, follow [Plugin Lazy Resource Loading §11–12](../docs/architecture/PLUGIN-LAZY-RESOURCE-LOADING-v0.1.md). For unrelated changes, state why this section is not applicable.

- [ ] Identify package/feature/capability, public dependencies, resource scope and creation trigger; explain any necessary Host exception.
- [ ] Keep discovery lightweight; prove applicable uninstalled, inactive, active-unused and first/concurrent-use behavior.
- [ ] Prove applicable disable/load races, bounded stop, failure recovery and restart; preserve durable data and shared security authority.
- [ ] Check effective browser routing/surface loading and explicit background qualification/budgets where applicable.
- [ ] Link executable resource assertions in the existing relevant CI, or explain each inapplicable case. Do not use generic green CI as full resource evidence.
- [ ] Keep the eager-dependency baseline from expanding and preserve existing safety/cold-start assertions. Existing debt does not authorize new violations.
