# EOG Definition Projection Edit & Save Flow v0.1

**Status:** Implemented flow / CI-gated  
**Scope:** Enterprise Business Definition projection editing through EOG 2D

## Human flow

```text
Ledger Manager / owning business surface
        ↓ View relationship map
Definition Projection Viewer
        ↓ Edit projection
Definition Projection Editor
        ↓ drag nodes / pan / zoom
        ↓ explicit Save projection
Enterprise Context Business Definition Repository
        ↓ append new revision
Projection Gallery updated
        ↓
Viewer / Editor reads the new revision
```

## Boundary

This flow edits **presentation projection**, not business semantics.

Saving a projection may change:

- node placements;
- camera scale;
- camera translation;
- existing projection view state.

It does not change:

- Ledger Runtime payload;
- posting rules;
- applications;
- ledgers;
- semantic relations;
- historical revisions.

## Persistence rule

Business Definition revisions are append-only.

Therefore Projection Gallery persistence follows the existing repository lifecycle:

- latest DRAFT → `reviseDraft` with an identical payload and updated Projection Gallery;
- latest PUBLISHED → `beginDraft` with an identical payload and updated Projection Gallery;
- historical/stale revision → save fails with revision conflict.

No old revision is mutated.

## Interaction rule

Viewer is inspection-first.

The Viewer exposes a contextual **Edit projection** action only when the EOG 2D Designer Feature is active.

Editor behavior:

- node drag is local until explicit save;
- pan/zoom are local until explicit save;
- Save projection captures all visible node placements and current 2D camera;
- selection properties remain semantically read-only;
- saving is a governed Host action;
- owner/admin enterprise-management authority and Authorization Provider approval are required.

This prevents accidental business-definition edits while making simple layout work direct and non-conversational.

## Eidos ownership

Eidos 2D Core owns generic mechanics:

- Viewer → Editor toolbar navigation;
- local node drag;
- pan/zoom;
- captured view-state payload;
- explicit graph action;
- ActionHost invocation.

Eidos does not know Ledger, Enterprise Context or Projection Gallery semantics.

## App Platform / EOG ownership

EOG 2D Designer owns the contextual Definition Projection Editor Experience and save command.

Enterprise Context remains authoritative persistence through the Business Definition Repository.

## Session continuity

The existing Definition Projection session identifies:

- enterprise;
- definition;
- selected revision;
- projection.

After a successful save the session is advanced to the newly appended revision, so subsequent editor reads continue from the saved state.

## Next increments

Potential later additions, without changing this persistence boundary:

- projection title/description edit;
- hide/show node or edge;
- reset layout;
- duplicate as a new projection;
- choose/set primary projection;
- regenerate projection thumbnail;
- compare projection revisions;
- explicit discard/unsaved-change guard.

These are projection capabilities, not reasons to mutate business payloads.
