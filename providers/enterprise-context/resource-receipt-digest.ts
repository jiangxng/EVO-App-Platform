import {createHash} from "node:crypto";
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
