# Enterprise Context Governance

## Product role

`evo-enterprise-context-governance` is the Human-facing management Experience
for Enterprise Contexts.

Enterprise Context is a thin enterprise-scoped persistent resource container.
It provides identity, namespace, persistence and access boundaries; domain
semantics are owned by independent plugins.

The sole conceptual authority is:
`docs/architecture/ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`.

It is not a physical database, not Ledger Runtime, not Template Store and not
an all-in-one enterprise administration/control-plane application.

Provider/service capabilities remain authoritative for Enterprise Context
facts. This Application owns the Eidos-facing management journey.

## Current product model

The platform supports multiple Enterprise Contexts for one Principal.

The product distinguishes:

- **available Enterprise Contexts** — every enterprise the Principal may access;
- **default Enterprise Context** — the Principal's persistent preferred
  enterprise, exactly one when enterprises are available;
- **current Enterprise Context** — the enterprise selected for the current
  browsing/operation session.

The first Enterprise Context created by a Principal becomes the default.
Creating another enterprise does not silently replace that default.

Default selection is Principal-scoped. It is not a `default=true` property on
the Enterprise Context itself.

## Current governance capabilities

The existing provider/Host implementation already supports:

- Enterprise Context creation;
- immutable enterprise/context identity and creation facts;
- lifecycle state;
- OWNER / ADMIN / MEMBER / AUDITOR relationships;
- Enterprise Context Grants;
- invitation / acceptance / decline / revoke lifecycle;
- relationship revocation;
- ownership transfer without an ownerless ACTIVE state;
- append-only governance evidence;
- provider-owned enterprise definition repositories.

The management Experience should expose these capabilities rather than creating
a parallel IAM or persistence model.

## Target management information architecture

Keep the Enterprise Context management Experience intentionally small:

```text
Enterprise Contexts
  ├─ Directory
  ├─ Create Context
  └─ Context Detail
       ├─ identity / lifecycle
       ├─ current / default state
       ├─ access / ownership
       └─ optional generic resource diagnostics
```

Applications, Organization, Ledger, Files, Jobs, Connections and other domain
surfaces belong to independent plugins operating against the selected Context.

## Enterprise Context Directory

The directory is the product entry, not the Create form.

It must make these facts obvious:

- whether any Enterprise Context exists;
- how many are accessible;
- which is default;
- which is current;
- lifecycle state;
- current user's role;
- how to enter an enterprise;
- how to set the default;
- how to create another enterprise.

After Enterprise Context creation, the Human returns to the directory and sees
the newly created enterprise. Creation must not feel like a write into an
invisible backend.

## Organization boundary

Enterprise Context is the governed root and must not be treated as synonymous
with every enterprise organization concept.

Future organization capabilities may represent typed units such as:

- Legal Entity;
- Division;
- Business Unit;
- Department;
- Site / Plant;
- Warehouse / Storage Location.

The organization model should permit multiple legal, managerial and functional
projections rather than force all semantics into one tree.

## Data scope direction

Enterprise software commonly needs both shared and scoped data.

Future Enterprise Context data governance should be able to express distinctions
such as:

- enterprise-shared reference data;
- organization-scoped data;
- application-scoped data;
- personal data.

The management Experience may show these boundaries, but it does not become the
physical database implementation.

## Ledger Runtime boundary

Ledger Runtime is treated as stable in this design slice.

Permanent rules:

- Enterprise Context does **not** own a built-in/default Ledger Runtime template.
- Enterprise Context creation produces an empty governed enterprise boundary.
- Ledger Runtime does not become the Enterprise Context version manager.
- Ledger Runtime executes its current published runtime definition according to
  its own stable contract.

## Template Store boundary

Template Store is also treated as stable.

It is the independent sharing/distribution surface for reusable templates.

```text
Template Store
  -> explicit Use Template / Copy
  -> Enterprise Context-owned independent content
```

Enterprise Context does not require Template Store in order to exist.

For workflows such as Template Store Copy:

1. an explicit authorized target wins;
2. the current Enterprise Context may be used when explicitly selected by the
   user journey;
3. otherwise the Principal's default Enterprise Context provides a deterministic
   target when product semantics allow it.

Template Store does not own the default-Enterprise policy.

## Provider-first boundary

The management Application must remain replaceable.

```text
Enterprise Context Providers
  own facts, lifecycle, relationships and resource authorities
        |
        v
Enterprise Context Governance Application
  owns management Experience and action projection
        |
        v
Eidos
  owns rendering and interaction primitives
```

Uninstalling/replacing the management Application must not delete enterprise
facts.

## Reference design

See:

`docs/architecture/ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`

That document records lessons from SAP, Oracle Fusion, Microsoft
Power Platform / Dynamics 365 and Odoo and translates them into EVO design
principles without making those products dependencies.
