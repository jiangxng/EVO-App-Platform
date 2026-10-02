import { existsSync, readFileSync } from "node:fs";
import type {
  BusinessDefinitionRepositoryMigrationV010,
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import {
  BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010
} from "../../contracts/enterprise-business-definition.js";
import type {
  EnterpriseOperatingGraphV010
} from "../../contracts/enterprise-operating-graph.js";
import type {
  EnterpriseOperatingGraphStoreSnapshotV010
} from "./enterprise-operating-graph-store.js";
import {
  validateEnterpriseOperatingGraphV010
} from "./enterprise-operating-graph-model.js";

export interface LegacyEogGraphMigrationResultV010 {
  sourcePresent: boolean;
  examined: number;
  imported: number;
  alreadyPresent: number;
}

type MigrationRepository =
  BusinessDefinitionRepositoryV010
  & BusinessDefinitionRepositoryMigrationV010;

function revision(
  graph: EnterpriseOperatingGraphV010
): BusinessDefinitionRevisionV010 {
  const validation = validateEnterpriseOperatingGraphV010(graph);
  if (validation.issues.length > 0) {
    throw new Error(
      "BUSINESS_DEFINITION_LEGACY_EOG_GRAPH_INVALID:"
      + validation.issues.map(item => item.code).join(",")
    );
  }
  return {
    contractVersion: "0.1.0",
    definitionId: graph.graphId,
    enterpriseId: graph.enterpriseId,
    kind: BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010,
    revision: graph.revision,
    state: graph.state,
    title: "Enterprise Operating Graph " + graph.graphId,
    payload: {
      graphContractVersion: "0.1.0",
      nodes: structuredClone(graph.nodes),
      guidanceRelations: structuredClone(graph.guidanceRelations),
      enterpriseRelations: structuredClone(graph.enterpriseRelations)
    },
    definitionCreatedAt: graph.createdAt,
    recordedAt: graph.updatedAt,
    recordedBy: {
      actorType: "SERVICE",
      subjectId: "migration:eog-semantic-store"
    },
    ...(graph.state === "PUBLISHED"
      ? {
          publishedAt: graph.publishedAt,
          publishedBySubjectId:
            "migration:eog-semantic-publisher-unavailable"
        }
      : {}),
    origin: {
      type: "MIGRATED",
      sourceRef: "legacy:eog-semantic-store",
      historyComplete: graph.revision === 0
    }
  };
}

export function migrateLegacyEnterpriseOperatingGraphSnapshotV010(input: {
  snapshot: EnterpriseOperatingGraphStoreSnapshotV010;
  repository: MigrationRepository;
}): LegacyEogGraphMigrationResultV010 {
  if (
    input.snapshot?.contractVersion !== "0.1.0"
    || !Array.isArray(input.snapshot.graphs)
  ) {
    throw new Error(
      "BUSINESS_DEFINITION_LEGACY_EOG_GRAPH_SNAPSHOT_INVALID"
    );
  }

  let imported = 0;
  let alreadyPresent = 0;
  for (const graph of input.snapshot.graphs) {
    const next = revision(graph);
    const history = input.repository.listHistory({
      enterpriseId: next.enterpriseId,
      definitionId: next.definitionId
    });
    const existing = history.find(item => item.revision === next.revision);
    if (existing) {
      if (
        existing.kind !== next.kind
        || JSON.stringify(existing.payload) !== JSON.stringify(next.payload)
        || existing.state !== next.state
      ) {
        throw new Error("BUSINESS_DEFINITION_MIGRATION_CONFLICT");
      }
      alreadyPresent += 1;
      continue;
    }
    if (history.some(item => item.revision > next.revision)) {
      throw new Error("BUSINESS_DEFINITION_MIGRATION_HISTORY_GAP");
    }
    input.repository.importRevision(next);
    imported += 1;
  }

  return {
    sourcePresent: true,
    examined: input.snapshot.graphs.length,
    imported,
    alreadyPresent
  };
}

export function migrateLegacyEnterpriseOperatingGraphsV010(input: {
  path: string | undefined;
  repository: MigrationRepository;
}): LegacyEogGraphMigrationResultV010 {
  if (!input.path || !existsSync(input.path)) {
    return {
      sourcePresent: false,
      examined: 0,
      imported: 0,
      alreadyPresent: 0
    };
  }

  const snapshot = JSON.parse(
    readFileSync(input.path, "utf8")
  ) as EnterpriseOperatingGraphStoreSnapshotV010;

  return migrateLegacyEnterpriseOperatingGraphSnapshotV010({
    snapshot,
    repository: input.repository
  });
}
