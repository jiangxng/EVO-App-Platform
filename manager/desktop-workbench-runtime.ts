import {
  createAppHost
} from "../vendor/eidos/src/app-host/host.js";
import {
  createAppManagerActionHost
} from "../vendor/eidos/src/app-host/app-manager-action-host.js";
import type {
  ExperienceSource
} from "../vendor/eidos/src/app-host/contracts.js";
import type {
  LocalizationBundleSource
} from "../vendor/eidos/src/localization/contracts.js";
import {
  mountWorkbenchShell,
  type WorkbenchActivityV010,
  type WorkbenchShell
} from "../vendor/eidos/src/workbench/index.js";
import {
  createLocalizationRuntime,
  eidosAppHostLocalizationBundles
} from "../vendor/eidos/src/localization/index.js";
import {
  createFetchSseRealtimeSourceV010,
  type RealtimeEventV010
} from "../vendor/eidos/src/realtime/index.js";

type WorkbenchExperienceSource =
  ExperienceSource
  & LocalizationBundleSource;

export interface DesktopWorkbenchRuntimeV010 {
  dispose(): void;
}

interface BrowserContextOptionV010 {
  ref: {
    kind: "PERSONAL" | "ENTERPRISE";
    contextId: string;
    enterpriseId?: string;
  };
  label: string;
}

async function loadBrowserContextOptionsV010(
  fetchImpl: typeof fetch
): Promise<{
  options: BrowserContextOptionV010[];
  defaultContextId?: string;
}> {
  const response = await fetchImpl("/v1/contexts/effective", {
    headers: { accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`CONTEXT_OPTIONS_HTTP_${response.status}`);
  }
  const payload = await response.json() as {
    availableContextOptions?: BrowserContextOptionV010[];
    availableContexts?: BrowserContextOptionV010["ref"][];
    defaultActiveContext?: { contextId?: string };
  };
  const options = payload.availableContextOptions?.length
    ? payload.availableContextOptions
    : (payload.availableContexts ?? []).map(ref => ({
        ref,
        label: ref.contextId
      }));
  return {
    options,
    defaultContextId: payload.defaultActiveContext?.contextId
  };
}

export async function mountDesktopWorkbenchRuntimeV010(options: {
  source: WorkbenchExperienceSource;
  bootstrapManifests: unknown[];
  initialLocale: string;
  activeSurfaceId?: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<DesktopWorkbenchRuntimeV010> {
  const source = options.source;
  const actionHost = createAppManagerActionHost({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl
  });
  let activeLocale = options.initialLocale;
  const initialBundles = await source.listEffectiveLocalizationBundles();

  let pendingBootstrapManifests: unknown[] | undefined =
    options.bootstrapManifests;
  const host = createAppHost({
    async listEffectiveExperienceManifests() {
      if (pendingBootstrapManifests) {
        const manifests = pendingBootstrapManifests;
        pendingBootstrapManifests = undefined;
        return manifests.map(item => structuredClone(item));
      }
      return source.listEffectiveExperienceManifests();
    },
    loadPage(page) {
      return source.loadPage(page);
    }
  });

  const activeSurfaceId = options.activeSurfaceId;

  let activeBundleDigest = JSON.stringify(initialBundles);
  
  const localization = createLocalizationRuntime(
    [...eidosAppHostLocalizationBundles, ...initialBundles],
    {
      locale: options.initialLocale,
      fallbackLocales: ["en"]
    }
  );
  
  localization.subscribe(context => {
    activeLocale = context.locale;
    window.localStorage.setItem("evo.locale", context.locale);
  });
  
  async function refreshLocalizationBundles(): Promise<boolean> {
    const activeBundles = await source.listEffectiveLocalizationBundles();
    const digest = JSON.stringify(activeBundles);
    if (digest === activeBundleDigest) return false;
    activeBundleDigest = digest;
    localization.replaceBundles([
      ...eidosAppHostLocalizationBundles,
      ...activeBundles
    ]);
    return true;
  }
  
  const platformActivities: WorkbenchActivityV010[] = [
    {
      id: "apps",
      title: "Apps",
      icon: "dashboard",
      kind: "navigation",
      order: 10,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.apps"
      }
    },
    {
      id: "plugins",
      title: "Plugins",
      icon: "plugins",
      kind: "workspace-route",
      route: "/store",
      order: 30,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.plugins"
      }
    },
    {
      id: "workspace",
      title: "Workspace",
      icon: "workspace",
      kind: "workspace-focus",
      order: 40,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.workspace"
      }
    },
    {
      id: "memory",
      title: "Memory",
      icon: "database",
      kind: "workspace-route",
      route: "/memory",
      order: 50,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.memory"
      }
    },
    {
      id: "help",
      title: "Help",
      icon: "help",
      kind: "side-route",
      route: "/help",
      order: 900,
      placement: "secondary",
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.help"
      }
    },
    {
      id: "settings",
      title: "Settings",
      icon: "settings",
      kind: "workspace-route",
      route: "/settings",
      order: 1000,
      placement: "secondary",
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.settings"
      }
    }
  ];
  
  let lastEffectiveActivities = [...platformActivities];
  let workbenchActivitiesEtag: string | undefined;
  
  async function loadEffectiveWorkbenchActivities(): Promise<{
    activities: WorkbenchActivityV010[];
    changed: boolean;
  }> {
    try {
      const headers: Record<string, string> = {
        accept: "application/json"
      };
      if (workbenchActivitiesEtag) {
        headers["if-none-match"] = workbenchActivitiesEtag;
      }
      const response = await (options.fetchImpl ?? fetch)(
        "/v1/workbench/activities",
        { headers }
      );
      if (response.status === 304) {
        return {
          activities: [...lastEffectiveActivities],
          changed: false
        };
      }
      if (!response.ok) {
        throw new Error(`WORKBENCH_ACTIVITIES_HTTP_${response.status}`);
      }
      workbenchActivitiesEtag =
        response.headers.get("etag") ?? workbenchActivitiesEtag;
      const contributions = await response.json() as Array<
        WorkbenchActivityV010 & {
          contractVersion?: string;
          packageId?: string;
          featureId?: string;
        }
      >;
      const next = [
        ...platformActivities,
        ...contributions.map(({
          contractVersion: _contractVersion,
          packageId: _packageId,
          featureId: _featureId,
          ...activity
        }) => activity)
      ];
      const changed = JSON.stringify(next) !== JSON.stringify(lastEffectiveActivities);
      lastEffectiveActivities = next;
      return {
        activities: [...lastEffectiveActivities],
        changed
      };
    } catch (error) {
      console.error(
        "Failed to refresh Workbench activities; keeping last known effective set.",
        error
      );
      return {
        activities: [...lastEffectiveActivities],
        changed: false
      };
    }
  }
  
  let workbench: WorkbenchShell | undefined;
  
  let topologyRefresh: Promise<void> | undefined;
  async function refreshHostTopology(): Promise<void> {
    if (topologyRefresh) return topologyRefresh;
    topologyRefresh = (async () => {
      await host.refresh();
      await refreshLocalizationBundles();
      const activities = await loadEffectiveWorkbenchActivities();
      if (activities.changed) {
        await workbench?.setActivities(activities.activities);
      }
    })();
    try {
      await topologyRefresh;
    } finally {
      topologyRefresh = undefined;
    }
  }
  
  const locallyAppliedCorrelations = new Map<string, number>();
  const LOCAL_CORRELATION_TTL_MS = 30_000;
  
  function pruneLocalCorrelations(now = Date.now()): void {
    for (const [correlationId, recordedAt] of locallyAppliedCorrelations) {
      if (now - recordedAt > LOCAL_CORRELATION_TTL_MS) {
        locallyAppliedCorrelations.delete(correlationId);
      }
    }
  }
  
  function rememberLocallyAppliedCorrelation(result: unknown): void {
    if (
      result === null
      || typeof result !== "object"
      || Array.isArray(result)
      || (result as { ok?: unknown }).ok !== true
    ) {
      return;
    }
    const correlationId = (result as { correlationId?: unknown }).correlationId;
    if (typeof correlationId !== "string" || !correlationId.trim()) return;
    pruneLocalCorrelations();
    locallyAppliedCorrelations.set(correlationId.trim(), Date.now());
  }
  
  function isLocalEcho(event: RealtimeEventV010): boolean {
    if (!event.correlationId) return false;
    pruneLocalCorrelations();
    if (!locallyAppliedCorrelations.has(event.correlationId)) return false;
    locallyAppliedCorrelations.delete(event.correlationId);
    return true;
  }
  
  let topologyEventTimer: ReturnType<typeof setTimeout> | undefined;
  
  
    const initialActivities = await loadEffectiveWorkbenchActivities();
  
    workbench = await mountWorkbenchShell({
      host,
      container: "#app",
      title: "EVO",
      defaultActivityId: "plugins",
      initialWorkspaceRoute: "/store",
      surfaceId: activeSurfaceId,
      activities: initialActivities.activities,
      actionHost,
      localization,
      minSidePanelWidth: 260,
      maxSidePanelWidth: 720,
      async onActionResult(result, page, renderHint) {
        if (renderHint?.preserveMountedPage === true) {
          rememberLocallyAppliedCorrelation(result);
        }

        if (
          result !== null
          && typeof result === "object"
          && !Array.isArray(result)
          && (result as { ok?: unknown }).ok === true
        ) {
          const payload = (result as {
            result?: {
              context?: { contextId?: unknown };
              targetContextId?: unknown;
              copiedState?: unknown;
              selectedContextId?: unknown;
              navigateTo?: unknown;
            };
          }).result;

          const createdContextId =
            page.page.id === "evo-enterprise-context-governance.create"
            && typeof payload?.context?.contextId === "string"
              ? payload.context.contextId.trim()
              : undefined;
          if (createdContextId) {
            window.localStorage.setItem("evo.context.id", createdContextId);
            await refreshContextControlV010(createdContextId);
            await workbench?.navigateWorkspace("/enterprise-contexts");
            return;
          }

          const selectedContextId =
            typeof payload?.selectedContextId === "string"
              ? payload.selectedContextId.trim()
              : undefined;
          if (selectedContextId) {
            window.localStorage.setItem("evo.context.id", selectedContextId);
            await refreshContextControlV010(selectedContextId);
            await workbench?.navigateWorkspace(
              typeof payload?.navigateTo === "string"
                ? payload.navigateTo
                : "/enterprise-contexts/software"
            );
            return;
          }

          const copiedContextId =
            typeof payload?.targetContextId === "string"
            && typeof payload?.copiedState === "string"
              ? payload.targetContextId.trim()
              : undefined;
          if (copiedContextId) {
            window.localStorage.setItem("evo.context.id", copiedContextId);
            await refreshContextControlV010(copiedContextId);
            await workbench?.navigateWorkspace("/enterprise-contexts/software");
          }
        }
      }
    });

    const contextControl = document.createElement("label");
    contextControl.setAttribute("data-evo-context-control", "");
    contextControl.style.display = "grid";
    contextControl.style.gap = "4px";
    contextControl.style.marginBottom = "10px";
    const contextLabel = document.createElement("span");
    contextLabel.textContent = activeLocale.toLowerCase().startsWith("zh")
      ? "当前上下文"
      : "Current Context";
    contextLabel.style.fontSize = "12px";
    const contextSelect = document.createElement("select");
    contextSelect.setAttribute("data-evo-context-select", "");
    contextSelect.style.width = "100%";
    contextControl.append(contextLabel, contextSelect);
    document.querySelector<HTMLElement>("[data-eidos-side-panel-footer]")
      ?.prepend(contextControl);

    async function refreshContextControlV010(
      preferredContextId?: string
    ): Promise<void> {
      try {
        const loaded = await loadBrowserContextOptionsV010(
          options.fetchImpl ?? fetch
        );
        const persisted =
          preferredContextId
          ?? window.localStorage.getItem("evo.context.id")?.trim()
          ?? loaded.defaultContextId;
        contextSelect.replaceChildren();
        for (const item of loaded.options) {
          const option = document.createElement("option");
          option.value = item.ref.contextId;
          option.textContent = item.ref.kind === "ENTERPRISE"
            ? `🏢 ${item.label}`
            : `👤 ${item.label}`;
          option.selected = item.ref.contextId === persisted;
          contextSelect.appendChild(option);
        }
        if (
          persisted
          && loaded.options.some(item => item.ref.contextId === persisted)
        ) {
          window.localStorage.setItem("evo.context.id", persisted);
        } else {
          window.localStorage.removeItem("evo.context.id");
        }
      } catch (error) {
        console.error("Failed to refresh Enterprise Context selector.", error);
      }
    }

    contextSelect.addEventListener("change", () => {
      const selected = contextSelect.value.trim();
      if (selected) window.localStorage.setItem("evo.context.id", selected);
      else window.localStorage.removeItem("evo.context.id");
      void workbench?.refresh();
    });
    await refreshContextControlV010();
  
    const realtime = createFetchSseRealtimeSourceV010({
      url: () => window.location.origin + "/v1/events",
      fetchImpl: options.fetchImpl
    });
  
    const scheduleTopologyRefresh = () => {
      if (topologyEventTimer !== undefined) return;
      topologyEventTimer = setTimeout(() => {
        topologyEventTimer = undefined;
        void refreshHostTopology();
      }, 50);
    };
  
    const unsubscribeRealtime = realtime.subscribe(event => {
      if (isLocalEcho(event)) return;
  
      if (event.type === "HOST_TOPOLOGY_CHANGED") {
        scheduleTopologyRefresh();
        return;
      }
  
      if (event.type === "RESET_REQUIRED") {
        scheduleTopologyRefresh();
      }
  
      workbench?.notifyRealtimeEvent(event);
    });
  
    realtime.connect();

    let disposed = false;
    return {
      dispose() {
        if (disposed) return;
        disposed = true;
        if (topologyEventTimer !== undefined) {
          clearTimeout(topologyEventTimer);
          topologyEventTimer = undefined;
        }
        unsubscribeRealtime();
        realtime.dispose();
        workbench?.dispose();
        host.dispose();
      }
    };
}
