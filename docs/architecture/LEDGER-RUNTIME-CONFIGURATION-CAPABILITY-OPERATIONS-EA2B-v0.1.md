# Ledger Runtime Configuration Capability Operations — EA-2B v0.1

**Status:** Implementation baseline  
**Date:** 2026-09-30  
**Milestone:** External-Agent-First Platform Validation v0.1  
**Owner Package:** evo-ledger-runtime-configurator  
**Owner Feature:** evo-ledger-runtime-configurator.default  
**Capability:** ledger.runtime.configuration  
**External network exposure:** NONE in EA-2B

## 1. Purpose

EA-2B is the first real business-plugin implementation of the generic
platform.capability-operation contract introduced in EA-2A.

Its purpose is to answer the original External Agent reference question:

> Tell me the current Ledger Runtime template content for this enterprise.

without requiring GitHub, source code, database access, private endpoint knowledge,
or knowledge of EVO internal TypeScript structures.

EA-2B does not yet expose the operations over MCP. It proves that the Ledger
plugin itself can describe its semantic capability through the common plugin
contract and bind it to real Host Actions.

## 2. Definition ownership

The Configurator owns Ledger Runtime configuration/template definition.

The deterministic runtime owns runtime execution facts, posting, ledger and
balances.

Therefore the public semantic Capability is:

~~~text
ledger.runtime.configuration
~~~

not a broad claim over every ledger.runtime.* runtime fact.

The existing compatibility Capability remains:

~~~text
evo.ledger-runtime.configurator
~~~

## 3. First two operations

EA-2B contributes exactly two READ operations.

### 3.1 Describe

~~~text
ledger.runtime.configuration.describe
~~~

Returns a bounded semantic summary:

- template id;
- display name;
- semantic digest;
- expression language;
- account/application/dictionary/posting-rule counts;
- source libraries;
- burn compatibility;
- required runtime capabilities;
- available sections;
- section sizes;
- paging limits.

It intentionally does not return all configuration records.

### 3.2 Section read

~~~text
ledger.runtime.configuration.section.read
~~~

Reads one bounded page from one section:

~~~text
accounts
applications
dictionaries
postingRules
~~~

Input:

~~~text
section
pageSize? 1..100
cursor?
~~~

Output:

~~~text
templateId
semanticDigest
section
offset
pageSize
total
items[]
nextCursor
~~~

## 4. Why describe is bounded

The current imported baseline contains:

~~~text
141 accounts
143 applications
106 dictionary entries
912 active posting rules
587 separate legacy-reference rules
~~~

Returning the whole template in the first Agent call would couple the interface
to large model context windows, high token usage, high latency, fragile client
truncation, arbitrary future template size and protocol transport limits.

> Agent-native does not mean serializing the whole database into a prompt.

The Agent first discovers shape and scale, then requests only the section it
needs.

## 5. Pagination contract

Default page size is 50.

Maximum page size is 100.

A client cannot request an unbounded page. This is a semantic platform
constraint, not merely a UI pagination choice.

## 6. Cursor binding

The opaque section cursor contains, at minimum:

~~~text
contract version
cursor kind
semanticDigest
section
offset
~~~

The cursor is bound to the exact Ledger configuration semantic digest and the
requested section.

Therefore:

- using an accounts cursor for applications fails;
- using a cursor after the configuration changes fails;
- malformed cursors fail;
- offsets outside the current section fail.

Stale result:

~~~text
LEDGER_CONFIGURATION_CURSOR_STALE
~~~

The caller must restart from the current description/page. This avoids mixing
records from two different template revisions in one Agent answer.

## 7. Semantic digest

The existing Configurator semantic digest remains the revision identity for
these reads.

The External Agent layer does not invent another revision number.

This allows later protocol projection to expose semanticDigest as a stable
consistency boundary and potential cache/revalidation input.

## 8. Action binding

Operations use the EA-2A ACTION_HOST binding.

Describe:

~~~text
operation:
ledger.runtime.configuration.describe

Host command:
evo-ledger-runtime-configurator.describe-runtime-configuration
~~~

Section read:

~~~text
operation:
ledger.runtime.configuration.section.read

Host command:
evo-ledger-runtime-configurator.read-runtime-configuration-section
~~~

The existing Human UI validation command remains unchanged:

~~~text
evo-ledger-runtime-configurator.validate-default
~~~

EA-2B therefore adds Agent-neutral semantic reads without breaking the existing
Configurator Experience.

## 9. Exposure eligibility

Both operations declare eligibility for:

~~~text
HUMAN
PERSONAL_AGENT
EXTERNAL_AGENT
AUTOMATION
~~~

This is not authorization.

Actual future External Agent visibility still requires:

~~~text
active Feature
∩ Principal
∩ Enterprise Context
∩ delegated Grant
∩ authorization.check
∩ protocol policy
=
visible operation
~~~

## 10. Current security posture

EA-2B does not add a public REST endpoint, MCP server, OAuth resource,
External Agent token, authorization bypass, or second read authority.

The operations are currently reachable only through the existing internal Host
Action routing context.

External network access remains blocked until identity/delegation gates are
completed.

## 11. Current template semantics

The active configuration remains the imported Bookkeeping policy.sql baseline.

The separate 记账规则.sql rule set remains a reference source library and is
not silently merged into the active 912 posting rules.

The describe operation makes that source-library distinction observable without
rewriting Ledger semantics.

## 12. Conformance evidence

Ledger plugin CI must prove:

1. describe returns the current template identity and counts;
2. describe does not dump the complete posting-rule array;
3. section read returns bounded pages;
4. cursor continuation retains the same semantic digest;
5. section mismatch fails closed;
6. configuration change makes old cursor stale;
7. page size above 100 fails;
8. Host Actions return the same semantic contracts;
9. Plugin Manifest publishes exactly the intended EA-001 READ operations;
10. operation bindings resolve to real Host handlers;
11. EXTERNAL_AGENT eligibility is explicit;
12. lifecycle disable removes both operations from the effective registry.

## 13. EA-001 future flow

~~~text
External Agent
  ↓
authorized capability discovery
  ↓
ledger.runtime.configuration.describe
  ↓
understand current template shape
  ↓
ledger.runtime.configuration.section.read
  ↓
read only relevant pages
  ↓
answer Human
~~~

No source repository knowledge is needed.

## 14. Next step after EA-2B

The next generic platform slice is not another Ledger-specific API.

It is the governed selection layer:

~~~text
effective Capability Operations
        ↓
Principal
+ Enterprise Context
+ exposure eligibility
+ authorization
        ↓
authorized operation catalog
~~~

Then External Agent delegated authority and MCP can project that catalog.

The production Human OIDC live-login gate remains open until a real IdP and
browser flow are proven.


## 15. EA-2C authorization refinement

EA-2C makes the two Ledger operations explicit about data ownership and
authorization:

~~~text
dataScope:
INSTALLATION

authorization action:
ledger.runtime.configuration.read

resource type:
ledger.runtime.configuration

resource id source:
NONE
~~~

This reflects the current implementation truth: the Configurator currently
maintains the App Host installation's current Ledger configuration. It does not
yet maintain an explicit per-Enterprise Context template binding.

The Host now enforces this authorization metadata before direct ACTION_HOST
execution as well as during authorized capability discovery. Knowing or guessing
the underlying Host command does not bypass authorization.check.

### Enterprise-specific answer remains a separate domain gap

The EA-001 wording asks:

> What Ledger Runtime template is this enterprise using?

Today these operations can accurately answer:

> What Ledger Runtime configuration is current for this App Host installation?

A later Ledger/domain slice must make the enterprise relation explicit, for
example:

~~~text
Enterprise Context
→ explicit Ledger Template binding

or

Enterprise Context
→ explicit inheritance of installation default
~~~

That binding/inheritance must be queryable and auditable. An Agent adapter must
not infer it from deployment variables or hidden implementation knowledge.

See:
`docs/architecture/AUTHORIZED-CAPABILITY-OPERATION-CATALOG-EA2C-v0.1.md`.
