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

export function createMemoryTemplateStoreRepositoryV010(
  seed: TemplateStoreRecordV010[] = []
): TemplateStoreRepositoryV010 {
  const records = seed.map(item => ({
    ...clone(item),
    bundle: assertTemplateTransferBundleV010(item.bundle)
  }));

  function history(templateId: string): TemplateStoreRecordV010[] {
    return records
      .filter(item => item.templateId === templateId)
      .sort((a, b) => a.version - b.version);
  }

  return {
    publish(input) {
      const templateId = required(
        input.templateId,
        "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED"
      );
      const bundle = assertTemplateTransferBundleV010(input.bundle);
      const existing = history(templateId);
      const duplicateTransfer = records.find(
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
      records.push(record);
      return clone(record);
    },

    listLatest() {
      return [...new Set(records.map(item => item.templateId))]
        .map(templateId => history(templateId).at(-1))
        .filter(
          (item): item is TemplateStoreRecordV010 => item !== undefined
        )
        .sort((a, b) => a.templateId.localeCompare(b.templateId))
        .map(clone);
    },

    getLatest(templateId) {
      const item = history(
        required(templateId, "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED")
      ).at(-1);
      return item ? clone(item) : undefined;
    },

    getVersion(templateId, version) {
      if (!Number.isInteger(version) || version < 1) {
        throw new Error("TEMPLATE_STORE_VERSION_INVALID");
      }
      const item = history(
        required(templateId, "TEMPLATE_STORE_TEMPLATE_ID_REQUIRED")
      ).find(value => value.version === version);
      return item ? clone(item) : undefined;
    }
  };
}
