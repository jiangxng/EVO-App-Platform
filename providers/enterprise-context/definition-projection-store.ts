import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import {
  assertTemplateProjectionGalleryV010,
  type TemplateProjectionGalleryV010
} from "../../contracts/template-projection-gallery.js";

export interface DefinitionProjectionStoreEntryV010 {
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  gallery: TemplateProjectionGalleryV010;
  updatedAt: string;
  updatedBySubjectId: string;
}

export interface DefinitionProjectionStoreSnapshotV010 {
  contractVersion: "0.1.0";
  entries: DefinitionProjectionStoreEntryV010[];
}

export interface DefinitionProjectionStoreV010 {
  get(input: {
    enterpriseId: string;
    definitionId: string;
    definitionRevision: number;
  }): TemplateProjectionGalleryV010 | undefined;
  put(input: DefinitionProjectionStoreEntryV010): TemplateProjectionGalleryV010;
  snapshot(): DefinitionProjectionStoreSnapshotV010;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function validateEntry(
  value: DefinitionProjectionStoreEntryV010
): DefinitionProjectionStoreEntryV010 {
  if (
    !Number.isInteger(value.definitionRevision)
    || value.definitionRevision < 0
    || !Number.isFinite(Date.parse(value.updatedAt))
  ) {
    throw new Error("DEFINITION_PROJECTION_STORE_ENTRY_INVALID");
  }
  return {
    enterpriseId: required(
      value.enterpriseId,
      "DEFINITION_PROJECTION_STORE_ENTERPRISE_REQUIRED"
    ),
    definitionId: required(
      value.definitionId,
      "DEFINITION_PROJECTION_STORE_DEFINITION_REQUIRED"
    ),
    definitionRevision: value.definitionRevision,
    gallery: assertTemplateProjectionGalleryV010(value.gallery),
    updatedAt: value.updatedAt,
    updatedBySubjectId: required(
      value.updatedBySubjectId,
      "DEFINITION_PROJECTION_STORE_ACTOR_REQUIRED"
    )
  };
}

function key(input: {
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
}): string {
  return [
    input.enterpriseId.trim(),
    input.definitionId.trim(),
    String(input.definitionRevision)
  ].join("|");
}

function validateSnapshot(
  value: DefinitionProjectionStoreSnapshotV010
): DefinitionProjectionStoreSnapshotV010 {
  if (
    value?.contractVersion !== "0.1.0"
    || !Array.isArray(value.entries)
  ) {
    throw new Error("DEFINITION_PROJECTION_STORE_SNAPSHOT_INVALID");
  }
  const seen = new Set<string>();
  const entries = value.entries.map(validateEntry);
  for (const entry of entries) {
    const entryKey = key(entry);
    if (seen.has(entryKey)) {
      throw new Error("DEFINITION_PROJECTION_STORE_ENTRY_DUPLICATE");
    }
    seen.add(entryKey);
  }
  return { contractVersion: "0.1.0", entries };
}

function createStore(
  read: () => DefinitionProjectionStoreSnapshotV010,
  write: (snapshot: DefinitionProjectionStoreSnapshotV010) => void
): DefinitionProjectionStoreV010 {
  return {
    get(input) {
      const found = read().entries.find(item => key(item) === key(input));
      return found ? clone(found.gallery) : undefined;
    },

    put(input) {
      const entry = validateEntry(input);
      const current = read();
      const entryKey = key(entry);
      const entries = current.entries.filter(item => key(item) !== entryKey);
      write({
        contractVersion: "0.1.0",
        entries: [...entries, entry]
      });
      return clone(entry.gallery);
    },

    snapshot() {
      return clone(read());
    }
  };
}

export function createMemoryDefinitionProjectionStoreV010(
  seed: DefinitionProjectionStoreSnapshotV010 = {
    contractVersion: "0.1.0",
    entries: []
  }
): DefinitionProjectionStoreV010 {
  let snapshot = validateSnapshot(clone(seed));
  return createStore(
    () => clone(snapshot),
    value => {
      snapshot = validateSnapshot(clone(value));
    }
  );
}

export function createFileDefinitionProjectionStoreV010(
  path: string
): DefinitionProjectionStoreV010 {
  const read = (): DefinitionProjectionStoreSnapshotV010 => {
    if (!existsSync(path)) {
      return { contractVersion: "0.1.0", entries: [] };
    }
    return validateSnapshot(
      JSON.parse(
        readFileSync(path, "utf8")
      ) as DefinitionProjectionStoreSnapshotV010
    );
  };

  const write = (snapshot: DefinitionProjectionStoreSnapshotV010): void => {
    const valid = validateSnapshot(snapshot);
    mkdirSync(dirname(path), { recursive: true });
    const temp = path + ".tmp";
    writeFileSync(temp, JSON.stringify(valid, null, 2) + "\n", "utf8");
    renameSync(temp, path);
  };

  return createStore(read, write);
}
