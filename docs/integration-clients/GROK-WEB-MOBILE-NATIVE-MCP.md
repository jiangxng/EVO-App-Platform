# Grok Web/Mobile + EVO Native OAuth Validation

**Status:** VERIFIED_PRODUCTION_PASS  
**Date:** 2026-10-02

## Conclusion

Grok Web and Grok Mobile both completed real production OAuth + MCP + Ledger Runtime READ validation against EVO.

This closes the Grok live gate for the External Agent READ/PLAN foundation.

Validated production path:

    Grok Web / Mobile
      ↓ Custom MCP
    EVO production /mcp
      ↓ OAuth protected-resource discovery
    EVO Authorization Server
      ↓ Human Consent / delegated Grant
    Agent Capability Fabric / delegated Capability Operations
      ↓
    Ledger Runtime configuration READ

Production MCP endpoint:

    https://ledger-configurator-production.up.railway.app/mcp

## Web client identity

Current Grok Web behavior uses Grok's own published CIMD identity automatically:

    https://grok.com/oauth/mcp-client.json

The current Web Custom Connector UI can complete setup from the MCP server URL without asking the Human to type a Client ID.

This native Grok identity is the observed Web client identity and must not be replaced by the EVO-maintained compatibility profile merely for consistency.

## Mobile/manual client identity

Current Grok Mobile behavior differs from Web.

The Mobile Custom Connector flow asks for:

- Client ID
- optional Client Secret

For that manual flow use the EVO-maintained compatibility profile:

    https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/grok-web-mobile-client.json

Client Secret:

    leave blank

The profile is a PUBLIC Authorization Code + PKCE client and currently declares:

    https://grok.com/connectors-oauth-exchange-code/

as its redirect URI.

The callback is an observed compatibility fact, not an EVO invariant. Do not loosen generic redirect matching if Grok changes it.

## MCP protocol compatibility

Initial native Grok OAuth succeeded but tool discovery failed because Grok used handshake-era Streamable HTTP behavior while EVO only accepted the strict 2026-07-28 wire path.

PR #255 added stateless compatibility for:

- 2025-11-25
- 2025-06-18
- 2025-03-26

while preserving the existing 2026-07-28 path.

The compatibility layer adapts the older handshake-era transport into the existing governed MCP core. It does not widen delegated authority, bypass OAuth or move business semantics into the transport adapter.

## Web production proof

Grok Web completed all of the following in production:

- OAuth protected-resource discovery;
- native Grok CIMD client identity;
- Authorization Code + PKCE token exchange;
- MCP initialize / tool discovery over the handshake-era compatible path;
- natural-language autonomous selection of Ledger Runtime configuration capabilities;
- installation-scoped configuration description;
- bounded accounts READ;
- no WRITE exposure;
- immediate delegated-Grant revocation cutoff.

Observed Ledger Runtime evidence matched the independent Cline + DeepSeek proof:

- templateId: `bookkeeping-default`
- semanticDigest: `8a1e5f7110625cf92da1c6c65a57d875cca9c008bc47c391ebeb76a694990e98`
- accounts: 141
- applications: 143
- dictionaries: 106
- postingRules: 912
- referenceLegacyPostingRules: 587
- burnReady: true

After all effective native Grok Grants were revoked, a fresh Grok request reached EVO `/mcp` and received HTTP 401 while the connector still existed. Grok then required re-authentication.

That is the production proof that an already-held client credential cannot outlive current delegated authority.

## Mobile production proof

Grok Mobile completed:

- manual public Client ID setup with no Client Secret;
- EVO Human Consent;
- OAuth token exchange;
- native MCP tool discovery;
- real Ledger Runtime bounded READ.

The fresh Mobile test requested accounts 6 through 10 and returned:

| ID | Title |
| --- | --- |
| 1121 | 应收票据 |
| 1122 | 应收账款 |
| 1123 | 预付账款 |
| 1131 | 应收股利 |
| 1132 | 应收利息 |

Production HTTP logs showed the corresponding MCP request sequence returning 200 / 202 / 200 responses.

## OAuth callback UX observation

A Grok interoperability UX issue exists on both PC Web and Mobile:

1. the Human completes EVO consent;
2. EVO returns HTTP 303 to the registered Grok callback;
3. the browser may remain open instead of visibly returning/closing into Grok;
4. when the connector flow is started again, EVO can recognize the already-created effective Grant;
5. the second authorization request can redirect immediately and Grok completes `/oauth/token` successfully.

Therefore:

- the first visible callback stall must not automatically be interpreted as failed EVO consent;
- verify the server-side 303 and subsequent token exchange before diagnosing the authorization itself;
- this is an Integration Client UX compatibility issue, not evidence that EVO lost the Grant.

A separate observed Grok behavior is that an expired cached refresh token may continue to be retried. Disconnecting/recreating the connector cleared that client-side state during validation.

## Security boundary proved

The live validation proves:

- public-client OAuth with PKCE;
- exact delegated READ authority;
- current-authority recomputation;
- token-family ceilings do not silently expand authority;
- no WRITE exposure in the validated slice;
- Grant revocation removes effective access immediately;
- protocol-version compatibility does not bypass governance;
- a third-party Agent can discover and use EVO capabilities from natural-language intent without source-code knowledge.

## Evidence boundary

This proof validates the External Agent READ/PLAN capability foundation.

It does not by itself prove:

- External Agent WRITE;
- every future Grok UI/callback behavior;
- every non-Ledger plugin's external projection;
- ChatGPT product-specific MCP entitlement/UX.

Those are future product or regression slices, not prerequisites for considering the External Agent capability foundation validated.
