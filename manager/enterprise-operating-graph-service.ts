import { randomUUID } from "node:crypto";
import type {
  EogNodeBindingV010,
  EogApplicationLedgerGuidanceRelationV010,
  EnterpriseOperatingGraphOperationV010,
  EnterpriseOperatingGraphV010
} from "../contracts/enterprise-operating-graph.js";
import {
  applyEnterpriseOperatingGraphOperationV010,
  createEnterpriseOperatingGraphV010,
  validateEnterpriseOperatingGraphV010
} from "./enterprise-operating-graph-model.js";
import type {
  EnterpriseOperatingGraphStoreV010
} from "./enterprise-operating-graph-store.js";
import type {
  EnterpriseOperatingGraphDefinitionPersistenceV010
} from "../providers/enterprise-context/eog-graph-definitions.js";

export type EnterpriseOperatingGraphMutationV010 =
  | {
      type: "NODE_BIND";
      node: EogNodeBindingV010;
    }
  | {
      type: "NODE_REMOVE";
      nodeId: string;
    }
  | {
      type: "GUIDANCE_RELATION_PUT";
      relation: EogApplicationLedgerGuidanceRelationV010;
    }
  | {
      type: "GUIDANCE_RELATION_REMOVE";
      relationId: string;
    }
  | {
      type: "ENTERPRISE_RELATION_CONFIRM";
      enterpriseRelationId: string;
      applicationNodeId: string;
      ledgerNodeId: string;
      guidanceRelationId?: string;
    }
  | {
      type: "ENTERPRISE_RELATION_REMOVE";
      relationId: string;
    }
  | {
      type: "PUBLISH";
    };

export interface EnterpriseOperatingGraphHostServiceV010 {
  create(input: {
    enterpriseId: string;
    graphId?: string;
    actor?: {
      type: "HUMAN" | "AGENT";
      subjectId: string;
    };
    occurredAt?: string;
  }): EnterpriseOperatingGraphV010;
  get(input: {
    enterpriseId: string;
    graphId: string;
  }): EnterpriseOperatingGraphV010;
  list(input: {
    enterpriseId: string;
  }): EnterpriseOperatingGraphV010[];
  apply(input: {
    enterpriseId: string;
    graphId: string;
    expectedRevision: number;
    mutation: EnterpriseOperatingGraphMutationV010;
    actor: {
      type: "HUMAN" | "AGENT";
      subjectId: string;
    };
    operationId?: string;
    occurredAt?: string;
  }): EnterpriseOperatingGraphV010;
  validate(input: {
    enterpriseId: string;
    graphId: string;
  }): ReturnType<typeof validateEnterpriseOperatingGraphV010>;
}

function required(value: string, code: string): string {
  if (!value?.trim()) throw new Error(code);
  return value.trim();
}

export function createEnterpriseOperatingGraphHostServiceV010(input: {
  store?: EnterpriseOperatingGraphStoreV010;
  persistence?: EnterpriseOperatingGraphDefinitionPersistenceV010;
  id?: () => string;
  now?: () => Date;
}): EnterpriseOperatingGraphHostServiceV010 {
  if ((input.store === undefined) === (input.persistence === undefined)) {
    throw new Error("EOG_PERSISTENCE_CONFIGURATION_INVALID");
  }

  const id = input.id ?? randomUUID;
  const now = input.now ?? (() => new Date());

  const scopedGraph = (
    enterpriseId: string,
    graphId: string
  ): EnterpriseOperatingGraphV010 => {
    const normalizedEnterpriseId = required(
      enterpriseId,
      "EOG_ENTERPRISE_ID_REQUIRED"
    );
    const normalizedGraphId = required(graphId, "EOG_GRAPH_ID_REQUIRED");
    const graph = input.persistence
      ? input.persistence.get({
          enterpriseId: normalizedEnterpriseId,
          graphId: normalizedGraphId
        })
      : input.store!.get(normalizedGraphId);
    if (
      !graph
      || graph.enterpriseId !== normalizedEnterpriseId
    ) {
      throw new Error("EOG_GRAPH_NOT_FOUND");
    }
    return graph;
  };

  return {
    create(request) {
      const enterpriseId = required(
        request.enterpriseId,
        "EOG_ENTERPRISE_ID_REQUIRED"
      );
      const occurredAt = request.occurredAt ?? now().toISOString();
      const graph = createEnterpriseOperatingGraphV010({
        graphId: request.graphId?.trim() || "eog:" + id(),
        enterpriseId,
        createdAt: occurredAt
      });
      if (input.persistence) {
        return input.persistence.create({
          graph,
          actor: request.actor
            ? {
                type: request.actor.type,
                subjectId: required(
                  request.actor.subjectId,
                  "EOG_OPERATION_ACTOR_REQUIRED"
                )
              }
            : {
                type: "SERVICE",
                subjectId: "service:eog-host"
              }
        });
      }
      return input.store!.create(graph);
    },

    get(request) {
      return scopedGraph(request.enterpriseId, request.graphId);
    },

    list(request) {
      const enterpriseId = required(
        request.enterpriseId,
        "EOG_ENTERPRISE_ID_REQUIRED"
      );
      return input.persistence
        ? input.persistence.listByEnterprise({ enterpriseId })
        : input.store!.listByEnterprise(enterpriseId);
    },

    apply(request) {
      const graph = scopedGraph(request.enterpriseId, request.graphId);
      const occurredAt = request.occurredAt ?? now().toISOString();
      const operation = {
        contractVersion: "0.1.0" as const,
        operationId: request.operationId?.trim() || "eog-operation:" + id(),
        graphId: graph.graphId,
        expectedRevision: request.expectedRevision,
        actor: {
          type: request.actor.type,
          subjectId: required(
            request.actor.subjectId,
            "EOG_OPERATION_ACTOR_REQUIRED"
          )
        },
        occurredAt,
        ...structuredClone(request.mutation)
      } as EnterpriseOperatingGraphOperationV010;

      const next = applyEnterpriseOperatingGraphOperationV010(
        graph,
        operation
      );
      if (input.persistence) {
        return input.persistence.replace({
          current: graph,
          next,
          actor: operation.actor
        });
      }
      return input.store!.replace(next);
    },

    validate(request) {
      return validateEnterpriseOperatingGraphV010(
        scopedGraph(request.enterpriseId, request.graphId)
      );
    }
  };
}
