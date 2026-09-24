import type { ActionHost } from "../adapters/ports.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import type { AppHost, AppHostSnapshotV010 } from "./contracts.js";
import {
  mountAppHostLoadedPage,
  type AppHostChatState,
  type MountedAppHostPage
} from "./page-controller.js";
import { renderAppHostPageToHtml } from "./page-renderer.js";

export interface AgentWorkspaceShellOptions {
  host: AppHost;
  container: HTMLElement | string;
  assistantRoute: string;
  title?: string;
  actionHost?: ActionHost;
  localization?: LocalizationRuntime;
  initialWorkspaceRoute?: string;
  onActionResult?: Parameters<typeof mountAppHostLoadedPage>[0]["onActionResult"];
}

export interface AgentWorkspaceShell {
  refresh(): Promise<AppHostSnapshotV010>;
  navigateWorkspace(target: string): Promise<void>;
  focusPane(pane: "menu" | "chat" | "workspace"): void;
  dispose(): void;
}

function resolveContainer(value: HTMLElement | string): HTMLElement {
  if (typeof value !== "string") return value;
  const element = document.querySelector<HTMLElement>(value);
  if (!element) throw new Error(`EIDOS_APP_HOST_CONTAINER_NOT_FOUND: ${value}`);
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

export async function mountAgentWorkspaceShell(
  options: AgentWorkspaceShellOptions
): Promise<AgentWorkspaceShell> {
  const container = resolveContainer(options.container);
  const { host, localization } = options;
  const hostText = (
    key: string,
    fallback: string,
    params?: Record<string, string | number | boolean | null>
  ) => localization?.resolve("eidos.app-host", key, fallback, params) ?? fallback;

  let disposed = false;
  let assistantMount: MountedAppHostPage | undefined;
  let workspaceMount: MountedAppHostPage | undefined;
  let workspaceTarget = options.initialWorkspaceRoute ?? currentHashPath() ?? "/store";
  let workspaceMode: "app" | "web" = workspaceTarget.startsWith("/") ? "app" : "web";
  const chatState: AppHostChatState = { messages: [] };

  const root = document.createElement("div");
  root.setAttribute("data-eidos-app-host", "0.1.0");
  root.setAttribute("data-eidos-app-host-layout", "agent-workspace");
  root.setAttribute("data-eidos-mobile-pane", "chat");

  const sidebar = document.createElement("aside");
  sidebar.setAttribute("data-eidos-workspace-pane", "menu");

  const heading = document.createElement("h1");
  heading.textContent = options.title ?? "Eidos";
  heading.setAttribute("data-eidos-app-host-title", "");

  const localeWrap = document.createElement("label");
  localeWrap.setAttribute("data-eidos-locale-control", "");
  const localeLabel = document.createElement("span");
  const localeSelect = document.createElement("select");
  localeSelect.setAttribute("data-eidos-locale", "");
  localeWrap.append(localeLabel, localeSelect);

  const navigation = document.createElement("nav");
  navigation.setAttribute("data-eidos-app-navigation", "");

  const assistant = document.createElement("section");
  assistant.setAttribute("data-eidos-workspace-pane", "chat");
  assistant.setAttribute("data-eidos-assistant-pane", "");
  const assistantContent = document.createElement("div");
  assistantContent.setAttribute("data-eidos-assistant-content", "");
  assistant.appendChild(assistantContent);

  const workspace = document.createElement("section");
  workspace.setAttribute("data-eidos-workspace-pane", "workspace");
  workspace.setAttribute("data-eidos-browser-pane", "");

  const browserToolbar = document.createElement("div");
  browserToolbar.setAttribute("data-eidos-browser-toolbar", "");
  const browserAddress = document.createElement("input");
  browserAddress.type = "text";
  browserAddress.setAttribute("data-eidos-browser-address", "");
  browserAddress.autocomplete = "off";
  const browserGo = document.createElement("button");
  browserGo.type = "button";
  browserGo.setAttribute("data-eidos-browser-go", "");
  const browserExternal = document.createElement("button");
  browserExternal.type = "button";
  browserExternal.setAttribute("data-eidos-browser-external", "");
  browserToolbar.append(browserAddress, browserGo, browserExternal);

  const workspaceContent = document.createElement("div");
  workspaceContent.setAttribute("data-eidos-browser-content", "");
  const workspaceStatus = document.createElement("div");
  workspaceStatus.setAttribute("data-eidos-browser-status", "");
  workspaceStatus.setAttribute("role", "status");
  workspace.append(browserToolbar, workspaceStatus, workspaceContent);

  const mobileTabs = document.createElement("nav");
  mobileTabs.setAttribute("data-eidos-mobile-tabs", "");
  const menuTab = document.createElement("button");
  const chatTab = document.createElement("button");
  const workspaceTab = document.createElement("button");
  for (const [button, pane] of [
    [menuTab, "menu"],
    [chatTab, "chat"],
    [workspaceTab, "workspace"]
  ] as const) {
    button.type = "button";
    button.dataset.eidosMobilePaneTarget = pane;
    button.addEventListener("click", () => focusPane(pane));
  }
  mobileTabs.append(menuTab, chatTab, workspaceTab);

  sidebar.append(heading);
  if (localization) sidebar.append(localeWrap);
  sidebar.append(navigation);
  root.append(sidebar, assistant, workspace, mobileTabs);
  container.replaceChildren(root);

  function focusPane(pane: "menu" | "chat" | "workspace"): void {
    root.setAttribute("data-eidos-mobile-pane", pane);
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

  async function renderAssistant(): Promise<void> {
    assistantMount?.dispose();
    assistantMount = undefined;
    assistantContent.replaceChildren();

    const loaded = await host.loadRoute(options.assistantRoute);
    if (!loaded) {
      const empty = document.createElement("div");
      empty.setAttribute("data-eidos-assistant-unavailable", "");
      empty.textContent = hostText(
        "shell.assistantUnavailable",
        "Assistant is not installed or active."
      );
      assistantContent.appendChild(empty);
      return;
    }

    assistantMount = mountAppHostLoadedPage({
      page: loaded,
      container: assistantContent,
      renderPage: page => renderAppHostPageToHtml(page, localization),
      actionHost: options.actionHost,
      localization,
      chatState,
      async onActionResult(result, page) {
        await options.onActionResult?.(result, page);
        if (
          result !== null
          && typeof result === "object"
          && !Array.isArray(result)
          && (result as { ok?: unknown }).ok === true
        ) {
          await host.refresh();
          renderNavigation(host.getSnapshot());
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
    workspaceStatus.textContent = hostText("shell.browserExternalContent", "External web content");
  }

  async function renderInternalRoute(path: string): Promise<void> {
    workspaceMount?.dispose();
    workspaceMount = undefined;
    workspaceContent.replaceChildren();

    const loaded = await host.loadRoute(path);
    if (!loaded) {
      const message = document.createElement("p");
      message.textContent = hostText("shell.noRoute", "No active route for '{path}'.", { path });
      workspaceContent.appendChild(message);
      workspaceStatus.textContent = "";
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
    workspaceStatus.textContent = loaded.page.title ?? path;
  }

  async function navigateWorkspace(target: string): Promise<void> {
    if (disposed) throw new Error("EIDOS_AGENT_WORKSPACE_SHELL_DISPOSED");
    const normalized = target.trim();
    if (!normalized) return;

    if (normalized.startsWith("/")) {
      workspaceMode = "app";
      workspaceTarget = normalized;
      browserAddress.value = normalized;
      if (currentHashPath() !== normalized) window.location.hash = normalized;
      await renderInternalRoute(normalized);
      focusPane("workspace");
      return;
    }

    if (isExternalUrl(normalized)) {
      workspaceMode = "web";
      workspaceTarget = normalized;
      browserAddress.value = normalized;
      renderWeb(normalized);
      focusPane("workspace");
      return;
    }

    workspaceStatus.textContent = hostText(
      "shell.browserInvalidTarget",
      "Enter an App Host route beginning with '/' or an http(s) URL."
    );
  }

  function renderNavigation(snapshot: AppHostSnapshotV010): void {
    navigation.replaceChildren();

    for (const item of snapshot.navigation) {
      const button = document.createElement("button");
      button.type = "button";
      const owner = snapshot.manifests.find(manifest =>
        (manifest.navigation ?? []).some(candidate => candidate.id === item.id)
      );
      button.textContent = owner && localization
        ? localization.resolve(owner.packageId, `navigation.${item.id}.label`, item.label)
        : item.label;
      button.setAttribute("data-route", item.route);
      button.setAttribute(
        "data-assistant-route",
        item.route === options.assistantRoute ? "true" : "false"
      );
      button.onclick = () => {
        if (item.route === options.assistantRoute) {
          focusPane("chat");
          return;
        }
        void navigateWorkspace(item.route);
      };
      navigation.appendChild(button);
    }

    navigation.setAttribute("aria-label", hostText("shell.applications", "Applications"));
    localeLabel.textContent = hostText("shell.language", "Language");
    browserAddress.setAttribute(
      "aria-label",
      hostText("shell.browserAddress", "Workspace address")
    );
    browserGo.textContent = hostText("shell.browserGo", "Open");
    browserExternal.textContent = hostText("shell.browserOpenExternal", "Open externally");
    menuTab.textContent = hostText("shell.mobileMenu", "Menu");
    chatTab.textContent = hostText("shell.mobileChat", "Chat");
    workspaceTab.textContent = hostText("shell.mobileWorkspace", "Workspace");
  }

  browserGo.addEventListener("click", () => { void navigateWorkspace(browserAddress.value); });
  browserAddress.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      void navigateWorkspace(browserAddress.value);
    }
  });
  browserExternal.addEventListener("click", () => {
    if (workspaceMode !== "web" || !isExternalUrl(workspaceTarget)) return;
    window.open(workspaceTarget, "_blank", "noopener,noreferrer");
  });

  if (localization) {
    refreshLocaleOptions();
    localeSelect.addEventListener("change", () => localization.setLocale(localeSelect.value));
  }

  const unsubscribeHost = host.subscribe(snapshot => {
    if (!disposed) renderNavigation(snapshot);
  });

  const unsubscribeLocale = localization?.subscribe(() => {
    if (disposed) return;
    refreshLocaleOptions();
    renderNavigation(host.getSnapshot());
    void renderAssistant();
    if (workspaceMode === "app") void renderInternalRoute(workspaceTarget);
  });

  const hashHandler = () => {
    const path = currentHashPath();
    if (path && path !== options.assistantRoute) {
      void navigateWorkspace(path);
    } else if (path === options.assistantRoute) {
      focusPane("chat");
    }
  };
  window.addEventListener("hashchange", hashHandler);

  async function refresh(): Promise<AppHostSnapshotV010> {
    const snapshot = await host.refresh();
    renderNavigation(snapshot);
    await renderAssistant();

    if (
      workspaceMode === "app"
      && (!workspaceTarget.startsWith("/") || !host.resolveRoute(workspaceTarget))
    ) {
      const fallback = snapshot.routes.find(route => route.path !== options.assistantRoute)?.path;
      workspaceTarget = fallback ?? "/";
    }

    browserAddress.value = workspaceTarget;
    if (workspaceMode === "app") {
      await renderInternalRoute(workspaceTarget);
    } else if (isExternalUrl(workspaceTarget)) {
      renderWeb(workspaceTarget);
    }

    return snapshot;
  }

  function dispose(): void {
    disposed = true;
    assistantMount?.dispose();
    workspaceMount?.dispose();
    unsubscribeHost();
    unsubscribeLocale?.();
    window.removeEventListener("hashchange", hashHandler);
    root.remove();
  }

  await refresh();
  return { refresh, navigateWorkspace, focusPane, dispose };
}
