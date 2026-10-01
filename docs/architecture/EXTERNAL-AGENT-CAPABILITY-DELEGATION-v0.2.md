# External Agent Capability-Level Delegation v0.2

**Status:** CURRENT_AUTHORITY / implementation baseline  
**Date:** 2026-10-01  
**Owner:** EVO-App-Platform

## 1. Purpose

Agent Capability Fabric removes the need to expose every business operation as a top-level protocol tool.

The remaining delegation problem is that a Human must still enumerate every operation id in an Authority Grant.

v0.2 introduces capability-level selectors so a Human can express bounded authority such as:

    capability = ledger.runtime.configuration
    effects = READ

without listing every current operation.

## 2. Grant model

An External Agent Authority Grant may contain either or both:

    allowedOperationIds[]
    capabilitySelectors[]

A selector is:

    {
      contractVersion: "0.1.0",
      capability: "<exact Capability id>",
      effects: ["READ" | "PLAN"]
    }

The stored Grant still contains:

- Human authorizer;
- Agent;
- Client;
- Enterprise Context;
- effectConstraints;
- validity window;
- terminal revocation state.

## 3. Exact capability identity only

v0.2 intentionally does not support:

- wildcard capability ids;
- prefix matching;
- regex matching;
- implicit hierarchy;
- WRITE selectors.

A selector matches only an exact Capability id and an explicitly selected READ or PLAN effect.

Broader selector languages require separate governance design.

## 4. Grant-time validation

A selector is accepted only if the authorizing Human currently has at least one operation that:

- belongs to the exact Capability;
- has the requested effect;
- is exposed to EXTERNAL_AGENT;
- passes current Human authorization;
- belongs to an active Feature/plugin.

This prevents typo or imaginary selectors from entering durable authority.

## 5. Runtime resolution

Capability selectors are dynamically resolved on every delegated authority evaluation.

For a current operation to be visible/invokable:

    active Agent
    ∩ active Client
    ∩ active/unexpired Grant
    ∩ active authorizing Human
    ∩ current Enterprise Context membership
    ∩ current Feature/plugin lifecycle
    ∩ current Human authorization.check
    ∩ EXTERNAL_AGENT exposure
    ∩ (
         explicit allowedOperationId
         OR exact capability selector + effect
       )
    ∩ Grant effectConstraints

must all hold.

A selector can therefore naturally include a newly installed READ/PLAN operation in the same Capability for a future authorization.

## 6. Token-family non-expansion

Dynamic Grant resolution must not cause an already issued OAuth credential family to silently expand.

When an authorization code is issued, EVO captures the exact effective operation ids at that moment.

That operation set becomes an immutable ceiling for:

    authorization code
    → access token
    → refresh-token family

Every later token use/rotation computes:

    current effective Grant authority
    ∩ immutable token-family operation ceiling

Therefore runtime policy/plugin/Context changes can shrink authority immediately.

They cannot expand an already issued token family.

To receive newly added operations selected by a capability-level Grant, the client must start a fresh authorization flow.

## 7. Legacy compatibility

Existing Grants with only allowedOperationIds remain valid.

Existing persisted OAuth code/token records created before v0.2 may not contain an operation ceiling. They retain legacy behavior until they expire/rotate out.

All newly issued credentials contain an explicit operation ceiling.

No persistent-state migration that rewrites historical Grant/token facts is required.

## 8. Human Consent projection

OAuth Human Consent now projects capability-level selectors in addition to concrete operation ids.

For each Enterprise Context the page groups current grantable operations by:

    exact Capability id
    +
    exact effect (READ or PLAN)

The Human may choose:

    Grant entire capability: <exact capability id> <effect>

or expand the group and select individual operations instead.

No selector or operation is preselected.

Each capability group shows the concrete current operations it covers and states that a future matching operation requires a fresh OAuth authorization before an existing token family can gain it.

Consent POST does not trust the submitted selector. It re-lists the current grantable catalog and requires the exact capability/effect pair to exist there before creating the normal Authority Grant.

WRITE, wildcard, prefix and regex delegation remain absent from the UI and rejected at the Host boundary.

## 9. Relationship to OAuth Rich Authorization Requests

RFC 9396 defines authorization_details for fine-grained OAuth authorization requirements.

EVO v0.2 does not require external MCP clients to send authorization_details.

The internal authority model is nevertheless compatible with the same separation:

    OAuth scope
    = coarse protocol permission

    Authority Grant / capability selector
    = fine-grained business authority

A future standards projection may map selected EVO authority into an authorization_details type after interoperability demand exists.

## 10. Security invariants

1. WRITE selectors are forbidden.
2. Selector identity is exact; no wildcard semantics.
3. Current Human authorization remains mandatory.
4. Current Enterprise Context membership remains mandatory.
5. Plugin/Feature lifecycle is re-evaluated.
6. Revocation remains immediate.
7. Token-family authority can only stay equal or shrink.
8. A fresh OAuth authorization is required to pick up selector expansion.
9. Explicit operation grants remain supported and auditable.
10. Historical Grant creation facts remain immutable.

## 11. Acceptance

Machine acceptance requires:

1. a selector-only Grant can be created with an empty allowedOperationIds array;
2. nonexistent or unauthorized capability/effect selectors are rejected;
3. dynamic delegated catalogs include all currently authorized matching operations;
4. operations outside the selector remain OPERATION_NOT_GRANTED;
5. current policy or plugin disablement still removes selected operations;
6. ActionHost governance accepts selector-only Grant creation;
7. authorization-code issuance freezes current operation ids;
8. access tokens preserve that operation ceiling;
9. refresh rotation never expands beyond the original token family ceiling;
10. a new authorization flow may capture newly available operations selected by the durable Grant;
11. legacy explicit-operation Grants remain unchanged.
