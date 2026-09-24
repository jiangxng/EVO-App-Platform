import type { Diagnostic } from "../runtime/contracts.js";

export type AppHostStatus = "idle" | "ready" | "degraded" | "error";

export interface AppHostPageReferenceV010 {
  id: string;
  title?: string;
  source: string;
}

export interface AppHostRouteV010 {
  id: string;
  path: string;
  pageId: string;
}

export interface AppHostNavigationItemV010 {
  id: string;
  label: string;
  route: string;
  order?: number;
  parentId?: string;
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

export interface ExperienceSource {
  listEffectiveExperienceManifests(): Promise<unknown[]>;
  loadPage(page: AppHostPageReferenceV010): Promise<unknown>;
}

export interface AppHost {
  refresh(): Promise<AppHostSnapshotV010>;
  getSnapshot(): AppHostSnapshotV010;
  resolveRoute(path: string): AppHostResolvedRouteV010 | undefined;
  loadRoute(path: string): Promise<AppHostLoadedPageV010 | undefined>;
  subscribe(listener: (snapshot: AppHostSnapshotV010) => void): () => void;
  dispose(): void;
}
