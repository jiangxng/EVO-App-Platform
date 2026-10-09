import type {
  AppHostSurfaceSupportV010,
  AppHostSurfaceTargetV010,
  ClientSurfaceProfileV010,
  EffectiveExperienceManifestV010
} from "../vendor/eidos/src/app-host/contracts.js";
import {
  createSurfaceHandoffViewModelV010,
  type SurfaceHandoffViewModelV010
} from "../vendor/eidos/src/app-host/surface-handoff.js";
import {
  resolveExperienceSurfaceV010,
  surfaceTargetFromUrlV010
} from "../vendor/eidos/src/app-host/surface.js";
import {
  validateEffectiveExperienceManifest
} from "../vendor/eidos/src/app-host/host.js";

export type BrowserSurfaceGatewayResultV010 =
  | {
      kind: "UNCHANGED";
      reason:
        | "ROUTE_NOT_FOUND"
        | "EXPERIENCE_NOT_SURFACE_MANAGED"
        | "ALREADY_ON_TARGET";
      path: string;
      target?: AppHostSurfaceTargetV010;
      surfaceId?: string;
      support?: Exclude<AppHostSurfaceSupportV010, "UNSUPPORTED">;
    }
  | {
      kind: "REDIRECT";
      fromPath: string;
      toPath: string;
      target: AppHostSurfaceTargetV010;
      surfaceId: string;
      support: Exclude<AppHostSurfaceSupportV010, "UNSUPPORTED">;
      semanticRouteId: string;
    }
  | {
      kind: "HANDOFF";
      path: string;
      target: AppHostSurfaceTargetV010;
      model: SurfaceHandoffViewModelV010;
    };

function targetFromStoredValue(
  value: string | undefined
): AppHostSurfaceTargetV010 | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim();
  if (
    normalized === "DESKTOP_WORKBENCH"
    || normalized === "MOBILE_TASK"
    || normalized === "MOBILE_READ"
    || normalized === "TABLET_WORKBENCH"
  ) {
    return normalized;
  }

  const url = new URL("https://surface.local/");
  url.searchParams.set("surface", normalized);
  return surfaceTargetFromUrlV010(url);
}

function validManifests(raw: unknown[]): EffectiveExperienceManifestV010[] {
  return raw.flatMap((value, index) => {
    const validated = validateEffectiveExperienceManifest(value, index);
    return validated.ok && validated.value ? [validated.value] : [];
  });
}


export function resolveBrowserDefaultExperienceRouteV010(
  raw: unknown[],
  fallback = "/store"
): string {
  const candidates = validManifests(raw)
    .filter(manifest => Boolean(manifest.defaultRoute?.trim()))
    .map(manifest => {
      const navigationOrder = Math.min(
        ...((manifest.navigation ?? []).map(item =>
          Number.isFinite(item.order) ? item.order : 10_000
        )),
        10_000
      );
      return {
        route: manifest.defaultRoute,
        navigationOrder,
        experienceId: manifest.experienceId
      };
    })
    .sort((a, b) =>
      a.navigationOrder - b.navigationOrder
      || a.experienceId.localeCompare(b.experienceId)
    );
  return candidates[0]?.route ?? fallback;
}

function owningManifest(
  manifests: EffectiveExperienceManifestV010[],
  path: string
): EffectiveExperienceManifestV010 | undefined {
  return manifests.find(manifest =>
    manifest.routes.some(route => route.path === path)
  );
}

function alternativesFor(
  manifest: EffectiveExperienceManifestV010,
  semanticRouteId: string,
  availableTargets: readonly AppHostSurfaceTargetV010[]
) {
  return availableTargets.flatMap(target => {
    const resolved = resolveExperienceSurfaceV010(manifest, {
      semanticRouteId,
      explicitTarget: target
    });
    if (resolved.kind !== "ROUTE") return [];
    return [{
      target,
      label: target === "DESKTOP_WORKBENCH"
        ? "Open desktop"
        : target === "MOBILE_TASK"
          ? "Open mobile task view"
          : target === "MOBILE_READ"
            ? "Open mobile read view"
            : "Open tablet view",
      route: resolved.route.path
    }];
  });
}

export function resolveBrowserSurfaceGatewayV010(input: {
  manifests: unknown[];
  path: string;
  url: URL;
  profile: ClientSurfaceProfileV010;
  storedUserTarget?: string;
}): BrowserSurfaceGatewayResultV010 {
  const path = input.path.trim();
  const manifests = validManifests(input.manifests);
  const manifest = owningManifest(manifests, path);
  if (!manifest) {
    return { kind: "UNCHANGED", reason: "ROUTE_NOT_FOUND", path };
  }

  if (!manifest.surfaces?.length) {
    return {
      kind: "UNCHANGED",
      reason: "EXPERIENCE_NOT_SURFACE_MANAGED",
      path
    };
  }

  const explicitTarget = surfaceTargetFromUrlV010(input.url);
  const userTarget = targetFromStoredValue(input.storedUserTarget);
  const resolved = resolveExperienceSurfaceV010(manifest, {
    path,
    ...(explicitTarget ? { explicitTarget } : {}),
    ...(userTarget ? { userTarget } : {}),
    profile: input.profile
  });

  if (resolved.kind === "ROUTE") {
    if (resolved.route.path === path) {
      return {
        kind: "UNCHANGED",
        reason: "ALREADY_ON_TARGET",
        path,
        target: resolved.target,
        surfaceId: resolved.surfaceId,
        support: resolved.support
      };
    }
    return {
      kind: "REDIRECT",
      fromPath: path,
      toPath: resolved.route.path,
      target: resolved.target,
      surfaceId: resolved.surfaceId,
      support: resolved.support,
      semanticRouteId: resolved.semanticRouteId
    };
  }

  if (resolved.kind === "HANDOFF") {
    const semanticRouteId = resolved.semanticRouteId
      ?? manifest.routes.find(route => route.path === path)?.semanticId
      ?? manifest.routes.find(route => route.path === path)?.id;
    const alternatives = semanticRouteId
      ? alternativesFor(manifest, semanticRouteId, resolved.availableTargets)
      : [];

    return {
      kind: "HANDOFF",
      path,
      target: resolved.target,
      model: createSurfaceHandoffViewModelV010(
        resolved,
        alternatives
      )
    };
  }

  return {
    kind: "UNCHANGED",
    reason: "ROUTE_NOT_FOUND",
    path
  };
}

export function replaceBrowserSurfaceRouteV010(path: string): void {
  const next = new URL(window.location.href);
  next.hash = path;
  window.history.replaceState(window.history.state, "", next);
}
