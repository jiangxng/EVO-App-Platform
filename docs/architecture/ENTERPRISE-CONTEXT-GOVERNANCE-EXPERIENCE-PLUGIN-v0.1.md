# Enterprise Context Governance Experience Plugin v0.1

**Status:** Implementation baseline subordinate to the canonical Resource Container design  
**Date:** 2026-10-01  
**Scope:** Enterprise Context creation product flow  
**Architecture:** Provider data plane + Application Experience plugin + independent authorization

## 0. Authority

This document describes the governance Experience implementation only. It MUST conform to `ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md`, which is the sole conceptual authority for Enterprise Context.

## 1. Decision

Enterprise Context creation is not a Host-special page.

The canonical separation is:

~~~text
host-enterprise-context-provider
  owns Enterprise Context data / lifecycle / relationships / Grants
            |
            | enterprise.directory + enterprise.context.create
            v
evo-enterprise-context-governance
  installable APPLICATION plugin
  owns Eidos Experience / UIDL / localization only
            |
            v
Eidos
  owns rendering / interaction / design language

authorization.check Provider
  independently decides whether the Human may create
~~~

The Experience plugin stores no Enterprise Context data.

## 2. Data / design separation

Provider-owned facts:

- EnterpriseContext;
- lifecycle events;
- OWNER / ADMIN / MEMBER / AUDITOR relationships;
- Enterprise Context Grants;
- immutable creation facts.

Experience-owned design:

- route and navigation;
- form fields;
- labels/localization;
- Human confirmation affordance;
- command projection.

The current UIDL asset invokes only:

~~~text
enterprise.context.create
~~~

The page does not import the governance store and does not generate authority IDs.

## 3. Plugin lifecycle

Package:

~~~text
packageId = evo-enterprise-context-governance
type      = APPLICATION
featureId = evo-enterprise-context-governance.default
~~~

The package is present in the catalog but is not Host-hardcoded as always installed.

Normal product flow:

~~~text
Plugin Store
→ install Enterprise Context Governance
→ Feature becomes effective
→ Eidos receives eidos.experience contribution
→ Workbench exposes Enterprise Contexts
→ Human opens /enterprise-contexts/new
→ Human submits confirmed enterprise.context.create
~~~

Disabling or uninstalling the plugin removes the Experience without deleting Enterprise Context data.

## 4. Dependencies

The Experience plugin declares:

~~~text
requiresCapabilities:
  - enterprise.directory
  - authorization.check
~~~

This keeps it dependent on stable capabilities rather than concrete storage or authorization implementations.

A different Enterprise Provider may satisfy `enterprise.directory` in the future without redesigning the page, provided the public creation contract remains compatible.

## 5. Authorization

Human confirmation is required but is not authorization.

Creation still requires the effective `authorization.check` Provider to ALLOW:

~~~text
action        = enterprise.context.create
resource.type = enterprise.context
actorType     = HUMAN
~~~

The reference static Authorization Provider remains default-deny.

For production policy composition, the reference Provider supports an optional additive overlay:

~~~text
APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON
~~~

The overlay does not replace the base policy. Rules are composed and any matching DENY continues to override ALLOW. Duplicate rule IDs fail closed.

This permits a deployment to add a narrow product rule without reading, rewriting or disclosing the existing Host-owned policy.

## 6. Designer evolution

The initial Experience asset is ordinary UIDL. It is intentionally separate from the Provider and may later be emitted or edited by an Eidos Designer without moving Enterprise Context state into the design layer.

Permanent rule:

~~~text
Designer output
→ Experience / UIDL artifact
→ public command/capability
→ Provider-owned data
~~~

Never:

~~~text
Designer output
→ private governance store
~~~

## 7. Acceptance

The implementation is accepted when:

1. the Experience is absent before plugin installation;
2. installing the plugin makes the Experience effective;
3. the page loads through the generic Experience asset path, with no `server.ts` route special-case;
4. the form invokes only `enterprise.context.create`;
5. the form requires Human confirmation;
6. the Experience plugin contains no Enterprise Context store;
7. the Provider remains authoritative for generated IDs, lifecycle, OWNER and initial Grant;
8. authorization remains Provider-controlled and default-deny;
9. additive policy overlay cannot override an explicit DENY;
10. uninstalling the UI plugin does not delete Enterprise Context facts.

## 8. Follow-on

After the first Enterprise Context is created, additional governance surfaces (member invitation, ownership transfer, External Agent delegation) should follow the same pattern: Provider/service owns facts and rules; installable Experience plugins own Human UI; Eidos owns rendering.