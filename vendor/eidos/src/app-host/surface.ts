import type {
  AppHostRouteV010,
  AppHostSurfaceSupportV010,
  AppHostSurfaceTargetV010,
  ClientSurfaceProfileV010,
  EffectiveExperienceManifestV010
} from "./contracts.js";

export interface ClientSurfaceEnvironmentV010 {
  viewportWidth: number;
  coarsePointer: boolean;
  finePointer: boolean;
  hover: boolean;
  touchPoints: number;
  reducedMotion: boolean;
  standalone: boolean;
}

export function createClientSurfaceProfileV010(
  environment: ClientSurfaceEnvironmentV010
): ClientSurfaceProfileV010 {
  const viewportClass = environment.viewportWidth < 768
    ? "COMPACT"
    : environment.viewportWidth < 1200
      ? "MEDIUM"
      : "EXPANDED";
  const primaryPointer = environment.coarsePointer
    ? "COARSE"
    : environment.finePointer
      ? "FINE"
      : "NONE";

  return {
    contractVersion: "0.1.0",
    viewportClass,
    primaryPointer,
    hover: environment.hover,
    touch: environment.touchPoints > 0,
    reducedMotion: environment.reducedMotion,
    standalone: environment.standalone
  };
}

export function readBrowserSurfaceProfileV010(): ClientSurfaceProfileV010 {
  const media = (query: string): boolean =>
    typeof window.matchMedia === "function" && window.matchMedia(query).matches;

  return createClientSurfaceProfileV010({
    viewportWidth: window.innerWidth,
    coarsePointer: media("(pointer: coarse)"),
    finePointer: media("(pointer: fine)"),
    hover: media("(hover: hover)"),
    touchPoints: navigator.maxTouchPoints ?? 0,
    reducedMotion: media("(prefers-reduced-motion: reduce)"),
    standalone: media("(display-mode: standalone)")
  });
}

const SURFACE_QUERY_VALUES: Record<
  string,
  AppHostSurfaceTargetV010
> = {
  desktop: "DESKTOP_WORKBENCH",
  "mobile-task": "MOBILE_TASK",
  "mobile-read": "MOBILE_READ",
  tablet: "TABLET_WORKBENCH"
};

export function surfaceTargetFromUrlV010(
  url: URL
): AppHostSurfaceTargetV010 | undefined {
  const raw = url.searchParams.get("surface")?.trim().toLowerCase();
  return raw ? SURFACE_QUERY_VALUES[raw] : undefined;
}

export function surfaceQueryValueV010(
  target: AppHostSurfaceTargetV010
): string {
  return Object.entries(SURFACE_QUERY_VALUES)
    .find(([, value]) => value === target)?.[0] ?? "desktop";
}

export interface ExperienceSurfaceResolutionRequestV010 {
  path?: string;
  semanticRouteId?: string;
  explicitTarget?: AppHostSurfaceTargetV010;
  userTarget?: AppHostSurfaceTargetV010;
  profile?: ClientSurfaceProfileV010;
}

export interface ExperienceSurfaceRouteResolutionV010 {
  kind: "ROUTE";
  target: AppHostSurfaceTargetV010;
  support: Exclude<AppHostSurfaceSupportV010, "UNSUPPORTED">;
  surfaceId: string;
  route: AppHostRouteV010;
  semanticRouteId: string;
  selectedBy: "EXPLICIT" | "USER" | "CAPABILITY" | "DEFAULT";
}

export interface ExperienceSurfaceHandoffResolutionV010 {
  kind: "HANDOFF";
  target: AppHostSurfaceTargetV010;
  reason:
    | "LEGACY_DESKTOP_ONLY"
    | "TARGET_NOT_DECLARED"
    | "TARGET_UNSUPPORTED"
    | "SEMANTIC_ROUTE_UNAVAILABLE";
  selectedBy: "EXPLICIT" | "USER" | "CAPABILITY" | "DEFAULT";
  semanticRouteId?: string;
  requestedPath?: string;
  availableTargets: AppHostSurfaceTargetV010[];
  fallbackSurfaceId?: string;
}

export interface ExperienceSurfaceNotFoundResolutionV010 {
  kind: "NOT_FOUND";
  target: AppHostSurfaceTargetV010;
  selectedBy: "EXPLICIT" | "USER" | "CAPABILITY" | "DEFAULT";
  requestedPath?: string;
  semanticRouteId?: string;
}

export type ExperienceSurfaceResolutionV010 =
  | ExperienceSurfaceRouteResolutionV010
  | ExperienceSurfaceHandoffResolutionV010
  | ExperienceSurfaceNotFoundResolutionV010;

export function inferSurfaceTargetV010(
  profile: ClientSurfaceProfileV010
): AppHostSurfaceTargetV010 {
  if (
    profile.viewportClass === "COMPACT"
    || profile.primaryPointer === "COARSE"
  ) {
    return "MOBILE_TASK";
  }
  if (profile.viewportClass === "MEDIUM" && profile.touch) {
    return "TABLET_WORKBENCH";
  }
  return "DESKTOP_WORKBENCH";
}

function selectedTarget(
  request: ExperienceSurfaceResolutionRequestV010
): {
  target: AppHostSurfaceTargetV010;
  selectedBy: "EXPLICIT" | "USER" | "CAPABILITY" | "DEFAULT";
} {
  if (request.explicitTarget) {
    return { target: request.explicitTarget, selectedBy: "EXPLICIT" };
  }
  if (request.userTarget) {
    return { target: request.userTarget, selectedBy: "USER" };
  }
  if (request.profile) {
    return {
      target: inferSurfaceTargetV010(request.profile),
      selectedBy: "CAPABILITY"
    };
  }
  return { target: "DESKTOP_WORKBENCH", selectedBy: "DEFAULT" };
}

function semanticId(route: AppHostRouteV010): string {
  return route.semanticId ?? route.id;
}

function requestedSemanticId(
  manifest: EffectiveExperienceManifestV010,
  request: ExperienceSurfaceResolutionRequestV010
): string | undefined {
  if (request.semanticRouteId) return request.semanticRouteId;
  if (!request.path) return undefined;
  return manifest.routes.find(route => route.path === request.path)
    ? semanticId(manifest.routes.find(route => route.path === request.path)!)
    : undefined;
}

function routeForSurface(
  manifest: EffectiveExperienceManifestV010,
  surfaceId: string,
  semanticRouteId: string
): AppHostRouteV010 | undefined {
  return manifest.routes.find(route =>
    semanticId(route) === semanticRouteId
    && route.surfaceId === surfaceId
  ) ?? manifest.routes.find(route =>
    semanticId(route) === semanticRouteId
    && route.surfaceId === undefined
  );
}

export function resolveExperienceSurfaceV010(
  manifest: EffectiveExperienceManifestV010,
  request: ExperienceSurfaceResolutionRequestV010 = {}
): ExperienceSurfaceResolutionV010 {
  const choice = selectedTarget(request);
  const surfaces = manifest.surfaces ?? [];
  const semantic = requestedSemanticId(manifest, request);

  if (surfaces.length === 0) {
    if (choice.target !== "DESKTOP_WORKBENCH") {
      return {
        kind: "HANDOFF",
        target: choice.target,
        reason: "LEGACY_DESKTOP_ONLY",
        selectedBy: choice.selectedBy,
        ...(semantic ? { semanticRouteId: semantic } : {}),
        ...(request.path ? { requestedPath: request.path } : {}),
        availableTargets: ["DESKTOP_WORKBENCH"]
      };
    }

    const route = semantic
      ? manifest.routes.find(candidate => semanticId(candidate) === semantic)
      : request.path
        ? manifest.routes.find(candidate => candidate.path === request.path)
        : manifest.defaultRoute
          ? manifest.routes.find(candidate => candidate.path === manifest.defaultRoute)
          : manifest.routes[0];

    if (!route) {
      return {
        kind: "NOT_FOUND",
        target: choice.target,
        selectedBy: choice.selectedBy,
        ...(request.path ? { requestedPath: request.path } : {}),
        ...(semantic ? { semanticRouteId: semantic } : {})
      };
    }

    return {
      kind: "ROUTE",
      target: "DESKTOP_WORKBENCH",
      support: "FULL",
      surfaceId: "legacy:desktop",
      route,
      semanticRouteId: semanticId(route),
      selectedBy: choice.selectedBy
    };
  }

  const surface = surfaces.find(candidate => candidate.target === choice.target);
  const availableTargets = surfaces
    .filter(candidate => candidate.support !== "UNSUPPORTED")
    .map(candidate => candidate.target);

  if (!surface) {
    return {
      kind: "HANDOFF",
      target: choice.target,
      reason: "TARGET_NOT_DECLARED",
      selectedBy: choice.selectedBy,
      ...(semantic ? { semanticRouteId: semantic } : {}),
      ...(request.path ? { requestedPath: request.path } : {}),
      availableTargets
    };
  }

  if (surface.support === "UNSUPPORTED") {
    if (
      choice.selectedBy === "CAPABILITY"
      && surface.fallbackSurfaceId
    ) {
      const fallback = surfaces.find(
        candidate => candidate.id === surface.fallbackSurfaceId
      );
      if (fallback && fallback.support !== "UNSUPPORTED") {
        const fallbackRoute = semantic
          ? routeForSurface(manifest, fallback.id, semantic)
          : fallback.entryRoute
            ? manifest.routes.find(candidate =>
                candidate.path === fallback.entryRoute
                && (
                  candidate.surfaceId === fallback.id
                  || candidate.surfaceId === undefined
                )
              )
            : undefined;

        if (fallbackRoute) {
          return {
            kind: "ROUTE",
            target: fallback.target,
            support: fallback.support,
            surfaceId: fallback.id,
            route: fallbackRoute,
            semanticRouteId: semantic ?? semanticId(fallbackRoute),
            selectedBy: "CAPABILITY"
          };
        }
      }
    }

    return {
      kind: "HANDOFF",
      target: choice.target,
      reason: "TARGET_UNSUPPORTED",
      selectedBy: choice.selectedBy,
      ...(semantic ? { semanticRouteId: semantic } : {}),
      ...(request.path ? { requestedPath: request.path } : {}),
      availableTargets,
      ...(surface.fallbackSurfaceId
        ? { fallbackSurfaceId: surface.fallbackSurfaceId }
        : {})
    };
  }

  let route: AppHostRouteV010 | undefined;
  let resolvedSemantic = semantic;

  if (semantic) {
    route = routeForSurface(manifest, surface.id, semantic);
    if (!route) {
      return {
        kind: "HANDOFF",
        target: choice.target,
        reason: "SEMANTIC_ROUTE_UNAVAILABLE",
        selectedBy: choice.selectedBy,
        semanticRouteId: semantic,
        ...(request.path ? { requestedPath: request.path } : {}),
        availableTargets,
        ...(surface.fallbackSurfaceId
          ? { fallbackSurfaceId: surface.fallbackSurfaceId }
          : {})
      };
    }
  } else if (request.path) {
    route = manifest.routes.find(candidate =>
      candidate.path === request.path
      && (candidate.surfaceId === surface.id || candidate.surfaceId === undefined)
    );
  } else if (surface.entryRoute) {
    route = manifest.routes.find(candidate =>
      candidate.path === surface.entryRoute
      && (candidate.surfaceId === surface.id || candidate.surfaceId === undefined)
    );
  }

  if (!route) {
    return {
      kind: "NOT_FOUND",
      target: choice.target,
      selectedBy: choice.selectedBy,
      ...(request.path ? { requestedPath: request.path } : {}),
      ...(resolvedSemantic ? { semanticRouteId: resolvedSemantic } : {})
    };
  }

  resolvedSemantic ??= semanticId(route);
  return {
    kind: "ROUTE",
    target: choice.target,
    support: surface.support,
    surfaceId: surface.id,
    route,
    semanticRouteId: resolvedSemantic,
    selectedBy: choice.selectedBy
  };
}
