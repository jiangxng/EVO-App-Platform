import type { Diagnostic } from "../runtime/contracts.js";

export type AppHostStatus = "idle" | "ready" | "degraded" | "error";

export interface AppHostPageReferenceV010 {
  id: string;
  title?: string;
  source: string;
}

export type AppHostSurfaceTargetV010 =
  | "DESKTOP_WORKBENCH"
  | "MOBILE_TASK"
  | "MOBILE_READ"
  | "TABLET_WORKBENCH";

export type AppHostSurfaceSupportV010 =
  | "FULL"
  | "TASK_FOCUSED"
  | "READ_ONLY"
  | "UNSUPPORTED";

export interface AppHostSurfaceDeclarationV010 {
  id: string;
  target: AppHostSurfaceTargetV010;
  support: AppHostSurfaceSupportV010;
  entryRoute?: string;
  fallbackSurfaceId?: string;
}

export interface ClientSurfaceProfileV010 {
  contractVersion: "0.1.0";
  viewportClass: "COMPACT" | "MEDIUM" | "EXPANDED";
  primaryPointer: "COARSE" | "FINE" | "NONE";
  hover: boolean;
  touch: boolean;
  reducedMotion: boolean;
  standalone: boolean;
}

export interface AppHostRouteV010 {
  id: string;
  path: string;
  pageId: string;
  semanticId?: string;
  surfaceId?: string;
}

export interface AppHostNavigationItemV010 {
  id: string;
  label: string;
  route: string;
  order?: number;
  parentId?: string;
  surfaceIds?: string[];
}

export interface EffectiveExperienceManifestV010 {
  contractVersion: "0.1.0";
  experienceId: string;
  packageId: string;
  featureId: string;
  defaultRoute?: string;
  pages: AppHostPageReferenceV010[];
  routes: AppHostRouteV010[];
  navigation?: AppHostNavigationItemV010[];
  surfaces?: AppHostSurfaceDeclarationV010[];
}

export interface AppHostResolvedRouteV010 {
  route: AppHostRouteV010;
  page: AppHostPageReferenceV010;
  experienceId: string;
  packageId: string;
  featureId: string;
}

export interface AppHostSnapshotV010 {
  contractVersion: "0.1.0";
  revision: number;
  status: AppHostStatus;
  manifests: EffectiveExperienceManifestV010[];
  pages: AppHostPageReferenceV010[];
  routes: AppHostRouteV010[];
  navigation: AppHostNavigationItemV010[];
  diagnostics: Diagnostic[];
}

export interface AppHostLoadedPageV010 extends AppHostResolvedRouteV010 {
  definition: unknown;
}

export interface ExperienceReadOptionsV010 {
  signal?: AbortSignal;
}

export interface ExperienceSource {
  listEffectiveExperienceManifests(
    options?: ExperienceReadOptionsV010
  ): Promise<unknown[]>;
  loadPage(
    page: AppHostPageReferenceV010,
    options?: ExperienceReadOptionsV010
  ): Promise<unknown>;
}

export interface AppHost {
  refresh(): Promise<AppHostSnapshotV010>;
  getSnapshot(): AppHostSnapshotV010;
  resolveRoute(path: string): AppHostResolvedRouteV010 | undefined;
  loadRoute(
    path: string,
    options?: ExperienceReadOptionsV010
  ): Promise<AppHostLoadedPageV010 | undefined>;
  subscribe(listener: (snapshot: AppHostSnapshotV010) => void): () => void;
  dispose(): void;
}
