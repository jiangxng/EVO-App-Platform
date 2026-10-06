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

function routeLookupPath(path: string): string {
  const queryIndex = path.indexOf("?");
  return queryIndex >= 0 ? path.slice(0, queryIndex) : path;
}

export function findWorkbenchRouteManifestV010(
  snapshot: AppHostSnapshotV010,
  path: string
): EffectiveExperienceManifestV010 | undefined {
  const lookupPath = routeLookupPath(path);
  const direct = snapshot.manifests.find(manifest =>
    manifest.routes.some(route => route.path === lookupPath)
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
  const lookupPath = routeLookupPath(request.path);
  const manifest = findWorkbenchRouteManifestV010(snapshot, lookupPath);
  if (!manifest) return undefined;

  const configuredTarget = request.configuredSurfaceId
    ? manifest.surfaces?.find(surface =>
        surface.id === request.configuredSurfaceId
      )?.target
    : undefined;

  const hasDirectRoute = manifest.routes.some(route =>
    route.path === lookupPath
  );

  return {
    manifest,
    resolution: resolveExperienceSurfaceV010(manifest, {
      ...(hasDirectRoute ? { path: lookupPath } : {}),
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
