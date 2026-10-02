# EOG split plugin package identities

This directory-level split starts the physical convergence defined by
`docs/architecture/EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`.

The package family is migrating incrementally:

- `evo-eog-2d-designer` — package identity plus target Eidos Experience manifest is defined; activation still remains default-OFF until the compatibility cutover slice.
- `evo-eog-2d-viewer` — package identity plus target desktop/mobile-read Eidos Experience manifest is defined; activation remains default-OFF until compatibility cutover.
- `evo-eog-3d-viewer` — identity-only scaffold.

All packages are registered in the Package Catalog but are not installed or
activated by default. Existing EOG production behavior remains owned by the
compatibility implementation until each Experience/action/provider asset is
migrated with its own regression proof.

All three depend on the Enterprise Context Business Definition repository
capability. The Designer additionally depends on `authorization.check`.

No package may introduce a second Enterprise Graph Definition authority.
