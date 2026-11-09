import {createHash,createHmac} from "node:crypto";
import type {AgentActionReceiptBeginInputV010} from "../../contracts/agent-action-receipt.js";
import type {EnterpriseResourceConditionalPutInputV010} from "../../contracts/enterprise-resource.js";

/**
 * Canonical digest of the exact resource CAS input, shared by trusted Host
 * approval and the PostgreSQL Owner. An expectedRevision/timestamp change
 * is a different write intent; never hide it behind an existing receipt key.
 */
function canonical(value: unknown): unknown {
  if(Array.isArray(value)) return value.map(canonical);
  if(value && typeof value==="object"){
    return Object.fromEntries(
      Object.entries(value as Record<string,unknown>)
        .filter(([,v])=>v!==undefined)
        .sort(([a],[b])=>a.localeCompare(b))
        .map(([k,v])=>[k,canonical(v)])
    );
  }
  return value;
}
export function stableResourceReceiptJsonV010(value: unknown): string {
  return JSON.stringify(canonical(value));
}
export function sha256ResourceReceiptV010(value: unknown): string {
  return createHash("sha256").update(stableResourceReceiptJsonV010(value)).digest("hex");
}
export function digestConditionalResourcePutV010(
  input:EnterpriseResourceConditionalPutInputV010
):string {
  return sha256ResourceReceiptV010(input);
}

/**
 * Host-only proof token, domain-separated from all other Agent/PA05 permits.
 * The verifier must be given a trusted secret by the Host owner; no secret is
 * embedded in a Feature/Action request or returned with the public receipt.
 */
export function hmacCv03HostResourceReceiptV010(
  receipt: AgentActionReceiptBeginInputV010,
  keyId: string,
  secret: string
): string {
  if (!/^[a-zA-Z0-9_-]{1,48}$/.test(keyId) ||
      Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("CV03_HOST_RECEIPT_SIGNING_CONFIG_INVALID");
  }
  return createHmac("sha256",secret).update(stableResourceReceiptJsonV010({
    domain:"cv03.enterprise-resource.host-write/0.1.0",
    keyId,
    receipt
  })).digest("hex");
}
