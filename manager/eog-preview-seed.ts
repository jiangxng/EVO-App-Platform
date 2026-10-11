import type {
  EnterpriseOperatingGraphHostServiceV010
} from "../apps/eog-2d-designer/enterprise-operating-graph-service.js";
import type {
  EogNodeBindingV010,
  EogApplicationLedgerGuidanceRelationV010
} from "../contracts/enterprise-operating-graph.js";

export interface EogPreviewSeedV010 {
  enterpriseId: string;
  graphId: string;
  nodes: EogNodeBindingV010[];
  guidanceRelations?: EogApplicationLedgerGuidanceRelationV010[];
}

function required(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function parseEogPreviewSeedV010(
  raw: string | undefined
): EogPreviewSeedV010 | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as Partial<EogPreviewSeedV010>;
  const enterpriseId = required(
    parsed.enterpriseId,
    "EOG_PREVIEW_SEED_ENTERPRISE_ID_REQUIRED"
  );
  const graphId = required(
    parsed.graphId,
    "EOG_PREVIEW_SEED_GRAPH_ID_REQUIRED"
  );
  if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    throw new Error("EOG_PREVIEW_SEED_NODES_REQUIRED");
  }
  if (
    parsed.guidanceRelations !== undefined
    && !Array.isArray(parsed.guidanceRelations)
  ) {
    throw new Error("EOG_PREVIEW_SEED_RELATIONS_INVALID");
  }
  return {
    enterpriseId,
    graphId,
    nodes: structuredClone(parsed.nodes),
    ...(parsed.guidanceRelations === undefined
      ? {}
      : { guidanceRelations: structuredClone(parsed.guidanceRelations) })
  };
}

export function applyEogPreviewSeedV010(input: {
  service: EnterpriseOperatingGraphHostServiceV010;
  seed: EogPreviewSeedV010 | undefined;
  occurredAt?: string;
}): { seeded: boolean; graphId?: string } {
  if (!input.seed) return { seeded: false };

  const { service, seed } = input;
  try {
    service.get({
      enterpriseId: seed.enterpriseId,
      graphId: seed.graphId
    });
    return { seeded: false, graphId: seed.graphId };
  } catch (error) {
    if (
      !(error instanceof Error)
      || error.message !== "EOG_GRAPH_NOT_FOUND"
    ) {
      throw error;
    }
  }

  const actor = {
    type: "AGENT" as const,
    subjectId: "agent:eog-preview-seed"
  };
  let graph = service.create({
    enterpriseId: seed.enterpriseId,
    graphId: seed.graphId,
    actor,
    ...(input.occurredAt ? { occurredAt: input.occurredAt } : {})
  });

  for (const node of seed.nodes) {
    graph = service.apply({
      enterpriseId: seed.enterpriseId,
      graphId: seed.graphId,
      expectedRevision: graph.revision,
      mutation: {
        type: "NODE_BIND",
        node: structuredClone(node)
      },
      actor,
      ...(input.occurredAt ? { occurredAt: input.occurredAt } : {})
    });
  }

  for (const relation of seed.guidanceRelations ?? []) {
    graph = service.apply({
      enterpriseId: seed.enterpriseId,
      graphId: seed.graphId,
      expectedRevision: graph.revision,
      mutation: {
        type: "GUIDANCE_RELATION_PUT",
        relation: structuredClone(relation)
      },
      actor,
      ...(input.occurredAt ? { occurredAt: input.occurredAt } : {})
    });
  }

  return { seeded: true, graphId: graph.graphId };
}
