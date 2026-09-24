import type { ActionHost } from "../adapters/ports.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import type { AppHost, AppHostSnapshotV010 } from "./contracts.js";
import {
  mountAppHostLoadedPage,
  type MountedAppHostPage
} from "./page-controller.js";
import { renderAppHostPageToHtml } from "./page-renderer.js";

export interface BrowserAppHostShellOptions {
  host: AppHost;
  container: HTMLElement | string;
  title?: string;
  renderPage?: Parameters<typeof mountAppHostLoadedPage>[0]["renderPage"];
  actionHost?: ActionHost;
  onActionResult?: Parameters<typeof mountAppHostLoadedPage>[0]["onActionResult"];
  localization?: LocalizationRuntime;
}

export interface BrowserAppHostShell {
  refresh(): Promise<AppHostSnapshotV010>;
  navigate(path: string): Promise<void>;
  dispose(): void;
}

function resolveContainer(value: HTMLElement | string): HTMLElement {
  if (typeof value !== "string") return value;
  const element = document.querySelector<HTMLElement>(value);
  if (!element) throw new Error(`EIDOS_APP_HOST_CONTAINER_NOT_FOUND: ${value}`);
  return element;
}

function currentPath(): string {
  const hash = window.location.hash;
  if (!hash || hash === "#") return "/";
  return hash.startsWith("#") ? hash.slice(1) : hash;
}

export async function mountBrowserAppHostShell(
  options: BrowserAppHostShellOptions
): Promise<BrowserAppHostShell> {
  const container = resolveContainer(options.container);
  const { host, localization } = options;
  const hostText = (
    key: string,
    fallback: string,
    params?: Record<string, string | number | boolean | null>
  ) => localization?.resolve("eidos.app-host", key, fallback, params) ?? fallback;

  let disposed = false;
  let activePath = currentPath();
  let mountedPage: MountedAppHostPage | undefined;

  const root = document.createElement("div");
  root.setAttribute("data-eidos-app-host", "0.1.0");
  root.setAttribute("data-eidos-app-host-layout", "standard");
  root.style.display = "grid";
  root.style.gridTemplateColumns = "240px minmax(0, 1fr)";
  root.style.minHeight = "100vh";

  const sidebar = document.createElement("aside");
  sidebar.style.borderRight = "1px solid #ddd";
  sidebar.style.padding = "16px";

  const heading = document.createElement("h1");
  heading.textContent = options.title ?? "Eidos App Host";
  heading.style.fontSize = "18px";
  heading.style.margin = "0 0 16px";

  const localeWrap = document.createElement("label");
  const localeLabel = document.createElement("span");
  const localeSelect = document.createElement("select");
  localeWrap.setAttribute("data-eidos-locale-control", "");
  localeWrap.style.display = "block";
  localeWrap.style.marginBottom = "16px";
  localeLabel.style.display = "block";
  localeLabel.style.fontSize = "12px";
  localeLabel.style.marginBottom = "4px";
  localeSelect.setAttribute("data-eidos-locale", "");
  localeSelect.style.width = "100%";
  localeWrap.append(localeLabel, localeSelect);

  const navigation = document.createElement("nav");

  const main = document.createElement("main");
  main.style.padding = "24px";
  main.setAttribute("data-eidos-app-host-main", "");

  const status = document.createElement("div");
  status.setAttribute("role", "status");
  status.style.marginBottom = "12px";
  status.style.fontSize = "12px";

  const pageContainer = document.createElement("section");
  pageContainer.setAttribute("data-eidos-page-slot", "main");
  main.append(status, pageContainer);
  sidebar.append(heading);
  if (localization) sidebar.append(localeWrap);
  sidebar.append(navigation);
  root.append(sidebar, main);
  container.replaceChildren(root);

  async function renderRoute(path: string): Promise<void> {
    if (disposed) return;
    activePath = path;
    mountedPage?.dispose();
    mountedPage = undefined;
    pageContainer.replaceChildren();

    const loaded = await host.loadRoute(path);
    pageContainer.setAttribute("data-eidos-page", loaded?.page.id ?? "not-found");

    if (!loaded) {
      const message = document.createElement("p");
      message.textContent = path === "/"
        ? hostText("shell.noActivePage", "No active application page.")
        : hostText("shell.noRoute", "No active route for '{path}'.", { path });
      pageContainer.appendChild(message);
      return;
    }

    try {
      mountedPage = mountAppHostLoadedPage({
        page: loaded,
        container: pageContainer,
        renderPage: options.renderPage ?? ((page) => renderAppHostPageToHtml(page, localization)),
        actionHost: options.actionHost,
        localization,
        onNavigate: navigate,
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
    } catch (error) {
      const pre = document.createElement("pre");
      pre.textContent = error instanceof Error ? error.message : String(error);
      pageContainer.appendChild(pre);
    }
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
      button.style.display = "block";
      button.style.width = "100%";
      button.style.textAlign = "left";
      button.style.margin = "0 0 8px";
      button.onclick = () => { void navigate(item.route); };
      navigation.appendChild(button);
    }

    navigation.setAttribute("aria-label", hostText("shell.applications", "Applications"));
    localeLabel.textContent = hostText("shell.language", "Language");
    status.textContent = snapshot.diagnostics.length === 0
      ? hostText("shell.status", "App Host: {status} · revision {revision}", {
          status: snapshot.status,
          revision: snapshot.revision
        })
      : hostText("shell.statusDiagnostics", "App Host: {status} · {count} diagnostic(s)", {
          status: snapshot.status,
          count: snapshot.diagnostics.length
        });
  }

  const refreshLocaleOptions = () => {
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
  };

  const unsubscribe = host.subscribe(snapshot => {
    if (!disposed) renderNavigation(snapshot);
  });

  if (localization) {
    refreshLocaleOptions();
    localeSelect.addEventListener("change", () => localization.setLocale(localeSelect.value));
  }

  const unsubscribeLocale = localization?.subscribe(() => {
    if (disposed) return;
    refreshLocaleOptions();
    renderNavigation(host.getSnapshot());
    void renderRoute(activePath);
  });

  const onHashChange = () => { void renderRoute(currentPath()); };
  window.addEventListener("hashchange", onHashChange);

  async function refresh(): Promise<AppHostSnapshotV010> {
    const snapshot = await host.refresh();
    renderNavigation(snapshot);

    let path = currentPath();
    if (!host.resolveRoute(path)) {
      const defaultRoute = snapshot.manifests.find(item => item.defaultRoute)?.defaultRoute;
      path = defaultRoute ?? snapshot.routes[0]?.path ?? "/";
      if (path !== "/" && currentPath() !== path) window.location.hash = path;
    }

    await renderRoute(path);
    return snapshot;
  }

  async function navigate(path: string): Promise<void> {
    if (disposed) throw new Error("EIDOS_APP_HOST_SHELL_DISPOSED");
    if (!host.resolveRoute(path)) throw new Error(`EIDOS_APP_HOST_ROUTE_NOT_FOUND: ${path}`);
    if (currentPath() !== path) {
      window.location.hash = path;
    } else {
      await renderRoute(path);
    }
  }

  function dispose(): void {
    disposed = true;
    mountedPage?.dispose();
    unsubscribe();
    unsubscribeLocale?.();
    window.removeEventListener("hashchange", onHashChange);
    root.remove();
  }

  await refresh();
  return { refresh, navigate, dispose };
}

export { renderAppHostPageToHtml } from "./page-renderer.js";
