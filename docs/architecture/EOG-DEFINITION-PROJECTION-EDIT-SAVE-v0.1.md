# EOG Definition Projection Edit & Save Flow v0.1

**Status:** Implemented flow / CI-gated  
**Scope:** Enterprise Business Definition projection editing through EOG 2D

## Human flow

```text
Ledger Manager / owning business definition detail
        ↓ Open projection view
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

## Product home and next increments

A Projection is not a standalone top-level EVO application. It belongs to the owning Business Definition and is entered from that definition's management surface. For Ledger Runtime Templates, the current product home is the Ledger Manager detail page and its Projection Gallery.

This keeps the hierarchy stable:

```text
Ledger Manager
  -> Ledger definition / version
      -> Projection Gallery
          -> Projection Viewer
              -> Projection Editor
```

Potential later additions, without changing this persistence boundary:

- projection description edit;
- restore/show a previously hidden node or relation individually;
- reset layout;
- choose/set the primary projection;
- compare projection revisions;
- explicit discard/unsaved-change guard;
- plugin-owned `visualIdentity` rendering when real owning business plugins declare it.

Projection identity remains presentation metadata. EOG/Eidos must not infer domain icons from names.

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


## Deep context navigation — first product trial

Breadcrumb-style context navigation is intentionally **not** global EVO chrome. The first trial is limited to the deep Ledger Runtime Template relationship-map journey.

Desktop:

`账本管理 › <账本运行时模板> › 投影视图`

and in edit mode:

`账本管理 › <账本运行时模板> › 投影视图 › 编辑投影`

The path sits above the page title inside the main workspace header. It is visually subordinate to the title and remains outside the graph canvas. Current business actions remain on the title/action row.

Mobile does not render the full path. It reduces the same context to the nearest reloadable parent:

- Viewer: `‹ <账本运行时模板>`
- Editor: `‹ 投影视图`

The page title stays visible below that parent affordance. This preserves context without consuming the limited canvas width.

The editor therefore does not duplicate navigation with a separate "返回查看" toolbar action. Navigation answers "where am I / where can I go back"; Save / Save As / Restore and other controls answer "what can I do here".

This trial applies only when the Host knows the relationship graph belongs to a Ledger Runtime Template. Shallow Ledger Manager list/detail pages remain unchanged.


## Authorization boundary

Projection persistence is a governed material write.

The EOG projection editor first requires the active Human to have an ACTIVE OWNER or ADMIN relationship to the current Enterprise Context. It then evaluates Host authorization using:

- action: `definition.projection.save`
- resource type: `enterprise.business-definition.projection`

The built-in EOG authorization baseline explicitly allows this action for Human actors so normal Owner/Admin editing does not fall through to the static Provider's default-deny `STATIC_POLICY_NO_MATCH`.

This baseline does not grant enterprise membership by itself and does not weaken deployment governance. An explicit deployment DENY for the same action/resource still overrides the built-in ALLOW rule.

"Save projection" and "Save as projection" intentionally share this authorization action because both persist Projection Gallery presentation state under the same business-definition write boundary; neither mutates Application, Ledger or posting-rule semantics.


## Projection naming and current-view thumbnails

A saved Projection has a Human-editable title independent of its stable `projectionId`.

The editor exposes an explicit rename action. Renaming appends the normal Definition revision, updates only Projection Gallery presentation metadata, preserves the projection ID/view/business payload, and updates thumbnail alternative text. Projection titles must be non-empty and unique within the same gallery.

Every explicit **Save projection** and **Save as projection** regenerates the Projection thumbnail from the captured current canvas view:

- current camera scale and translation;
- current canvas viewport dimensions;
- current node placements;
- current hidden node/relation state.

The thumbnail is therefore a lightweight visual memory of what the Human was looking at when the Projection was saved, not an automatic fit-to-graph rendering. The stored artifact is a self-contained SVG data URI so Ledger Manager can render it without an additional image service/network round trip.

Rename alone does not regenerate the image pixels because it does not change the view; it only refreshes thumbnail alt text.

## Node visual identity boundary

EOG does **not** infer business icons from node names.

A renderer-owned keyword dictionary such as “库存 -> box” or “现金 -> wallet” would embed business/industry semantics into the generic visualization layer before an owning Application/Ledger plugin exists. That would create an unstable hidden ontology and make localization/industry extension ambiguous.

The intended future boundary is:

`owning plugin / metadata -> declared visualIdentity (for example iconKey) -> EOG/Eidos presentation`

When such metadata exists, EOG may render the declared icon as a restrained background identity element. When it does not exist, the current shape/type treatment remains the fallback. No name-based icon guessing is introduced by this version.
