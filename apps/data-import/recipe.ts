import { createHash } from "node:crypto";
import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  FoundationObjectImportTargetParametersV010
} from "../../contracts/foundation-object/import.js";
import type {
  EffectiveObjectSchemaV010
} from "../../contracts/foundation-object/schema.js";
import {
  type DataImportMappingV010,
  type DataImportSourceV010
} from "./types.js";

export const DATA_IMPORT_RECIPE_COLLECTION_V010 = "recipes" as const;
export const DATA_IMPORT_RECIPE_RESOURCE_TYPE_V010 =
  "data-import.recipe" as const;
export const DATA_IMPORT_RECIPE_SCHEMA_V010 =
  "evo.data-import.recipe/0.1.0" as const;

export interface DataImportRecipeV010 {
  contractVersion: "0.1.0";
  recipeId: string;
  targetId: string;
  targetParameters?: FoundationObjectImportTargetParametersV010;
  sourceFingerprint: string;
  sourceHeaders: string[];
  targetSchemaDigest: string;
  mapping: DataImportMappingV010[];
  createdAt: string;
  createdBySubjectId: string;
  updatedAt: string;
  updatedBySubjectId: string;
  /**
   * Human-confirmed mappings are eligible for automatic same-structure reuse
   * after a successful dry run. A later successful commit adds stronger
   * business-outcome evidence without being required merely to remember the
   * Human's field mapping.
   */
  confirmedAt?: string;
  confirmedBySubjectId?: string;
  lastValidatedImportJobId?: string;
  lastSuccessfulImportJobId?: string;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function normalizedHeader(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_\-\/()[\]{}.:：]+/gu, "");
}

export function dataImportSourceFingerprintV010(input: {
  targetId: string;
  targetParameters?: FoundationObjectImportTargetParametersV010;
  source: Pick<DataImportSourceV010, "headers">;
}): string {
  return digest({
    targetId: required(input.targetId, "DATA_IMPORT_TARGET_ID_REQUIRED"),
    targetParameters: input.targetParameters ?? {},
    headers: [...input.source.headers]
      .map(normalizedHeader)
      .filter(Boolean)
      .sort()
  });
}

export function dataImportTargetSchemaDigestV010(
  schema: EffectiveObjectSchemaV010
): string {
  return digest({
    contractVersion: schema.contractVersion,
    objectType: schema.objectType,
    ownerPackageId: schema.ownerPackageId,
    baseSchemaRef: schema.baseSchemaRef,
    activeRelationshipRoles: [...schema.activeRelationshipRoles].sort(),
    fields: schema.fields.map(field => {
      const {
        resolvedLabel: _resolvedLabel,
        resolvedDescription: _resolvedDescription,
        ...semantic
      } = field;
      return semantic;
    })
  });
}

function recipeIdFor(sourceFingerprint: string): string {
  return "recipe-" + sourceFingerprint.slice(0, 32);
}

function payloadOf(
  recipe: DataImportRecipeV010
): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(recipe)) as EnterpriseResourceJsonV010;
}

function fromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): DataImportRecipeV010 {
  if (
    payload === null
    || typeof payload !== "object"
    || Array.isArray(payload)
  ) {
    throw new Error("DATA_IMPORT_RECIPE_PAYLOAD_INVALID");
  }
  const value = payload as unknown as DataImportRecipeV010;
  if (value.contractVersion !== "0.1.0") {
    throw new Error("DATA_IMPORT_RECIPE_VERSION_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    recipeId: required(value.recipeId, "DATA_IMPORT_RECIPE_ID_REQUIRED"),
    targetId: required(value.targetId, "DATA_IMPORT_TARGET_ID_REQUIRED"),
    ...(value.targetParameters
      ? { targetParameters: structuredClone(value.targetParameters) }
      : {}),
    sourceFingerprint: required(
      value.sourceFingerprint,
      "DATA_IMPORT_RECIPE_FINGERPRINT_REQUIRED"
    ),
    sourceHeaders: value.sourceHeaders.map(header =>
      required(header, "DATA_IMPORT_SOURCE_HEADER_INVALID")
    ),
    targetSchemaDigest: required(
      value.targetSchemaDigest,
      "DATA_IMPORT_RECIPE_SCHEMA_DIGEST_REQUIRED"
    ),
    mapping: structuredClone(value.mapping),
    createdAt: required(value.createdAt, "DATA_IMPORT_RECIPE_CREATED_AT_REQUIRED"),
    createdBySubjectId: required(
      value.createdBySubjectId,
      "DATA_IMPORT_RECIPE_CREATED_BY_REQUIRED"
    ),
    updatedAt: required(value.updatedAt, "DATA_IMPORT_RECIPE_UPDATED_AT_REQUIRED"),
    updatedBySubjectId: required(
      value.updatedBySubjectId,
      "DATA_IMPORT_RECIPE_UPDATED_BY_REQUIRED"
    ),
    ...(value.confirmedAt?.trim()
      ? { confirmedAt: value.confirmedAt.trim() }
      : {}),
    ...(value.confirmedBySubjectId?.trim()
      ? { confirmedBySubjectId: value.confirmedBySubjectId.trim() }
      : {}),
    ...(value.lastValidatedImportJobId?.trim()
      ? { lastValidatedImportJobId: value.lastValidatedImportJobId.trim() }
      : {}),
    ...(value.lastSuccessfulImportJobId?.trim()
      ? { lastSuccessfulImportJobId: value.lastSuccessfulImportJobId.trim() }
      : {})
  };
}

export interface DataImportRecipeRepositoryV010 {
  findBySource(input: {
    contextId: string;
    targetId: string;
    targetParameters?: FoundationObjectImportTargetParametersV010;
    source: Pick<DataImportSourceV010, "headers">;
  }): DataImportRecipeV010 | undefined;
  get(contextId: string, recipeId: string): DataImportRecipeV010 | undefined;
  list(contextId: string, targetId?: string): DataImportRecipeV010[];
  recordValidated(input: {
    contextId: string;
    targetId: string;
    targetParameters?: FoundationObjectImportTargetParametersV010;
    source: Pick<DataImportSourceV010, "headers">;
    targetSchemaDigest: string;
    mapping: DataImportMappingV010[];
    importJobId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportRecipeV010;
  recordSuccessful(input: {
    contextId: string;
    targetId: string;
    targetParameters?: FoundationObjectImportTargetParametersV010;
    source: Pick<DataImportSourceV010, "headers">;
    targetSchemaDigest: string;
    mapping: DataImportMappingV010[];
    importJobId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportRecipeV010;
}

export function createDataImportRecipeRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): DataImportRecipeRepositoryV010 {
  return {
    findBySource(input) {
      const fingerprint = dataImportSourceFingerprintV010(input);
      const recipe = this.get(input.contextId, recipeIdFor(fingerprint));
      return recipe?.confirmedAt ? recipe : undefined;
    },

    get(contextId, recipeId) {
      const resource = resources.get({
        contextId: required(contextId, "DATA_IMPORT_CONTEXT_REQUIRED"),
        namespace: "evo.data-import",
        collectionId: DATA_IMPORT_RECIPE_COLLECTION_V010,
        resourceType: DATA_IMPORT_RECIPE_RESOURCE_TYPE_V010,
        resourceId: required(recipeId, "DATA_IMPORT_RECIPE_ID_REQUIRED")
      });
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return fromPayload(resource.payload);
    },

    list(contextId, targetId) {
      const target = targetId?.trim();
      return resources.list({
        contextId: required(contextId, "DATA_IMPORT_CONTEXT_REQUIRED"),
        namespace: "evo.data-import",
        collectionId: DATA_IMPORT_RECIPE_COLLECTION_V010,
        resourceType: DATA_IMPORT_RECIPE_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => fromPayload(resource.payload))
        .filter(recipe => !target || recipe.targetId === target)
        .sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
          || a.recipeId.localeCompare(b.recipeId)
        );
    },

    recordValidated(input) {
      const sourceFingerprint = dataImportSourceFingerprintV010({
        targetId: input.targetId,
        targetParameters: input.targetParameters,
        source: input.source
      });
      const recipeId = recipeIdFor(sourceFingerprint);
      const current = this.get(input.contextId, recipeId);
      const recipe: DataImportRecipeV010 = {
        contractVersion: "0.1.0",
        recipeId,
        targetId: required(input.targetId, "DATA_IMPORT_TARGET_ID_REQUIRED"),
        ...(input.targetParameters
          ? { targetParameters: structuredClone(input.targetParameters) }
          : {}),
        sourceFingerprint,
        sourceHeaders: [...input.source.headers],
        targetSchemaDigest: required(
          input.targetSchemaDigest,
          "DATA_IMPORT_RECIPE_SCHEMA_DIGEST_REQUIRED"
        ),
        mapping: structuredClone(input.mapping),
        createdAt: current?.createdAt ?? input.recordedAt,
        createdBySubjectId:
          current?.createdBySubjectId ?? input.actorSubjectId,
        updatedAt: input.recordedAt,
        updatedBySubjectId: input.actorSubjectId,
        confirmedAt: input.recordedAt,
        confirmedBySubjectId: input.actorSubjectId,
        lastValidatedImportJobId: required(
          input.importJobId,
          "DATA_IMPORT_RECIPE_JOB_REQUIRED"
        ),
        ...(current?.lastSuccessfulImportJobId
          ? { lastSuccessfulImportJobId: current.lastSuccessfulImportJobId }
          : {})
      };
      const saved = resources.put({
        contextId: required(input.contextId, "DATA_IMPORT_CONTEXT_REQUIRED"),
        namespace: "evo.data-import",
        collectionId: DATA_IMPORT_RECIPE_COLLECTION_V010,
        resourceType: DATA_IMPORT_RECIPE_RESOURCE_TYPE_V010,
        resourceId: recipe.recipeId,
        schemaRef: DATA_IMPORT_RECIPE_SCHEMA_V010,
        ownerPackageId: "evo-data-import",
        storageKind: "DOCUMENT",
        payload: payloadOf(recipe),
        metadata: {
          targetId: recipe.targetId,
          sourceFingerprint: recipe.sourceFingerprint,
          lastValidatedImportJobId: recipe.lastValidatedImportJobId ?? "",
          ...(recipe.lastSuccessfulImportJobId
            ? { lastSuccessfulImportJobId: recipe.lastSuccessfulImportJobId }
            : {}),
          confirmedAt: recipe.confirmedAt ?? ""
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return fromPayload(saved.payload);
    },

    recordSuccessful(input) {
      const sourceFingerprint = dataImportSourceFingerprintV010({
        targetId: input.targetId,
        targetParameters: input.targetParameters,
        source: input.source
      });
      const recipeId = recipeIdFor(sourceFingerprint);
      const current = this.get(input.contextId, recipeId);
      const recipe: DataImportRecipeV010 = {
        contractVersion: "0.1.0",
        recipeId,
        targetId: required(input.targetId, "DATA_IMPORT_TARGET_ID_REQUIRED"),
        ...(input.targetParameters
          ? { targetParameters: structuredClone(input.targetParameters) }
          : {}),
        sourceFingerprint,
        sourceHeaders: [...input.source.headers],
        targetSchemaDigest: required(
          input.targetSchemaDigest,
          "DATA_IMPORT_RECIPE_SCHEMA_DIGEST_REQUIRED"
        ),
        mapping: structuredClone(input.mapping),
        createdAt: current?.createdAt ?? input.recordedAt,
        createdBySubjectId:
          current?.createdBySubjectId ?? input.actorSubjectId,
        updatedAt: input.recordedAt,
        updatedBySubjectId: input.actorSubjectId,
        confirmedAt: input.recordedAt,
        confirmedBySubjectId: input.actorSubjectId,
        ...(current?.lastValidatedImportJobId
          ? { lastValidatedImportJobId: current.lastValidatedImportJobId }
          : {}),
        lastSuccessfulImportJobId: required(
          input.importJobId,
          "DATA_IMPORT_RECIPE_JOB_REQUIRED"
        )
      };
      const saved = resources.put({
        contextId: required(input.contextId, "DATA_IMPORT_CONTEXT_REQUIRED"),
        namespace: "evo.data-import",
        collectionId: DATA_IMPORT_RECIPE_COLLECTION_V010,
        resourceType: DATA_IMPORT_RECIPE_RESOURCE_TYPE_V010,
        resourceId: recipe.recipeId,
        schemaRef: DATA_IMPORT_RECIPE_SCHEMA_V010,
        ownerPackageId: "evo-data-import",
        storageKind: "DOCUMENT",
        payload: payloadOf(recipe),
        metadata: {
          targetId: recipe.targetId,
          sourceFingerprint: recipe.sourceFingerprint,
          lastSuccessfulImportJobId: recipe.lastSuccessfulImportJobId ?? "",
          confirmedAt: recipe.confirmedAt ?? ""
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return fromPayload(saved.payload);
    }
  };
}
