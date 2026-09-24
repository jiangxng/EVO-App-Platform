import { renderToHtml } from "../renderers/html/index.js";
import { renderCatalogBrowserToHtml } from "../catalog-browser/render.js";
import { assertValidUidl } from "../runtime/validate.js";
import type { JsonValue } from "../runtime/contracts.js";
import { executeAppHostPageAction } from "./action-executor.js";
import type { ActionHost } from "../adapters/ports.js";
import type { AppHost, AppHostLoadedPageV010, AppHostSnapshotV010 } from "./contracts.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import { localizeAppHostPageDefinition } from "../localization/localize.js";

export interface BrowserAppHostShellOptions {
  host: AppHost;
  container: HTMLElement | string;
  title?: string;
  renderPage?: (page: AppHostLoadedPageV010) => string | Node;
  actionHost?: ActionHost;
  onActionResult?: (result: unknown, page: AppHostLoadedPageV010) => void | Promise<void>;
  localization?: LocalizationRuntime;
}

export interface BrowserAppHostShell {
  refresh(): Promise<AppHostSnapshotV010>;
  navigate(path: string): Promise<void>;
  dispose(): void;
}

export function renderAppHostPageToHtml(
  page: AppHostLoadedPageV010,
  localization?: LocalizationRuntime
): string {
  const localizedDefinition = localizeAppHostPageDefinition(page, localization);
  const definition = localizedDefinition as { kind?: unknown };
  if (definition?.kind === "catalog-browser") {
    return renderCatalogBrowserToHtml(localizedDefinition as import("../catalog-browser/contracts.js").CatalogBrowserV010);
  }
  return renderToHtml(localizedDefinition);
}

function resolveContainer(value: HTMLElement | string): HTMLElement {
  if (typeof value !== "string") return value;
  const element = document.querySelector<HTMLElement>(value);
  if (!element) throw new Error(`EIDOS_APP_HOST_CONTAINER_NOT_FOUND: ${value}`);
  return element;
}


function collectFormValues(
  form: HTMLFormElement,
  definition: unknown
): Record<string, JsonValue> {
  const document = assertValidUidl(definition);
  const values: Record<string, JsonValue> = {};

  for (const field of document.fields) {
    const control = form.elements.namedItem(field.key);
    if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLSelectElement)) continue;

    const raw = control.value;
    if (raw === "") {
      values[field.key] = "";
      continue;
    }

    if (field.control === "number" || field.control === "money") {
      values[field.key] = Number(raw);
      continue;
    }

    if (field.control === "select" && control instanceof HTMLSelectElement) {
      const selected = control.selectedOptions[0];
      const valueType = selected?.dataset.valueType;
      if (valueType === "number") values[field.key] = Number(raw);
      else if (valueType === "boolean") values[field.key] = raw === "true";
      else values[field.key] = raw;
      continue;
    }

    values[field.key] = raw;
  }

  return values;
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
  const host = options.host;
  const localization = options.localization;
  const renderPage = options.renderPage ?? ((page: AppHostLoadedPageV010) =>
    renderAppHostPageToHtml(page, localization));
  const hostText = (
    key: string,
    fallback: string,
    params?: Record<string, string | number | boolean | null>
  ) => localization?.resolve("eidos.app-host", key, fallback, params) ?? fallback;
  let disposed = false;
  let activePath = currentPath();

  const root = document.createElement("div");
  root.setAttribute("data-eidos-app-host", "0.1.0");
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

  const navigation = document.createElement("nav");
  navigation.setAttribute("aria-label", hostText("shell.applications", "Applications"));

  const localeWrap = document.createElement("label");
  localeWrap.style.display = "block";
  localeWrap.style.marginBottom = "16px";
  const localeLabel = document.createElement("span");
  localeLabel.textContent = hostText("shell.language", "Language");
  localeLabel.style.display = "block";
  localeLabel.style.fontSize = "12px";
  localeLabel.style.marginBottom = "4px";
  const localeSelect = document.createElement("select");
  localeSelect.setAttribute("data-eidos-locale", "");
  localeSelect.style.width = "100%";
  localeWrap.append(localeLabel, localeSelect);

  const main = document.createElement("main");
  main.style.padding = "24px";
  main.setAttribute("data-eidos-app-host-main", "");

  const status = document.createElement("div");
  status.setAttribute("role", "status");
  status.style.marginBottom = "12px";
  status.style.fontSize = "12px";

  sidebar.append(heading);
  if (localization) sidebar.append(localeWrap);
  sidebar.append(navigation);
  main.append(status);
  root.append(sidebar, main);
  container.replaceChildren(root);

  async function renderRoute(path: string): Promise<void> {
    if (disposed) return;
    activePath = path;
    const loaded = await host.loadRoute(path);

    const old = main.querySelector("[data-eidos-page]");
    old?.remove();

    const pageContainer = document.createElement("section");
    pageContainer.setAttribute("data-eidos-page", loaded?.page.id ?? "not-found");

    if (!loaded) {
      const message = document.createElement("p");
      message.textContent = path === "/"
        ? hostText("shell.noActivePage", "No active application page.")
        : hostText("shell.noRoute", "No active route for '{path}'.", { path });
      pageContainer.appendChild(message);
      main.appendChild(pageContainer);
      return;
    }

    try {
      const rendered = renderPage(loaded);
      if (typeof rendered === "string") {
        pageContainer.innerHTML = rendered;
      } else {
        pageContainer.appendChild(rendered);
      }
    } catch (error) {
      const pre = document.createElement("pre");
      pre.textContent = error instanceof Error ? error.message : String(error);
      pageContainer.appendChild(pre);
    }

    const catalogButtons = pageContainer.querySelectorAll<HTMLButtonElement>("[data-eidos-catalog-action]");
    if (catalogButtons.length > 0) {
      const actionStatus = document.createElement("pre");
      actionStatus.setAttribute("data-eidos-action-status", "");
      actionStatus.setAttribute("role", "status");
      actionStatus.style.marginTop = "12px";
      pageContainer.appendChild(actionStatus);

      for (const button of Array.from(catalogButtons)) {
        button.addEventListener("click", () => {
          void (async () => {
            if (button.disabled) {
              actionStatus.textContent = button.dataset.eidosDisabledReason ?? "This action is not available yet.";
              return;
            }
            const actionType = button.dataset.eidosActionType;
            const route = button.dataset.eidosRoute;
            if (actionType === "navigate") {
              if (!route) throw new Error("EIDOS_CATALOG_NAVIGATE_ROUTE_REQUIRED");
              await navigate(route);
              return;
            }
            if (actionType !== "command") return;
            if (!options.actionHost) {
              actionStatus.textContent = hostText("shell.noActionHost", "No App Host ActionHost is configured.");
              return;
            }
            const command = button.dataset.eidosCommand;
            const itemId = button.dataset.eidosItemId;
            if (!command || !itemId) {
              actionStatus.textContent = "Catalog command action is incomplete.";
              return;
            }
            if (button.dataset.eidosConfirm === "true" && !window.confirm(button.textContent ?? "Confirm action?")) {
              return;
            }
            button.disabled = true;
            actionStatus.textContent = hostText("shell.executing", "Executing…");
            try {
              const request = {
                contractVersion: "0.1.0" as const,
                type: "command" as const,
                command: { code: command, inputVersion: button.dataset.eidosInputVersion ?? "0.1.0" },
                values: { itemId },
                sourceInteractionId: (loaded.definition as { id?: string }).id ?? loaded.page.id,
                actionId: button.dataset.eidosCatalogAction ?? command,
                requiresConfirmation: button.dataset.eidosConfirm === "true"
              };
              const result = await options.actionHost.execute(request);
              if (result.ok) {
                const payload = result.result;
                if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
                  const message = (payload as { message?: unknown }).message;
                  const nextAction = (payload as { nextAction?: unknown }).nextAction;
                  const details = JSON.stringify(payload, null, 2);
                  actionStatus.textContent = [
                    typeof message === "string" ? message : hostText("shell.completed", "Completed."),
                    typeof nextAction === "string"
                      ? hostText("shell.next", "Next: {next}", { next: nextAction })
                      : "",
                    details
                  ].filter(Boolean).join("\n\n");
                } else {
                  actionStatus.textContent = JSON.stringify(payload ?? { ok: true }, null, 2);
                }
              } else {
                actionStatus.textContent = hostText("shell.actionFailed", "Action failed: {message}", { message: result.error?.message ?? "Unknown action error" });
              }
              await options.onActionResult?.(result, loaded);
              if (result.ok) await refresh();
            } catch (error) {
              actionStatus.textContent = hostText("shell.actionFailed", "Action failed: {message}", { message: error instanceof Error ? error.message : String(error) });
            } finally {
              button.disabled = false;
            }
          })();
        });
      }
    }

    const form = pageContainer.querySelector<HTMLFormElement>("form[data-eidos-id]");
    if (form) {
      const actionStatus = document.createElement("div");
      actionStatus.setAttribute("data-eidos-action-status", "");
      actionStatus.setAttribute("role", "status");
      actionStatus.style.marginTop = "12px";
      pageContainer.appendChild(actionStatus);

      form.addEventListener("submit", event => {
        event.preventDefault();
        void (async () => {
          if (!options.actionHost) {
            actionStatus.textContent = hostText("shell.noActionHost", "No App Host ActionHost is configured.");
            return;
          }

          const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
          if (submit) submit.disabled = true;
          actionStatus.textContent = hostText("shell.executing", "Executing…");

          try {
            const values = collectFormValues(form, loaded.definition);
            const execution = await executeAppHostPageAction(
              loaded,
              values,
              options.actionHost
            );
            if (execution.result.ok) {
              actionStatus.textContent = `Completed: ${execution.request.command.code}`;
            } else {
              actionStatus.textContent = `Action failed: ${execution.result.error?.message ?? "Unknown action error"}`;
            }
            await options.onActionResult?.(execution.result, loaded);
          } catch (error) {
            actionStatus.textContent = `Action failed: ${error instanceof Error ? error.message : String(error)}`;
          } finally {
            if (submit) submit.disabled = false;
          }
        })();
      });
    }

    main.appendChild(pageContainer);
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
        ? localization.resolve(
            owner.packageId,
            `navigation.${item.id}.label`,
            item.label
          )
        : item.label;
      button.setAttribute("data-route", item.route);
      button.style.display = "block";
      button.style.width = "100%";
      button.style.textAlign = "left";
      button.style.margin = "0 0 8px";
      button.onclick = () => {
        window.location.hash = item.route;
      };
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

  const unsubscribe = host.subscribe(snapshot => {
    if (disposed) return;
    renderNavigation(snapshot);
  });

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

  if (localization) {
    refreshLocaleOptions();
    localeSelect.addEventListener("change", () => {
      localization.setLocale(localeSelect.value);
    });
  }

  const unsubscribeLocale = localization?.subscribe(() => {
    if (disposed) return;
    refreshLocaleOptions();
    renderNavigation(host.getSnapshot());
    void renderRoute(activePath);
  });

  const onHashChange = () => {
    void renderRoute(currentPath());
  };
  window.addEventListener("hashchange", onHashChange);

  async function refresh(): Promise<AppHostSnapshotV010> {
    const snapshot = await host.refresh();
    renderNavigation(snapshot);

    let path = currentPath();
    if (!host.resolveRoute(path)) {
      const defaultRoute = snapshot.manifests.find(x => x.defaultRoute)?.defaultRoute;
      path = defaultRoute ?? snapshot.routes[0]?.path ?? "/";
      if (path !== "/" && currentPath() !== path) {
        window.location.hash = path;
      }
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
    unsubscribe();
    unsubscribeLocale?.();
    window.removeEventListener("hashchange", onHashChange);
    root.remove();
  }

  await refresh();

  return { refresh, navigate, dispose };
}
