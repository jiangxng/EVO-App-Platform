# Decision Record — Uninstalled Plugins Do Not Load Implementation Resources

**Document class:** DECISION_RECORD  
**Status:** Accepted  
**Date:** 2026-10-04

## Decision

EVO App Platform distinguishes Catalog metadata from plugin implementation
resources.

An uninstalled or inactive plugin may remain discoverable through lightweight
manifest metadata, but the Host must not eagerly import its page, Action,
repository, projection or runtime implementation.

Implementation is admitted only after lifecycle activation and actual use.

## First enforcement

Template Store and the 2D Viewer preview path adopt this model first:

- Template Store Experience assets are removed from the global eager asset map;
- Template Store Repository is constructed lazily;
- Template Store Copy/Preview Actions use lazy ActionHost handlers;
- 2D Viewer Workspace and Template Preview pages/actions load dynamically;
- EOG 2D Viewer/Designer are no longer startup-auto-installed on fresh state;
- CI guards the physical dependency/loading boundary.

## User experience

Template Store exposes Preview even when no Viewer is installed, but disables it
with a clear explanation.

Installing/activating a provider of `visual.viewer.2d` enables Preview without
changing Template Store code.

## Compatibility

Existing persisted plugin installations remain installed.

This decision changes fresh-start loading/installation behavior, not existing
enterprise data or Template Store copy semantics.
