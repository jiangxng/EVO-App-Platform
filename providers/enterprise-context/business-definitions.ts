import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import {
  assertTemplateProjectionGalleryV010
} from "../../contracts/template-projection-gallery.js";
import type {
  BusinessDefinitionAttributionV010,
  BusinessDefinitionRepositoryMigrationV010,
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import {
  HOST_ENTERPRISE_BUSINESS_DEFINITION_PROVIDER_ID
} from "./package.js";

interface BusinessDefinitionSnapshotV010 {
  contractVersion: "0.1.0";
  revisions: BusinessDefinitionRevisionV010[];
}

export interface BusinessDefinitionRepositoryRuntimeV010
  extends BusinessDefinitionRepositoryV010,
    BusinessDefinitionRepositoryMigrationV010 {}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function timestamp(value: string | undefined, code: string): string {
  const normalized = value ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(code);
  return normalized;
}

function validateActor(
  actor: BusinessDefinitionAttributionV010
): BusinessDefinitionAttributionV010 {
  if (
    actor.actorType !== "HUMAN"
    && actor.actorType !== "AI"
    && actor.actorType !== "AUTOMATION"
    && actor.actorType !== "SERVICE"
  ) {
    throw new Error("BUSINESS_DEFINITION_ACTOR_TYPE_INVALID");
  }
  return {
    actorType: actor.actorType,
    subjectId: required(
      actor.subjectId,
      "BUSINESS_DEFINITION_ACTOR_SUBJECT_REQUIRED"
    )
  };
}

function validateRevision(
  value: BusinessDefinitionRevisionV010
): BusinessDefinitionRevisionV010 {
  if (
    value.contractVersion !== "0.1.0"
    || !Number.isInteger(value.revision)
    || value.revision < 0
    || (value.state !== "DRAFT" && value.state !== "PUBLISHED")
    || value.payload === null
    || Array.isArray(value.payload)
    || typeof value.payload !== "object"
  ) {
    throw new Error("BUSINESS_DEFINITION_REVISION_INVALID");
  }

  const revision: BusinessDefinitionRevisionV010 = {
    ...clone(value),
    definitionId: required(
      value.definitionId,
      "BUSINESS_DEFINITION_ID_REQUIRED"
    ),
    enterpriseId: required(
      value.enterpriseId,
      "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
    ),
    kind: required(value.kind, "BUSINESS_DEFINITION_KIND_REQUIRED"),
    title: required(value.title, "BUSINESS_DEFINITION_TITLE_REQUIRED"),
    definitionCreatedAt: timestamp(
      value.definitionCreatedAt,
      "BUSINESS_DEFINITION_CREATED_AT_INVALID"
    ),
    recordedAt: timestamp(
      value.recordedAt,
      "BUSINESS_DEFINITION_RECORDED_AT_INVALID"
    ),
    recordedBy: validateActor(value.recordedBy),
    ...(value.projectionGallery
      ? {
          projectionGallery: assertTemplateProjectionGalleryV010(
            value.projectionGallery
          )
        }
      : {}),
    origin: {
      type:
        value.origin?.type === "MIGRATED"
          ? "MIGRATED"
          : value.origin?.type === "TEMPLATE_COPY"
            ? "TEMPLATE_COPY"
            : "NATIVE",
      ...(value.origin?.sourceRef?.trim()
        ? { sourceRef: value.origin.sourceRef.trim() }
        : {}),
      historyComplete: value.origin?.historyComplete === true
    }
  };

  if (
    revision.origin.type === "TEMPLATE_COPY"
    && !revision.origin.sourceRef?.trim()
  ) {
    throw new Error("BUSINESS_DEFINITION_TEMPLATE_COPY_SOURCE_REQUIRED");
  }

  if (revision.state === "PUBLISHED") {
    if (
      !revision.publishedAt
      || !Number.isFinite(Date.parse(revision.publishedAt))
      || !revision.publishedBySubjectId?.trim()
    ) {
      throw new Error("BUSINESS_DEFINITION_PUBLISHED_METADATA_REQUIRED");
    }
    revision.publishedBySubjectId =
      revision.publishedBySubjectId.trim();
  } else {
    delete revision.publishedAt;
    delete revision.publishedBySubjectId;
  }

  return revision;
}

function empty(): BusinessDefinitionSnapshotV010 {
  return { contractVersion: "0.1.0", revisions: [] };
}

function validateSnapshot(
  raw: BusinessDefinitionSnapshotV010
): BusinessDefinitionSnapshotV010 {
  if (
    raw?.contractVersion !== "0.1.0"
    || !Array.isArray(raw.revisions)
  ) {
    throw new Error("BUSINESS_DEFINITION_SNAPSHOT_INVALID");
  }

  const revisions = raw.revisions.map(validateRevision);
  const keys = new Set<string>();
  for (const revision of revisions) {
    const key = [
      revision.enterpriseId,
      revision.definitionId,
      revision.revision
    ].join("|");
    if (keys.has(key)) {
      throw new Error("BUSINESS_DEFINITION_REVISION_DUPLICATE");
    }
    keys.add(key);
  }

  return { contractVersion: "0.1.0", revisions };
}

function createRepository(
  read: () => BusinessDefinitionSnapshotV010,
  write: (snapshot: BusinessDefinitionSnapshotV010) => void
): BusinessDefinitionRepositoryRuntimeV010 {
  const history = (
    snapshot: BusinessDefinitionSnapshotV010,
    enterpriseId: string,
    definitionId: string
  ) =>
    snapshot.revisions
      .filter(item =>
        item.enterpriseId === enterpriseId
        && item.definitionId === definitionId
      )
      .sort((a, b) => a.revision - b.revision);

  const latest = (
    snapshot: BusinessDefinitionSnapshotV010,
    enterpriseId: string,
    definitionId: string
  ) => history(snapshot, enterpriseId, definitionId).at(-1);

  const effective = (
    snapshot: BusinessDefinitionSnapshotV010,
    enterpriseId: string,
    definitionId: string
  ) => history(snapshot, enterpriseId, definitionId)
    .filter(item => item.state === "PUBLISHED")
    .at(-1);

  const append = (
    revision: BusinessDefinitionRevisionV010
  ): BusinessDefinitionRevisionV010 => {
    const current = read();
    const valid = validateRevision(revision);
    if (
      current.revisions.some(item =>
        item.enterpriseId === valid.enterpriseId
        && item.definitionId === valid.definitionId
        && item.revision === valid.revision
      )
    ) {
      throw new Error("BUSINESS_DEFINITION_REVISION_DUPLICATE");
    }
    write({
      contractVersion: "0.1.0",
      revisions: [...current.revisions, valid]
    });
    return clone(valid);
  };

  return {
    providerId: HOST_ENTERPRISE_BUSINESS_DEFINITION_PROVIDER_ID,

    createDraft(input) {
      const enterpriseId = required(
        input.enterpriseId,
        "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
      );
      const definitionId = required(
        input.definitionId,
        "BUSINESS_DEFINITION_ID_REQUIRED"
      );
      const current = read();
      if (history(current, enterpriseId, definitionId).length > 0) {
        throw new Error("BUSINESS_DEFINITION_ALREADY_EXISTS");
      }
      const recordedAt = timestamp(
        input.recordedAt,
        "BUSINESS_DEFINITION_RECORDED_AT_INVALID"
      );
      return append({
        contractVersion: "0.1.0",
        enterpriseId,
        definitionId,
        kind: required(input.kind, "BUSINESS_DEFINITION_KIND_REQUIRED"),
        revision: 0,
        state: "DRAFT",
        title: required(input.title, "BUSINESS_DEFINITION_TITLE_REQUIRED"),
        payload: clone(input.payload),
        ...(input.projectionGallery
          ? {
              projectionGallery: assertTemplateProjectionGalleryV010(
                input.projectionGallery
              )
            }
          : {}),
        definitionCreatedAt: recordedAt,
        recordedAt,
        recordedBy: validateActor(input.actor),
        origin: input.origin?.type === "TEMPLATE_COPY"
          ? {
              type: "TEMPLATE_COPY",
              sourceRef: required(
                input.origin.sourceRef,
                "BUSINESS_DEFINITION_TEMPLATE_COPY_SOURCE_REQUIRED"
              ),
              historyComplete: true
            }
          : {
              type: "NATIVE",
              historyComplete: true
            }
      });
    },

    reviseDraft(input) {
      const enterpriseId = required(
        input.enterpriseId,
        "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
      );
      const definitionId = required(
        input.definitionId,
        "BUSINESS_DEFINITION_ID_REQUIRED"
      );
      const current = latest(read(), enterpriseId, definitionId);
      if (!current) throw new Error("BUSINESS_DEFINITION_NOT_FOUND");
      if (current.state !== "DRAFT") {
        throw new Error("BUSINESS_DEFINITION_PUBLISHED_IMMUTABLE");
      }
      if (current.revision !== input.expectedRevision) {
        throw new Error("BUSINESS_DEFINITION_REVISION_CONFLICT");
      }
      return append({
        ...current,
        revision: current.revision + 1,
        title: required(input.title, "BUSINESS_DEFINITION_TITLE_REQUIRED"),
        payload: clone(input.payload),
        projectionGallery: input.projectionGallery
          ? assertTemplateProjectionGalleryV010(input.projectionGallery)
          : current.projectionGallery,
        recordedAt: timestamp(
          input.recordedAt,
          "BUSINESS_DEFINITION_RECORDED_AT_INVALID"
        ),
        recordedBy: validateActor(input.actor)
      });
    },

    beginDraft(input) {
      const enterpriseId = required(
        input.enterpriseId,
        "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
      );
      const definitionId = required(
        input.definitionId,
        "BUSINESS_DEFINITION_ID_REQUIRED"
      );
      const current = latest(read(), enterpriseId, definitionId);
      if (!current) throw new Error("BUSINESS_DEFINITION_NOT_FOUND");
      if (current.state !== "PUBLISHED") {
        throw new Error("BUSINESS_DEFINITION_DRAFT_ALREADY_ACTIVE");
      }
      if (current.revision !== input.expectedRevision) {
        throw new Error("BUSINESS_DEFINITION_REVISION_CONFLICT");
      }
      return append({
        ...current,
        revision: current.revision + 1,
        state: "DRAFT",
        title: required(input.title, "BUSINESS_DEFINITION_TITLE_REQUIRED"),
        payload: clone(input.payload),
        projectionGallery: input.projectionGallery
          ? assertTemplateProjectionGalleryV010(input.projectionGallery)
          : current.projectionGallery,
        recordedAt: timestamp(
          input.recordedAt,
          "BUSINESS_DEFINITION_RECORDED_AT_INVALID"
        ),
        recordedBy: validateActor(input.actor),
        origin: {
          type: "NATIVE",
          historyComplete: current.origin.historyComplete
        },
        publishedAt: undefined,
        publishedBySubjectId: undefined
      });
    },

    publish(input) {
      const enterpriseId = required(
        input.enterpriseId,
        "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
      );
      const definitionId = required(
        input.definitionId,
        "BUSINESS_DEFINITION_ID_REQUIRED"
      );
      const current = latest(read(), enterpriseId, definitionId);
      if (!current) throw new Error("BUSINESS_DEFINITION_NOT_FOUND");
      if (current.state !== "DRAFT") {
        throw new Error("BUSINESS_DEFINITION_PUBLISHED_IMMUTABLE");
      }
      if (current.revision !== input.expectedRevision) {
        throw new Error("BUSINESS_DEFINITION_REVISION_CONFLICT");
      }
      const actor = validateActor(input.actor);
      if (actor.actorType !== "HUMAN") {
        throw new Error("BUSINESS_DEFINITION_PUBLISH_HUMAN_REQUIRED");
      }
      const recordedAt = timestamp(
        input.recordedAt,
        "BUSINESS_DEFINITION_RECORDED_AT_INVALID"
      );
      return append({
        ...current,
        revision: current.revision + 1,
        state: "PUBLISHED",
        recordedAt,
        recordedBy: actor,
        publishedAt: recordedAt,
        publishedBySubjectId: actor.subjectId
      });
    },

    getLatest(input) {
      const item = latest(
        read(),
        required(
          input.enterpriseId,
          "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
        ),
        required(
          input.definitionId,
          "BUSINESS_DEFINITION_ID_REQUIRED"
        )
      );
      return item ? clone(item) : undefined;
    },

    getEffective(input) {
      const item = effective(
        read(),
        required(
          input.enterpriseId,
          "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
        ),
        required(
          input.definitionId,
          "BUSINESS_DEFINITION_ID_REQUIRED"
        )
      );
      return item ? clone(item) : undefined;
    },

    listLatest(input) {
      const enterpriseId = required(
        input.enterpriseId,
        "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
      );
      const snapshot = read();
      const ids = new Set(
        snapshot.revisions
          .filter(item =>
            item.enterpriseId === enterpriseId
            && (input.kind === undefined || item.kind === input.kind)
          )
          .map(item => item.definitionId)
      );
      return [...ids]
        .map(definitionId =>
          latest(snapshot, enterpriseId, definitionId)
        )
        .filter(
          (item): item is BusinessDefinitionRevisionV010 =>
            item !== undefined
            && (input.kind === undefined || item.kind === input.kind)
        )
        .sort((a, b) =>
          a.kind.localeCompare(b.kind)
          || a.definitionId.localeCompare(b.definitionId)
        )
        .map(clone);
    },

    listEffective(input) {
      const enterpriseId = required(
        input.enterpriseId,
        "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
      );
      const snapshot = read();
      const ids = new Set(
        snapshot.revisions
          .filter(item =>
            item.enterpriseId === enterpriseId
            && item.state === "PUBLISHED"
            && (input.kind === undefined || item.kind === input.kind)
          )
          .map(item => item.definitionId)
      );
      return [...ids]
        .map(definitionId =>
          effective(snapshot, enterpriseId, definitionId)
        )
        .filter(
          (item): item is BusinessDefinitionRevisionV010 =>
            item !== undefined
            && (input.kind === undefined || item.kind === input.kind)
        )
        .sort((a, b) =>
          a.kind.localeCompare(b.kind)
          || a.definitionId.localeCompare(b.definitionId)
        )
        .map(clone);
    },

    listHistory(input) {
      return history(
        read(),
        required(
          input.enterpriseId,
          "BUSINESS_DEFINITION_ENTERPRISE_REQUIRED"
        ),
        required(
          input.definitionId,
          "BUSINESS_DEFINITION_ID_REQUIRED"
        )
      ).map(clone);
    },

    importRevision(input) {
      const revision = validateRevision(input);
      const current = read();
      const existing = current.revisions.find(item =>
        item.enterpriseId === revision.enterpriseId
        && item.definitionId === revision.definitionId
        && item.revision === revision.revision
      );
      if (existing) {
        const same =
          JSON.stringify(existing) === JSON.stringify(revision);
        if (!same) {
          throw new Error("BUSINESS_DEFINITION_MIGRATION_CONFLICT");
        }
        return clone(existing);
      }
      return append(revision);
    }
  };
}

export function createMemoryBusinessDefinitionRepositoryV010(
  seed: BusinessDefinitionRevisionV010[] = []
): BusinessDefinitionRepositoryRuntimeV010 {
  let snapshot = validateSnapshot({
    contractVersion: "0.1.0",
    revisions: seed
  });
  return createRepository(
    () => clone(snapshot),
    next => {
      snapshot = validateSnapshot(clone(next));
    }
  );
}

export function createFileBusinessDefinitionRepositoryV010(
  path: string
): BusinessDefinitionRepositoryRuntimeV010 {
  const read = (): BusinessDefinitionSnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validateSnapshot(
      JSON.parse(readFileSync(path, "utf8")) as BusinessDefinitionSnapshotV010
    );
  };
  const write = (snapshot: BusinessDefinitionSnapshotV010) => {
    const valid = validateSnapshot(snapshot);
    mkdirSync(dirname(path), { recursive: true });
    const temp = path + ".tmp";
    writeFileSync(
      temp,
      JSON.stringify(valid, null, 2) + "\n",
      "utf8"
    );
    renameSync(temp, path);
  };
  return createRepository(read, write);
}
