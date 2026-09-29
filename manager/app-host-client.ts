import {
  createAppManagerExperienceSource
} from "../vendor/eidos/src/app-host/app-manager-source.js";
import {
  mountSurfaceHandoffV010
} from "../vendor/eidos/src/app-host/surface-handoff.js";
import {
  readBrowserSurfaceProfileV010,
  surfaceQueryValueV010
} from "../vendor/eidos/src/app-host/surface.js";
import {
  replaceBrowserSurfaceRouteV010,
  resolveBrowserSurfaceGatewayV010
} from "./browser-surface-gateway.js";
import {
  disposeOnRealPageExitV010,
  mountBrowserConnectivityNoticeV010
} from "./browser-lifecycle.js";

if (!window.location.hash || window.location.hash === "#") {
  window.location.hash = "/store";
}

const persistedLocale = window.localStorage.getItem("evo.locale")?.trim();
const browserLocale = window.navigator.language?.trim();
const initialLocale = persistedLocale || browserLocale || "en";

const source = createAppManagerExperienceSource({
  baseUrl: window.location.origin,
  locale: () =>
    window.localStorage.getItem("evo.locale")?.trim()
    || initialLocale
});

const connectivity = mountBrowserConnectivityNoticeV010();
const bootstrapManifests = await source.listEffectiveExperienceManifests();

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

let activePath = currentSurfacePath || "/store";
let activeSurfaceId: string | undefined;
let activeTarget:
  | "DESKTOP_WORKBENCH"
  | "MOBILE_TASK"
  | "MOBILE_READ"
  | "TABLET_WORKBENCH"
  | undefined;

if (surfaceGateway.kind === "REDIRECT") {
  activePath = surfaceGateway.toPath;
  activeSurfaceId = surfaceGateway.surfaceId;
  activeTarget = surfaceGateway.target;
  replaceBrowserSurfaceRouteV010(surfaceGateway.toPath);
} else if (surfaceGateway.kind === "UNCHANGED") {
  activeSurfaceId = surfaceGateway.surfaceId;
  activeTarget = surfaceGateway.target;
}

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

  disposeOnRealPageExitV010(() => {
    mountedHandoff.dispose();
    connectivity.dispose();
  });
} else if (activeTarget === "MOBILE_TASK") {
  const { mountMobileTaskRuntimeV010 } = await import(
    "./mobile-task-runtime.js"
  );
  const mounted = await mountMobileTaskRuntimeV010({
    container: "#app",
    source,
    bootstrapManifests,
    path: activePath,
    locale: initialLocale,
    baseUrl: window.location.origin
  });

  disposeOnRealPageExitV010(() => {
    mounted.dispose();
    connectivity.dispose();
  });
} else if (activeTarget === "MOBILE_READ") {
  const { mountMobileReadRuntimeV010 } = await import(
    "./mobile-read-runtime.js"
  );
  const mounted = await mountMobileReadRuntimeV010({
    container: "#app",
    source,
    bootstrapManifests,
    path: activePath,
    baseUrl: window.location.origin
  });

  disposeOnRealPageExitV010(() => {
    mounted.dispose();
    connectivity.dispose();
  });
} else {
  const { mountDesktopWorkbenchRuntimeV010 } = await import(
    "./desktop-workbench-runtime.js"
  );
  const mounted = await mountDesktopWorkbenchRuntimeV010({
    source,
    bootstrapManifests,
    initialLocale,
    activeSurfaceId,
    baseUrl: window.location.origin
  });
  disposeOnRealPageExitV010(() => {
    mounted.dispose();
    connectivity.dispose();
  });
}
