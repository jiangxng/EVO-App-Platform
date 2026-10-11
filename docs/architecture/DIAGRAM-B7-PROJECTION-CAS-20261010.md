# B7 — Projection CAS, write conflicts and unsaved draft preservation (2026-10-10)

**Status:** Implementation in isolated Draft PR stacked on [App Platform B5a PR #553](https://github.com/jiangxng/EVO-App-Platform/pull/553); upstream generic Eidos changes stacked on [Eidos B5a PR #137](https://github.com/jiangxng/eidos/pull/137). Research baseline [#552](https://github.com/jiangxng/EVO-App-Platform/pull/552) and `docs/architecture/EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md` remain authoritative. No new external sources claimed.

## Evidence and design

- **Original code fact:** `definitionRevision` stayed unchanged for presentation-only saves, so two editor windows could overwrite the same gallery in `DefinitionProjectionStoreV010.put` despite a successful business revision check.
- **Implementation:** persisted `DefinitionProjectionStoreEntryV010.version` is optional for legacy snapshots. Missing gallery = version 0; old stored gallery without version = 1; writes produce 1,2,... A new `putIfVersion` checks `expectedVersion` inside a serialized write and rejects stale values with `DEFINITION_PROJECTION_WRITE_CONFLICT`.
- **Local file provider:** an exclusive `.lock` directory encloses read/check/atomic rename. A second cooperative instance refuses the write with `DEFINITION_PROJECTION_STORE_LOCKED`; lock is removed on ordinary error/success. An unexpected process crash can leave a lock and will fail closed until an operator investigates it. This protects ordinary cooperating processes on a filesystem supporting atomic directory creation and rename; network/cloud/distributed stores require their own CAS primitive and cannot infer identical guarantees.
- **Host request:** GET sends generic `writeToken` independent of `revision`; Eidos sends `expectedWriteToken`. Host validates unsigned safe integer strings and calls CAS in SAVE/RENAME/SET_PRIMARY/SAVE_AS_NEW. Authorization remains mandatory; business revision rechecked after awaiting authorization. A stale edit returns a defined conflict rather than resetting another user's projection.
- **Backward compatibility:** previous clients that omit `expectedWriteToken` fall back to current stored version for now; **they are not fully protected against overwriting a previous writer**. This is a transitional compatibility concession, not a safe final multi-user policy. Must enforce token for all production writes after legacy-client migration.
- **Conflict escape hatch:** a deliberate `SAVE_PROJECTION_AS_NEW` from a stale window re-reads the latest **gallery and version from one snapshot**, appends a distinct projection and uses CAS. It never overwrites the original projection; concurrent changes during the append still fail closed. After a conflict, the user can select Save As without first reloading and losing the local draft.
- **Client preservation:** overlapping write submits are ignored; failures keep local draft; delayed success does not replace newer local changes. Actual Save As button behavior and asynchronous host navigation callbacks still need full browser validation, not just Node assertions.
- **Isolation:** no business fields or relation semantics changed; no main merge/deploy. The App Platform vendor patch touches only generic Eidos deltas and retains Host context navigation.

## Automated evidence and limitations

Added tests:
- `tests/integration/definition-projection-cas-store.test.mjs`: memory CAS, legacy data migration, two independent file provider instances, locked-file failure.
- `tests/integration/definition-projection-edit-save.test.mjs`: two stale editor views, write conflict without mutation, fresh read and explicit retry, overlapping authorized writers, stale-draft Save As preserving the original, invalid token.
- `tests/integration/diagram-visual-handles.test.mjs`: vendor forwarder, save in-flight guard and context-nav preservation.
- Eidos `tests/diagram/diagram-opaque-write-token.test.mjs`: generic contract and save-source guards.

**Not accepted yet:** real parallel multi-process stress/chaos, distributed deployment, crash recovery of orphan locks, browser E2E restore of unsaved draft, save-as + host navigation while editing, physical gesture devices. §14 39-item evidence matrix retains NOT TESTED for device gates; CI pass is separate.
