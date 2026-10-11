import type {
  ActionRequestV010,
  JsonValue
} from "../vendor/eidos/src/runtime/contracts.js";
import type {
  EffectiveExperienceManifestV010,
  ExperienceSource
} from "../vendor/eidos/src/app-host/contracts.js";
import {
  validateEffectiveExperienceManifest
} from "../vendor/eidos/src/app-host/host.js";
import {
  createAppManagerActionHost
} from "../vendor/eidos/src/app-host/app-manager-action-host.js";
import {
  isEntityInspectorV010,
  renderEntityInspectorToHtml
} from "../vendor/eidos/src/entity-inspector/index.js";

export interface MobileReadRuntimeV010 {
  dispose(): void;
}

interface EntityInspectorReaderPageV010 {
  contractVersion: "0.1.0";
  kind: "entity-inspector-reader";
  id: string;
  title: string;
  resourceId: string;
  readCommand: {
    code: string;
    inputVersion: string;
  };
  requestValues: Record<string, JsonValue>;
}

function isEntityInspectorReaderPageV010(
  value: unknown
): value is EntityInspectorReaderPageV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const page = value as Partial<EntityInspectorReaderPageV010>;
  return page.contractVersion === "0.1.0"
    && page.kind === "entity-inspector-reader"
    && typeof page.id === "string"
    && typeof page.resourceId === "string"
    && page.readCommand !== undefined
    && typeof page.readCommand.code === "string"
    && typeof page.readCommand.inputVersion === "string"
    && page.requestValues !== null
    && typeof page.requestValues === "object"
    && !Array.isArray(page.requestValues);
}

function findManifestAndRoute(
  rawManifests: unknown[],
  path: string
): {
  manifest: EffectiveExperienceManifestV010;
  route: EffectiveExperienceManifestV010["routes"][number];
} | undefined {
  for (const [index, raw] of rawManifests.entries()) {
    const validated = validateEffectiveExperienceManifest(raw, index);
    if (!validated.ok || !validated.value) continue;
    const route = validated.value.routes.find(item => item.path === path);
    if (route) return { manifest: validated.value, route };
  }
  return undefined;
}

export async function mountMobileReadRuntimeV010(options: {
  container: HTMLElement | string;
  source: ExperienceSource;
  bootstrapManifests: unknown[];
  path: string;
  locale: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<MobileReadRuntimeV010> {
  const container = typeof options.container === "string"
    ? document.querySelector<HTMLElement>(options.container)
    : options.container;
  if (!container) throw new Error("EVO_MOBILE_READ_CONTAINER_NOT_FOUND");

  const resolved = findManifestAndRoute(options.bootstrapManifests, options.path);
  if (!resolved) throw new Error("EVO_MOBILE_READ_ROUTE_NOT_FOUND");

  const page = resolved.manifest.pages.find(
    item => item.id === resolved.route.pageId
  );
  if (!page) throw new Error("EVO_MOBILE_READ_PAGE_NOT_FOUND");

  const definition = await options.source.loadPage(
    page,
    { routePath: options.path }
  );
  if (!isEntityInspectorReaderPageV010(definition)) {
    throw new Error("EVO_MOBILE_READ_UNSUPPORTED_PAGE_KIND");
  }

  const root = document.createElement("main");
  root.setAttribute("data-evo-mobile-read-runtime", "0.1.0");
  root.setAttribute("data-surface-target", "MOBILE_READ");
  root.setAttribute("data-resource-id", definition.resourceId);

  const status = document.createElement("div");
  status.setAttribute("data-evo-mobile-read-status", "");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Loading…";

  const content = document.createElement("div");
  content.setAttribute("data-evo-mobile-read-content", "");
  root.append(status, content);
  container.replaceChildren(root);

  let disposed = false;
  const controller = new AbortController();
  const actionHost = createAppManagerActionHost({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    locale: () => options.locale
  });

  const request: ActionRequestV010 = {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...definition.readCommand },
    values: structuredClone(definition.requestValues),
    sourceInteractionId: definition.id,
    actionId: "read",
    requiresConfirmation: false
  };

  const result = await actionHost.execute(request);
  if (disposed || controller.signal.aborted) {
    return {
      dispose() {
        disposed = true;
        controller.abort();
      }
    };
  }

  if (!result.ok) {
    status.textContent = result.error?.message ?? "Unable to load read view.";
  } else if (!isEntityInspectorV010(result.result)) {
    status.textContent = "Invalid read model.";
  } else {
    content.innerHTML = renderEntityInspectorToHtml(result.result);
    status.textContent = "";
  }

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      root.remove();
    }
  };
}
