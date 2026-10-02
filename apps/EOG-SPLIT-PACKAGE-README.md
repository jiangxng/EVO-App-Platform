# EOG split plugin package identities

This directory-level split starts the physical convergence defined by
`docs/architecture/EOG-2D-3D-RESPONSIBILITY-CONVERGENCE-v0.1.md`.

The three packages are intentionally **identity-only scaffolds** in this slice:

- `evo-eog-2d-designer`
- `evo-eog-2d-viewer`
- `evo-eog-3d-viewer`

They are registered in the Package Catalog but are not installed or activated by
default. Existing EOG behavior remains owned by the compatibility implementation
until each Experience/action/provider asset is migrated with its own regression
proof.

All three depend on the Enterprise Context Business Definition repository
capability. The Designer additionally depends on `authorization.check`.

No package may introduce a second Enterprise Graph Definition authority.
