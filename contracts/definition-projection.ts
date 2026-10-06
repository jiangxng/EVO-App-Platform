import type { Template2dPreviewV010 } from "./template-preview.js";

export const DEFINITION_2D_PREVIEW_ROUTE_V010 = "/definition-preview/2d" as const;
export const DEFINITION_2D_EDITOR_ROUTE_V010 = "/definition-preview/2d/edit" as const;

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
