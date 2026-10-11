import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  COUNTERPARTY_NAMESPACE_V010,
  type CounterpartyRepositoryV010
} from "./repository.js";

export const COUNTERPARTY_ROLE_COLLECTION_V010 =
  "counterparty-roles" as const;
export const COUNTERPARTY_ROLE_RESOURCE_TYPE_V010 =
  "counterparty.relationship-role" as const;
export const COUNTERPARTY_ROLE_SCHEMA_V010 =
  "evo.counterparty.relationship-role/0.1.0" as const;

export type CounterpartyRelationshipRoleCodeV010 =
  | "CUSTOMER"
  | "SUPPLIER";

export interface CounterpartyRelationshipRoleV010 {
  contractVersion: "0.1.0";
  roleId: string;
  counterpartyId: string;
  roleCode: CounterpartyRelationshipRoleCodeV010;
}

export interface CounterpartyRoleRepositoryV010 {
  list(
    contextId: string,
    counterpartyId?: string
  ): CounterpartyRelationshipRoleV010[];
  has(
    contextId: string,
    counterpartyId: string,
    roleCode: CounterpartyRelationshipRoleCodeV010
  ): boolean;
  assign(input: {
    contextId: string;
    counterpartyId: string;
    roleCode: CounterpartyRelationshipRoleCodeV010;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyRelationshipRoleV010;
  assignMany(input: {
    contextId: string;
    assignments: Array<{
      counterpartyId: string;
      roleCode: CounterpartyRelationshipRoleCodeV010;
    }>;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyRelationshipRoleV010[];
  archive(input: {
    contextId: string;
    counterpartyId: string;
    roleCode: CounterpartyRelationshipRoleCodeV010;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyRelationshipRoleV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function roleCode(
  value: string
): CounterpartyRelationshipRoleCodeV010 {
  const normalized = required(
    value,
    "COUNTERPARTY_ROLE_CODE_REQUIRED"
  ).toUpperCase();
  if (!["CUSTOMER", "SUPPLIER"].includes(normalized)) {
    throw new Error("COUNTERPARTY_ROLE_CODE_INVALID");
  }
  return normalized as CounterpartyRelationshipRoleCodeV010;
}

function roleId(
  counterpartyId: string,
  code: CounterpartyRelationshipRoleCodeV010
): string {
  return `${required(counterpartyId, "COUNTERPARTY_ID_REQUIRED")}.${code.toLowerCase()}`;
}

function assertRole(
  value: CounterpartyRelationshipRoleV010
): CounterpartyRelationshipRoleV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("COUNTERPARTY_ROLE_CONTRACT_VERSION_INVALID");
  }
  const normalizedCode = roleCode(value.roleCode);
  const normalizedCounterpartyId = required(
    value.counterpartyId,
    "COUNTERPARTY_ID_REQUIRED"
  );
  const expectedRoleId = roleId(
    normalizedCounterpartyId,
    normalizedCode
  );
  if (value.roleId !== expectedRoleId) {
    throw new Error("COUNTERPARTY_ROLE_ID_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    roleId: expectedRoleId,
    counterpartyId: normalizedCounterpartyId,
    roleCode: normalizedCode
  };
}

function payloadOf(
  role: CounterpartyRelationshipRoleV010
): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(role)) as EnterpriseResourceJsonV010;
}

function roleFromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): CounterpartyRelationshipRoleV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("COUNTERPARTY_ROLE_RESOURCE_PAYLOAD_INVALID");
  }
  return assertRole(
    payload as unknown as CounterpartyRelationshipRoleV010
  );
}

export function createCounterpartyRoleRepositoryV010(
  resources: EnterpriseResourceRepositoryV010,
  counterparties: CounterpartyRepositoryV010
): CounterpartyRoleRepositoryV010 {
  const address = (
    contextId: string,
    counterpartyId: string,
    code: CounterpartyRelationshipRoleCodeV010
  ) => ({
    contextId: required(contextId, "COUNTERPARTY_CONTEXT_REQUIRED"),
    namespace: COUNTERPARTY_NAMESPACE_V010,
    collectionId: COUNTERPARTY_ROLE_COLLECTION_V010,
    resourceType: COUNTERPARTY_ROLE_RESOURCE_TYPE_V010,
    resourceId: roleId(counterpartyId, code)
  });

  return {
    list(contextId, counterpartyId) {
      const normalizedContextId = required(
        contextId,
        "COUNTERPARTY_CONTEXT_REQUIRED"
      );
      const normalizedCounterpartyId = counterpartyId === undefined
        ? undefined
        : required(counterpartyId, "COUNTERPARTY_ID_REQUIRED");
      return resources.list({
        contextId: normalizedContextId,
        namespace: COUNTERPARTY_NAMESPACE_V010,
        collectionId: COUNTERPARTY_ROLE_COLLECTION_V010,
        resourceType: COUNTERPARTY_ROLE_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => roleFromPayload(resource.payload))
        .filter(role =>
          normalizedCounterpartyId === undefined
          || role.counterpartyId === normalizedCounterpartyId
        )
        .sort((a, b) =>
          a.counterpartyId.localeCompare(b.counterpartyId)
          || a.roleCode.localeCompare(b.roleCode)
        );
    },

    has(contextId, counterpartyId, code) {
      return this.list(contextId, counterpartyId)
        .some(role => role.roleCode === code);
    },

    assign(input) {
      const normalizedContextId = required(
        input.contextId,
        "COUNTERPARTY_CONTEXT_REQUIRED"
      );
      const normalizedCounterpartyId = required(
        input.counterpartyId,
        "COUNTERPARTY_ID_REQUIRED"
      );
      const normalizedCode = roleCode(input.roleCode);
      if (!counterparties.get(
        normalizedContextId,
        normalizedCounterpartyId
      )) {
        throw new Error("COUNTERPARTY_NOT_FOUND");
      }
      const role = assertRole({
        contractVersion: "0.1.0",
        roleId: roleId(normalizedCounterpartyId, normalizedCode),
        counterpartyId: normalizedCounterpartyId,
        roleCode: normalizedCode
      });
      const saved = resources.put({
        ...address(
          normalizedContextId,
          normalizedCounterpartyId,
          normalizedCode
        ),
        schemaRef: COUNTERPARTY_ROLE_SCHEMA_V010,
        ownerPackageId: "evo-counterparty",
        storageKind: "DOCUMENT",
        payload: payloadOf(role),
        metadata: {
          counterpartyId: normalizedCounterpartyId,
          roleCode: normalizedCode
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return roleFromPayload(saved.payload);
    },

    assignMany(input) {
      const contextId = required(
        input.contextId,
        "COUNTERPARTY_CONTEXT_REQUIRED"
      );
      const assignments = input.assignments.map(item => ({
        counterpartyId: required(
          item.counterpartyId,
          "COUNTERPARTY_ID_REQUIRED"
        ),
        roleCode: roleCode(item.roleCode)
      }));
      const seen = new Set<string>();
      const roles = assignments.map(item => {
        if (!counterparties.get(contextId, item.counterpartyId)) {
          throw new Error("COUNTERPARTY_NOT_FOUND");
        }
        const key = item.counterpartyId + "|" + item.roleCode;
        if (seen.has(key)) {
          throw new Error("COUNTERPARTY_ROLE_DUPLICATE_IN_BATCH");
        }
        seen.add(key);
        return assertRole({
          contractVersion: "0.1.0",
          roleId: roleId(item.counterpartyId, item.roleCode),
          counterpartyId: item.counterpartyId,
          roleCode: item.roleCode
        });
      });
      if (!resources.putMany) {
        return roles.map(role => this.assign({
          contextId,
          counterpartyId: role.counterpartyId,
          roleCode: role.roleCode,
          actorSubjectId: input.actorSubjectId,
          recordedAt: input.recordedAt
        }));
      }
      const saved = resources.putMany(roles.map(role => ({
        ...address(contextId, role.counterpartyId, role.roleCode),
        schemaRef: COUNTERPARTY_ROLE_SCHEMA_V010,
        ownerPackageId: "evo-counterparty",
        storageKind: "DOCUMENT" as const,
        payload: payloadOf(role),
        metadata: {
          counterpartyId: role.counterpartyId,
          roleCode: role.roleCode
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      })));
      return saved.map(resource => roleFromPayload(resource.payload));
    },

    archive(input) {
      const normalizedContextId = required(
        input.contextId,
        "COUNTERPARTY_CONTEXT_REQUIRED"
      );
      const normalizedCounterpartyId = required(
        input.counterpartyId,
        "COUNTERPARTY_ID_REQUIRED"
      );
      const normalizedCode = roleCode(input.roleCode);
      const roleAddress = address(
        normalizedContextId,
        normalizedCounterpartyId,
        normalizedCode
      );
      const current = resources.get(roleAddress);
      if (!current || current.lifecycleState !== "ACTIVE") {
        throw new Error("COUNTERPARTY_ROLE_NOT_ACTIVE");
      }
      const role = roleFromPayload(current.payload);
      resources.archive({
        address: roleAddress,
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return role;
    }
  };
}
