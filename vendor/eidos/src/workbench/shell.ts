import type { ActionHost } from "../adapters/ports.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import type { AppHost, AppHostSnapshotV010 } from "../app-host/contracts.js";
import {
  mountAppHostLoadedPage,
  type AppHostChatState,
  type MountedAppHostPage
} from "../app-host/page-controller.js";
import { renderAppHostPageToHtml } from "../app-host/page-renderer.js";
import {
  createBrowserWorkbenchLayoutStateStore,
  type WorkbenchActivityV010,
  type WorkbenchLayoutStateStore,
  type WorkbenchLayoutStateV010
} from "./contracts.js";

export interface WorkbenchShellOptions {
  host: AppHost;
  container: HTMLElement | string;
  activities: WorkbenchActivityV010[];
  defaultActivityId: string;
  title?: string;
  actionHost?: ActionHost;
  localization?: LocalizationRuntime;
  initialWorkspaceRoute?: string;
  layoutStateStore?: WorkbenchLayoutStateStore;
  minSidePanelWidth?: number;
  maxSidePanelWidth?: number;
  onActionResult?: Parameters<typeof mountAppHostLoadedPage>[0]["onActionResult"];
}

export interface WorkbenchShell {
  refresh(): Promise<AppHostSnapshotV010>;
  setActivity(activityId: string): Promise<void>;
  toggleSidePanel(): Promise<void>;
  navigateWorkspace(target: string): Promise<void>;
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

export async function mountWorkbenchShell(
  options: WorkbenchShellOptions
): Promise<WorkbenchShell> {
  const container = resolveContainer(options.container);
  const { host, localization } = options;
  const activities = [...options.activities].sort((a, b) =>
    (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id)
  );
  if (activities.length === 0) throw new Error("EIDOS_WORKBENCH_ACTIVITY_REQUIRED");

  const defaultActivity = activities.find(item => item.id === options.defaultActivityId)
    ?? activities[0]!;
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
    workspaceTarget: persisted?.workspaceTarget
      || options.initialWorkspaceRoute
      || currentHashPath()
      || "/"
  };

  let disposed = false;
  let sideMount: MountedAppHostPage | undefined;
  let workspaceMount: MountedAppHostPage | undefined;
  let workspaceMode: "app" | "web" = state.workspaceTarget.startsWith("/") ? "app" : "web";
  const chatStates = new Map<string, AppHostChatState>();

  const hostText = (
    key: string,
    fallback: string,
    params?: Record<string, string | number | boolean | null>
  ) => localization?.resolve("eidos.app-host", key, fallback, params) ?? fallback;

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
  sideToggle.textContent = "×";
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
  splitter.tabIndex = 0;

  const workspace = document.createElement("main");
  workspace.setAttribute("data-eidos-workspace", "");

  const browserToolbar = document.createElement("div");
  browserToolbar.setAttribute("data-eidos-browser-toolbar", "");
  const browserAddress = document.createElement("input");
  browserAddress.type = "text";
  browserAddress.autocomplete = "off";
  browserAddress.setAttribute("data-eidos-browser-address", "");
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
    root.style.setProperty("--eidos-side-panel-width", `${state.sidePanelWidth}px`);
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
      option.textContent = locale;
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
      const button = document.createElement("button");
      button.type = "button";
      const owner = snapshot.manifests.find(manifest =>
        (manifest.navigation ?? []).some(candidate => candidate.id === item.id)
      );
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

    const activity = activityById(state.activeActivityId) ?? defaultActivity;
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
    const loaded = await host.loadRoute(route);
    if (!loaded) {
      const empty = document.createElement("p");
      empty.textContent = hostText("shell.noRoute", "No active route for '{path}'.", { path: route });
      sideContent.appendChild(empty);
      return;
    }

    let chatState = chatStates.get(route);
    if (!chatState) {
      chatState = { messages: [] };
      chatStates.set(route, chatState);
    }

    sideMount = mountAppHostLoadedPage({
      page: loaded,
      container: sideContent,
      renderPage: page => renderAppHostPageToHtml(page, localization),
      actionHost: options.actionHost,
      localization,
      chatState,
      onNavigate: navigateWorkspace,
      async onActionResult(result, page) {
        await options.onActionResult?.(result, page);
        if (
          result !== null
          && typeof result === "object"
          && !Array.isArray(result)
          && (result as { ok?: unknown }).ok === true
        ) {
          await host.refresh();
          renderActivities();
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

    const loaded = await host.loadRoute(path);
    if (!loaded) {
      const empty = document.createElement("p");
      empty.textContent = hostText("shell.noRoute", "No active route for '{path}'.", { path });
      workspaceContent.appendChild(empty);
      statusRight.textContent = path;
      return;
    }

    workspaceMount = mountAppHostLoadedPage({
      page: loaded,
      container: workspaceContent,
      renderPage: page => renderAppHostPageToHtml(page, localization),
      actionHost: options.actionHost,
      localization,
      onNavigate: navigateWorkspace,
      async onActionResult(result, page) {
        await options.onActionResult?.(result, page);
        if (
          result !== null
          && typeof result === "object"
          && !Array.isArray(result)
          && (result as { ok?: unknown }).ok === true
        ) {
          await refresh();
        }
      }
    });
    statusRight.textContent = loaded.page.title ?? path;
  }

  async function navigateWorkspace(target: string): Promise<void> {
    if (disposed) throw new Error("EIDOS_WORKBENCH_DISPOSED");
    const normalized = target.trim();
    if (!normalized) return;

    if (normalized.startsWith("/")) {
      workspaceMode = "app";
      state.workspaceTarget = normalized;
      browserAddress.value = normalized;
      if (currentHashPath() !== normalized) window.location.hash = normalized;
      persist();
      await renderInternalWorkspace(normalized);
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
      icon.textContent = activity.icon;
      button.appendChild(icon);

      button.addEventListener("click", () => { void setActivity(activity.id); });
      const target = activity.id === "settings" ? activityBottom : activityTop;
      target.appendChild(button);
    }

    statusLeft.textContent = hostText(
      "workbench.status",
      "{title} · {status}",
      { title: options.title ?? "Eidos", status: host.getSnapshot().status }
    );
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
    renderActivities();
    void renderSidePanel();
    if (workspaceMode === "app") void renderInternalWorkspace(state.workspaceTarget);
  });

  const hashHandler = () => {
    const path = currentHashPath();
    if (path && path !== state.workspaceTarget) void navigateWorkspace(path);
  };
  window.addEventListener("hashchange", hashHandler);

  async function refresh(): Promise<AppHostSnapshotV010> {
    const snapshot = await host.refresh();
    renderActivities();

    if (
      workspaceMode === "app"
      && (!state.workspaceTarget.startsWith("/") || !host.resolveRoute(state.workspaceTarget))
    ) {
      const fallback = snapshot.routes[0]?.path ?? "/";
      state.workspaceTarget = fallback;
      persist();
    }

    browserAddress.value = state.workspaceTarget;
    await renderSidePanel();
    if (workspaceMode === "app") await renderInternalWorkspace(state.workspaceTarget);
    else if (isExternalUrl(state.workspaceTarget)) renderWeb(state.workspaceTarget);

    return snapshot;
  }

  function dispose(): void {
    disposed = true;
    sideMount?.dispose();
    workspaceMount?.dispose();
    unsubscribeHost();
    unsubscribeLocale?.();
    window.removeEventListener("hashchange", hashHandler);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    root.remove();
  }

  localeLabel.textContent = hostText("shell.language", "Language");
  browserAddress.setAttribute("aria-label", hostText("shell.browserAddress", "Workspace address"));
  browserGo.textContent = hostText("shell.browserGo", "Open");
  browserExternal.textContent = hostText("shell.browserOpenExternal", "Open externally");
  updateLayoutAttributes();
  await refresh();

  return {
    refresh,
    setActivity,
    toggleSidePanel,
    navigateWorkspace,
    dispose
  };
}
