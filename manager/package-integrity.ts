import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  KeyObject
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type {
  PackageManifestV010,
  PluginArtifactIntegrityV010,
  PluginIntegrityV010,
  PluginProvenanceV010
} from "../contracts/package.js";

export type PluginIntegrityStateV010 =
  | "VERIFIED"
  | "UNSIGNED"
  | "UNTRUSTED"
  | "INVALID"
  | "PENDING_ARTIFACT";

export interface TrustedPublisherKeyV010 {
  publisherId: string;
  keyId: string;
  algorithm: "Ed25519";
  publicKeyPem: string;
  status?: "TRUSTED" | "REVOKED";
  source?: string;
}

export interface PluginIntegrityTrustStoreV010 {
  get(publisherId: string, keyId: string): TrustedPublisherKeyV010 | undefined;
  list(): TrustedPublisherKeyV010[];
}

export interface PluginIntegrityVerificationV010 {
  state: PluginIntegrityStateV010;
  packageId: string;
  publisherId?: string;
  keyId?: string;
  algorithm?: "Ed25519";
  digest?: string;
  provenance?: PluginProvenanceV010;
  message: string;
}

export interface CreateIntegrityOptionsV010 {
  keyId: string;
  artifact?: PluginArtifactIntegrityV010;
  provenance?: PluginProvenanceV010;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, canonicalize(child)])
  );
}

function signingPayload(
  pkg: PackageManifestV010,
  integrity: Omit<PluginIntegrityV010, "signature">
): Buffer {
  const value = {
    ...structuredClone(pkg),
    integrity: {
      ...structuredClone(integrity),
      signature: ""
    }
  };
  return Buffer.from(JSON.stringify(canonicalize(value)), "utf8");
}

function normalizePrivateKey(key: string | Buffer | KeyObject): KeyObject {
  return key instanceof KeyObject ? key : createPrivateKey(key);
}

function normalizePublicKey(key: string | Buffer | KeyObject): KeyObject {
  return key instanceof KeyObject ? key : createPublicKey(key);
}

export function sha256DigestV010(bytes: Buffer | Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function createPluginIntegrityV010(
  pkg: PackageManifestV010,
  privateKey: string | Buffer | KeyObject,
  options: CreateIntegrityOptionsV010
): PluginIntegrityV010 {
  const unsigned: Omit<PluginIntegrityV010, "signature"> = {
    format: "EVO-SIGNATURE-v0.1",
    algorithm: "Ed25519",
    keyId: options.keyId,
    ...(options.artifact ? { artifact: structuredClone(options.artifact) } : {}),
    ...(options.provenance ? { provenance: structuredClone(options.provenance) } : {})
  };
  const signature = sign(null, signingPayload(pkg, unsigned), normalizePrivateKey(privateKey));
  return {
    ...unsigned,
    signature: signature.toString("base64")
  };
}

export function createMemoryPluginIntegrityTrustStoreV010(
  keys: TrustedPublisherKeyV010[] = []
): PluginIntegrityTrustStoreV010 {
  const byId = new Map<string, TrustedPublisherKeyV010>();
  for (const key of keys) {
    const id = `${key.publisherId}\n${key.keyId}`;
    if (byId.has(id)) {
      throw new Error(`PLUGIN_TRUST_KEY_DUPLICATE: ${key.publisherId}/${key.keyId}`);
    }
    byId.set(id, structuredClone(key));
  }
  return {
    get(publisherId, keyId) {
      const key = byId.get(`${publisherId}\n${keyId}`);
      return key ? structuredClone(key) : undefined;
    },
    list() {
      return [...byId.values()]
        .sort((a, b) => a.publisherId.localeCompare(b.publisherId) || a.keyId.localeCompare(b.keyId))
        .map(value => structuredClone(value));
    }
  };
}

interface TrustStoreFileV010 {
  contractVersion: "0.1.0";
  keys: TrustedPublisherKeyV010[];
}

export function createFilePluginIntegrityTrustStoreV010(
  filePath: string
): PluginIntegrityTrustStoreV010 {
  if (!existsSync(filePath)) {
    throw new Error(`PLUGIN_TRUST_STORE_NOT_FOUND: ${filePath}`);
  }
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as TrustStoreFileV010;
  if (parsed.contractVersion !== "0.1.0" || !Array.isArray(parsed.keys)) {
    throw new Error(`PLUGIN_TRUST_STORE_INVALID: ${filePath}`);
  }
  return createMemoryPluginIntegrityTrustStoreV010(parsed.keys);
}

export function verifyPackageIntegrityV010(
  pkg: PackageManifestV010,
  trustStore: PluginIntegrityTrustStoreV010,
  artifactBytes?: Buffer | Uint8Array
): PluginIntegrityVerificationV010 {
  const publisherId = pkg.publisher?.id;
  const integrity = pkg.integrity;

  if (!integrity) {
    return {
      state: "UNSIGNED",
      packageId: pkg.packageId,
      publisherId,
      message: "Package does not carry an EVO signature envelope."
    };
  }

  if (!publisherId) {
    return {
      state: "INVALID",
      packageId: pkg.packageId,
      keyId: integrity.keyId,
      algorithm: integrity.algorithm,
      digest: integrity.artifact?.digest,
      provenance: integrity.provenance,
      message: "Signed package is missing publisher identity."
    };
  }

  const trustedKey = trustStore.get(publisherId, integrity.keyId);
  if (!trustedKey || trustedKey.status === "REVOKED") {
    return {
      state: "UNTRUSTED",
      packageId: pkg.packageId,
      publisherId,
      keyId: integrity.keyId,
      algorithm: integrity.algorithm,
      digest: integrity.artifact?.digest,
      provenance: integrity.provenance,
      message: trustedKey?.status === "REVOKED"
        ? "Publisher signing key is revoked."
        : "Publisher signing key is not trusted by this Host."
    };
  }

  if (trustedKey.algorithm !== integrity.algorithm) {
    return {
      state: "INVALID",
      packageId: pkg.packageId,
      publisherId,
      keyId: integrity.keyId,
      algorithm: integrity.algorithm,
      digest: integrity.artifact?.digest,
      provenance: integrity.provenance,
      message: "Signature algorithm does not match trusted key metadata."
    };
  }

  const { signature, ...unsigned } = integrity;
  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(signature, "base64");
  } catch {
    return {
      state: "INVALID",
      packageId: pkg.packageId,
      publisherId,
      keyId: integrity.keyId,
      algorithm: integrity.algorithm,
      message: "Signature is not valid base64."
    };
  }

  const signatureValid = verify(
    null,
    signingPayload(pkg, unsigned),
    normalizePublicKey(trustedKey.publicKeyPem),
    signatureBytes
  );

  if (!signatureValid) {
    return {
      state: "INVALID",
      packageId: pkg.packageId,
      publisherId,
      keyId: integrity.keyId,
      algorithm: integrity.algorithm,
      digest: integrity.artifact?.digest,
      provenance: integrity.provenance,
      message: "Package signature verification failed."
    };
  }

  if (integrity.artifact && artifactBytes === undefined) {
    return {
      state: "PENDING_ARTIFACT",
      packageId: pkg.packageId,
      publisherId,
      keyId: integrity.keyId,
      algorithm: integrity.algorithm,
      digest: integrity.artifact.digest,
      provenance: integrity.provenance,
      message: "Signature is valid; artifact digest will be verified when artifact bytes are available."
    };
  }

  if (integrity.artifact && artifactBytes !== undefined) {
    const actualDigest = sha256DigestV010(artifactBytes);
    if (actualDigest !== integrity.artifact.digest) {
      return {
        state: "INVALID",
        packageId: pkg.packageId,
        publisherId,
        keyId: integrity.keyId,
        algorithm: integrity.algorithm,
        digest: integrity.artifact.digest,
        provenance: integrity.provenance,
        message: `Artifact digest mismatch. Expected ${integrity.artifact.digest}, got ${actualDigest}.`
      };
    }
  }

  return {
    state: "VERIFIED",
    packageId: pkg.packageId,
    publisherId,
    keyId: integrity.keyId,
    algorithm: integrity.algorithm,
    digest: integrity.artifact?.digest,
    provenance: integrity.provenance,
    message: "Package signature and available artifact digest are verified."
  };
}
