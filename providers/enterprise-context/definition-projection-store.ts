import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
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
  /** Independently increasing projection-gallery write version (legacy rows may omit). */
  version?: number;
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
  /** 0 for a gallery still inherited from the immutable business definition. */
  getVersion(input: { enterpriseId: string; definitionId: string; definitionRevision: number }): number;
  /** Version and gallery originate from the same snapshot to avoid mixed reads. */
  getVersioned(input: { enterpriseId: string; definitionId: string; definitionRevision: number }): {
    gallery?: TemplateProjectionGalleryV010; version: number
  };
  /** Reject a concurrent write instead of silently replacing a later projection. */
  putIfVersion(input: DefinitionProjectionStoreEntryV010, expectedVersion: number): {
    gallery: TemplateProjectionGalleryV010; version: number
  };
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
    || (value.version !== undefined
      && (!Number.isSafeInteger(value.version) || value.version < 1))
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
    ...(value.version !== undefined ? { version: value.version } : {}),
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
  write: (snapshot: DefinitionProjectionStoreSnapshotV010) => void,
  withWriteLock: <T>(action: () => T) => T = action => action()
): DefinitionProjectionStoreV010 {
  const versionOf = (entry: DefinitionProjectionStoreEntryV010 | undefined): number =>
    entry ? (entry.version ?? 1) : 0;
  const save = (
    input: DefinitionProjectionStoreEntryV010,
    expectedVersion?: number
  ): { gallery: TemplateProjectionGalleryV010; version: number } => withWriteLock(() => {
    const entry = validateEntry(input);
    const current = read();
    const entryKey = key(entry);
    const found = current.entries.find(item => key(item) === entryKey);
    const oldVersion = versionOf(found);
    if (expectedVersion !== undefined && expectedVersion !== oldVersion) {
      throw new Error("DEFINITION_PROJECTION_WRITE_CONFLICT");
    }
    const nextVersion = oldVersion + 1;
    const entries = current.entries.filter(item => key(item) !== entryKey);
    write({
      contractVersion: "0.1.0",
      entries: [...entries, { ...entry, version: nextVersion }]
    });
    return { gallery: clone(entry.gallery), version: nextVersion };
  });
  return {
    get(input) {
      const found = read().entries.find(item => key(item) === key(input));
      return found ? clone(found.gallery) : undefined;
    },
    getVersion(input) {
      return versionOf(read().entries.find(item => key(item) === key(input)));
    },
    getVersioned(input) {
      const found = read().entries.find(item => key(item) === key(input));
      return {
        ...(found ? { gallery: clone(found.gallery) } : {}),
        version: versionOf(found)
      };
    },
    put(input) {
      return save(input).gallery;
    },
    putIfVersion(input, expectedVersion) {
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
        throw new Error("DEFINITION_PROJECTION_WRITE_TOKEN_INVALID");
      }
      return save(input, expectedVersion);
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

  // Exclusive directory creation is atomic across cooperating processes on
  // a local filesystem. Never perform the version comparison outside the lock.
  // Crash leftovers fail closed; operations must not steal a potentially live lock.
  const withWriteLock = <T>(action: () => T): T => {
    mkdirSync(dirname(path), { recursive: true });
    const lockPath = path + ".lock";
    try {
      mkdirSync(lockPath);
    } catch {
      throw new Error("DEFINITION_PROJECTION_STORE_LOCKED");
    }
    try {
      return action();
    } finally {
      rmdirSync(lockPath);
    }
  };
  return createStore(read, write, withWriteLock);
}
