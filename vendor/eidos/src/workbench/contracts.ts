export type WorkbenchActivityKind =
  | "navigation"
  | "side-route"
  | "workspace-route"
  | "workspace-focus";

export type WorkbenchActivityPlacement = "primary" | "secondary";

export interface WorkbenchActivityV010 {
  id: string;
  title: string;
  icon: string;
  kind: WorkbenchActivityKind;
  route?: string;
  order?: number;
  placement?: WorkbenchActivityPlacement;
  localization?: {
    namespace: string;
    key: string;
  };
}

export function normalizeWorkbenchActivities(
  input: readonly WorkbenchActivityV010[]
): WorkbenchActivityV010[] {
  if (input.length === 0) throw new Error("EIDOS_WORKBENCH_ACTIVITY_REQUIRED");

  const ids = new Set<string>();
  const normalized = input.map(activity => {
    const id = activity.id.trim();
    const title = activity.title.trim();
    const icon = activity.icon.trim();
    const route = activity.route?.trim();

    if (!id) throw new Error("EIDOS_WORKBENCH_ACTIVITY_ID_REQUIRED");
    if (ids.has(id)) throw new Error(`EIDOS_WORKBENCH_ACTIVITY_DUPLICATE: ${id}`);
    ids.add(id);

    if (!title) throw new Error(`EIDOS_WORKBENCH_ACTIVITY_TITLE_REQUIRED: ${id}`);
    if (!icon) throw new Error(`EIDOS_WORKBENCH_ACTIVITY_ICON_REQUIRED: ${id}`);

    if (
      (activity.kind === "side-route" || activity.kind === "workspace-route")
      && !route
    ) {
      throw new Error(`EIDOS_WORKBENCH_ACTIVITY_ROUTE_REQUIRED: ${id}`);
    }

    if (
      activity.localization
      && (
        !activity.localization.namespace.trim()
        || !activity.localization.key.trim()
      )
    ) {
      throw new Error(`EIDOS_WORKBENCH_ACTIVITY_LOCALIZATION_INVALID: ${id}`);
    }

    return {
      ...activity,
      id,
      title,
      icon,
      ...(route ? { route } : {})
    };
  });

  return normalized.sort((a, b) =>
    (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id)
  );
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
