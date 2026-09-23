import type { CatalogEntryV010, PackageManifestV010 } from "../contracts/package.js";

export interface PackageCatalog {
  list(): CatalogEntryV010[];
  get(packageId: string): PackageManifestV010 | undefined;
  findCapabilityProviders(capability: string): Array<{ packageId: string; featureId: string }>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createPackageCatalog(entries: PackageManifestV010[]): PackageCatalog {
  const packages = new Map<string, PackageManifestV010>();

  for (const manifest of entries) {
    if (packages.has(manifest.packageId)) {
      throw new Error(`CATALOG_DUPLICATE_PACKAGE: ${manifest.packageId}`);
    }
    packages.set(manifest.packageId, clone(manifest));
  }

  return {
    list() {
      return [...packages.values()]
        .sort((a, b) => a.packageId.localeCompare(b.packageId))
        .map(pkg => ({ package: clone(pkg) }));
    },

    get(packageId) {
      const pkg = packages.get(packageId);
      return pkg ? clone(pkg) : undefined;
    },

    findCapabilityProviders(capability) {
      const providers: Array<{ packageId: string; featureId: string }> = [];
      for (const pkg of packages.values()) {
        for (const feature of pkg.features) {
          if ((feature.providesCapabilities ?? []).includes(capability)) {
            providers.push({ packageId: pkg.packageId, featureId: feature.featureId });
          }
        }
      }
      return providers.sort((a, b) =>
        a.packageId.localeCompare(b.packageId) || a.featureId.localeCompare(b.featureId)
      );
    }
  };
}
