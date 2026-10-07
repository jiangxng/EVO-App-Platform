import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  RESPONSIBILITY_PACKAGE_ID
} from "./constants.js";

export const RESPONSIBILITY_NAMESPACE_V010 =
  "evo.responsibility" as const;
export const RESPONSIBILITY_COLLECTION_V010 =
  "assignments" as const;
export const RESPONSIBILITY_RESOURCE_TYPE_V010 =
  "responsibility.assignment" as const;
export const RESPONSIBILITY_SCHEMA_V010 =
  "evo.responsibility.assignment/0.1.0" as const;

export type ResponsibilityAssigneeKindV010 =
  | "PRINCIPAL"
  | "POSITION"
  | "ORGANIZATION";

export interface ResponsibilityTargetRefV010 {
  objectType: string;
  objectId: string;
}

export interface ResponsibilityAssigneeRefV010 {
  kind: ResponsibilityAssigneeKindV010;
  id: string;
}

export interface ResponsibilityAssignmentV010 {
  contractVersion: "0.1.0";
  assignmentId: string;
  targetRef: ResponsibilityTargetRefV010;
  responsibilityType: string;
  assigneeRef: ResponsibilityAssigneeRefV010;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "ACTIVE";
}

export interface ResponsibilityRepositoryV010 {
  list(
    contextId: string,
    filter?: {
      objectType?: string;
      objectId?: string;
      responsibilityType?: string;
      assigneeKind?: ResponsibilityAssigneeKindV010;
      assigneeId?: string;
    }
  ): ResponsibilityAssignmentV010[];
  get(
    contextId: string,
    assignmentId: string
  ): ResponsibilityAssignmentV010 | undefined;
  assign(input: {
    contextId: string;
    targetRef: ResponsibilityTargetRefV010;
    responsibilityType: string;
    assigneeRef: ResponsibilityAssigneeRefV010;
    effectiveFrom: string;
    actorSubjectId: string;
  }): ResponsibilityAssignmentV010;
  archive(input: {
    contextId: string;
    assignmentId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): ResponsibilityAssignmentV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function assigneeKind(
  value: string
): ResponsibilityAssigneeKindV010 {
  const normalized = required(
    value,
    "RESPONSIBILITY_ASSIGNEE_KIND_REQUIRED"
  ).toUpperCase();
  if (!["PRINCIPAL", "POSITION", "ORGANIZATION"].includes(normalized)) {
    throw new Error("RESPONSIBILITY_ASSIGNEE_KIND_INVALID");
  }
  return normalized as ResponsibilityAssigneeKindV010;
}

export function responsibilityAssignmentIdV010(input: {
  targetRef: ResponsibilityTargetRefV010;
  responsibilityType: string;
  assigneeRef: ResponsibilityAssigneeRefV010;
}): string {
  return [
    input.targetRef.objectType,
    input.targetRef.objectId,
    input.responsibilityType,
    input.assigneeRef.kind,
    input.assigneeRef.id
  ].map(value => encodeURIComponent(required(
    value,
    "RESPONSIBILITY_ASSIGNMENT_ID_PART_REQUIRED"
  ))).join("::");
}

function assertAssignment(
  value: ResponsibilityAssignmentV010
): ResponsibilityAssignmentV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("RESPONSIBILITY_CONTRACT_VERSION_INVALID");
  }
  const targetRef = {
    objectType: required(
      value.targetRef?.objectType,
      "RESPONSIBILITY_TARGET_OBJECT_TYPE_REQUIRED"
    ),
    objectId: required(
      value.targetRef?.objectId,
      "RESPONSIBILITY_TARGET_OBJECT_ID_REQUIRED"
    )
  };
  const normalizedType = required(
    value.responsibilityType,
    "RESPONSIBILITY_TYPE_REQUIRED"
  );
  const assigneeRef = {
    kind: assigneeKind(value.assigneeRef?.kind),
    id: required(
      value.assigneeRef?.id,
      "RESPONSIBILITY_ASSIGNEE_ID_REQUIRED"
    )
  };
  const expectedId = responsibilityAssignmentIdV010({
    targetRef,
    responsibilityType: normalizedType,
    assigneeRef
  });
  if (value.assignmentId !== expectedId) {
    throw new Error("RESPONSIBILITY_ASSIGNMENT_ID_INVALID");
  }
  if (value.status !== "ACTIVE") {
    throw new Error("RESPONSIBILITY_STATUS_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    assignmentId: expectedId,
    targetRef,
    responsibilityType: normalizedType,
    assigneeRef,
    effectiveFrom: required(
      value.effectiveFrom,
      "RESPONSIBILITY_EFFECTIVE_FROM_REQUIRED"
    ),
    ...(value.effectiveTo
      ? {
          effectiveTo: required(
            value.effectiveTo,
            "RESPONSIBILITY_EFFECTIVE_TO_INVALID"
          )
        }
      : {}),
    status: "ACTIVE"
  };
}

function payloadOf(
  assignment: ResponsibilityAssignmentV010
): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(assignment)) as EnterpriseResourceJsonV010;
}

function fromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): ResponsibilityAssignmentV010 {
  if (
    payload === null
    || typeof payload !== "object"
    || Array.isArray(payload)
  ) {
    throw new Error("RESPONSIBILITY_RESOURCE_PAYLOAD_INVALID");
  }
  return assertAssignment(
    payload as unknown as ResponsibilityAssignmentV010
  );
}

export function createResponsibilityRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): ResponsibilityRepositoryV010 {
  const address = (contextId: string, assignmentId: string) => ({
    contextId: required(
      contextId,
      "RESPONSIBILITY_CONTEXT_REQUIRED"
    ),
    namespace: RESPONSIBILITY_NAMESPACE_V010,
    collectionId: RESPONSIBILITY_COLLECTION_V010,
    resourceType: RESPONSIBILITY_RESOURCE_TYPE_V010,
    resourceId: required(
      assignmentId,
      "RESPONSIBILITY_ASSIGNMENT_ID_REQUIRED"
    )
  });

  return {
    list(contextId, filter = {}) {
      const normalizedContextId = required(
        contextId,
        "RESPONSIBILITY_CONTEXT_REQUIRED"
      );
      return resources.list({
        contextId: normalizedContextId,
        namespace: RESPONSIBILITY_NAMESPACE_V010,
        collectionId: RESPONSIBILITY_COLLECTION_V010,
        resourceType: RESPONSIBILITY_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => fromPayload(resource.payload))
        .filter(item =>
          (!filter.objectType
            || item.targetRef.objectType === filter.objectType)
          && (!filter.objectId
            || item.targetRef.objectId === filter.objectId)
          && (!filter.responsibilityType
            || item.responsibilityType === filter.responsibilityType)
          && (!filter.assigneeKind
            || item.assigneeRef.kind === filter.assigneeKind)
          && (!filter.assigneeId
            || item.assigneeRef.id === filter.assigneeId)
        )
        .sort((a, b) =>
          a.targetRef.objectType.localeCompare(b.targetRef.objectType)
          || a.targetRef.objectId.localeCompare(b.targetRef.objectId)
          || a.responsibilityType.localeCompare(b.responsibilityType)
          || a.assigneeRef.kind.localeCompare(b.assigneeRef.kind)
          || a.assigneeRef.id.localeCompare(b.assigneeRef.id)
        );
    },

    get(contextId, assignmentId) {
      const resource = resources.get(address(contextId, assignmentId));
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return fromPayload(resource.payload);
    },

    assign(input) {
      const targetRef = {
        objectType: required(
          input.targetRef.objectType,
          "RESPONSIBILITY_TARGET_OBJECT_TYPE_REQUIRED"
        ),
        objectId: required(
          input.targetRef.objectId,
          "RESPONSIBILITY_TARGET_OBJECT_ID_REQUIRED"
        )
      };
      const responsibilityType = required(
        input.responsibilityType,
        "RESPONSIBILITY_TYPE_REQUIRED"
      );
      const normalizedAssigneeRef = {
        kind: assigneeKind(input.assigneeRef.kind),
        id: required(
          input.assigneeRef.id,
          "RESPONSIBILITY_ASSIGNEE_ID_REQUIRED"
        )
      };
      const assignment = assertAssignment({
        contractVersion: "0.1.0",
        assignmentId: responsibilityAssignmentIdV010({
          targetRef,
          responsibilityType,
          assigneeRef: normalizedAssigneeRef
        }),
        targetRef,
        responsibilityType,
        assigneeRef: normalizedAssigneeRef,
        effectiveFrom: required(
          input.effectiveFrom,
          "RESPONSIBILITY_EFFECTIVE_FROM_REQUIRED"
        ),
        status: "ACTIVE"
      });
      const saved = resources.put({
        ...address(input.contextId, assignment.assignmentId),
        schemaRef: RESPONSIBILITY_SCHEMA_V010,
        ownerPackageId: RESPONSIBILITY_PACKAGE_ID,
        storageKind: "DOCUMENT",
        payload: payloadOf(assignment),
        metadata: {
          targetObjectType: assignment.targetRef.objectType,
          targetObjectId: assignment.targetRef.objectId,
          responsibilityType: assignment.responsibilityType,
          assigneeKind: assignment.assigneeRef.kind,
          assigneeId: assignment.assigneeRef.id
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.effectiveFrom
      });
      return fromPayload(saved.payload);
    },

    archive(input) {
      const current = this.get(input.contextId, input.assignmentId);
      if (!current) throw new Error("RESPONSIBILITY_ASSIGNMENT_NOT_ACTIVE");
      resources.archive({
        address: address(input.contextId, input.assignmentId),
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return current;
    }
  };
}
