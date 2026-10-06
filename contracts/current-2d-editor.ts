export type Current2dEditorTargetV010 =
  | {
      contractVersion: "0.1.0";
      kind: "OPERATING_GRAPH";
      enterpriseId: string;
      graphId: string;
      resourceId: string;
      selectedAt: string;
    }
  | {
      contractVersion: "0.1.0";
      kind: "DEFINITION_PROJECTION";
      enterpriseId: string;
      definitionId: string;
      definitionRevision: number;
      projectionId: string;
      resourceId: string;
      selectedAt: string;
    };

export interface Current2dEditorSessionStoreV010 {
  set(sessionKey: string, target: Current2dEditorTargetV010): void;
  get(sessionKey: string): Current2dEditorTargetV010 | undefined;
  remove(sessionKey: string): void;
}

export function createMemoryCurrent2dEditorSessionStoreV010():
Current2dEditorSessionStoreV010 {
  const state = new Map<string, Current2dEditorTargetV010>();
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
