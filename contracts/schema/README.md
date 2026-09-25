# EVO Plugin Manifest Schemas

These files are the portable structural contracts for EVO Plugin Protocol v0.1.

- `plugin-package-v0.1.schema.json`
- `plugin-feature-v0.1.schema.json`

They use JSON Schema Draft 2020-12 and are intended for:

- IDE completion and validation;
- independent plugin repositories;
- LLM context packs;
- catalog ingestion tooling;
- non-TypeScript plugin tooling.

## Two validation layers

JSON Schema validates portable **structure**.

The canonical App Platform semantic validator:

`validatePluginManifestV010(...)`

also validates cross-field/ownership rules such as:

- Feature ownership;
- localization/settings namespace ownership;
- event topic namespace ownership;
- host/runtime policy;
- high-risk permission rationale;
- executable runtime integrity requirements;
- HTTPS REMOTE policy.

A plugin is conforming only when both structural and semantic expectations are satisfied.

CLI:

```bash
npm run plugin:validate -- examples/plugin-manifest.minimal.json
```

Schema and semantic validator share Plugin Protocol version `0.1.0`. Any incompatible schema change requires an explicit protocol version change.
