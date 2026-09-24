import type { Diagnostic, ValidationResult } from "../runtime/contracts.js";
import { isPlainObject } from "../runtime/json.js";
import type {
  AppHost,
  AppHostLoadedPageV010,
  AppHostNavigationItemV010,
  AppHostPageReferenceV010,
  AppHostResolvedRouteV010,
  AppHostRouteV010,
  AppHostSnapshotV010,
  EffectiveExperienceManifestV010,
  ExperienceSource
} from "./contracts.js";

const diagnostic = (code: string, path: string, message: string, fix?: string): Diagnostic => ({
  code,
  path,
  message,
  ...(fix ? { fix } : {})
});

function clonePage(page: AppHostPageReferenceV010): AppHostPageReferenceV010 {
  return { id: page.id, source: page.source, ...(page.title ? { title: page.title } : {}) };
}

function cloneRoute(route: AppHostRouteV010): AppHostRouteV010 {
  return { id: route.id, path: route.path, pageId: route.pageId };
}

function cloneNavigation(item: AppHostNavigationItemV010): AppHostNavigationItemV010 {
  return {
    id: item.id,
    label: item.label,
    route: item.route,
    ...(item.order !== undefined ? { order: item.order } : {}),
    ...(item.parentId ? { parentId: item.parentId } : {})
  };
}

function cloneManifest(manifest: EffectiveExperienceManifestV010): EffectiveExperienceManifestV010 {
  return {
    contractVersion: "0.1.0",
    experienceId: manifest.experienceId,
    packageId: manifest.packageId,
    featureId: manifest.featureId,
    ...(manifest.defaultRoute ? { defaultRoute: manifest.defaultRoute } : {}),
    pages: manifest.pages.map(clonePage),
    routes: manifest.routes.map(cloneRoute),
    ...(manifest.navigation ? { navigation: manifest.navigation.map(cloneNavigation) } : {})
  };
}

function cloneSnapshot(snapshot: AppHostSnapshotV010): AppHostSnapshotV010 {
  return {
    contractVersion: "0.1.0",
    revision: snapshot.revision,
    status: snapshot.status,
    manifests: snapshot.manifests.map(cloneManifest),
    pages: snapshot.pages.map(clonePage),
    routes: snapshot.routes.map(cloneRoute),
    navigation: snapshot.navigation.map(cloneNavigation),
    diagnostics: snapshot.diagnostics.map(item => ({ ...item }))
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function validateEffectiveExperienceManifest(
  value: unknown,
  index = 0
): ValidationResult<EffectiveExperienceManifestV010> {
  const diagnostics: Diagnostic[] = [];
  const root = `$[${index}]`;

  if (!isPlainObject(value)) {
    return {
      ok: false,
      diagnostics: [diagnostic("EIDOS_APP_HOST_MANIFEST_TYPE", root, "Experience manifest must be an object")]
    };
  }

  if (value.contractVersion !== "0.1.0") {
    diagnostics.push(diagnostic(
      "EIDOS_APP_HOST_MANIFEST_VERSION",
      `${root}.contractVersion`,
      "Unsupported App Host experience manifest version"
    ));
  }

  for (const key of ["experienceId", "packageId", "featureId"] as const) {
    if (!isNonEmptyString(value[key])) {
      diagnostics.push(diagnostic(
        "EIDOS_APP_HOST_MANIFEST_ID",
        `${root}.${key}`,
        `${key} must be a non-empty string`
      ));
    }
  }

  if (!Array.isArray(value.pages)) {
    diagnostics.push(diagnostic("EIDOS_APP_HOST_PAGES", `${root}.pages`, "pages must be an array"));
  }

  if (!Array.isArray(value.routes)) {
    diagnostics.push(diagnostic("EIDOS_APP_HOST_ROUTES", `${root}.routes`, "routes must be an array"));
  }

  if (value.navigation !== undefined && !Array.isArray(value.navigation)) {
    diagnostics.push(diagnostic(
      "EIDOS_APP_HOST_NAVIGATION",
      `${root}.navigation`,
      "navigation must be an array when provided"
    ));
  }

  if (diagnostics.length) return { ok: false, diagnostics };

  const pages = value.pages as unknown[];
  const routes = value.routes as unknown[];
  const navigation = (value.navigation ?? []) as unknown[];

  const pageIds = new Set<string>();
  pages.forEach((page, pageIndex) => {
    const path = `${root}.pages[${pageIndex}]`;
    if (!isPlainObject(page)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_PAGE_TYPE", path, "page must be an object"));
      return;
    }
    if (!isNonEmptyString(page.id)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_PAGE_ID", `${path}.id`, "page id is required"));
    } else if (pageIds.has(page.id)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_PAGE_DUPLICATE", `${path}.id`, `Duplicate page id '${page.id}'`));
    } else {
      pageIds.add(page.id);
    }
    if (!isNonEmptyString(page.source)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_PAGE_SOURCE", `${path}.source`, "page source is required"));
    }
    if (page.title !== undefined && typeof page.title !== "string") {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_PAGE_TITLE", `${path}.title`, "page title must be a string"));
    }
  });

  const routeIds = new Set<string>();
  const routePaths = new Set<string>();
  routes.forEach((route, routeIndex) => {
    const path = `${root}.routes[${routeIndex}]`;
    if (!isPlainObject(route)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_ROUTE_TYPE", path, "route must be an object"));
      return;
    }
    if (!isNonEmptyString(route.id)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_ROUTE_ID", `${path}.id`, "route id is required"));
    } else if (routeIds.has(route.id)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_ROUTE_ID_DUPLICATE", `${path}.id`, `Duplicate route id '${route.id}'`));
    } else {
      routeIds.add(route.id);
    }
    if (!isNonEmptyString(route.path) || !route.path.startsWith("/")) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_ROUTE_PATH", `${path}.path`, "route path must start with '/'"));
    } else if (routePaths.has(route.path)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_ROUTE_PATH_DUPLICATE", `${path}.path`, `Duplicate route path '${route.path}'`));
    } else {
      routePaths.add(route.path);
    }
    if (!isNonEmptyString(route.pageId) || !pageIds.has(route.pageId)) {
      diagnostics.push(diagnostic(
        "EIDOS_APP_HOST_ROUTE_PAGE",
        `${path}.pageId`,
        "route pageId must reference a page in the same manifest"
      ));
    }
  });

  const navigationIds = new Set<string>();
  navigation.forEach((item, navIndex) => {
    const path = `${root}.navigation[${navIndex}]`;
    if (!isPlainObject(item)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_NAV_TYPE", path, "navigation item must be an object"));
      return;
    }
    if (!isNonEmptyString(item.id)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_NAV_ID", `${path}.id`, "navigation id is required"));
    } else if (navigationIds.has(item.id)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_NAV_DUPLICATE", `${path}.id`, `Duplicate navigation id '${item.id}'`));
    } else {
      navigationIds.add(item.id);
    }
    if (!isNonEmptyString(item.label)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_NAV_LABEL", `${path}.label`, "navigation label is required"));
    }
    if (!isNonEmptyString(item.route) || !routePaths.has(item.route)) {
      diagnostics.push(diagnostic(
        "EIDOS_APP_HOST_NAV_ROUTE",
        `${path}.route`,
        "navigation route must reference a route in the same manifest"
      ));
    }
    if (item.order !== undefined && (typeof item.order !== "number" || !Number.isFinite(item.order))) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_NAV_ORDER", `${path}.order`, "navigation order must be a finite number"));
    }
    if (item.parentId !== undefined && !isNonEmptyString(item.parentId)) {
      diagnostics.push(diagnostic("EIDOS_APP_HOST_NAV_PARENT", `${path}.parentId`, "parentId must be a non-empty string"));
    }
  });

  if (isNonEmptyString(value.defaultRoute) && !routePaths.has(value.defaultRoute)) {
    diagnostics.push(diagnostic(
      "EIDOS_APP_HOST_DEFAULT_ROUTE",
      `${root}.defaultRoute`,
      "defaultRoute must reference a route in the same manifest"
    ));
  } else if (value.defaultRoute !== undefined && !isNonEmptyString(value.defaultRoute)) {
    diagnostics.push(diagnostic(
      "EIDOS_APP_HOST_DEFAULT_ROUTE",
      `${root}.defaultRoute`,
      "defaultRoute must be a non-empty string"
    ));
  }

  for (const item of navigation) {
    if (isPlainObject(item) && isNonEmptyString(item.parentId) && !navigationIds.has(item.parentId)) {
      diagnostics.push(diagnostic(
        "EIDOS_APP_HOST_NAV_PARENT_MISSING",
        root,
        `Navigation parent '${item.parentId}' is not declared in the same manifest`
      ));
    }
  }

  if (diagnostics.length) return { ok: false, diagnostics };

  return {
    ok: true,
    diagnostics: [],
    value: cloneManifest(value as unknown as EffectiveExperienceManifestV010)
  };
}

function manifestKey(manifest: EffectiveExperienceManifestV010): string {
  return `${manifest.packageId}\u0000${manifest.featureId}\u0000${manifest.experienceId}`;
}

function duplicateOwners<T>(
  manifests: EffectiveExperienceManifestV010[],
  items: (manifest: EffectiveExperienceManifestV010) => T[],
  key: (item: T) => string
): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();
  for (const manifest of manifests) {
    const owner = manifestKey(manifest);
    for (const item of items(manifest)) {
      const id = key(item);
      const set = owners.get(id) ?? new Set<string>();
      set.add(owner);
      owners.set(id, set);
    }
  }
  return new Map([...owners].filter(([, set]) => set.size > 1));
}

function conflictDiagnostics(
  code: string,
  kind: string,
  conflicts: Map<string, Set<string>>
): Diagnostic[] {
  return [...conflicts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, owners]) => diagnostic(
      code,
      "$",
      `${kind} '${id}' is contributed by multiple manifests: ${[...owners].sort().join(", ")}`
    ));
}

export function createAppHost(source: ExperienceSource): AppHost {
  let disposed = false;
  let revision = 0;
  const listeners = new Set<(snapshot: AppHostSnapshotV010) => void>();
  let snapshot: AppHostSnapshotV010 = {
    contractVersion: "0.1.0",
    revision,
    status: "idle",
    manifests: [],
    pages: [],
    routes: [],
    navigation: [],
    diagnostics: []
  };

  const publish = (next: AppHostSnapshotV010): AppHostSnapshotV010 => {
    snapshot = next;
    const cloned = cloneSnapshot(snapshot);
    for (const listener of listeners) listener(cloneSnapshot(cloned));
    return cloned;
  };

  const refresh = async (): Promise<AppHostSnapshotV010> => {
    if (disposed) {
      throw new Error("EIDOS_APP_HOST_DISPOSED");
    }

    revision += 1;
    let raw: unknown[];
    try {
      raw = await source.listEffectiveExperienceManifests();
      if (!Array.isArray(raw)) throw new Error("Experience source did not return an array");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return publish({
        contractVersion: "0.1.0",
        revision,
        status: "error",
        manifests: [],
        pages: [],
        routes: [],
        navigation: [],
        diagnostics: [diagnostic(
          "EIDOS_APP_HOST_DISCOVERY_FAILED",
          "$",
          `Failed to discover effective experiences: ${message}`
        )]
      });
    }

    const diagnostics: Diagnostic[] = [];
    const valid: EffectiveExperienceManifestV010[] = [];

    raw.forEach((value, index) => {
      const result = validateEffectiveExperienceManifest(value, index);
      if (result.ok && result.value) valid.push(result.value);
      else diagnostics.push(...result.diagnostics);
    });

    valid.sort((a, b) => manifestKey(a).localeCompare(manifestKey(b)));

    const pageConflicts = duplicateOwners(valid, manifest => manifest.pages, page => page.id);
    const routeIdConflicts = duplicateOwners(valid, manifest => manifest.routes, route => route.id);
    const routePathConflicts = duplicateOwners(valid, manifest => manifest.routes, route => route.path);
    const navigationConflicts = duplicateOwners(valid, manifest => manifest.navigation ?? [], item => item.id);

    diagnostics.push(...conflictDiagnostics("EIDOS_APP_HOST_PAGE_CONFLICT", "Page id", pageConflicts));
    diagnostics.push(...conflictDiagnostics("EIDOS_APP_HOST_ROUTE_ID_CONFLICT", "Route id", routeIdConflicts));
    diagnostics.push(...conflictDiagnostics("EIDOS_APP_HOST_ROUTE_PATH_CONFLICT", "Route path", routePathConflicts));
    diagnostics.push(...conflictDiagnostics("EIDOS_APP_HOST_NAV_CONFLICT", "Navigation id", navigationConflicts));

    const rejectedOwners = new Set<string>();
    for (const conflicts of [pageConflicts, routeIdConflicts, routePathConflicts, navigationConflicts]) {
      for (const owners of conflicts.values()) {
        for (const owner of owners) rejectedOwners.add(owner);
      }
    }

    const accepted = valid.filter(manifest => !rejectedOwners.has(manifestKey(manifest)));
    const pages = accepted.flatMap(manifest => manifest.pages.map(clonePage));
    const routes = accepted.flatMap(manifest => manifest.routes.map(cloneRoute));
    const navigation = accepted
      .flatMap(manifest => (manifest.navigation ?? []).map(cloneNavigation))
      .sort((a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        a.id.localeCompare(b.id)
      );

    const status = diagnostics.length === 0 ? "ready" : accepted.length > 0 || raw.length === 0 ? "degraded" : "error";

    return publish({
      contractVersion: "0.1.0",
      revision,
      status,
      manifests: accepted.map(cloneManifest),
      pages,
      routes,
      navigation,
      diagnostics
    });
  };

  const getSnapshot = (): AppHostSnapshotV010 => cloneSnapshot(snapshot);

  const resolveRoute = (path: string): AppHostResolvedRouteV010 | undefined => {
    const route = snapshot.routes.find(item => item.path === path);
    if (!route) return undefined;
    const page = snapshot.pages.find(item => item.id === route.pageId);
    if (!page) return undefined;
    const manifest = snapshot.manifests.find(item => item.routes.some(candidate => candidate.id === route.id));
    if (!manifest) return undefined;
    return {
      route: cloneRoute(route),
      page: clonePage(page),
      experienceId: manifest.experienceId,
      packageId: manifest.packageId,
      featureId: manifest.featureId
    };
  };

  const loadRoute = async (path: string): Promise<AppHostLoadedPageV010 | undefined> => {
    if (disposed) throw new Error("EIDOS_APP_HOST_DISPOSED");
    const resolved = resolveRoute(path);
    if (!resolved) return undefined;
    const definition = await source.loadPage(clonePage(resolved.page));
    return { ...resolved, definition };
  };

  const subscribe = (listener: (snapshot: AppHostSnapshotV010) => void): (() => void) => {
    if (disposed) throw new Error("EIDOS_APP_HOST_DISPOSED");
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const dispose = (): void => {
    disposed = true;
    listeners.clear();
  };

  return { refresh, getSnapshot, resolveRoute, loadRoute, subscribe, dispose };
}
