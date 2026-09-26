import {
  createCipheriv,
  createDecipheriv,
  randomBytes
} from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  SecretDescriptorV010,
  SecretReferenceV010
} from "../contracts/platform-services.js";

interface EncryptedSecretRecordV010 {
  contractVersion: "0.1.0";
  algorithm: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
  updatedAt: string;
}

interface PersistedEncryptedSecretsV010 {
  contractVersion: "0.1.0";
  records: Record<string, EncryptedSecretRecordV010>;
}

export interface SecretStoreV010 {
  describe(reference: SecretReferenceV010): SecretDescriptorV010;
  resolve(reference: SecretReferenceV010): string;
  put(reference: SecretReferenceV010, value: string): SecretDescriptorV010;
  remove(reference: SecretReferenceV010): void;
  listMetadata(namespace?: string): SecretDescriptorV010[];
}

function validateReference(reference: SecretReferenceV010): void {
  if (reference.contractVersion !== "0.1.0") {
    throw new Error("SECRET_REFERENCE_CONTRACT_UNSUPPORTED");
  }
  if (!reference.namespace.trim() || !reference.key.trim()) {
    throw new Error("SECRET_REFERENCE_INVALID");
  }
  if (reference.scope === "SYSTEM") {
    if (reference.scopeId?.trim()) throw new Error("SECRET_SYSTEM_SCOPE_ID_FORBIDDEN");
  } else if (!reference.scopeId?.trim()) {
    throw new Error("SECRET_SCOPE_ID_REQUIRED");
  }
}

function identity(reference: SecretReferenceV010): string {
  validateReference(reference);
  return [
    reference.namespace.trim(),
    reference.key.trim(),
    reference.scope,
    reference.scope === "SYSTEM" ? "" : reference.scopeId!.trim()
  ].join("\u0000");
}

function descriptor(
  reference: SecretReferenceV010,
  record?: EncryptedSecretRecordV010
): SecretDescriptorV010 {
  return {
    contractVersion: "0.1.0",
    reference: structuredClone(reference),
    configured: Boolean(record),
    ...(record ? { updatedAt: record.updatedAt } : {})
  };
}

function loadKey(keyFile: string): Buffer {
  mkdirSync(dirname(keyFile), { recursive: true });
  if (!existsSync(keyFile)) {
    const key = randomBytes(32);
    writeFileSync(keyFile, key.toString("base64") + "\n", {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx"
    });
    try { chmodSync(keyFile, 0o600); } catch {}
    return key;
  }
  const raw = readFileSync(keyFile, "utf8").trim();
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("SECRETS_MASTER_KEY_INVALID");
  return key;
}

function loadState(filePath: string): PersistedEncryptedSecretsV010 {
  if (!existsSync(filePath)) {
    return { contractVersion: "0.1.0", records: {} };
  }
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as PersistedEncryptedSecretsV010;
  if (
    parsed.contractVersion !== "0.1.0"
    || parsed.records === null
    || typeof parsed.records !== "object"
    || Array.isArray(parsed.records)
  ) {
    throw new Error(`SECRETS_STATE_INVALID: ${filePath}`);
  }
  return parsed;
}

export function createMemorySecretStoreV010(
  now: () => Date = () => new Date()
): SecretStoreV010 {
  const values = new Map<string, { value: string; updatedAt: string; reference: SecretReferenceV010 }>();
  return {
    describe(reference) {
      const record = values.get(identity(reference));
      return {
        contractVersion: "0.1.0",
        reference: structuredClone(reference),
        configured: Boolean(record),
        ...(record ? { updatedAt: record.updatedAt } : {})
      };
    },
    resolve(reference) {
      const record = values.get(identity(reference));
      if (!record) {
        throw new Error(`SECRET_NOT_FOUND: ${reference.namespace}: ${reference.key}`);
      }
      return record.value;
    },
    put(reference, value) {
      const normalized = value.trim();
      if (!normalized) throw new Error("SECRET_VALUE_EMPTY");
      const updatedAt = now().toISOString();
      values.set(identity(reference), {
        value: normalized,
        updatedAt,
        reference: structuredClone(reference)
      });
      return {
        contractVersion: "0.1.0",
        reference: structuredClone(reference),
        configured: true,
        updatedAt
      };
    },
    remove(reference) {
      values.delete(identity(reference));
    },
    listMetadata(namespace) {
      return [...values.values()]
        .filter(item => !namespace || item.reference.namespace === namespace)
        .map(item => ({
          contractVersion: "0.1.0" as const,
          reference: structuredClone(item.reference),
          configured: true,
          updatedAt: item.updatedAt
        }))
        .sort((a, b) =>
          a.reference.namespace.localeCompare(b.reference.namespace)
          || a.reference.key.localeCompare(b.reference.key)
        );
    }
  };
}

export function createEncryptedFileSecretStoreV010(
  filePath: string,
  keyFile: string,
  now: () => Date = () => new Date()
): SecretStoreV010 {
  const key = loadKey(keyFile);
  const state = loadState(filePath);

  function persist(): void {
    mkdirSync(dirname(filePath), { recursive: true });
    const tmp = filePath + ".tmp";
    writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", {
      encoding: "utf8",
      mode: 0o600
    });
    try { chmodSync(tmp, 0o600); } catch {}
    renameSync(tmp, filePath);
    try { chmodSync(filePath, 0o600); } catch {}
  }

  function encrypt(reference: SecretReferenceV010, value: string): EncryptedSecretRecordV010 {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(Buffer.from(identity(reference), "utf8"));
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final()
    ]);
    return {
      contractVersion: "0.1.0",
      algorithm: "aes-256-gcm",
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
      updatedAt: now().toISOString()
    };
  }

  function decrypt(reference: SecretReferenceV010, record: EncryptedSecretRecordV010): string {
    if (record.algorithm !== "aes-256-gcm") throw new Error("SECRET_ALGORITHM_UNSUPPORTED");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(record.iv, "base64")
    );
    decipher.setAAD(Buffer.from(identity(reference), "utf8"));
    decipher.setAuthTag(Buffer.from(record.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(record.ciphertext, "base64")),
      decipher.final()
    ]).toString("utf8");
  }

  return {
    describe(reference) {
      return descriptor(reference, state.records[identity(reference)]);
    },
    resolve(reference) {
      const record = state.records[identity(reference)];
      if (!record) {
        throw new Error(`SECRET_NOT_FOUND: ${reference.namespace}: ${reference.key}`);
      }
      return decrypt(reference, record);
    },
    put(reference, value) {
      const normalized = value.trim();
      if (!normalized) throw new Error("SECRET_VALUE_EMPTY");
      const record = encrypt(reference, normalized);
      state.records[identity(reference)] = record;
      persist();
      return descriptor(reference, record);
    },
    remove(reference) {
      delete state.records[identity(reference)];
      persist();
    },
    listMetadata(namespace) {
      const result: SecretDescriptorV010[] = [];
      for (const [key, record] of Object.entries(state.records)) {
        const [secretNamespace, secretKey, scope, scopeId] = key.split("\u0000");
        if (namespace && secretNamespace !== namespace) continue;
        result.push({
          contractVersion: "0.1.0",
          reference: {
            contractVersion: "0.1.0",
            namespace: secretNamespace!,
            key: secretKey!,
            scope: scope as SecretReferenceV010["scope"],
            ...(scope !== "SYSTEM" ? { scopeId } : {})
          },
          configured: true,
          updatedAt: record.updatedAt
        });
      }
      return result.sort((a, b) =>
        a.reference.namespace.localeCompare(b.reference.namespace)
        || a.reference.key.localeCompare(b.reference.key)
      );
    }
  };
}
