# Dependency Reproducibility v0.1

**Status:** P0 implemented  
**Date:** 2026-09-25  
**Owner:** EVO App Platform

## Purpose

App Platform dependency resolution must be deterministic across local development, CI, container builds and future LLM-driven maintenance.

The dependency graph is part of the software supply chain.

## Rules

- `package-lock.json` is committed and authoritative.
- `package.json` and `package-lock.json` MUST change together when dependencies change.
- Platform CI uses `npm ci`, never an unconstrained install.
- Container build/runtime stages use `npm ci`.
- CI uses Node `22.22.2`, matching the minimum Node 22 runtime required by the pinned Sigstore verifier dependency.
- Docker uses the exact `node:22.22.2-bookworm-slim` base tag for the current P0 line.
- npm cache may accelerate downloads, but cached content never replaces lockfile verification.
- Generated lockfiles MUST come from a real package-manager resolution and MUST NOT be manually synthesized by an LLM.

## CI boundary

Dependency changes belong to **Platform CI**.

They do not trigger EVO Ledger Runtime, Experience Compiler or unrelated plugin CI.

Individual plugin repositories own their own dependency locks and CI.

## Upgrade procedure

```text
change package.json intentionally
→ regenerate package-lock.json
→ npm ci
→ Platform CI
→ merge
→ deployment health check
```

For security-sensitive dependencies, update the relevant architecture/status documentation in the same change.

## Why this matters for LLM-native development

A fresh LLM must not need to infer which transitive dependency graph was intended.

The repository itself must reconstruct the exact dependency graph deterministically.
