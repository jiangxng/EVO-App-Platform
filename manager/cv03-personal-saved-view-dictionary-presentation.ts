import type { AppActionRouter } from "../actions/router.js";
import type { BusinessDictionarySnapshotV010 } from "../contracts/reference-data/dictionary.js";
import type { PlatformRequestContextV010 } from "../contracts/platform-services.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import {
  createBusinessDictionaryDirectoryPageV010,
  createBusinessDictionaryContextRequiredPageV010
} from "../apps/business-dictionary/page.js";
import type {
  BusinessDictionaryDirectorySelectionV010
} from "../apps/business-dictionary/directory-query.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_ID_V010,
  BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010
} from "../apps/business-dictionary/collection-query.js";
import {
  PERSONAL_SAVED_VIEW_READ_V010
} from "../providers/enterprise-context/personal-saved-views.js";

/**
 * Opt-in Host presentation adapter. The Host already owns the authenticated
 * Dictionary collection, and invokes the existing Saved View READ Capability
 * Operation anew for the current Principal/Enterprise. This is not registered
 * by the production server and grants no WRITE/READ privilege of its own.
 */
export async function createCv03AuthorizedDictionarySavedViewPageV010(input: {
  actionRouter: AppActionRouter;
  context?: PlatformRequestContextV010;
  /** Already authorized by the real Business Dictionary Host owner. */
  dictionaries: readonly BusinessDictionarySnapshotV010[];
  effectiveVersions?: Readonly<Record<string, number>>;
  directorySelection: BusinessDictionaryDirectorySelectionV010;
  canManage: boolean;
  locale?: string;
  /** A selection hint, never an authorization token. */
  selectedPersonalViewId?: string;
}): Promise<CatalogBrowserV010> {
  const active = input.context?.context?.activeContext;
  const principal = input.context?.principal;
  if (!active || active.kind !== "ENTERPRISE" || !active.contextId?.trim() ||
      !active.enterpriseId?.trim() || !principal?.subjectId?.trim() ||
      !["HUMAN", "AI"].includes(principal.actorType) ||
      input.context?.delegatedActor ||
      input.context?.scope.enterpriseId !== active.enterpriseId ||
      (input.context?.scope.userId &&
        input.context.scope.userId !== principal.subjectId) ||
      (input.context?.context?.personalContext?.ownerSubjectId &&
        input.context.context.personalContext.ownerSubjectId !== principal.subjectId)) {
    return createBusinessDictionaryContextRequiredPageV010(input.locale);
  }
  const base = {
    dictionaries:input.dictionaries,
    ...(input.effectiveVersions ? {effectiveVersions:input.effectiveVersions} : {}),
    directorySelection:input.directorySelection,
    canManage:input.canManage,
    locale:input.locale
  };
  // The existing Dictionary page owns all routes, rows and Eidos rendering.
  // When the saved-view Feature is unavailable, the baseline page is intact.
  let response:Awaited<ReturnType<AppActionRouter["execute"]>>;
  try {
    response = await input.actionRouter.execute({
      contractVersion:"0.1.0",type:"command",
      command:{code:PERSONAL_SAVED_VIEW_READ_V010,inputVersion:"0.1.0"},
      values:{},
      actionId:PERSONAL_SAVED_VIEW_READ_V010,
      sourceInteractionId:"cv03.dictionary.page:"+input.context!.correlationId,
      requiresConfirmation:false
    }, input.context);
  } catch {
    return createBusinessDictionaryDirectoryPageV010(base);
  }
  if (!response.ok || !response.result ||
      typeof response.result !== "object" || Array.isArray(response.result)) {
    return createBusinessDictionaryDirectoryPageV010(base);
  }
  const data=(response.result as Record<string,unknown>).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return createBusinessDictionaryDirectoryPageV010(base);
  }
  const rows=(data as Record<string,unknown>).views;
  if (!Array.isArray(rows) || rows.length > 100) {
    return createBusinessDictionaryDirectoryPageV010(base);
  }
  const authorizedPersonalViews = rows.flatMap(value=>{
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const v=value as Record<string,unknown>;
    if (v.visibility !== "PERSONAL" ||
        v.ownerSubjectId !== principal.subjectId ||
        v.enterpriseId !== active.enterpriseId ||
        v.collectionId !== BUSINESS_DICTIONARY_COLLECTION_ID_V010 ||
        v.schemaRef !== BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010 ||
        v.queryOperationId !== "dictionary.collection.query" ||
        typeof v.viewId !== "string" ||
        !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(v.viewId) ||
        typeof v.title !== "string" || !v.title.trim() || v.title.length>120 ||
        !v.query || typeof v.query !== "object" || Array.isArray(v.query) ||
        !Array.isArray(v.columns) || v.columns.length<1 || v.columns.length>20 ||
        v.columns.some(c=>typeof c!=="string")) return [];
    const q=v.query as Record<string,unknown>;
    if (Object.keys(q).some(key=>!["view","search","sort","direction"].includes(key)) ||
        (q.view!==undefined && typeof q.view!=="string") ||
        (q.search!==undefined && typeof q.search!=="string") ||
        (q.sort!==undefined && typeof q.sort!=="string") ||
        (q.direction!==undefined && q.direction!=="asc" && q.direction!=="desc"))
      return [];
    return [{
      viewId:v.viewId,title:v.title,
      collectionId:BUSINESS_DICTIONARY_COLLECTION_ID_V010,
      schemaRef:BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010,
      query:q as {view?:string;search?:string;sort?:string;direction?:"asc"|"desc"},
      columns:v.columns as string[]
    }];
  });
  // Domain-owned page code again validates current collection/schema/fields
  // and constructs only Owner-allowlisted safe routes for Eidos table.views.
  return createBusinessDictionaryDirectoryPageV010({
    ...base,
    authorizedPersonalViews,
    selectedPersonalViewId:input.selectedPersonalViewId
  });
}
