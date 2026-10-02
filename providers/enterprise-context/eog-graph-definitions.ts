import type {
  BusinessDefinitionAttributionV010,
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import {
  BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010
} from "../../contracts/enterprise-business-definition.js";
import type {
  EogOperationActorV010,
  EnterpriseOperatingGraphV010
} from "../../contracts/enterprise-operating-graph.js";
import {
  validateEnterpriseOperatingGraphV010
} from "../../manager/enterprise-operating-graph-model.js";

interface EnterpriseOperatingGraphDefinitionPayloadV010 {
  graphContractVersion: "0.1.0";
  nodes: EnterpriseOperatingGraphV010["nodes"];
  guidanceRelations: EnterpriseOperatingGraphV010["guidanceRelations"];
  enterpriseRelations: EnterpriseOperatingGraphV010["enterpriseRelations"];
}

export interface EnterpriseOperatingGraphDefinitionPersistenceV010 {
  create(input: {
    graph: EnterpriseOperatingGraphV010;
    actor: EogOperationActorV010;
  }): EnterpriseOperatingGraphV010;
  replace(input: {
    current: EnterpriseOperatingGraphV010;
    next: EnterpriseOperatingGraphV010;
    actor: EogOperationActorV010;
  }): EnterpriseOperatingGraphV010;
  get(input: {
    enterpriseId: string;
    graphId: string;
  }): EnterpriseOperatingGraphV010 | undefined;
  listByEnterprise(input: {
    enterpriseId: string;
  }): EnterpriseOperatingGraphV010[];
}

function actor(
  value: EogOperationActorV010
): BusinessDefinitionAttributionV010 {
  return {
    actorType: value.type === "HUMAN" ? "HUMAN" : "AI",
    subjectId: value.subjectId
  };
}

function payload(
  graph: EnterpriseOperatingGraphV010
): EnterpriseOperatingGraphDefinitionPayloadV010 {
  return {
    graphContractVersion: "0.1.0",
    nodes: structuredClone(graph.nodes),
    guidanceRelations: structuredClone(graph.guidanceRelations),
    enterpriseRelations: structuredClone(graph.enterpriseRelations)
  };
}

function title(graphId: string): string {
  return "Enterprise Operating Graph " + graphId;
}

function fromRevision(
  revision: BusinessDefinitionRevisionV010
): EnterpriseOperatingGraphV010 {
  if (
    revision.kind !== BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010
    || revision.payload?.graphContractVersion !== "0.1.0"
    || !Array.isArray(revision.payload.nodes)
    || !Array.isArray(revision.payload.guidanceRelations)
    || !Array.isArray(revision.payload.enterpriseRelations)
  ) {
    throw new Error("EOG_BUSINESS_DEFINITION_INVALID");
  }

  const graph: EnterpriseOperatingGraphV010 = {
    contractVersion: "0.1.0",
    graphId: revision.definitionId,
    enterpriseId: revision.enterpriseId,
    state: revision.state,
    revision: revision.revision,
    nodes: structuredClone(
      revision.payload.nodes
    ) as EnterpriseOperatingGraphV010["nodes"],
    guidanceRelations: structuredClone(
      revision.payload.guidanceRelations
    ) as EnterpriseOperatingGraphV010["guidanceRelations"],
    enterpriseRelations: structuredClone(
      revision.payload.enterpriseRelations
    ) as EnterpriseOperatingGraphV010["enterpriseRelations"],
    createdAt: revision.definitionCreatedAt,
    updatedAt: revision.recordedAt,
    ...(revision.state === "PUBLISHED"
      ? { publishedAt: revision.publishedAt }
      : {})
  };

  const validation = validateEnterpriseOperatingGraphV010(graph);
  if (validation.issues.length > 0) {
    throw new Error(
      "EOG_BUSINESS_DEFINITION_INVALID:"
      + validation.issues.map(item => item.code).join(",")
    );
  }
  return graph;
}

function assertCurrentMatches(
  current: EnterpriseOperatingGraphV010,
  revision: BusinessDefinitionRevisionV010 | undefined
): void {
  if (!revision) throw new Error("EOG_GRAPH_NOT_FOUND");
  const persisted = fromRevision(revision);
  if (
    persisted.graphId !== current.graphId
    || persisted.enterpriseId !== current.enterpriseId
    || persisted.revision !== current.revision
    || persisted.state !== current.state
  ) {
    throw new Error("EOG_DEFINITION_REVISION_CONFLICT");
  }
}

export function createEnterpriseOperatingGraphDefinitionPersistenceV010(
  repository: BusinessDefinitionRepositoryV010
): EnterpriseOperatingGraphDefinitionPersistenceV010 {
  return {
    create(input) {
      const graph = structuredClone(input.graph);
      if (graph.state !== "DRAFT" || graph.revision !== 0) {
        throw new Error("EOG_DEFINITION_CREATE_INVALID");
      }
      const validation = validateEnterpriseOperatingGraphV010(graph);
      if (validation.issues.length > 0) {
        throw new Error("EOG_GRAPH_INVALID");
      }
      const revision = repository.createDraft({
        enterpriseId: graph.enterpriseId,
        definitionId: graph.graphId,
        kind: BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010,
        title: title(graph.graphId),
        payload: payload(graph) as unknown as Record<string, unknown>,
        actor: actor(input.actor),
        recordedAt: graph.createdAt
      });
      return fromRevision(revision);
    },

    replace(input) {
      const current = structuredClone(input.current);
      const next = structuredClone(input.next);
      if (
        current.graphId !== next.graphId
        || current.enterpriseId !== next.enterpriseId
        || next.revision !== current.revision + 1
      ) {
        throw new Error("EOG_DEFINITION_REPLACEMENT_INVALID");
      }
      const validation = validateEnterpriseOperatingGraphV010(next);
      if (validation.issues.length > 0) {
        throw new Error("EOG_GRAPH_INVALID");
      }
      const latest = repository.getLatest({
        enterpriseId: current.enterpriseId,
        definitionId: current.graphId
      });
      assertCurrentMatches(current, latest);

      if (next.state === "PUBLISHED") {
        if (
          current.state !== "DRAFT"
          || next.publishedAt !== next.updatedAt
          || JSON.stringify(payload(current)) !== JSON.stringify(payload(next))
        ) {
          throw new Error("EOG_DEFINITION_PUBLISH_INVALID");
        }
        const revision = repository.publish({
          enterpriseId: next.enterpriseId,
          definitionId: next.graphId,
          expectedRevision: current.revision,
          actor: actor(input.actor),
          recordedAt: next.updatedAt
        });
        return fromRevision(revision);
      }

      if (current.state !== "DRAFT" || next.state !== "DRAFT") {
        throw new Error("EOG_PUBLISHED_IMMUTABLE");
      }
      const revision = repository.reviseDraft({
        enterpriseId: next.enterpriseId,
        definitionId: next.graphId,
        expectedRevision: current.revision,
        title: title(next.graphId),
        payload: payload(next) as unknown as Record<string, unknown>,
        actor: actor(input.actor),
        recordedAt: next.updatedAt
      });
      return fromRevision(revision);
    },

    get(input) {
      const revision = repository.getLatest({
        enterpriseId: input.enterpriseId,
        definitionId: input.graphId
      });
      if (
        !revision
        || revision.kind !== BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010
      ) {
        return undefined;
      }
      return fromRevision(revision);
    },

    listByEnterprise(input) {
      return repository.listLatest({
        enterpriseId: input.enterpriseId,
        kind: BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010
      })
        .map(fromRevision)
        .sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
          || a.graphId.localeCompare(b.graphId)
        );
    }
  };
}
