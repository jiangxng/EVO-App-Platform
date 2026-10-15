import type {
  ActiveContextRefV010, PlatformPrincipalV010
} from "../../contracts/platform-services.js";

/**
 * Host-authorized disclosure gate for a *current* Context Memory result.
 * The approval must cover the memory body and every provenance source,
 * including titles, snippets, document pointers, and download metadata
 * nested anywhere in the returned item. This has no model-granted override.
 * Refuse the whole result before it enters a model or tool response if one
 * disclosure cannot be proved. This is not a replacement for signed download
 * URL validation or historical Run/Conversation presentation authorization.
 */
export interface Pa04MemoryDisclosureAuthorityV010 {
  authorize(input: {
    principal: PlatformPrincipalV010;
    context: ActiveContextRefV010;
    memoryId: string;
    sourceContext: ActiveContextRefV010;
    evidenceRefs: string[];
    evidenceSourceIds: string[];
  }): Promise<boolean>;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}
function contextRef(value: unknown): ActiveContextRefV010 | undefined {
  const r=record(value);
  if (!r || (r.kind !== "PERSONAL" && r.kind !== "ENTERPRISE")
    || typeof r.contextId !== "string" || !r.contextId.trim()
    || (r.kind === "ENTERPRISE"
      && (typeof r.enterpriseId !== "string" || !r.enterpriseId.trim()))) {
    return undefined;
  }
  return r as unknown as ActiveContextRefV010;
}
function matching(a: ActiveContextRefV010, b: ActiveContextRefV010) {
  return a.kind === b.kind && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || (b.kind === "ENTERPRISE"
      && a.enterpriseId === b.enterpriseId));
}

export async function guardPa04ContextMemoryDisclosureV010(input: {
  result: unknown;
  principal: PlatformPrincipalV010;
  context: ActiveContextRefV010;
  authority: Pa04MemoryDisclosureAuthorityV010;
}): Promise<void> {
  const result=record(input.result);
  if (!result || !Array.isArray(result.items)) {
    throw Error("PA04_REFERENCE_DISCLOSURE_UNVERIFIED");
  }
  for (const value of result.items) {
    const item=record(value),provenance=record(item?.provenance);
    const context=contextRef(item?.context),sourceContext=contextRef(provenance?.sourceContext);
    const refs=provenance?.evidenceRefs;
    const sources=provenance?.evidenceSources;
    if (!item || typeof item.memoryId !== "string" || !item.memoryId.trim()
      || !context || !matching(context,input.context)
      || !sourceContext || !Array.isArray(refs)
      || refs.some(v=>typeof v !== "string" || !v.trim())
      || (sources!==undefined && (!Array.isArray(sources)
        || sources.some(v=>!record(v) || typeof record(v)?.sourceId !== "string"
          || !(record(v)?.sourceId as string).trim())))) {
      throw Error("PA04_REFERENCE_DISCLOSURE_UNVERIFIED");
    }
    let approved=false;
    try {
      approved=await input.authority.authorize({
        principal: input.principal, context:input.context,
        memoryId:item.memoryId,
        sourceContext,
        evidenceRefs:[...(refs as string[])],
        evidenceSourceIds:((sources??[]) as Record<string,unknown>[])
          .map(s=>s.sourceId as string)
      });
    } catch {
      approved=false;
    }
    if (approved!==true) {
      // Never put an inaccessible sourceId, memoryId, title, snippet or link
      // into the thrown error: the tool's generic error is all a model sees.
      throw Error("PA04_REFERENCE_DISCLOSURE_DENIED");
    }
  }
}
