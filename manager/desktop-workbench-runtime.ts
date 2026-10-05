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

interface BrowserPrincipalV010 {
  subjectId: string;
  actorType: string;
  identityProviderId: string;
  displayName?: string;
}

interface BrowserSessionSnapshotV010 {
  sessionId: string;
  principal: BrowserPrincipalV010;
}

export function currentUserDisplayNameV010(
  principal: BrowserPrincipalV010
): string {
  return principal.displayName?.trim() || principal.subjectId;
}

async function loadBrowserContextOptionsV010(
  fetchImpl: typeof fetch
): Promise<{
  options: BrowserContextOptionV010[];
  defaultContextId?: string;
  session?: BrowserSessionSnapshotV010;
}> {
  const response = await fetchImpl("/v1/contexts/effective", {
    headers: { accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`CONTEXT_OPTIONS_HTTP_${response.status}`);
  }
  const payload = await response.json() as {
    session?: BrowserSessionSnapshotV010;
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
    defaultContextId: payload.defaultActiveContext?.contextId,
    session: payload.session
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
  let contextSelect: HTMLSelectElement | undefined;
  let contextLabel: HTMLSpanElement | undefined;
  let currentUserSummary: HTMLElement | undefined;
  let currentUserMenu: HTMLElement | undefined;
  let currentSession: BrowserSessionSnapshotV010 | undefined;
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
    refreshGlobalControlLabelsV010();
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
  
  
    function refreshGlobalControlLabelsV010(): void {
      const zh = activeLocale.toLowerCase().startsWith("zh");
      if (contextLabel) {
        contextLabel.textContent = zh ? "当前企业" : "Current enterprise";
      }
      if (currentUserSummary) {
        const principal = currentSession?.principal;
        currentUserSummary.replaceChildren();
        const avatar = document.createElement("span");
        avatar.setAttribute("data-evo-current-user-avatar", "");
        const label = principal
          ? currentUserDisplayNameV010(principal)
          : (zh ? "当前用户" : "Current user");
        avatar.textContent = label.slice(0, 1).toUpperCase();
        const name = document.createElement("span");
        name.textContent = label;
        currentUserSummary.append(avatar, name);
      }
      if (currentUserMenu) {
        currentUserMenu.replaceChildren();
        const principal = currentSession?.principal;
        if (!principal) {
          currentUserMenu.textContent = zh
            ? "当前会话用户信息不可用。"
            : "Current session user is unavailable.";
          return;
        }
        const rows: Array<[string, string]> = [
          [zh ? "用户" : "User", currentUserDisplayNameV010(principal)],
          ["Subject", principal.subjectId],
          [zh ? "身份提供方" : "Identity provider", principal.identityProviderId],
          [zh ? "会话" : "Session", currentSession?.sessionId ?? "—"]
        ];
        for (const [key, value] of rows) {
          const row = document.createElement("div");
          row.setAttribute("data-evo-current-user-row", "");
          const label = document.createElement("span");
          label.textContent = key;
          const data = document.createElement("strong");
          data.textContent = value;
          row.append(label, data);
          currentUserMenu.append(row);
        }
      }
    }

    async function refreshContextControlV010(
      preferredContextId?: string
    ): Promise<void> {
      try {
        const loaded = await loadBrowserContextOptionsV010(
          options.fetchImpl ?? fetch
        );
        currentSession = loaded.session;
        refreshGlobalControlLabelsV010();

        const enterpriseOptions = loaded.options.filter(
          item => item.ref.kind === "ENTERPRISE"
        );
        const persistedCandidate =
          preferredContextId
          ?? window.localStorage.getItem("evo.context.id")?.trim()
          ?? loaded.defaultContextId;
        const persisted = enterpriseOptions.some(
          item => item.ref.contextId === persistedCandidate
        )
          ? persistedCandidate
          : loaded.defaultContextId
            && enterpriseOptions.some(
              item => item.ref.contextId === loaded.defaultContextId
            )
              ? loaded.defaultContextId
              : enterpriseOptions[0]?.ref.contextId;

        contextSelect?.replaceChildren();
        if (contextSelect && enterpriseOptions.length === 0) {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = activeLocale.toLowerCase().startsWith("zh")
            ? "暂无企业"
            : "No enterprise";
          contextSelect.appendChild(option);
          contextSelect.disabled = true;
        } else if (contextSelect) {
          contextSelect.disabled = false;
          for (const item of enterpriseOptions) {
            const option = document.createElement("option");
            option.value = item.ref.contextId;
            option.textContent = `🏢 ${item.label}`;
            option.selected = item.ref.contextId === persisted;
            contextSelect.appendChild(option);
          }
        }

        if (persisted) {
          window.localStorage.setItem("evo.context.id", persisted);
        } else {
          window.localStorage.removeItem("evo.context.id");
        }
      } catch (error) {
        console.error("Failed to refresh Enterprise Context selector.", error);
      }
    }
  
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
      mountGlobalControls(container) {
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
