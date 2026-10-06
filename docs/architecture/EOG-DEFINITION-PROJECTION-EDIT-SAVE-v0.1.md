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
        ↓ remove unnecessary nodes / relations from this projection
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
- nodes hidden from this projection;
- relations hidden from this projection;
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
- a selected node or relation may be removed from the current projection;
- removing a node immediately removes all of its connected relations from the rendered projection;
- this removal is projection-only: the application, ledger and semantic relation remain in the Business Definition;
- Delete/Backspace may be used as a direct-manipulation shortcut when a diagram item is selected;
- Save projection captures visible node placements, hidden projection items and the current 2D camera;
- selection properties remain semantically read-only;
- saving is a governed Host action;
- owner/admin enterprise-management authority and Authorization Provider approval are required.

This prevents accidental business-definition edits while making simple layout work direct and non-conversational.

## Eidos ownership

Eidos 2D Core owns generic mechanics:

- Viewer → Editor toolbar navigation;
- local node drag;
- pan/zoom;
- local projection pruning for selected nodes/relations;
- captured view-state payload, including hidden projection item IDs;
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
- restore/show previously hidden node or edge;
- reset layout;
- duplicate as a new projection;
- choose/set primary projection;
- regenerate projection thumbnail;
- compare projection revisions;
- explicit discard/unsaved-change guard.

These are projection capabilities, not reasons to mutate business payloads.


## Reloadable projection routes

Definition projection Viewer/Editor routes are self-identifying. A browser URL carries the definition ID, definition revision and projection ID required to reconstruct the page from authoritative Enterprise Context data.

Consequences:

- browser reload does not depend on an in-memory selection created by the previous click;
- browser back/forward may restore the exact projection route;
- Viewer → Editor and Editor → Viewer preserve the same projection identity;
- a projection thumbnail whose target is explicit navigates directly to the qualified Viewer route;
- Ledger Manager list-level shortcuts must not guess a projection. If a specific projection is not known, no relationship-map action is shown there;
- legacy session selection remains compatibility state only and is not the authoritative locator.

The Web delivery cache policy remains unchanged. Qualified page reads continue to use normal private conditional revalidation, and immutable revisioned assets keep their existing cache behavior.


## Restore complete view and Save As

Projection editing supports two additional view-authoring operations without changing Enterprise Definition business truth.

### Restore all

The editor materializes the complete graph for the selected Definition revision, including nodes and relations currently hidden by the saved Projection. Persisted hidden IDs initialize local visibility state, so the Human initially sees the saved Projection exactly as before.

"Restore all" clears only the editor's local hidden-node and hidden-relation sets. It does not immediately append a Definition revision and does not mutate Applications, Ledgers, posting rules or other business payload. The Human may continue editing and explicitly choose "Save projection" when ready.

When saved, the captured hidden-ID sets are authoritative for that Projection. Therefore an empty hidden set removes previously saved projection hiding and makes the complete graph visible again.

### Save as projection

"Save as projection" captures the current positions, camera and visibility state into a new Projection entry while leaving the source Projection unchanged. The Definition still advances through the normal append/versioned revision path.

The new Projection receives a unique projection ID and a deterministic copy title such as "原投影 副本", "原投影 副本 2", etc. The editor navigates to the newly created Projection after save. Gallery capacity remains governed by the existing maximum of nine projections.

Neither Save nor Save As duplicates or mutates the underlying Application/Ledger objects.
