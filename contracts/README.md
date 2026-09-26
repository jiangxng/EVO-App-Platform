# Contracts

Public, versioned App Platform contracts belong here.

## Package / Plugin

- `package.ts` — Package / Feature / Contribution / lifecycle contracts.
- `plugin-protocol.ts` and `schema/*` — portable Plugin Protocol contracts and JSON Schema.
- `llm.ts` — provider-neutral LLM inference/tool contracts.

## Platform services

`platform-services.ts` contains replaceable platform-service boundaries.

### Person-first Context

The current root-world-model authority is:

`docs/architecture/PERSON-FIRST-CONTEXT-MEMORY-MVP-v0.1.md`

New Personal Agent code should use:

- `PersonalContextV010`;
- `EnterpriseContextV010`;
- `ActiveContextRefV010`;
- `ResolvedContextSetV010`;
- `PlatformRequestContextV010.context`.

`PlatformScopeV010` remains compatibility state for older Provider/authorization code. It is not the Person-first ontology and must not be used to model a human as an Enterprise-owned child account.

Active Context is Host-resolved. Client/model input may select only a Context already exposed by a trusted Host/provider source.

### Context Memory P0.3

P0.3 exposes read contracts only:

- `ContextMemoryReadRequestV010`;
- `ContextMemoryItemV010`;
- `ContextMemoryReadResultV010`;
- `ContextMemoryReaderV010`.

There is deliberately no generic Context Memory write/learn contract yet. Memory Attribution, provenance and cross-context persistence governance must be explicit first.

### Existing service boundaries

The same file also contains:

- Principal / Identity Session;
- Authorization Provider;
- Secrets Provider;
- Provider references;
- LLM execution context.

Preserve backward compatibility unless a versioned migration is explicitly introduced.
