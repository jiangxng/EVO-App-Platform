# EVO Login Experience v0.1

**Status:** Independent product-improvement slice  
**Owner:** EVO App Platform host experience  
**Scope:** Browser human sign-in entry only

## Decision

EVO exposes a first-class `/login` experience before starting any external
identity-provider redirect.

The page intentionally shows both present and future identity capabilities:

- Google: current usable path through the existing generic OIDC provider;
- Microsoft: visible future identity method;
- Enterprise SSO: visible administrator-configured future method;
- Email/local identity: visible future method;
- self-service registration: visible planned capability.

Unavailable methods must never pretend to work. They render with explicit
`ADMIN_CONFIGURATION_REQUIRED` or `PLANNED` status until a real provider or
registration capability is connected.

## Authentication boundary

This slice does not replace authentication architecture.

```text
/login
  -> Human chooses an available identity method
  -> /auth/login
  -> identity.authenticate Provider
  -> OIDC / external IdP
  -> /auth/callback
  -> Host-managed Session
  -> local returnTo
```

Google remains a deployment profile of the generic OIDC provider, not a
Google-specific Host contract.

Future identity methods should become available by supplying a real action path
and changing capability status only after their backend contract is production
ready.

## Registration boundary

The page deliberately shows the future account-creation affordance, but it is
disabled in v0.1 because no registration authority exists yet.

Future registration must define its own governed contract for:

- invitation vs self-service admission;
- identity proof;
- organization/enterprise membership;
- duplicate identity handling;
- approval/policy;
- account recovery;
- audit evidence.

Registration must not be implemented as an implicit side effect of login.

## Design language

The experience extends the Eidos Productive Design Language rather than
introducing a separate brand system:

- Eidos typography, spacing, radius, color and focus tokens;
- calm enterprise visual hierarchy;
- one clear active path;
- explicit unavailable/future states;
- responsive desktop/mobile layout;
- no stock photography;
- reduced-motion support;
- accessible names and focus treatment.

The left-side cover speaks from the enterprise to its people, not from the
platform vendor to the enterprise. The default copy is a neutral management
template centered on aligned goals, clear ownership and continuous improvement.

The cover is intentionally shaped as a future enterprise-configurable surface:
an enterprise may later provide its own logo, background, headline, supporting
message, management priorities and footer statement. Until that capability is
governed and implemented, the Host renders the default template.

The cover remains presentation content rather than operational business truth.

## Enterprise cover skins

The Host may expose multiple presentation skins for demo or enterprise-branding
purposes without changing authentication behavior. The standard skin remains
the default. Alternate skins are selected explicitly and must preserve the same
identity-method truth and return-to boundary.

Customer brand assets are immutable inputs. A customer logo must be displayed
from the supplied/original image asset without redrawing, recoloring, filtering,
cropping, stretching, or substituting typography. Layout may control only
placement, maximum dimensions and surrounding whitespace.

The TUGE demo skin is a demonstration-only cover that uses TUGE's published
global-connectivity / AIoT themes and public footprint metrics while preserving
the approved enterprise headline. Its decorative globe/network artwork is an
EVO-owned presentation element; it is not part of the customer logo.

## Accessibility

The login experience preserves a low-cognitive-load path through federated
identity. Future email/password support must allow browser/password-manager
autofill and paste, and must not remove easier authentication alternatives.

## Non-goals

- no change to OIDC token validation;
- no change to Host Session ownership;
- no new user registration backend;
- no Microsoft/SSO/email provider implementation in this slice;
- no project milestone or `project.status.json` change.
