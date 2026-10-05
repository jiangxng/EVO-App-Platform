# Decision Record — Enterprise Context Is a Repository; Editor Is a Separate Application

> **Current authority:** `docs/architecture/ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`. The repository/editor separation remains valid, but Enterprise Context is now explicitly a thin generic Resource Container rather than a definition-specific repository.

**Document class:** DECISION_RECORD  
**Status:** SUPERSEDED IN PART — historical decision record  
**Date:** 2026-10-04

## Decision

Enterprise Context is modeled as an enterprise-owned repository/authority container.

The Human-facing application that creates, edits and governs it is a separate **Enterprise Context Editor** concept.

The current `evo-enterprise-context-governance` package is treated as the first implementation stage of that Editor experience.

No separate “Enterprise Context Store” plugin is introduced.

## Template Store

Template Store may receive portable snapshots published from an Enterprise Context repository and may preserve source repository/revision provenance.

A copied template becomes content in the destination Enterprise Context repository and does not maintain a live dependency on Template Store or the source Enterprise Context repository.

## Cardinality

v0.1 product UX supports one Enterprise Context repository.

Multiple Enterprise Context repositories remain a long-term architecture requirement. Stable Context identity and Host Context Registry contracts must remain multi-context capable even while the current UI is singular.
