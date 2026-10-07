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
import {
  applyEidosTextScalePreferenceV010,
  normalizeEidosTextScalePreferenceV010,
  type EidosTextScalePreferenceV010
} from "../vendor/eidos/src/design-language/index.js";

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

export function currentUserLogoutActionV010(locale: string): string {
  const normalizedLocale = locale.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en";
  const returnTo = "/login?locale=" + encodeURIComponent(normalizedLocale);
  return "/auth/logout?returnTo=" + encodeURIComponent(returnTo);
}

export function applyExclusiveChatWorkspacePresentationV010(
  root: HTMLElement
): boolean {
  const workspaceHasChat = Boolean(
    root.querySelector(
      "[data-eidos-workspace-content] > [data-eidos-chat]"
    )
  );
  const sidePanelHasChat = Boolean(
    root.querySelector(
      "[data-eidos-side-panel-content] > [data-eidos-chat]"
    )
  );
  const exclusive = workspaceHasChat && sidePanelHasChat;
  const sidePanel = root.querySelector<HTMLElement>("[data-eidos-side-panel]");
  const splitter = root.querySelector<HTMLElement>("[data-eidos-workbench-splitter]");
  const workspace = root.querySelector<HTMLElement>("[data-eidos-workspace]");

  if (exclusive) {
    root.setAttribute("data-evo-workspace-chat-exclusive", "true");
    root.style.gridTemplateColumns =
      "var(--eidos-activity-width) 0 0 minmax(0,1fr)";
    if (sidePanel) sidePanel.style.display = "none";
    if (splitter) splitter.style.display = "none";
    if (workspace) workspace.style.gridColumn = "2 / 5";
    return true;
  }

  root.removeAttribute("data-evo-workspace-chat-exclusive");
  root.style.removeProperty("grid-template-columns");
  sidePanel?.style.removeProperty("display");
  splitter?.style.removeProperty("display");
  workspace?.style.removeProperty("grid-column");
  return false;
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
  let activeLocale = options.initialLocale;
  const actionHost = createAppManagerActionHost({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    locale: () => activeLocale
  });
  let activeTextScale: EidosTextScalePreferenceV010 =
    normalizeEidosTextScalePreferenceV010(
      window.localStorage.getItem("evo.textScale")
    );
  applyEidosTextScalePreferenceV010(
    document.documentElement,
    activeTextScale
  );
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
    loadPage(page, readOptions) {
      return source.loadPage(page, readOptions);
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
      id: "help",
      title: "Help",
      icon: "help",
      kind: "workspace-route",
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
        avatar.setAttribute("data-eidos-account-avatar", "");
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
          row.setAttribute("data-eidos-account-row", "");
          const label = document.createElement("span");
          label.textContent = key;
          const data = document.createElement("strong");
          data.textContent = value;
          row.append(label, data);
          currentUserMenu.append(row);
        }

        const textScaleControl = document.createElement("label");
        textScaleControl.setAttribute("data-evo-text-scale-control", "");
        textScaleControl.setAttribute("data-eidos-text-scale-control", "");
        const textScaleLabel = document.createElement("span");
        textScaleLabel.textContent = zh ? "字体大小" : "Text size";
        const textScaleSelect = document.createElement("select");
        textScaleSelect.setAttribute("aria-label", textScaleLabel.textContent);
        const textScaleOptions: Array<[
          EidosTextScalePreferenceV010,
          string
        ]> = [
          ["system", zh ? "跟随系统" : "Follow system"],
          ["small", zh ? "小" : "Small"],
          ["standard", zh ? "标准" : "Standard"],
          ["large", zh ? "大" : "Large"]
        ];
        for (const [value, label] of textScaleOptions) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          option.selected = value === activeTextScale;
          textScaleSelect.appendChild(option);
        }
        textScaleSelect.addEventListener("change", () => {
          activeTextScale = normalizeEidosTextScalePreferenceV010(
            textScaleSelect.value
          );
          if (activeTextScale === "system") {
            window.localStorage.removeItem("evo.textScale");
          } else {
            window.localStorage.setItem("evo.textScale", activeTextScale);
          }
          applyEidosTextScalePreferenceV010(
            document.documentElement,
            activeTextScale
          );
        });
        textScaleControl.append(textScaleLabel, textScaleSelect);
        currentUserMenu.append(textScaleControl);

        const logoutForm = document.createElement("form");
        logoutForm.method = "post";
        logoutForm.action = currentUserLogoutActionV010(activeLocale);
        logoutForm.setAttribute("data-evo-current-user-logout", "");
        logoutForm.setAttribute("data-eidos-account-logout", "");
        const logoutButton = document.createElement("button");
        logoutButton.type = "submit";
        logoutButton.textContent = zh ? "退出登录" : "Sign out";
        logoutButton.setAttribute(
          "aria-label",
          zh ? "退出当前 EVO 会话" : "Sign out of the current EVO session"
        );
        logoutForm.style.marginTop = "var(--eidos-space-xs)";
        logoutForm.style.paddingTop = "var(--eidos-space-md)";
        logoutForm.style.borderTop = "1px solid var(--eidos-border)";
        logoutButton.style.width = "100%";
        logoutButton.style.minHeight = "var(--eidos-control-normal)";
        logoutButton.style.border = "1px solid var(--eidos-border-strong)";
        logoutButton.style.borderRadius = "var(--eidos-radius-md)";
        logoutButton.style.padding = "0 var(--eidos-space-md)";
        logoutButton.style.background = "var(--eidos-bg)";
        logoutButton.style.color = "var(--eidos-danger)";
        logoutButton.style.font = "inherit";
        logoutButton.style.fontSize = "var(--eidos-font-compact)";
        logoutButton.style.fontWeight = "600";
        logoutButton.style.textAlign = "left";
        logoutButton.style.cursor = "pointer";
        logoutForm.append(logoutButton);
        currentUserMenu.append(logoutForm);
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
      defaultActivityId: "apps",
      initialWorkspaceRoute: "/workspace",
      surfaceId: activeSurfaceId,
      activities: initialActivities.activities,
      actionHost,
      localization,
      minSidePanelWidth: 260,
      maxSidePanelWidth: 720,
      resolveAgentActivity(capability) {
        return !capability || capability === "agent.personal"
          ? "enterprise-agent"
          : undefined;
      },
      mountGlobalControls(container) {
        const contextControl = document.createElement("label");
        contextControl.setAttribute("data-evo-context-control", "");
        contextControl.setAttribute("data-eidos-global-control", "");
        contextLabel = document.createElement("span");
        contextLabel.setAttribute("data-evo-global-control-label", "");
        contextLabel.setAttribute("data-eidos-global-control-label", "");
        contextSelect = document.createElement("select");
        contextSelect.setAttribute("data-evo-context-select", "");
        contextSelect.setAttribute("data-eidos-global-control-select", "");
        contextControl.append(contextLabel, contextSelect);

        const userDetails = document.createElement("details");
        userDetails.setAttribute("data-evo-current-user", "");
        userDetails.setAttribute("data-eidos-account-control", "");
        currentUserSummary = document.createElement("summary");
        currentUserSummary.setAttribute("data-evo-current-user-summary", "");
        currentUserMenu = document.createElement("div");
        currentUserMenu.setAttribute("data-evo-current-user-menu", "");
        currentUserMenu.setAttribute("data-eidos-account-menu", "");
        userDetails.append(currentUserSummary, currentUserMenu);

        const localeControl =
          container.querySelector<HTMLElement>("[data-eidos-locale-control]");
        if (localeControl) {
          container.insertBefore(contextControl, localeControl);
        } else {
          container.prepend(contextControl);
        }
        container.append(userDetails);

        contextSelect.addEventListener("change", () => {
          const selected = contextSelect?.value.trim() ?? "";
          if (selected) {
            window.localStorage.setItem("evo.context.id", selected);
          } else {
            window.localStorage.removeItem("evo.context.id");
          }
          void workbench?.refresh();
        });

        refreshGlobalControlLabelsV010();
        void refreshContextControlV010();

        return () => {
          contextControl.remove();
          userDetails.remove();
          contextSelect = undefined;
          contextLabel = undefined;
          currentUserSummary = undefined;
          currentUserMenu = undefined;
        };
      },
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
              defaultContextId?: unknown;
              archivedContextId?: unknown;
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
                : "/enterprise-contexts/overview"
            );
            return;
          }

          const archivedContextId =
            typeof payload?.archivedContextId === "string"
              ? payload.archivedContextId.trim()
              : undefined;
          if (archivedContextId) {
            if (
              window.localStorage.getItem("evo.context.id")?.trim()
              === archivedContextId
            ) {
              window.localStorage.removeItem("evo.context.id");
            }
            await refreshContextControlV010();
            await workbench?.navigateWorkspace("/enterprise-contexts");
            return;
          }

          const defaultContextId =
            typeof payload?.defaultContextId === "string"
              ? payload.defaultContextId.trim()
              : undefined;
          if (defaultContextId) {
            await workbench?.navigateWorkspace("/enterprise-contexts");
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
            await workbench?.navigateWorkspace("/ledger");
            return;
          }

          const navigateTo =
            typeof payload?.navigateTo === "string"
              ? payload.navigateTo.trim()
              : "";
          if (navigateTo.startsWith("/")) {
            await workbench?.navigateWorkspace(navigateTo);
            return;
          }
        }
      }
    });

    await refreshContextControlV010();

    const workbenchRoot = document.querySelector<HTMLElement>(
      '[data-eidos-app-host-layout="workbench"]'
    );
    let chatWorkspaceObserver: MutationObserver | undefined;
    if (workbenchRoot) {
      const syncChatWorkspace = () => {
        applyExclusiveChatWorkspacePresentationV010(workbenchRoot);
      };
      const workspaceContent = workbenchRoot.querySelector<HTMLElement>(
        "[data-eidos-workspace-content]"
      );
      const sideContent = workbenchRoot.querySelector<HTMLElement>(
        "[data-eidos-side-panel-content]"
      );
      chatWorkspaceObserver = new MutationObserver(syncChatWorkspace);
      if (workspaceContent) {
        chatWorkspaceObserver.observe(workspaceContent, {
          childList: true
        });
      }
      if (sideContent) {
        chatWorkspaceObserver.observe(sideContent, {
          childList: true
        });
      }
      syncChatWorkspace();
    }
  
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
        chatWorkspaceObserver?.disconnect();
        workbench?.dispose();
        host.dispose();
      }
    };
}
