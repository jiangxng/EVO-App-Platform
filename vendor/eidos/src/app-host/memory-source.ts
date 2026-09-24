import type {
  AppHostPageReferenceV010,
  EffectiveExperienceManifestV010,
  ExperienceSource
} from "./contracts.js";

export interface MemoryExperienceSource extends ExperienceSource {
  replaceManifests(manifests: unknown[]): void;
  setPage(source: string, definition: unknown): void;
  removePage(source: string): void;
}

export function createMemoryExperienceSource(
  initialManifests: unknown[] = [],
  initialPages: Record<string, unknown> = {}
): MemoryExperienceSource {
  let manifests = [...initialManifests];
  const pages = new Map<string, unknown>(Object.entries(initialPages));

  return {
    async listEffectiveExperienceManifests(): Promise<unknown[]> {
      return manifests.map(item => structuredClone(item));
    },

    async loadPage(page: AppHostPageReferenceV010): Promise<unknown> {
      if (!pages.has(page.source)) {
        throw new Error(`EIDOS_APP_HOST_PAGE_NOT_FOUND: ${page.source}`);
      }
      return structuredClone(pages.get(page.source));
    },

    replaceManifests(next: unknown[]): void {
      manifests = next.map(item => structuredClone(item));
    },

    setPage(source: string, definition: unknown): void {
      pages.set(source, structuredClone(definition));
    },

    removePage(source: string): void {
      pages.delete(source);
    }
  };
}
