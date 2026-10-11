import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import {
  assertTemplateTransferBundleV010,
  type TemplateTransferBundleV010
} from "../../contracts/template-transfer.js";

export interface TemplateStoreRecordV010 {
  contractVersion: "0.1.0";
  templateId: string;
  version: number;
  bundle: TemplateTransferBundleV010;
  publishedAt: string;
}

/** Stable catalog identity for an immutable Template Store version.
 * The template ID is URI encoded so separators inside IDs cannot be confused
 * with the trailing version separator. Origin: archived Template Store actions.
 */
export function templateStoreRecordItemIdV010(
  templateId: string,
  version: number
): string {
  const normalized = required(templateId, "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED");
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("TEMPLATE_STORE_VERSION_INVALID");
  }
  return encodeURIComponent(normalized) + "@" + String(version);
}

export function parseTemplateStoreRecordItemIdV010(
  itemId: string
): { templateId: string; version: number } {
  const normalized = required(itemId, "TEMPLATE_STORE_ITEM_ID_REQUIRED");
  const separator = normalized.lastIndexOf("@");
  if (separator < 1) {
    throw new Error("TEMPLATE_STORE_ITEM_ID_INVALID");
  }
  const encodedId = normalized.slice(0, separator);
  const versionText = normalized.slice(separator + 1);
  if (!/^[1-9][0-9]*$/u.test(versionText)) {
    throw new Error("TEMPLATE_STORE_ITEM_ID_INVALID");
  }
  const version = Number(versionText);
  if (!Number.isSafeInteger(version)) {
    throw new Error("TEMPLATE_STORE_ITEM_ID_INVALID");
  }
  let templateId: string;
  try {
    templateId = decodeURIComponent(encodedId);
  } catch {
    throw new Error("TEMPLATE_STORE_ITEM_ID_INVALID");
  }
  if (!templateId.trim() || templateId !== templateId.trim()) {
    throw new Error("TEMPLATE_STORE_ITEM_ID_INVALID");
  }
  if (encodeURIComponent(templateId) !== encodedId) {
    throw new Error("TEMPLATE_STORE_ITEM_ID_INVALID");
  }
  return { templateId, version };
}

interface TemplateStoreSnapshotV010 {
  contractVersion: "0.1.0";
  records: TemplateStoreRecordV010[];
}

export interface TemplateStoreRepositoryV010 {
  publish(input: {
    templateId: string;
    bundle: TemplateTransferBundleV010;
    publishedAt?: string;
  }): TemplateStoreRecordV010;
  listLatest(): TemplateStoreRecordV010[];
  getLatest(templateId: string): TemplateStoreRecordV010 | undefined;
  getVersion(
    templateId: string,
    version: number
  ): TemplateStoreRecordV010 | undefined;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function at(value: string | undefined): string {
  const normalized = value ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(normalized))) {
    throw new Error("TEMPLATE_STORE_PUBLISHED_AT_INVALID");
  }
  return normalized;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function validateRecord(
  value: TemplateStoreRecordV010
): TemplateStoreRecordV010 {
  if (
    value?.contractVersion !== "0.1.0"
    || !Number.isInteger(value.version)
    || value.version < 1
    || !Number.isFinite(Date.parse(value.publishedAt))
  ) {
    throw new Error("TEMPLATE_STORE_RECORD_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    templateId: required(
      value.templateId,
      "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED"
    ),
    version: value.version,
    bundle: assertTemplateTransferBundleV010(value.bundle),
    publishedAt: value.publishedAt
  };
}

function validateSnapshot(
  raw: TemplateStoreSnapshotV010
): TemplateStoreSnapshotV010 {
  if (
    raw?.contractVersion !== "0.1.0"
    || !Array.isArray(raw.records)
  ) {
    throw new Error("TEMPLATE_STORE_SNAPSHOT_INVALID");
  }

  const records = raw.records.map(validateRecord);
  const versions = new Set<string>();
  const transfers = new Set<string>();
  for (const record of records) {
    const versionKey = record.templateId + "@" + record.version;
    if (versions.has(versionKey)) {
      throw new Error("TEMPLATE_STORE_VERSION_DUPLICATE");
    }
    versions.add(versionKey);
    if (transfers.has(record.bundle.transferId)) {
      throw new Error("TEMPLATE_STORE_TRANSFER_DUPLICATE");
    }
    transfers.add(record.bundle.transferId);
  }

  return {
    contractVersion: "0.1.0",
    records: records.map(clone)
  };
}

function seedSnapshot(
  seed: readonly TemplateStoreRecordV010[]
): TemplateStoreSnapshotV010 {
  return validateSnapshot({
    contractVersion: "0.1.0",
    records: seed.map(clone)
  });
}

function mergeMissingSeed(
  snapshot: TemplateStoreSnapshotV010,
  seed: readonly TemplateStoreRecordV010[]
): TemplateStoreSnapshotV010 {
  const next = clone(snapshot);
  const presentVersions = new Set(
    next.records.map(
      record => record.templateId + "@" + record.version
    )
  );
  for (const seeded of seed.map(validateRecord)) {
    const versionKey = seeded.templateId + "@" + seeded.version;
    if (!presentVersions.has(versionKey)) {
      next.records.push(clone(seeded));
      presentVersions.add(versionKey);
    }
  }
  return validateSnapshot(next);
}

function createRepository(
  read: () => TemplateStoreSnapshotV010,
  write: (snapshot: TemplateStoreSnapshotV010) => void
): TemplateStoreRepositoryV010 {
  const history = (
    snapshot: TemplateStoreSnapshotV010,
    templateId: string
  ): TemplateStoreRecordV010[] =>
    snapshot.records
      .filter(item => item.templateId === templateId)
      .sort((a, b) => a.version - b.version);

  return {
    publish(input) {
      const templateId = required(
        input.templateId,
        "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED"
      );
      const bundle = assertTemplateTransferBundleV010(input.bundle);
      const current = read();
      const existing = history(current, templateId);
      const duplicateTransfer = current.records.find(
        item => item.bundle.transferId === bundle.transferId
      );
      if (duplicateTransfer) {
        if (duplicateTransfer.templateId !== templateId) {
          throw new Error("TEMPLATE_STORE_TRANSFER_ALREADY_PUBLISHED");
        }
        return clone(duplicateTransfer);
      }

      const record: TemplateStoreRecordV010 = {
        contractVersion: "0.1.0",
        templateId,
        version: (existing.at(-1)?.version ?? 0) + 1,
        bundle: clone(bundle),
        publishedAt: at(input.publishedAt)
      };
      write(validateSnapshot({
        contractVersion: "0.1.0",
        records: [...current.records, record]
      }));
      return clone(record);
    },

    listLatest() {
      const snapshot = read();
      return [...new Set(snapshot.records.map(item => item.templateId))]
        .map(templateId => history(snapshot, templateId).at(-1))
        .filter(
          (item): item is TemplateStoreRecordV010 => item !== undefined
        )
        .sort((a, b) => a.templateId.localeCompare(b.templateId))
        .map(clone);
    },

    getLatest(templateId) {
      const item = history(
        read(),
        required(templateId, "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED")
      ).at(-1);
      return item ? clone(item) : undefined;
    },

    getVersion(templateId, version) {
      if (!Number.isInteger(version) || version < 1) {
        throw new Error("TEMPLATE_STORE_VERSION_INVALID");
      }
      const item = history(
        read(),
        required(templateId, "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED")
      ).find(value => value.version === version);
      return item ? clone(item) : undefined;
    }
  };
}

export function createMemoryTemplateStoreRepositoryV010(
  seed: TemplateStoreRecordV010[] = []
): TemplateStoreRepositoryV010 {
  let snapshot = seedSnapshot(seed);
  return createRepository(
    () => clone(snapshot),
    next => {
      snapshot = validateSnapshot(next);
    }
  );
}

export function createFileTemplateStoreRepositoryV010(
  path: string,
  seed: readonly TemplateStoreRecordV010[] = []
): TemplateStoreRepositoryV010 {
  const validatedSeed = seed.map(validateRecord);

  const read = (): TemplateStoreSnapshotV010 => {
    if (!existsSync(path)) {
      return seedSnapshot(validatedSeed);
    }
    const parsed = validateSnapshot(
      JSON.parse(readFileSync(path, "utf8")) as TemplateStoreSnapshotV010
    );
    return mergeMissingSeed(parsed, validatedSeed);
  };

  const write = (snapshot: TemplateStoreSnapshotV010): void => {
    const valid = validateSnapshot(snapshot);
    mkdirSync(dirname(path), { recursive: true });
    const temporaryPath = path + ".tmp";
    writeFileSync(
      temporaryPath,
      JSON.stringify(valid, null, 2) + "\n",
      "utf8"
    );
    renameSync(temporaryPath, path);
  };

  return createRepository(read, write);
}
