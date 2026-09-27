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
