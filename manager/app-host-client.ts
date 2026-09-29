import {
  createAppHost,
  createAppManagerExperienceSource,
  createAppManagerActionHost,
  mountSurfaceHandoffV010,
  readBrowserSurfaceProfileV010,
  surfaceQueryValueV010
} from "../vendor/eidos/src/app-host/index.js";
import {
  replaceBrowserSurfaceRouteV010,
  resolveBrowserSurfaceGatewayV010
} from "./browser-surface-gateway.js";
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

if (!window.location.hash || window.location.hash === "#") {
  window.location.hash = "/store";
}

const persistedLocale = window.localStorage.getItem("evo.locale")?.trim();
const browserLocale = window.navigator.language?.trim();
const initialLocale = persistedLocale || browserLocale || "en";
let activeLocale = initialLocale;

const source = createAppManagerExperienceSource({
  baseUrl: window.location.origin,
  locale: () => activeLocale
});
const actionHost = createAppManagerActionHost({
  baseUrl: window.location.origin
});

const [bootstrapManifests, initialBundles] = await Promise.all([
  source.listEffectiveExperienceManifests(),
  source.listEffectiveLocalizationBundles()
]);

let pendingBootstrapManifests: unknown[] | undefined = bootstrapManifests;
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

const currentSurfacePath = window.location.hash.startsWith("#")
  ? window.location.hash.slice(1)
  : window.location.hash;
const surfaceGateway = resolveBrowserSurfaceGatewayV010({
  manifests: bootstrapManifests,
  path: currentSurfacePath || "/store",
  url: new URL(window.location.href),
  profile: readBrowserSurfaceProfileV010(),
  storedUserTarget:
    window.localStorage.getItem("evo.surface.target") ?? undefined
});

let activeSurfaceId: string | undefined;
if (surfaceGateway.kind === "REDIRECT") {
  activeSurfaceId = surfaceGateway.surfaceId;
  replaceBrowserSurfaceRouteV010(surfaceGateway.toPath);
} else if (surfaceGateway.kind === "UNCHANGED") {
  activeSurfaceId = surfaceGateway.surfaceId;
}

let activeBundleDigest = JSON.stringify(initialBundles);

const localization = createLocalizationRuntime(
  [...eidosAppHostLocalizationBundles, ...initialBundles],
  {
    locale: initialLocale,
    fallbackLocales: ["en"]
  }
);

localization.subscribe(context => {
  activeLocale = context.locale;
  window.localStorage.setItem("evo.locale", context.locale);
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
    const response = await fetch("/v1/workbench/activities", { headers });
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

if (surfaceGateway.kind === "HANDOFF") {
  const mountedHandoff = mountSurfaceHandoffV010({
    container: "#app",
    model: surfaceGateway.model,
    onNavigate(route, target) {
      const next = new URL(window.location.href);
      next.searchParams.set("surface", surfaceQueryValueV010(target));
      next.hash = route;
      window.location.replace(next.toString());
    }
  });

  window.addEventListener("pagehide", () => {
    mountedHandoff.dispose();
  }, { once: true });
} else {
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
    async onActionResult(result, _page, renderHint) {
      if (renderHint?.preserveMountedPage === true) {
        rememberLocallyAppliedCorrelation(result);
      }
    }
  });

  const realtime = createFetchSseRealtimeSourceV010({
    url: () => window.location.origin + "/v1/events"
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

  window.addEventListener("pagehide", () => {
    if (topologyEventTimer !== undefined) {
      clearTimeout(topologyEventTimer);
      topologyEventTimer = undefined;
    }
    unsubscribeRealtime();
    realtime.dispose();
  }, { once: true });
}
