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
Projection presentation store
        ↓ overwrite current Projection state in place
Projection Gallery updated
        ↓
Viewer / Editor reads the same Business Definition revision with the updated Projection
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

Business Definition revisions are reserved for **real business-semantic changes**. Projection changes do not create Business Definition revisions.

Projection is intentionally non-versioned presentation state:

- Save overwrites the current Projection state in place;
- Rename updates the current Projection in place;
- layout, camera, hide/show and Restore all update only the current Projection;
- Set as default updates only Projection Gallery presentation metadata;
- Save As creates another Projection identity, not another version;
- Projection has no independent revision history;
- a Projection remains bound to a specific Business Definition revision, so saving against a stale business revision still fails closed.

This keeps Business Definition history readable: adding/changing applications, ledgers, semantic relations and later posting/accounting logic may create a new Business Definition version; presentation work never does.

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

Enterprise Context remains authoritative for business semantics through the Business Definition Repository. Projection presentation state is persisted separately and mutably for the selected Business Definition revision; it does not participate in Business Definition version history.

## Session continuity

The existing Definition Projection session identifies:

- enterprise;
- definition;
- selected revision;
- projection.

After a successful save the session remains on the same Business Definition revision and Projection identity (or the new Projection identity after Save As). Subsequent reads resolve the updated presentation state without advancing the business version.

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

"Save as projection" captures the current positions, camera and visibility state into a new Projection entry while leaving the source Projection unchanged. It creates a new Projection identity only and does not advance the Business Definition version.

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

The editor exposes an explicit rename action. Renaming updates only the current Projection Gallery presentation metadata in place, preserves the projection ID/view/business payload, does not advance the Business Definition version, and updates thumbnail alternative text. Projection titles must be non-empty and unique within the same gallery.

Every explicit **Save projection** and **Save as projection** regenerates the Projection thumbnail from the captured current canvas view:

- current camera scale and translation;
- current canvas viewport dimensions;
- current node placements;
- current hidden node/relation state.

The thumbnail is therefore a lightweight visual memory of what the Human was looking at when the Projection was saved, not an automatic fit-to-graph rendering. The stored artifact is a self-contained SVG data URI so Ledger Manager can render it without an additional image service/network round trip.

Rename alone does not regenerate the image pixels because it does not change the view; it only refreshes thumbnail alt text.

## Default projection

Each Projection Gallery has exactly one default Projection. The default controls which saved view is presented as the primary view when an owning business surface opens the gallery without naming another Projection.

A non-default Projection may be promoted from the existing Projection Editor with **Set as default projection**.

Changing the default:

- updates only `primaryProjectionId`;
- preserves every Projection title, thumbnail and view state;
- preserves the Business Definition payload;
- does not create or advance a Business Definition version;
- uses the same governed Projection persistence authorization boundary.

The action is not shown when the current Projection is already the default. This is gallery presentation preference, not Ledger Runtime configuration.


## Fixed Human capabilities vs Personal Agent

EVO does **not** make every new function an Agent-only tool.

The product boundary is:

- stable, deterministic, broadly useful operations are first-class Human product capabilities;
- open-ended intent, semantic interpretation, multi-step composition and requests that cannot reasonably be enumerated belong to Personal Agent;
- when Personal Agent later uses a stable capability, it should invoke the same governed underlying capability instead of growing a second business-semantic implementation;
- do not create one bespoke Agent tool for every foreseeable UI command.

For the 2D Projection Editor, **Auto layout** is therefore a fixed Designer function. A Human can use it directly even when Personal Agent is unavailable. Natural-language requests such as “把销售到收款放中间，采购放下面，财务账本统一放右边” remain suitable Agent work because they require semantic interpretation and composition.

This keeps Human operation complete while allowing Agent behavior to grow without turning the tool catalog into an enumeration of every button.

## Fixed Auto layout

Definition Projection Editor exposes **Auto layout / 自动排版** as a fixed presentation function.

The first layout policy follows the established layered/hierarchical family used by mature directed-graph layout systems:

1. detect connected components;
2. break cycles deterministically for layout purposes while preserving the original graph;
3. assign directed layers;
4. reduce edge crossings with repeated barycenter-style sweeps;
5. place nodes with separate inter-layer and same-layer spacing;
6. place disconnected components without overlap;
7. fit the resulting visible graph to the canvas.

The default direction is **left to right** because Projection material is primarily directed workflow/dependency information. The algorithm is domain-neutral: Eidos does not know “销售”, “收款”, “账本”, “应用” or any other business vocabulary.

Only currently visible nodes and relations participate in the layout. Hidden Projection material remains hidden.

Auto layout is a **local presentation edit**, like Human node dragging:

- it changes node placements only;
- it does not mutate Applications, Ledgers, semantic relations, posting logic or Business Definition payload;
- it does not advance a Business Definition version;
- it does not create a Projection version;
- the Human can continue adjusting the result before choosing **Save projection**;
- Save persists the current placements through the existing non-versioned Projection persistence boundary.

The first implementation intentionally avoids a heavyweight layout dependency while preserving the same architectural phases. A future Eidos implementation may replace the algorithm internally as long as the public contract and deterministic presentation semantics stay compatible.

## Scalable Projection action area

The Projection Editor action area must scale as capabilities grow. It must not become an ever-expanding horizontal row of buttons.

The fixed information architecture is:

```text
Frequent / immediate
  Auto layout
  Save projection

More
  Restore all
  Rename projection
  Save as projection
  Set as default projection (when applicable)
  future low-frequency management actions
```

Rules:

- high-frequency, task-immediate actions stay visible;
- low-frequency management/destructive/secondary actions belong in **More**;
- new functions must be deliberately classified as visible or overflow rather than appended to the row by default;
- desktop and mobile use the same information architecture;
- mobile keeps a compact single-line action surface rather than wrapping into a multi-row button wall;
- canvas navigation controls such as zoom/Fit remain separate from document actions;
- selection-specific actions remain in the Inspector/selection surface rather than being promoted globally.

## Personal Agent direct current-Projection authoring

Personal Agent is a third operator over the same Projection model. It does not replace either the 2D Viewer or the 2D Designer.

The first normative Human scenario is:

```text
Human opens a qualified 2D editor (Enterprise Operating Graph or Definition Projection)
        ↓
Human opens/uses Personal Agent in the same Workbench session
        ↓
Human: “帮我裁剪出从销售到收款的投影”
        ↓
Personal Agent reads the complete material behind the current 2D editor
        ↓
The model chooses the exact nodes and relations that satisfy the Human intent
        ↓
Personal Agent writes that retained set directly to the current editor's presentation/projection state
        ↓
Host publishes a resource invalidation for the exact open editor
        ↓
The mounted 2D canvas refreshes to the new Projection
```

Rules:

- no mouse, drag simulation or click choreography is used;
- Personal Agent conversation/memory context and current-editor task scope are distinct: the chat selector may remain **Personal** while the current editor belongs to an Enterprise Context;
- the current editor supplies the enterprise resource scope for editor READ/WRITE tools; it does not silently change the chat's memory/context selector;
- editor tools are exposed only when the principal still has access to the editor's Enterprise Context;
- editor writes require an ACTIVE Owner/Admin relationship and are authorized against the editor's Enterprise Context even when the chat context is Personal;
- resource invalidation is published in the editor's Enterprise Context so the mounted enterprise canvas receives the refresh;
- the Human does not need to repeat definition ID, revision ID or projection ID after opening the editor;
- opening/loading a qualified Enterprise Operating Graph editor or Definition Projection Editor establishes that editor as the current 2D target for the browser session;
- the Agent reads complete material, including items currently hidden from the Projection, before selecting a retained set;
- business meaning is interpreted by the model from the current material; phrases such as “销售到收款” are **not** hard-coded into EOG/Eidos keyword rules;
- the Agent writes exact retained node/relation IDs through the same governed Projection persistence boundary as Human authoring;
- a Definition Projection target keeps the same Projection identity and Business Definition revision; an Enterprise Operating Graph target changes only its 2D View State revision and never its semantic graph revision;
- applications, ledgers, posting logic and semantic relations are not created, deleted or rewritten;
- the Projection thumbnail is regenerated with the resulting visibility state;
- the open editor refreshes through the generic resource-invalidation path; Eidos remains unaware of Ledger/business semantics.

The v0.4.1 acceptance assumes one intended current 2D editor in the active Workbench session. The Personal Agent context selector may remain Personal. Multi-tab/current-surface arbitration is a separate concern and must not be guessed from business semantics.

## Node visual identity boundary

EOG does **not** infer business icons from node names.

A renderer-owned keyword dictionary such as “库存 -> box” or “现金 -> wallet” would embed business/industry semantics into the generic visualization layer before an owning Application/Ledger plugin exists. That would create an unstable hidden ontology and make localization/industry extension ambiguous.

The intended future boundary is:

`owning plugin / metadata -> declared visualIdentity (for example iconKey) -> EOG/Eidos presentation`

When such metadata exists, EOG may render the declared icon as a restrained background identity element. When it does not exist, the current shape/type treatment remains the fallback. No name-based icon guessing is introduced by this version.
