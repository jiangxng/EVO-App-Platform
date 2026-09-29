import type {
  AppHostSurfaceTargetV010
} from "./contracts.js";
import type {
  ExperienceSurfaceHandoffResolutionV010
} from "./surface.js";

export interface SurfaceHandoffAlternativeV010 {
  target: AppHostSurfaceTargetV010;
  label: string;
  route?: string;
}

export interface SurfaceHandoffViewModelV010 {
  contractVersion: "0.1.0";
  kind: "SURFACE_HANDOFF";
  target: AppHostSurfaceTargetV010;
  reason: ExperienceSurfaceHandoffResolutionV010["reason"];
  title: string;
  message: string;
  requestedPath?: string;
  semanticRouteId?: string;
  alternatives: SurfaceHandoffAlternativeV010[];
}

export interface SurfaceHandoffTextV010 {
  title?: string;
  unsupportedMessage?: string;
  unavailableMessage?: string;
}

function defaultMessage(
  reason: ExperienceSurfaceHandoffResolutionV010["reason"]
): string {
  switch (reason) {
    case "LEGACY_DESKTOP_ONLY":
      return "This experience has not declared support for the current surface.";
    case "TARGET_NOT_DECLARED":
      return "This experience is not available on the requested surface.";
    case "TARGET_UNSUPPORTED":
      return "This task is intentionally not supported on the requested surface.";
    case "SEMANTIC_ROUTE_UNAVAILABLE":
      return "This task exists, but not on the requested surface.";
  }
}

export function createSurfaceHandoffViewModelV010(
  resolution: ExperienceSurfaceHandoffResolutionV010,
  alternatives: SurfaceHandoffAlternativeV010[],
  text: SurfaceHandoffTextV010 = {}
): SurfaceHandoffViewModelV010 {
  return {
    contractVersion: "0.1.0",
    kind: "SURFACE_HANDOFF",
    target: resolution.target,
    reason: resolution.reason,
    title: text.title ?? "Continue on another surface",
    message: resolution.reason === "SEMANTIC_ROUTE_UNAVAILABLE"
      ? text.unavailableMessage ?? defaultMessage(resolution.reason)
      : text.unsupportedMessage ?? defaultMessage(resolution.reason),
    ...(resolution.requestedPath
      ? { requestedPath: resolution.requestedPath }
      : {}),
    ...(resolution.semanticRouteId
      ? { semanticRouteId: resolution.semanticRouteId }
      : {}),
    alternatives: alternatives.map(item => ({ ...item }))
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

export function renderSurfaceHandoffToHtmlV010(
  model: SurfaceHandoffViewModelV010
): string {
  const alternatives = model.alternatives
    .map(item => {
      const route = item.route
        ? ` data-route="${escapeHtml(item.route)}"`
        : "";
      return `<button type="button" data-eidos-surface-handoff-target="${escapeHtml(item.target)}"${route}>${escapeHtml(item.label)}</button>`;
    })
    .join("");

  return [
    `<section data-eidos-surface-handoff="0.1.0" data-target="${escapeHtml(model.target)}" data-reason="${escapeHtml(model.reason)}">`,
    `<h1>${escapeHtml(model.title)}</h1>`,
    `<p>${escapeHtml(model.message)}</p>`,
    model.requestedPath
      ? `<p data-eidos-surface-handoff-path>${escapeHtml(model.requestedPath)}</p>`
      : "",
    alternatives
      ? `<div data-eidos-surface-handoff-actions>${alternatives}</div>`
      : "",
    "</section>"
  ].join("");
}

export interface MountedSurfaceHandoffV010 {
  dispose(): void;
}

export function mountSurfaceHandoffV010(options: {
  container: HTMLElement | string;
  model: SurfaceHandoffViewModelV010;
  onNavigate?: (route: string, target: AppHostSurfaceTargetV010) => void;
}): MountedSurfaceHandoffV010 {
  const container = typeof options.container === "string"
    ? document.querySelector<HTMLElement>(options.container)
    : options.container;
  if (!container) {
    throw new Error("EIDOS_SURFACE_HANDOFF_CONTAINER_NOT_FOUND");
  }

  const root = document.createElement("div");
  root.innerHTML = renderSurfaceHandoffToHtmlV010(options.model);
  const surface = root.firstElementChild;
  if (!surface) {
    throw new Error("EIDOS_SURFACE_HANDOFF_RENDER_FAILED");
  }

  const listeners: Array<() => void> = [];
  for (const button of Array.from(
    surface.querySelectorAll<HTMLButtonElement>(
      "[data-eidos-surface-handoff-target]"
    )
  )) {
    const handler = () => {
      const target = button.dataset.eidosSurfaceHandoffTarget as
        AppHostSurfaceTargetV010 | undefined;
      const route = button.dataset.route;
      if (target && route) options.onNavigate?.(route, target);
    };
    button.addEventListener("click", handler);
    listeners.push(() => button.removeEventListener("click", handler));
  }

  container.replaceChildren(surface);
  return {
    dispose() {
      for (const dispose of listeners) dispose();
      surface.remove();
    }
  };
}
