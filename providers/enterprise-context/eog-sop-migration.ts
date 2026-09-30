import { existsSync, readFileSync } from "node:fs";
import type {
  BusinessDefinitionRepositoryMigrationV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import {
  BUSINESS_DEFINITION_KIND_SOP_V010
} from "../../contracts/enterprise-business-definition.js";
import type {
  EogExpectedSopSnapshotV010,
  EogExpectedSopTransitionV010,
  EogExpectedSopV010
} from "../../contracts/enterprise-operating-graph-sop.js";

export interface LegacyEogSopMigrationResultV010 {
  sourcePresent: boolean;
  examined: number;
  imported: number;
  alreadyPresent: number;
}

function linearTransitions(
  sop: Pick<EogExpectedSopV010, "steps">
): EogExpectedSopTransitionV010[] {
  const result: EogExpectedSopTransitionV010[] = [];
  for (let index = 0; index + 1 < sop.steps.length; index += 1) {
    result.push({
      transitionId: "transition:" + (index + 1),
      fromApplicationNodeId: sop.steps[index]!.applicationNodeId,
      toApplicationNodeId: sop.steps[index + 1]!.applicationNodeId,
      kind: "EXPECTED"
    });
  }
  return result;
}

function toRevision(
  sop: EogExpectedSopV010
): BusinessDefinitionRevisionV010 {
  const transitions = Array.isArray(sop.transitions)
    ? structuredClone(sop.transitions)
    : linearTransitions(sop);

  return {
    contractVersion: "0.1.0",
    definitionId: sop.sopId,
    enterpriseId: sop.enterpriseId,
    kind: BUSINESS_DEFINITION_KIND_SOP_V010,
    revision: sop.revision,
    state: sop.state,
    title: sop.title,
    payload: {
      graphId: sop.graphId,
      steps: structuredClone(sop.steps),
      transitions
    },
    definitionCreatedAt: sop.createdAt,
    recordedAt: sop.updatedAt,
    recordedBy: {
      actorType: "SERVICE",
      subjectId: "migration:eog-expected-sop"
    },
    ...(sop.state === "PUBLISHED"
      ? {
          publishedAt: sop.publishedAt,
          publishedBySubjectId: sop.publishedBySubjectId
        }
      : {}),
    origin: {
      type: "MIGRATED",
      sourceRef: "legacy:eog-expected-sops",
      historyComplete: sop.revision === 0
    }
  };
}

export function migrateLegacyEogSopsV010(input: {
  path: string | undefined;
  repository: BusinessDefinitionRepositoryMigrationV010;
}): LegacyEogSopMigrationResultV010 {
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
  ) as EogExpectedSopSnapshotV010;

  if (
    snapshot?.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.sops)
  ) {
    throw new Error("BUSINESS_DEFINITION_LEGACY_SOP_SNAPSHOT_INVALID");
  }

  let imported = 0;
  let alreadyPresent = 0;
  for (const sop of snapshot.sops) {
    const revision = toRevision(sop);
    try {
      input.repository.importRevision(revision);
      imported += 1;
    } catch (error) {
      if (
        error instanceof Error
        && error.message === "BUSINESS_DEFINITION_MIGRATION_CONFLICT"
      ) {
        throw error;
      }
      throw error;
    }
  }

  return {
    sourcePresent: true,
    examined: snapshot.sops.length,
    imported,
    alreadyPresent
  };
}
