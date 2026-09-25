export interface ProviderDescriptorLike {
  providerId: string;
  capability: string;
}

export interface ProviderRuntimeRegistry {
  register<T>(providerId: string, runtime: T): void;
  replace<T>(providerId: string, runtime: T): void;
  remove(providerId: string): void;
  get<T>(providerId: string): T | undefined;
  resolve<T>(
    descriptors: readonly ProviderDescriptorLike[],
    capability: string
  ): { providerId: string; runtime: T } | undefined;
  has(providerId: string): boolean;
}

export function createProviderRuntimeRegistry(): ProviderRuntimeRegistry {
  const runtimes = new Map<string, unknown>();

  return {
    register<T>(providerId: string, runtime: T) {
      if (runtimes.has(providerId)) throw new Error(`PROVIDER_RUNTIME_DUPLICATE: ${providerId}`);
      runtimes.set(providerId, runtime);
    },

    replace<T>(providerId: string, runtime: T) {
      runtimes.set(providerId, runtime);
    },

    remove(providerId: string) {
      runtimes.delete(providerId);
    },

    get<T>(providerId: string) {
      const runtime = runtimes.get(providerId);
      return runtime === undefined ? undefined : runtime as T;
    },

    resolve<T>(descriptors: readonly ProviderDescriptorLike[], capability: string) {
      const candidates = descriptors
        .filter(descriptor => descriptor.capability === capability)
        .sort((a, b) => a.providerId.localeCompare(b.providerId));

      for (const descriptor of candidates) {
        const runtime = runtimes.get(descriptor.providerId);
        if (runtime !== undefined) {
          return { providerId: descriptor.providerId, runtime: runtime as T };
        }
      }
      return undefined;
    },

    has(providerId: string) {
      return runtimes.has(providerId);
    }
  };
}
