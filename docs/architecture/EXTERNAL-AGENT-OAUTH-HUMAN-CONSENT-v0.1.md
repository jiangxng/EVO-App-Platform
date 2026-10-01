# External Agent OAuth Human Consent v0.1

**Status:** CURRENT_AUTHORITY / implementation baseline  
**Date:** 2026-10-01  
**Owner:** EVO-App-Platform

## 1. Purpose

External Agent OAuth must be usable by a Human from a normal browser or mobile device.

The Human must not need DevTools, a bootstrap script, or a pre-created Authority Grant before connecting a standards-compatible public MCP client.

The Host therefore supports a first-use Human Consent flow:

    public CIMD client
    → OAuth authorize request
    → Human login
    → EVO Consent page
    → choose Enterprise Context
    → choose explicit READ/PLAN operations
    → choose short expiry
    → Host enrolls Agent + Client if first use
    → Host creates bounded Grant
    → OAuth authorization code
    → client continues PKCE token exchange

This is not Dynamic Client Registration.

## 2. Client identity

v0.1 accepts a public OAuth client only when its client_id is a valid HTTPS Client ID Metadata Document URL.

The Host fetches and validates the CIMD before consent:

- metadata client_id must equal the requested client_id;
- redirect_uris must be valid and unique;
- requested redirect_uri must match a registered redirect;
- authorization_code / code compatibility must hold;
- token endpoint authentication must be public-client compatible;
- PKCE S256 remains mandatory.

MCP 2026-07-28 formally shifts new implementations from DCR toward CIMD, so Human consent builds on the stable metadata-document identity rather than creating an arbitrary server-issued client id.

## 3. First-use enrollment

A valid CIMD does not by itself create authority.

If the OAuth client is not already represented in EVO governance, approval may create:

    ExternalAgentRegistration
    +
    ExternalAgentClientRegistration

as one Host governance transition.

The enrollment records:

- Human creator;
- public client kind;
- MCP protocol;
- stable oauthClientId;
- onboarding source = OAUTH_HUMAN_CONSENT.

The client is REGISTERED, not VERIFIED or FIRST_PARTY.

Consent must never silently increase trust level.

## 4. Revocation remains terminal

If a previously known OAuth Client has been revoked, the consent flow must not recreate or reactivate it automatically.

Explicit revocation always wins over convenience.

A Human administrator must use a future explicit recovery/re-registration flow if reactivation is ever supported.

## 5. Human authority before delegation

The Consent page only shows operations that satisfy all of the following for the current Human and selected Enterprise Context:

    Human authorization
    ∩ active Feature / plugin
    ∩ EXTERNAL_AGENT exposure
    ∩ READ or PLAN effect

WRITE is excluded from v0.1.

The Human must explicitly select operation ids.

No operation is granted merely because it exists in the Capability Registry.

## 6. Grant creation

Approval creates a normal ExternalAgentAuthorityGrant.

No alternate consent-token authority model exists.

The Grant remains bounded by:

- authorizing Human;
- Enterprise Context;
- Agent;
- Client;
- explicit allowedOperationIds;
- effect constraints;
- validFrom;
- validUntil.

v0.1 allows only these durations in the browser consent surface:

    1 hour
    4 hours
    24 hours

The default is 4 hours.

## 7. OAuth scopes do not replace Capability Grants

The OAuth scope:

    evo.capabilities

means the token may represent EVO delegated capability access.

It does not name or grant business operations.

The Authority Grant is the business-operation authority source.

If offline_access is requested, refresh tokens are still bounded by the Grant's expiry and current delegated-authority recomputation.

## 8. Existing-client fast path

If the Human already has exactly one current effective Grant for the registered Client, the existing authorization fast path may issue a code without asking the Human to select the same operations again.

This preserves previously validated Inspector/Cline interoperability.

If multiple effective Grants exist, v0.1 remains fail-closed with interaction_required rather than guessing which Grant to use.

A later consent version may support explicit existing-Grant selection.

## 9. Consent page security

The Consent page is served by the EVO Authorization Server.

It must:

- require an authenticated Human session;
- use no client-supplied HTML;
- escape all client metadata rendered into HTML;
- POST only back to the same EVO origin;
- pass existing same-origin cookie-mutation protection;
- revalidate CIMD, redirect URI, resource, scopes, PKCE, Context and operation selection on POST;
- redirect to the client only after redirect_uri has already been validated.

A manipulated form cannot expand authority because POST approval re-derives the grantable operation catalog from current Host authority.

## 10. Relationship to Agent Capability Fabric

Human Consent and Agent Capability Fabric solve different problems.

    Human Consent
    = how authority enters the system safely

    Agent Capability Fabric
    = how an authorized Agent discovers, understands and invokes capability contracts at scale

Consent does not make the Capability Fabric open-ended.

The Fabric remains bounded by the resulting Grant and Access Token.

## 11. Future delegation scale

v0.1 still asks the Human to select concrete operation ids.

This is acceptable for initial validation but does not scale to a mature ERP with thousands of operations.

The next authority slice should introduce governed Capability-level selectors, such as:

    Capability id
    + effect constraints
    + Context constraints
    + expiry
    + optional operation exclusions

Those selectors must be resolved into current effective operations at runtime and remain revocable.

No wildcard authority is introduced by this consent slice.

## 12. Standards alignment

OAuth exists to let a resource owner authorize limited third-party access through an authorization server.

MCP 2026-07-28 prefers CIMD over DCR for client identity.

EVO therefore keeps:

    CIMD = client identity metadata
    Human Consent = authorization decision
    Authority Grant = durable delegated business authority
    Access Token = short-lived bearer representation
    current-authority recomputation = runtime enforcement

These layers must not be collapsed.

## 13. v0.1 acceptance

Machine acceptance requires:

1. an unregistered valid CIMD can be inspected without creating governance state;
2. GET authorization for first use returns a Human Consent model rather than access_denied;
3. deny creates no Agent, Client, Grant or authorization code;
4. approve revalidates the request and selected Context;
5. approve rejects non-grantable operation ids;
6. approve atomically enrolls a first-use public Agent/Client;
7. approve creates only READ/PLAN Grant authority;
8. revoked clients cannot be resurrected by consent;
9. the Grant expiry is bounded to an allowed duration;
10. code issuance continues through the existing OAuth service;
11. existing unique effective Grant fast path still works;
12. token/current-authority revocation semantics remain unchanged.

Live acceptance is a mobile client flow where the Human enters only the MCP server/client identity information required by the external product, signs into EVO, selects a bounded read-only Grant in the EVO page, and returns to the client without DevTools.
