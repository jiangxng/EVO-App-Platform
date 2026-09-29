import type { ActionHost } from "../adapters/ports.js";
import { createEidosIconElement } from "../design-language/icons/index.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import type {
  AppHost,
  AppHostSnapshotV010,
  AppHostSurfaceTargetV010,
  ClientSurfaceProfileV010,
  EffectiveExperienceManifestV010
} from "../app-host/contracts.js";
import {
  readBrowserSurfaceProfileV010,
  resolveExperienceSurfaceV010,
  surfaceQueryValueV010,
  surfaceTargetFromUrlV010,
  type ExperienceSurfaceHandoffResolutionV010
} from "../app-host/surface.js";
import type { RealtimeEventV010 } from "../realtime/contracts.js";
import {
  mountAppHostLoadedPage,
  type AppHostChatState,
  type MountedAppHostPage
} from "../app-host/page-controller.js";
import { renderAppHostPageToHtml } from "../app-host/page-renderer.js";
import {
  createBrowserWorkbenchLayoutStateStore,
  normalizeWorkbenchActivities,
  type WorkbenchActivityV010,
  type WorkbenchLayoutStateStore,
  type WorkbenchLayoutStateV010
} from "./contracts.js";
import { resolveWorkbenchSurfaceRouteV010 } from "./surface-routing.js";

export interface WorkbenchShellOptions {
  host: AppHost;
  container: HTMLElement | string;
  activities: WorkbenchActivityV010[];
  defaultActivityId: string;
  title?: string;
  actionHost?: ActionHost;
  localization?: LocalizationRuntime;
  initialWorkspaceRoute?: string;
  /**
   * Legacy explicit Surface id used by existing Workbench embedders.
   * When declared by the owning Experience it is resolved to that Surface target.
   */
  surfaceId?: string;
  /**
   * Explicit user Surface preference. URL ?surface=... has higher precedence.
   */
  surfaceTarget?: AppHostSurfaceTargetV010;
  /**
   * Optional capability profile. Omit to retain desktop-compatible behavior.
   * Set autoSurfaceProfile=true to derive it from browser capabilities.
   */
  surfaceProfile?: ClientSurfaceProfileV010 | (() => ClientSurfaceProfileV010);
  autoSurfaceProfile?: boolean;
  layoutStateStore?: WorkbenchLayoutStateStore;
  minSidePanelWidth?: number;
  maxSidePanelWidth?: number;
  onActionResult?: Parameters<typeof mountAppHostLoadedPage>[0]["onActionResult"];
}

export interface WorkbenchShell {
  refresh(): Promise<AppHostSnapshotV010>;
  setActivities(activities: WorkbenchActivityV010[]): Promise<void>;
  setActivity(activityId: string): Promise<void>;
  toggleSidePanel(): Promise<void>;
  navigateWorkspace(target: string): Promise<void>;
  notifyRealtimeEvent(event: RealtimeEventV010): boolean;
  dispose(): void;
}

function resolveContainer(value: HTMLElement | string): HTMLElement {
  if (typeof value !== "string") return value;
  const element = document.querySelector<HTMLElement>(value);
  if (!element) throw new Error(`EIDOS_WORKBENCH_CONTAINER_NOT_FOUND: ${value}`);
  return element;
}

function currentHashPath(): string | undefined {
  const hash = window.location.hash;
  if (!hash || hash === "#") return undefined;
  return hash.startsWith("#") ? hash.slice(1) : hash;
}

function isExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function configuredSurfaceProfile(
  options: WorkbenchShellOptions
): ClientSurfaceProfileV010 | undefined {
  if (typeof options.surfaceProfile === "function") {
    return options.surfaceProfile();
  }
  if (options.surfaceProfile) return options.surfaceProfile;
  return options.autoSurfaceProfile
    ? readBrowserSurfaceProfileV010()
    : undefined;
}

export function resolveWorkbenchInitialTargetV010(input: {
  urlPath?: string;
  initialWorkspaceRoute?: string;
  persistedWorkspaceTarget?: string;
}): string {
  return input.urlPath?.trim()
    || input.initialWorkspaceRoute?.trim()
    || input.persistedWorkspaceTarget?.trim()
    || "/";
}

export async function mountWorkbenchShell(
  options: WorkbenchShellOptions
): Promise<WorkbenchShell> {
  const container = resolveContainer(options.container);
  const { host, localization } = options;
  let activities = normalizeWorkbenchActivities(options.activities);

  function fallbackActivity(): WorkbenchActivityV010 {
    return activities.find(item => item.id === options.defaultActivityId)
      ?? activities[0]!;
  }

  const defaultActivity = fallbackActivity();
  const stateStore = options.layoutStateStore
    ?? createBrowserWorkbenchLayoutStateStore("eidos.workbench.layout");
  const persisted = stateStore.load();
  const minWidth = options.minSidePanelWidth ?? 240;
  const maxWidth = options.maxSidePanelWidth ?? 720;
  const persistedActivity = persisted
    ? activities.find(item => item.id === persisted.activeActivityId)
    : undefined;

  let state: WorkbenchLayoutStateV010 = {
    contractVersion: "0.1.0",
    activeActivityId: persistedActivity?.id ?? defaultActivity.id,
    sidePanelVisible: persisted?.sidePanelVisible ?? true,
    sidePanelWidth: clamp(persisted?.sidePanelWidth ?? 360, minWidth, maxWidth),
    workspaceTarget: resolveWorkbenchInitialTargetV010({
      urlPath: currentHashPath(),
      initialWorkspaceRoute: options.initialWorkspaceRoute,
      persistedWorkspaceTarget: persisted?.workspaceTarget
    })
  };

  let disposed = false;
  let sideMount: MountedAppHostPage | undefined;
  let workspaceMount: MountedAppHostPage | undefined;
  let activeSurfaceId: string | undefined = options.surfaceId;
  let activeSurfaceTarget: AppHostSurfaceTargetV010 = "DESKTOP_WORKBENCH";
  let workspaceMode: "app" | "web" = state.workspaceTarget.startsWith("/") ? "app" : "web";
  const chatStates = new Map<string, AppHostChatState>();
  const pendingResourceRefreshes = new Set<string>();
  let resourceRefreshTimer: ReturnType<typeof setTimeout> | undefined;
  let resourceRefreshInFlight = false;

  const hostText = (
    key: string,
    fallback: string,
    params?: Record<string, string | number | boolean | null>
  ) => localization?.resolve("eidos.app-host", key, fallback, params) ?? fallback;

  function resolveSurface(path: string) {
    return resolveWorkbenchSurfaceRouteV010(host.getSnapshot(), {
      path,
      explicitTarget: surfaceTargetFromUrlV010(new URL(window.location.href)),
      userTarget: options.surfaceTarget,
      configuredSurfaceId: options.surfaceId,
      profile: configuredSurfaceProfile(options)
    });
  }

  function surfaceUrl(
    target: AppHostSurfaceTargetV010,
    routePath: string
  ): string {
    const url = new URL(window.location.href);
    url.searchParams.set("surface", surfaceQueryValueV010(target));
    url.hash = routePath;
    return url.toString();
  }

  function renderSurfaceHandoff(
    target: HTMLElement,
    manifest: EffectiveExperienceManifestV010,
    handoff: ExperienceSurfaceHandoffResolutionV010
  ): void {
    target.replaceChildren();
    target.setAttribute("data-eidos-surface-handoff", handoff.reason);

    const article = document.createElement("article");
    const title = document.createElement("h2");
    title.textContent = hostText(
      "surface.handoff.title",
      "This experience is not available on this surface."
    );
    const detail = document.createElement("p");
    detail.textContent = hostText(
      "surface.handoff.detail",
      "Choose an available experience surface to continue."
    );
    article.append(title, detail);

    for (const targetSurface of handoff.availableTargets) {
      const mapped = resolveExperienceSurfaceV010(manifest, {
        ...(handoff.semanticRouteId
          ? { semanticRouteId: handoff.semanticRouteId }
          : handoff.requestedPath
            ? { path: handoff.requestedPath }
            : {}),
        explicitTarget: targetSurface
      });
      if (mapped.kind !== "ROUTE") continue;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = hostText(
        "surface.handoff.openTarget",
        "Open {target}",
        { target: targetSurface }
      );
      button.setAttribute("data-eidos-surface-target", targetSurface);
      button.addEventListener("click", () => {
        window.location.href = surfaceUrl(targetSurface, mapped.route.path);
      });
      article.appendChild(button);
    }

    target.appendChild(article);
  }

  function applyActiveSurface(
    surfaceId: string,
    target: AppHostSurfaceTargetV010
  ): void {
    const changed =
      activeSurfaceId !== surfaceId
      || activeSurfaceTarget !== target;
    activeSurfaceId = surfaceId;
    activeSurfaceTarget = target;
    root.setAttribute("data-eidos-surface-id", surfaceId);
    root.setAttribute("data-eidos-surface-target", target);

    if (changed) {
      const current = activityById(state.activeActivityId);
      if (current?.kind === "navigation" && state.sidePanelVisible) {
        renderNavigationList(host.getSnapshot());
      }
    }
  }

  function setIconContent(
    element: HTMLElement,
    iconName: string,
    fallbackText?: string,
    size = 20
  ): void {
    element.replaceChildren();
    const icon = createEidosIconElement(iconName, { size });
    if (icon) {
      element.appendChild(icon);
      return;
    }
    if (fallbackText) element.textContent = fallbackText;
  }

  function setIconButton(
    button: HTMLButtonElement,
    iconName: string,
    label: string,
    size = 18
  ): void {
    button.setAttribute("data-eidos-icon-button", "");
    button.setAttribute("aria-label", label);
    button.title = label;
    setIconContent(button, iconName, undefined, size);
  }

  const root = document.createElement("div");
  root.setAttribute("data-eidos-app-host", "0.1.0");
  root.setAttribute("data-eidos-app-host-layout", "workbench");
  root.setAttribute("data-side-panel-visible", state.sidePanelVisible ? "true" : "false");
  root.setAttribute("data-mobile-surface", "panel");
  root.style.setProperty("--eidos-side-panel-width", `${state.sidePanelWidth}px`);

  const activityBar = document.createElement("nav");
  activityBar.setAttribute("data-eidos-activity-bar", "");
  activityBar.setAttribute("aria-label", hostText("workbench.activityBar", "Activity Bar"));

  const activityTop = document.createElement("div");
  activityTop.setAttribute("data-eidos-activity-primary", "");
  const activityBottom = document.createElement("div");
  activityBottom.setAttribute("data-eidos-activity-secondary", "");
  activityBar.append(activityTop, activityBottom);

  const sidePanel = document.createElement("aside");
  sidePanel.setAttribute("data-eidos-side-panel", "");

  const sideHeader = document.createElement("header");
  sideHeader.setAttribute("data-eidos-side-panel-header", "");
  const sideTitle = document.createElement("strong");
  const sideToggle = document.createElement("button");
  sideToggle.type = "button";
  sideToggle.setAttribute("data-eidos-side-panel-toggle", "");
  sideHeader.append(sideTitle, sideToggle);

  const sideContent = document.createElement("div");
  sideContent.setAttribute("data-eidos-side-panel-content", "");

  const sideFooter = document.createElement("footer");
  sideFooter.setAttribute("data-eidos-side-panel-footer", "");
  const localeWrap = document.createElement("label");
  localeWrap.setAttribute("data-eidos-locale-control", "");
  const localeLabel = document.createElement("span");
  const localeSelect = document.createElement("select");
  localeSelect.setAttribute("data-eidos-locale", "");
  localeWrap.append(localeLabel, localeSelect);
  if (localization) sideFooter.append(localeWrap);

  sidePanel.append(sideHeader, sideContent, sideFooter);

  const splitter = document.createElement("div");
  splitter.setAttribute("data-eidos-workbench-splitter", "");
  splitter.setAttribute("role", "separator");
  splitter.setAttribute("aria-orientation", "vertical");
  splitter.setAttribute("aria-label", hostText("workbench.resizeSidePanel", "Resize side panel"));
  splitter.tabIndex = 0;

  const workspace = document.createElement("main");
  workspace.setAttribute("data-eidos-workspace", "");

  const browserToolbar = document.createElement("div");
  browserToolbar.setAttribute("data-eidos-browser-toolbar", "");
  browserToolbar.setAttribute("aria-label", hostText("workbench.workspaceToolbar", "Workspace toolbar"));
  const browserAddress = document.createElement("input");
  browserAddress.type = "text";
  browserAddress.autocomplete = "off";
  browserAddress.setAttribute("data-eidos-browser-address", "");
  browserAddress.setAttribute("aria-label", hostText("workbench.workspaceTarget", "Workspace route or web address"));
  const browserGo = document.createElement("button");
  browserGo.type = "button";
  browserGo.setAttribute("data-eidos-browser-go", "");
  const browserExternal = document.createElement("button");
  browserExternal.type = "button";
  browserExternal.setAttribute("data-eidos-browser-external", "");
  browserToolbar.append(browserAddress, browserGo, browserExternal);

  const workspaceContent = document.createElement("div");
  workspaceContent.setAttribute("data-eidos-workspace-content", "");

  workspace.append(browserToolbar, workspaceContent);

  const statusBar = document.createElement("footer");
  statusBar.setAttribute("data-eidos-status-bar", "");
  const statusLeft = document.createElement("span");
  const statusRight = document.createElement("span");
  statusBar.append(statusLeft, statusRight);

  root.append(activityBar, sidePanel, splitter, workspace, statusBar);
  container.replaceChildren(root);

  function persist(): void {
    stateStore.save({ ...state });
  }

  function activityById(id: string): WorkbenchActivityV010 | undefined {
    return activities.find(item => item.id === id);
  }

  function sideKind(activity: WorkbenchActivityV010): boolean {
    return activity.kind === "navigation" || activity.kind === "side-route";
  }

  function updateLayoutAttributes(): void {
    root.setAttribute("data-side-panel-visible", state.sidePanelVisible ? "true" : "false");
    const toggleLabel = state.sidePanelVisible
      ? hostText("workbench.hideSidePanel", "Hide side panel")
      : hostText("workbench.showSidePanel", "Show side panel");
    setIconButton(sideToggle, "sidebar", toggleLabel, 18);
    root.style.setProperty("--eidos-side-panel-width", `${state.sidePanelWidth}px`);
    root.setAttribute("data-eidos-surface-target", activeSurfaceTarget);
    if (activeSurfaceId) {
      root.setAttribute("data-eidos-surface-id", activeSurfaceId);
    } else {
      root.removeAttribute("data-eidos-surface-id");
    }
    splitter.setAttribute("aria-valuenow", String(state.sidePanelWidth));
    splitter.setAttribute("aria-valuemin", String(minWidth));
    splitter.setAttribute("aria-valuemax", String(maxWidth));
  }

  function refreshLocaleOptions(): void {
    if (!localization) return;
    const current = localization.getContext().locale;
    localeSelect.replaceChildren();
    for (const locale of localization.availableLocales()) {
      const option = document.createElement("option");
      option.value = locale;
      option.textContent = hostText(`shell.locale.${locale}`, locale);
      option.selected = locale === current;
      localeSelect.appendChild(option);
    }
    document.documentElement.lang = current;
  }

  function renderNavigationList(snapshot: AppHostSnapshotV010): void {
    sideContent.replaceChildren();
    const list = document.createElement("nav");
    list.setAttribute("data-eidos-workbench-navigation", "");
    list.setAttribute("aria-label", hostText("shell.applications", "Applications"));

    for (const item of snapshot.navigation) {
      const owner = snapshot.manifests.find(manifest =>
        (manifest.navigation ?? []).some(candidate => candidate.id === item.id)
      );
      if (item.surfaceIds) {
        const ownerSurfaceId = owner?.surfaces?.find(surface =>
          surface.target === activeSurfaceTarget
          && surface.support !== "UNSUPPORTED"
        )?.id ?? (
          owner?.surfaces?.some(surface => surface.id === options.surfaceId)
            ? options.surfaceId
            : undefined
        );
        if (!ownerSurfaceId || !item.surfaceIds.includes(ownerSurfaceId)) {
          continue;
        }
      }

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = owner && localization
        ? localization.resolve(owner.packageId, `navigation.${item.id}.label`, item.label)
        : item.label;
      button.dataset.route = item.route;
      button.addEventListener("click", () => {
        void navigateWorkspace(item.route);
      });
      list.appendChild(button);
    }
    sideContent.appendChild(list);
  }

  async function renderSidePanel(): Promise<void> {
    sideMount?.dispose();
    sideMount = undefined;
    sideContent.replaceChildren();

    const activity = activityById(state.activeActivityId) ?? fallbackActivity();
    sideTitle.textContent = activity.localization && localization
      ? localization.resolve(
          activity.localization.namespace,
          activity.localization.key,
          activity.title
        )
      : activity.title;

    if (!state.sidePanelVisible || !sideKind(activity)) return;

    if (activity.kind === "navigation") {
      renderNavigationList(host.getSnapshot());
      return;
    }

    const route = activity.route;
    if (!route) return;

    const surface = resolveSurface(route);
    let resolvedRoute = route;
    if (surface?.resolution.kind === "HANDOFF") {
      renderSurfaceHandoff(sideContent, surface.manifest, surface.resolution);
      return;
    }
    if (surface?.resolution.kind === "ROUTE") {
      resolvedRoute = surface.resolution.route.path;
      applyActiveSurface(
        surface.resolution.surfaceId,
        surface.resolution.target
      );
    }

    const loaded = await host.loadRoute(resolvedRoute);
    if (!loaded) {
      const empty = document.createElement("p");
      empty.textContent = hostText(
        "shell.noRoute",
        "No active route for '{path}'.",
        { path: resolvedRoute }
      );
      sideContent.appendChild(empty);
      return;
    }

    let chatState = chatStates.get(resolvedRoute);
    if (!chatState) {
      chatState = { messages: [] };
      chatStates.set(resolvedRoute, chatState);
    }

    sideMount = mountAppHostLoadedPage({
      page: loaded,
      container: sideContent,
      renderPage: page => renderAppHostPageToHtml(page, localization),
      actionHost: options.actionHost,
      localization,
      chatState,
      onNavigate: navigateWorkspace,
      async onActionResult(result, page, renderHint) {
        await options.onActionResult?.(result, page, renderHint);
        if (
          result !== null
          && typeof result === "object"
          && !Array.isArray(result)
          && (result as { ok?: unknown }).ok === true
        ) {
          await refreshChrome();
        }
      }
    });
  }

  function renderWeb(url: string): void {
    workspaceMount?.dispose();
    workspaceMount = undefined;
    workspaceContent.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.setAttribute("data-eidos-browser-frame", "");
    iframe.title = url;
    iframe.src = url;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute(
      "sandbox",
      "allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
    );
    workspaceContent.appendChild(iframe);
    statusRight.textContent = hostText("shell.browserExternalContent", "External web content");
  }

  async function renderInternalWorkspace(path: string): Promise<void> {
    workspaceMount?.dispose();
    workspaceMount = undefined;
    workspaceContent.replaceChildren();

    const surface = resolveSurface(path);
    let resolvedPath = path;
    if (surface?.resolution.kind === "HANDOFF") {
      renderSurfaceHandoff(
        workspaceContent,
        surface.manifest,
        surface.resolution
      );
      statusRight.textContent = surface.resolution.reason;
      return;
    }
    if (surface?.resolution.kind === "ROUTE") {
      resolvedPath = surface.resolution.route.path;
      applyActiveSurface(
        surface.resolution.surfaceId,
        surface.resolution.target
      );
    }

    const loaded = await host.loadRoute(resolvedPath);
    if (!loaded) {
      const empty = document.createElement("p");
      empty.textContent = hostText(
        "shell.noRoute",
        "No active route for '{path}'.",
        { path: resolvedPath }
      );
      workspaceContent.appendChild(empty);
      statusRight.textContent = resolvedPath;
      return;
    }

    workspaceMount = mountAppHostLoadedPage({
      page: loaded,
      container: workspaceContent,
      renderPage: page => renderAppHostPageToHtml(page, localization),
      actionHost: options.actionHost,
      localization,
      onNavigate: navigateWorkspace,
      async onActionResult(result, page, renderHint) {
        await options.onActionResult?.(result, page, renderHint);
        if (
          result !== null
          && typeof result === "object"
          && !Array.isArray(result)
          && (result as { ok?: unknown }).ok === true
        ) {
          if (renderHint?.preserveMountedPage === true) {
            await refreshChrome();
          } else {
            await refresh();
          }
        }
      }
    });
    statusRight.textContent = loaded.page.title ?? resolvedPath;
  }

  async function navigateWorkspace(target: string): Promise<void> {
    if (disposed) throw new Error("EIDOS_WORKBENCH_DISPOSED");
    const normalized = target.trim();
    if (!normalized) return;

    if (normalized.startsWith("/")) {
      workspaceMode = "app";
      const surface = resolveSurface(normalized);
      let resolvedTarget = normalized;

      if (surface?.resolution.kind === "ROUTE") {
        resolvedTarget = surface.resolution.route.path;
        applyActiveSurface(
          surface.resolution.surfaceId,
          surface.resolution.target
        );
      }

      state.workspaceTarget = resolvedTarget;
      browserAddress.value = resolvedTarget;
      if (
        surface?.resolution.kind !== "HANDOFF"
        && currentHashPath() !== resolvedTarget
      ) {
        window.location.hash = resolvedTarget;
      }
      persist();

      if (surface?.resolution.kind === "HANDOFF") {
        renderSurfaceHandoff(
          workspaceContent,
          surface.manifest,
          surface.resolution
        );
        statusRight.textContent = surface.resolution.reason;
      } else {
        await renderInternalWorkspace(resolvedTarget);
      }
      root.setAttribute("data-mobile-surface", "workspace");
      return;
    }

    if (isExternalUrl(normalized)) {
      workspaceMode = "web";
      state.workspaceTarget = normalized;
      browserAddress.value = normalized;
      persist();
      renderWeb(normalized);
      root.setAttribute("data-mobile-surface", "workspace");
      return;
    }

    statusRight.textContent = hostText(
      "shell.browserInvalidTarget",
      "Enter an App Host route beginning with '/' or an http(s) URL."
    );
  }

  function renderActivities(): void {
    activityTop.replaceChildren();
    activityBottom.replaceChildren();

    for (const activity of activities) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.activityId = activity.id;
      button.dataset.active = activity.id === state.activeActivityId ? "true" : "false";
      const activityTitle = activity.localization && localization
        ? localization.resolve(
            activity.localization.namespace,
            activity.localization.key,
            activity.title
          )
        : activity.title;
      button.title = activityTitle;
      button.setAttribute("aria-label", activityTitle);
      const icon = document.createElement("span");
      icon.setAttribute("data-eidos-activity-icon", "");
      setIconContent(icon, activity.icon, activity.icon, 22);
      button.appendChild(icon);

      button.addEventListener("click", () => { void setActivity(activity.id); });
      const target = activity.placement === "secondary" ? activityBottom : activityTop;
      target.appendChild(button);
    }

    statusLeft.textContent = hostText(
      "workbench.status",
      "{title} · {status}",
      { title: options.title ?? "Eidos", status: host.getSnapshot().status }
    );
  }

  async function setActivities(nextActivities: WorkbenchActivityV010[]): Promise<void> {
    if (disposed) throw new Error("EIDOS_WORKBENCH_DISPOSED");

    const normalized = normalizeWorkbenchActivities(nextActivities);
    if (JSON.stringify(normalized) === JSON.stringify(activities)) {
      return;
    }

    const previousActivity = activityById(state.activeActivityId);
    activities = normalized;

    let active = activityById(state.activeActivityId);
    const activeWasRemoved = !active;
    if (!active) {
      active = fallbackActivity();
      state.activeActivityId = active.id;
    }

    if (active.kind === "workspace-focus") {
      state.sidePanelVisible = false;
    } else if (active.kind === "workspace-route") {
      state.sidePanelVisible = false;
    } else if (activeWasRemoved) {
      state.sidePanelVisible = true;
    }

    persist();
    updateLayoutAttributes();
    renderActivities();

    if (
      active.kind === "workspace-route"
      && active.route
      && (
        activeWasRemoved
        || previousActivity?.kind !== active.kind
        || previousActivity?.route !== active.route
      )
    ) {
      await navigateWorkspace(active.route);
      root.setAttribute("data-mobile-surface", "workspace");
      return;
    }

    if (active.kind === "workspace-focus") {
      root.setAttribute("data-mobile-surface", "workspace");
      return;
    }

    await renderSidePanel();
    if (state.sidePanelVisible) root.setAttribute("data-mobile-surface", "panel");
  }

  async function setActivity(activityId: string): Promise<void> {
    const activity = activityById(activityId);
    if (!activity) throw new Error(`EIDOS_WORKBENCH_ACTIVITY_NOT_FOUND: ${activityId}`);

    if (activity.kind === "workspace-focus") {
      state.activeActivityId = activity.id;
      state.sidePanelVisible = false;
      persist();
      updateLayoutAttributes();
      renderActivities();
      root.setAttribute("data-mobile-surface", "workspace");
      return;
    }

    if (activity.kind === "workspace-route") {
      state.activeActivityId = activity.id;
      state.sidePanelVisible = false;
      persist();
      updateLayoutAttributes();
      renderActivities();
      if (activity.route) await navigateWorkspace(activity.route);
      root.setAttribute("data-mobile-surface", "workspace");
      return;
    }

    if (state.activeActivityId === activity.id && state.sidePanelVisible) {
      state.sidePanelVisible = false;
    } else {
      state.activeActivityId = activity.id;
      state.sidePanelVisible = true;
    }

    persist();
    updateLayoutAttributes();
    renderActivities();
    await renderSidePanel();
    root.setAttribute("data-mobile-surface", "panel");
  }

  async function toggleSidePanel(): Promise<void> {
    state.sidePanelVisible = !state.sidePanelVisible;
    persist();
    updateLayoutAttributes();
    await renderSidePanel();
  }

  browserGo.addEventListener("click", () => { void navigateWorkspace(browserAddress.value); });
  browserAddress.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      void navigateWorkspace(browserAddress.value);
    }
  });
  browserExternal.addEventListener("click", () => {
    if (workspaceMode === "web" && isExternalUrl(state.workspaceTarget)) {
      window.open(state.workspaceTarget, "_blank", "noopener,noreferrer");
    }
  });
  sideToggle.addEventListener("click", () => { void toggleSidePanel(); });

  let dragStartX = 0;
  let dragStartWidth = state.sidePanelWidth;
  const move = (event: PointerEvent) => {
    const next = clamp(dragStartWidth + (event.clientX - dragStartX), minWidth, maxWidth);
    state.sidePanelWidth = next;
    updateLayoutAttributes();
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    persist();
  };
  splitter.addEventListener("pointerdown", event => {
    if (!state.sidePanelVisible) return;
    dragStartX = event.clientX;
    dragStartWidth = state.sidePanelWidth;
    splitter.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
  splitter.addEventListener("keydown", event => {
    if (!state.sidePanelVisible) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    state.sidePanelWidth = clamp(
      state.sidePanelWidth + (event.key === "ArrowRight" ? 16 : -16),
      minWidth,
      maxWidth
    );
    updateLayoutAttributes();
    persist();
  });

  if (localization) {
    refreshLocaleOptions();
    localeSelect.addEventListener("change", () => localization.setLocale(localeSelect.value));
  }

  const unsubscribeHost = host.subscribe(snapshot => {
    if (disposed) return;
    renderActivities();
    const current = activityById(state.activeActivityId);
    if (current?.kind === "navigation" && state.sidePanelVisible) {
      renderNavigationList(snapshot);
    }
  });

  const unsubscribeLocale = localization?.subscribe(() => {
    if (disposed) return;
    refreshLocaleOptions();
    updateChromeLabels();
    renderActivities();
    void renderSidePanel();
    if (workspaceMode === "app") void renderInternalWorkspace(state.workspaceTarget);
  });

  const hashHandler = () => {
    const path = currentHashPath();
    if (path && path !== state.workspaceTarget) void navigateWorkspace(path);
  };
  const keyboardHandler = (event: KeyboardEvent) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.key.toLowerCase() === "b") {
      event.preventDefault();
      void toggleSidePanel();
      return;
    }
    if (modifier && event.key.toLowerCase() === "l") {
      event.preventDefault();
      browserAddress.focus();
      browserAddress.select();
      return;
    }
    if (event.key === "Escape" && document.activeElement === browserAddress) {
      browserAddress.blur();
    }
  };
  window.addEventListener("keydown", keyboardHandler);
  window.addEventListener("hashchange", hashHandler);

  async function refreshChrome(): Promise<AppHostSnapshotV010> {
    const snapshot = host.getSnapshot();
    renderActivities();
    return snapshot;
  }

  async function refresh(): Promise<AppHostSnapshotV010> {
    const snapshot = await host.refresh();
    renderActivities();

    if (workspaceMode === "app") {
      const routed = resolveSurface(state.workspaceTarget);
      if (routed?.resolution.kind === "ROUTE") {
        const resolvedPath = routed.resolution.route.path;
        applyActiveSurface(
          routed.resolution.surfaceId,
          routed.resolution.target
        );
        if (state.workspaceTarget !== resolvedPath) {
          state.workspaceTarget = resolvedPath;
          if (currentHashPath() !== resolvedPath) {
            window.location.hash = resolvedPath;
          }
          persist();
        }
      } else if (
        routed?.resolution.kind !== "HANDOFF"
        && (
          !state.workspaceTarget.startsWith("/")
          || !host.resolveRoute(state.workspaceTarget)
        )
      ) {
        const fallback =
          snapshot.manifests.find(item => item.defaultRoute)?.defaultRoute
          ?? snapshot.routes[0]?.path
          ?? "/";
        state.workspaceTarget = fallback;
        persist();
      }
    }

    browserAddress.value = state.workspaceTarget;
    await renderSidePanel();
    if (workspaceMode === "app") {
      await renderInternalWorkspace(state.workspaceTarget);
    } else if (isExternalUrl(state.workspaceTarget)) {
      renderWeb(state.workspaceTarget);
    }

    return snapshot;
  }

  const mountHandlesResource = (
    mount: MountedAppHostPage | undefined,
    resourceId: string
  ): boolean =>
    Boolean(
      mount?.refresh
      && mount.resourceIds?.includes(resourceId)
    );

  const flushResourceRefreshes = async (): Promise<void> => {
    if (disposed || resourceRefreshInFlight) return;
    resourceRefreshInFlight = true;
    try {
      while (pendingResourceRefreshes.size > 0 && !disposed) {
        const batch = [...pendingResourceRefreshes];
        pendingResourceRefreshes.clear();

        const sideNeedsRefresh = batch.some(resourceId =>
          mountHandlesResource(sideMount, resourceId)
        );
        const workspaceNeedsRefresh = batch.some(resourceId =>
          mountHandlesResource(workspaceMount, resourceId)
        );

        await Promise.all([
          sideNeedsRefresh ? sideMount?.refresh?.() : undefined,
          workspaceNeedsRefresh ? workspaceMount?.refresh?.() : undefined
        ]);
      }
    } finally {
      resourceRefreshInFlight = false;
    }
  };

  const scheduleResourceRefresh = (): void => {
    if (resourceRefreshTimer !== undefined || disposed) return;
    resourceRefreshTimer = setTimeout(() => {
      resourceRefreshTimer = undefined;
      void flushResourceRefreshes();
    }, 50);
  };

  function notifyRealtimeEvent(event: RealtimeEventV010): boolean {
    if (disposed) return false;
    if (event.type === "RESET_REQUIRED") {
      void refresh();
      return true;
    }
    const resourceId = event.resource?.resourceId;
    if (!resourceId) return false;

    const handled =
      mountHandlesResource(sideMount, resourceId)
      || mountHandlesResource(workspaceMount, resourceId);
    if (!handled) return false;

    pendingResourceRefreshes.add(resourceId);
    scheduleResourceRefresh();
    return true;
  }

  function dispose(): void {
    disposed = true;
    if (resourceRefreshTimer !== undefined) {
      clearTimeout(resourceRefreshTimer);
      resourceRefreshTimer = undefined;
    }
    pendingResourceRefreshes.clear();
    sideMount?.dispose();
    workspaceMount?.dispose();
    unsubscribeHost();
    unsubscribeLocale?.();
    window.removeEventListener("hashchange", hashHandler);
    window.removeEventListener("keydown", keyboardHandler);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    root.remove();
  }

  function updateChromeLabels(): void {
    localeLabel.textContent = hostText("shell.language", "Language");
    browserAddress.setAttribute("aria-label", hostText("shell.browserAddress", "Workspace address"));
    setIconButton(browserGo, "arrow-right", hostText("shell.browserGo", "Open"), 18);
    setIconButton(
      browserExternal,
      "external-link",
      hostText("shell.browserOpenExternal", "Open externally"),
      18
    );
  }

  updateChromeLabels();
  updateLayoutAttributes();
  await refresh();

  return {
    refresh,
    setActivities,
    setActivity,
    toggleSidePanel,
    navigateWorkspace,
    notifyRealtimeEvent,
    dispose
  };
}
