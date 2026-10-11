import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  EnterpriseContextGrantV010,
  EnterpriseContextRelationshipV010,
  EnterpriseContextV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
  HOST_ENTERPRISE_CONTEXT_PROVIDER_ID
} from "../providers/enterprise-context/package.js";
import type {
  EnterpriseContextGovernanceSnapshotV010,
  EnterpriseContextGovernanceStoreV010
} from "./enterprise-context-governance-store.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export const ENTERPRISE_CONTEXT_CREATE_COMMAND = "enterprise.context.create";
export const ENTERPRISE_CONTEXT_CREATE_ACTION = "enterprise.context.create";

function stringValue(
  values: Record<string, JsonValue>,
  key: string,
  required = true
): string | undefined {
  const value = values[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`ENTERPRISE_CONTEXT_CREATE_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function attributesValue(
  values: Record<string, JsonValue>
): Record<string, string | number | boolean | null> | undefined {
  const raw = values.attributes;
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("ENTERPRISE_CONTEXT_CREATE_FIELD_INVALID: attributes");
  }
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      value !== null
      && typeof value !== "string"
      && typeof value !== "number"
      && typeof value !== "boolean"
    ) {
      throw new Error(`ENTERPRISE_CONTEXT_CREATE_ATTRIBUTE_INVALID: ${key}`);
    }
    result[key] = value;
  }
  return result;
}

function codeFrom(values: Record<string, JsonValue>): string | undefined {
  const code = stringValue(values, "code", false);
  if (!code) return undefined;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(code)) {
    throw new Error("ENTERPRISE_CONTEXT_CREATE_CODE_INVALID");
  }
  return code;
}

function collision(snapshot: EnterpriseContextGovernanceSnapshotV010, id: string): boolean {
  return snapshot.contexts.some(item => item.contextId === id || item.enterpriseId === id)
    || snapshot.relationships.some(item => item.relationshipId === id)
    || snapshot.grants.some(item => item.grantId === id)
    || snapshot.lifecycleEvents.some(item => item.eventId === id);
}

export interface EnterpriseContextCreationDependenciesV010 {
  store: EnterpriseContextGovernanceStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  now?: () => Date;
  id?: () => string;
}

export function createEnterpriseContextCreationActionHandlerV010(
  dependencies: EnterpriseContextCreationDependenciesV010
): AppActionHandler {
  const now = dependencies.now ?? (() => new Date());
  const nextId = dependencies.id ?? randomUUID;

  return {
    packageId: HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
    featureId: HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
    commandCode: ENTERPRISE_CONTEXT_CREATE_COMMAND,

    async execute(
      request: AppActionRequestV010,
      requestContext?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      if (!requestContext) {
        return {
          ok: false,
          error: {
            code: "REQUEST_CONTEXT_REQUIRED",
            message: "Enterprise Context creation requires a Host-resolved request context."
          }
        };
      }
      if (!requestContext.context || requestContext.context.activeContext.kind !== "PERSONAL") {
        return {
          ok: false,
          error: {
            code: "ENTERPRISE_CONTEXT_CREATE_REQUIRES_PERSONAL_CONTEXT",
            message: "Create an Enterprise Context from the current Principal's Personal Context."
          }
        };
      }
      if (requestContext.principal.actorType !== "HUMAN") {
        return {
          ok: false,
          error: {
            code: "ENTERPRISE_CONTEXT_CREATE_HUMAN_REQUIRED",
            message: "The initial Enterprise Context owner must be a human Principal."
          }
        };
      }
      if (request.requiresConfirmation !== true) {
        return {
          ok: false,
          error: {
            code: "MATERIAL_WRITE_CONFIRMATION_REQUIRED",
            message: "Enterprise Context creation requires explicit human confirmation."
          }
        };
      }

      try {
        const displayName = stringValue(request.values, "displayName")!;
        const code = codeFrom(request.values);
        const suppliedAttributes = attributesValue(request.values);

        const authorization = await authorizeMaterialWriteV010(
          dependencies.resolveAuthorizationProvider(),
          requestContext,
          {
            action: ENTERPRISE_CONTEXT_CREATE_ACTION,
            resource: {
              type: "enterprise.context",
              attributes: {
                displayName,
                ...(code ? { code } : {})
              }
            }
          }
        );
        if (!authorization.allowed) {
          return {
            ok: false,
            error: {
              code: authorization.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED",
              message: `Enterprise Context creation denied by '${authorization.policyProviderId}': ${authorization.reasonCodes.join(", ")}`
            }
          };
        }

        const createdAt = now().toISOString();
        const snapshot = dependencies.store.snapshot();

        let suffix = nextId();
        while (collision(snapshot, suffix)) suffix = nextId();

        const enterpriseId = `ent_${suffix.replaceAll("-", "")}`;
        const contextId = `enterprise:${enterpriseId}`;
        const ownerRelationshipId = `relationship:${nextId()}`;
        const grantId = `grant:${nextId()}`;
        const creatingEventId = `lifecycle:${nextId()}`;
        const activeEventId = `lifecycle:${nextId()}`;
        const ownerActivatedEventId = `relationship-event:${nextId()}`;

        const context: EnterpriseContextV010 = {
          contractVersion: "0.1.0",
          kind: "ENTERPRISE",
          contextId,
          enterpriseId,
          enterpriseProviderId: HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
          displayName,
          lifecycleState: "ACTIVE",
          createdBySubjectId: requestContext.principal.subjectId,
          createdAt,
          attributes: {
            ...(suppliedAttributes ?? {}),
            ...(code ? { code } : {})
          }
        };

        const owner: EnterpriseContextRelationshipV010 = {
          contractVersion: "0.1.0",
          relationshipId: ownerRelationshipId,
          subjectId: requestContext.principal.subjectId,
          contextId,
          kind: "OWNER",
          state: "ACTIVE",
          createdAt,
          createdBySubjectId: requestContext.principal.subjectId
        };

        const grant: EnterpriseContextGrantV010 = {
          contractVersion: "0.1.0",
          grantId,
          subjectId: requestContext.principal.subjectId,
          contextId,
          relationship: "OWNER",
          state: "ACTIVE",
          createdAt,
          createdBySubjectId: requestContext.principal.subjectId,
          attributes: {
            source: "enterprise.context.create"
          }
        };

        dependencies.store.save({
          contractVersion: "0.1.0",
          contexts: [...snapshot.contexts, context],
          relationships: [...snapshot.relationships, owner],
          grants: [...snapshot.grants, grant],
          lifecycleEvents: [
            ...snapshot.lifecycleEvents,
            {
              contractVersion: "0.1.0",
              eventId: creatingEventId,
              contextId,
              to: "CREATING",
              occurredAt: createdAt,
              actorSubjectId: requestContext.principal.subjectId
            },
            {
              contractVersion: "0.1.0",
              eventId: activeEventId,
              contextId,
              from: "CREATING",
              to: "ACTIVE",
              occurredAt: createdAt,
              actorSubjectId: requestContext.principal.subjectId
            }
          ],
          invitations: snapshot.invitations,
          ownershipTransfers: snapshot.ownershipTransfers,
          relationshipEvents: [
            ...snapshot.relationshipEvents,
            {
              contractVersion: "0.1.0",
              eventId: ownerActivatedEventId,
              contextId,
              type: "RELATIONSHIP_ACTIVATED",
              occurredAt: createdAt,
              actorSubjectId: requestContext.principal.subjectId,
              subjectId: requestContext.principal.subjectId,
              relationshipId: owner.relationshipId
            }
          ],
          defaultContexts: snapshot.defaultContexts.some(
            item => item.subjectId === requestContext.principal.subjectId
          )
            ? snapshot.defaultContexts
            : [
                ...snapshot.defaultContexts,
                {
                  contractVersion: "0.1.0",
                  subjectId: requestContext.principal.subjectId,
                  contextId,
                  selectedAt: createdAt,
                  selectedBySubjectId: requestContext.principal.subjectId
                }
              ]
        });

        return {
          ok: true,
          correlationId: requestContext.correlationId,
          result: JSON.parse(JSON.stringify({
            context,
            ownerRelationship: owner,
            initialGrant: grant,
            authorization: {
              policyProviderId: authorization.policyProviderId,
              reasonCodes: authorization.reasonCodes
            }
          }))
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const [candidate] = message.split(":");
        return {
          ok: false,
          error: {
            code: candidate && /^[A-Z0-9_]+$/.test(candidate)
              ? candidate
              : "ENTERPRISE_CONTEXT_CREATE_FAILED",
            message
          }
        };
      }
    }
  };
}
