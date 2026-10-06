import type { Template2dPreviewV010 } from "./template-preview.js";

export const DEFINITION_2D_PREVIEW_ROUTE_V010 = "/definition-preview/2d" as const;
export const DEFINITION_2D_EDITOR_ROUTE_V010 = "/definition-preview/2d/edit" as const;

export interface DefinitionProjectionRouteIdentityV010 {
  definitionId: string;
  definitionRevision: number;
  projectionId: string;
}

function definitionProjectionRouteV010(
  baseRoute: typeof DEFINITION_2D_PREVIEW_ROUTE_V010 | typeof DEFINITION_2D_EDITOR_ROUTE_V010,
  identity: DefinitionProjectionRouteIdentityV010
): string {
  if (!identity.definitionId.trim()) {
    throw new Error("DEFINITION_PROJECTION_DEFINITION_ID_REQUIRED");
  }
  if (
    !Number.isInteger(identity.definitionRevision)
    || identity.definitionRevision < 0
  ) {
    throw new Error("DEFINITION_PROJECTION_REVISION_INVALID");
  }
  if (!identity.projectionId.trim()) {
    throw new Error("DEFINITION_PROJECTION_ID_REQUIRED");
  }
  const query = new URLSearchParams({
    definitionId: identity.definitionId.trim(),
    definitionRevision: String(identity.definitionRevision),
    projectionId: identity.projectionId.trim()
  });
  return `${baseRoute}?${query.toString()}`;
}

export function definition2dPreviewRouteV010(
  identity: DefinitionProjectionRouteIdentityV010
): string {
  return definitionProjectionRouteV010(
    DEFINITION_2D_PREVIEW_ROUTE_V010,
    identity
  );
}

export function definition2dEditorRouteV010(
  identity: DefinitionProjectionRouteIdentityV010
): string {
  return definitionProjectionRouteV010(
    DEFINITION_2D_EDITOR_ROUTE_V010,
    identity
  );
}

export function parseDefinitionProjectionRouteV010(
  route: string | undefined,
  expectedRoute:
    | typeof DEFINITION_2D_PREVIEW_ROUTE_V010
    | typeof DEFINITION_2D_EDITOR_ROUTE_V010
): DefinitionProjectionRouteIdentityV010 | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== expectedRoute) return undefined;
  const definitionId = url.searchParams.get("definitionId")?.trim();
  const revisionText = url.searchParams.get("definitionRevision")?.trim();
  const projectionId = url.searchParams.get("projectionId")?.trim();
  if (
    !definitionId
    || !revisionText
    || !/^\d+$/u.test(revisionText)
    || !projectionId
  ) {
    return undefined;
  }
  const definitionRevision = Number.parseInt(revisionText, 10);
  if (!Number.isSafeInteger(definitionRevision) || definitionRevision < 0) {
    return undefined;
  }
  return { definitionId, definitionRevision, projectionId };
}

export interface DefinitionProjectionArtifactV010 {
  contractVersion: "0.1.0";
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  projectionId?: string;
  title: string;
  description?: string;
  definitionKind: string;
  diagram2d?: Template2dPreviewV010;
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
  camera?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
}

export interface DefinitionProjectionArtifactSourceV010 {
  get(input: {
    enterpriseId: string;
    definitionId: string;
    definitionRevision?: number;
    projectionId?: string;
    includeHidden?: boolean;
  }): DefinitionProjectionArtifactV010 | undefined;
}

export interface DefinitionProjectionSelectionV010 {
  contractVersion: "0.1.0";
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  projectionId?: string;
  selectedAt: string;
}

export interface DefinitionProjectionSessionStoreV010 {
  set(sessionKey: string, selection: DefinitionProjectionSelectionV010): void;
  get(sessionKey: string): DefinitionProjectionSelectionV010 | undefined;
  remove(sessionKey: string): void;
}

export function createMemoryDefinitionProjectionSessionStoreV010():
DefinitionProjectionSessionStoreV010 {
  const state = new Map<string, DefinitionProjectionSelectionV010>();
  return {
    set(key, value) {
      state.set(key, structuredClone(value));
    },
    get(key) {
      const value = state.get(key);
      return value ? structuredClone(value) : undefined;
    },
    remove(key) {
      state.delete(key);
    }
  };
}
