export type WorkbenchActivityKind =
  | "navigation"
  | "side-route"
  | "workspace-route"
  | "workspace-focus";

export interface WorkbenchActivityV010 {
  id: string;
  title: string;
  icon: string;
  kind: WorkbenchActivityKind;
  route?: string;
  order?: number;
  localization?: {
    namespace: string;
    key: string;
  };
}

export interface WorkbenchLayoutStateV010 {
  contractVersion: "0.1.0";
  activeActivityId: string;
  sidePanelVisible: boolean;
  sidePanelWidth: number;
  workspaceTarget: string;
}

export interface WorkbenchLayoutStateStore {
  load(): WorkbenchLayoutStateV010 | undefined;
  save(state: WorkbenchLayoutStateV010): void;
}

export function createBrowserWorkbenchLayoutStateStore(
  storageKey = "eidos.workbench.layout"
): WorkbenchLayoutStateStore {
  return {
    load() {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as Partial<WorkbenchLayoutStateV010>;
        if (
          parsed.contractVersion !== "0.1.0"
          || typeof parsed.activeActivityId !== "string"
          || typeof parsed.sidePanelVisible !== "boolean"
          || typeof parsed.sidePanelWidth !== "number"
          || typeof parsed.workspaceTarget !== "string"
        ) {
          return undefined;
        }
        return parsed as WorkbenchLayoutStateV010;
      } catch {
        return undefined;
      }
    },
    save(state) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // Persistence failure must not break the workbench.
      }
    }
  };
}
