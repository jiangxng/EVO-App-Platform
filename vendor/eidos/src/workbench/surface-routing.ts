import type {
  AppHostSnapshotV010,
  AppHostSurfaceTargetV010,
  ClientSurfaceProfileV010,
  EffectiveExperienceManifestV010
} from "../app-host/contracts.js";
import {
  resolveExperienceSurfaceV010,
  type ExperienceSurfaceResolutionV010
} from "../app-host/surface.js";

export interface WorkbenchSurfaceRoutingRequestV010 {
  path: string;
  explicitTarget?: AppHostSurfaceTargetV010;
  userTarget?: AppHostSurfaceTargetV010;
  configuredSurfaceId?: string;
  profile?: ClientSurfaceProfileV010;
}

export interface WorkbenchSurfaceRoutingResultV010 {
  manifest: EffectiveExperienceManifestV010;
  resolution: ExperienceSurfaceResolutionV010;
}

export function findWorkbenchRouteManifestV010(
  snapshot: AppHostSnapshotV010,
  path: string
): EffectiveExperienceManifestV010 | undefined {
  const direct = snapshot.manifests.find(manifest =>
    manifest.routes.some(route => route.path === path)
  );
  if (direct) return direct;

  if (path === "/") {
    return snapshot.manifests.find(manifest => manifest.defaultRoute)
      ?? snapshot.manifests[0];
  }
  return undefined;
}

export function resolveWorkbenchSurfaceRouteV010(
  snapshot: AppHostSnapshotV010,
  request: WorkbenchSurfaceRoutingRequestV010
): WorkbenchSurfaceRoutingResultV010 | undefined {
  const manifest = findWorkbenchRouteManifestV010(snapshot, request.path);
  if (!manifest) return undefined;

  const configuredTarget = request.configuredSurfaceId
    ? manifest.surfaces?.find(surface =>
        surface.id === request.configuredSurfaceId
      )?.target
    : undefined;

  const hasDirectRoute = manifest.routes.some(route =>
    route.path === request.path
  );

  return {
    manifest,
    resolution: resolveExperienceSurfaceV010(manifest, {
      ...(hasDirectRoute ? { path: request.path } : {}),
      ...(request.explicitTarget
        ? { explicitTarget: request.explicitTarget }
        : {}),
      ...(configuredTarget || request.userTarget
        ? { userTarget: configuredTarget ?? request.userTarget }
        : {}),
      ...(request.profile ? { profile: request.profile } : {})
    })
  };
}
