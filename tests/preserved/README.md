# Preserved EOG / SOP Future-Plugin Test Corpus

**CI classification:** NON_GATING_FOR_CURRENT_EOG_CORE_CI  
**Authority:** `docs/architecture/ENTERPRISE-DEFINITION-EOG-INTELLIGENCE-BOUNDARIES-v0.1.md`

These tests preserve already implemented assets whose target ownership is no longer EOG Core:

- SOP definition/edit/publish;
- SOP conformance/deviation;
- Observatory Runtime Facts / Analysis Overlay;
- EVO Runtime Observatory adapter;
- Application runtime binding;
- spatial operational observatory;
- EOG mobile operational read.

They are intentionally named `*.preserved.mjs` so ordinary `*.test.mjs` CI discovery does not include them.

Run manually when changing or extracting these assets:

```bash
npm run test:preserved:eog-assets
```

Do not delete this corpus merely to simplify EOG Core. When a future SOP/report/analysis/runtime-adapter plugin is formalized, move the corresponding tests into that plugin's owning CI.
