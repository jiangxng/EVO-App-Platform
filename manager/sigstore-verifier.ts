import {
  verify as verifySigstore,
  type Bundle,
  type VerifyOptions
} from "sigstore";
import type { PackageManifestV010 } from "../contracts/package.js";
import {
  verifyPackageIntegrityV010,
  type PluginIntegrityTrustStoreV010
} from "./package-integrity.js";

export type PluginExternalEvidenceStateV010 =
  | "VERIFIED"
  | "NOT_PRESENT"
  | "UNTRUSTED"
  | "INVALID";

export interface PluginExternalEvidenceVerificationV010 {
  state: PluginExternalEvidenceStateV010;
  packageId: string;
  evidenceType?: "SIGSTORE_BUNDLE";
  message: string;
}

export type SigstoreVerifyFunctionV010 = (
  bundle: Bundle,
  data: Buffer,
  options?: VerifyOptions
) => Promise<unknown>;

export async function verifySigstoreBundleEvidenceV010(
  pkg: PackageManifestV010,
  trustStore: PluginIntegrityTrustStoreV010,
  artifactBytes: Buffer | Uint8Array,
  verifyImpl: SigstoreVerifyFunctionV010 = verifySigstore
): Promise<PluginExternalEvidenceVerificationV010> {
  const provenance = pkg.integrity?.provenance;
  if (provenance?.type !== "SIGSTORE_BUNDLE") {
    return {
      state: "NOT_PRESENT",
      packageId: pkg.packageId,
      message: "Package does not declare Sigstore bundle evidence."
    };
  }

  const bundle = provenance.sigstore?.bundle;
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return {
      state: "INVALID",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: "Sigstore provenance is missing a serialized bundle object."
    };
  }

  const base = verifyPackageIntegrityV010(pkg, trustStore, artifactBytes);
  if (base.state !== "VERIFIED") {
    return {
      state: base.state === "UNTRUSTED" ? "UNTRUSTED" : "INVALID",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: `Native package integrity must verify before Sigstore evidence: ${base.message}`
    };
  }

  const publisherId = pkg.publisher?.id;
  const keyId = pkg.integrity?.keyId;
  if (!publisherId || !keyId) {
    return {
      state: "INVALID",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: "Sigstore evidence requires a trusted publisher/key identity."
    };
  }

  const trustedKey = trustStore.get(publisherId, keyId);
  const policy = trustedKey?.provenancePolicy?.sigstore;
  if (!trustedKey || trustedKey.status === "REVOKED" || !policy) {
    return {
      state: "UNTRUSTED",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: "Host trust store does not authorize Sigstore identity policy for this publisher key."
    };
  }

  if (!policy.certificateIssuer.trim()) {
    return {
      state: "UNTRUSTED",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: "Host Sigstore policy requires a certificate issuer."
    };
  }

  const identityEmail = policy.certificateIdentityEmail?.trim();
  const identityUri = policy.certificateIdentityURI?.trim();
  if ((!identityEmail && !identityUri) || (identityEmail && identityUri)) {
    return {
      state: "UNTRUSTED",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: "Host Sigstore policy must configure exactly one certificate identity: email or URI."
    };
  }

  const options: VerifyOptions = {
    certificateIssuer: policy.certificateIssuer,
    ...(identityEmail ? { certificateIdentityEmail: identityEmail } : {}),
    ...(identityUri ? { certificateIdentityURI: identityUri } : {}),
    tlogThreshold: policy.tlogThreshold ?? 1,
    ctLogThreshold: policy.ctLogThreshold ?? 1
  };

  try {
    await verifyImpl(
      bundle as Bundle,
      Buffer.from(artifactBytes),
      options
    );
    return {
      state: "VERIFIED",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: "Sigstore bundle, signing identity and transparency evidence verified."
    };
  } catch (error) {
    return {
      state: "INVALID",
      packageId: pkg.packageId,
      evidenceType: "SIGSTORE_BUNDLE",
      message: `Sigstore verification failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
