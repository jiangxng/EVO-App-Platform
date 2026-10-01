# Grok Web/Mobile + EVO Native OAuth Validation

**Status:** Integration client profile  
**Date:** 2026-10-01

## Purpose

Validate EVO External Agent OAuth and Agent Capability Fabric from Grok Web/Mobile without DevTools, client secrets, DCR or a local MCP adapter.

Architecture:

    Grok Web/Mobile
      ↓ native Custom MCP
    EVO production /mcp
      ↓ OAuth discovery
    EVO Authorization Server
      ↓ Human Consent
    bounded External Agent Authority Grant
      ↓
    Agent Capability Fabric / delegated Capability Operations

## MCP server

    https://ledger-configurator-production.up.railway.app/mcp

## Public Client ID

Use this HTTPS CIMD document as the OAuth Client ID:

    https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/grok-web-mobile-client.json

Client secret:

    leave blank

The client is public and uses Authorization Code + PKCE.

## Redirect compatibility

Current Grok Web custom-connector integrations observed in August/September 2026 use:

    https://grok.com/connectors-oauth-exchange-code/

This callback is not currently documented as a stable xAI public contract.

Therefore it is treated as an Integration Client Profile fact, not an EVO Host invariant.

If Grok changes the callback, update this versioned client profile after observing the exact new value. Do not loosen generic redirect validation.

## Expected first-use flow

    Grok
    → EVO /mcp
    → OAuth metadata
    → Client ID supplied by Human
    → EVO fetches and validates CIMD
    → EVO Human login
    → EVO Human Consent page
    → Human selects Enterprise Context
    → Human selects explicit READ/PLAN operations
    → Human chooses 1h / 4h / 24h
    → EVO enrolls Agent + PUBLIC MCP Client
    → EVO creates normal Authority Grant
    → OAuth code + PKCE token exchange
    → Grok reconnects to /mcp

No pre-created Agent/Client/Grant is required.

## First validation selection

For the first mobile proof, grant only:

    ledger.runtime.configuration.describe
    ledger.runtime.configuration.section.read

Do not grant WRITE.

## Agent Capability Fabric

Production currently runs MCP capability mode HYBRID.

Therefore Grok may see:

    evo.capabilities.search
    evo.capabilities.describe
    evo.capabilities.invoke

and the two directly delegated Ledger operations.

A later FABRIC-only test should expose only the three generic Fabric gateway tools.

## Security

- CIMD identity is public and secret-free.
- PKCE S256 remains mandatory.
- Redirect URI is exact-match HTTPS.
- Human Consent does not preselect business operations.
- WRITE is excluded from Consent v0.1.
- Grant expiry bounds token and refresh-token authority.
- Current Human, Context, Feature lifecycle and authorization are recomputed at runtime.
- Revocation remains immediate.

## Mobile pass criteria

A phone-only validation passes when:

1. the Human enters the EVO MCP URL and this Client ID in Grok;
2. Client Secret is left blank;
3. Grok opens EVO OAuth;
4. EVO shows Human Consent without DevTools;
5. Human selects the two Ledger READ operations and a short expiry;
6. OAuth returns to Grok;
7. Grok discovers EVO tools;
8. a natural-language request results in a real EVO tool call;
9. the answer remains installation-scoped;
10. no WRITE tool is available.

## Current evidence boundary

xAI's official connector documentation confirms Custom MCP and OAuth-capable authentication, but does not currently publish the Grok hosted OAuth callback URI.

The callback above is based on current third-party interoperability reports and must be revalidated if Grok changes behavior.
