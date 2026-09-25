export interface ProviderDescriptorLike {
  providerId: string;
  capability: string;
}

export type ProviderRuntimeHealthStateV010 =
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export interface ProviderRuntimeHealthV010 {
  state: ProviderRuntimeHealthStateV010;
  message?: string;
  checkedAt?: string;
}

export interface ProviderRuntimeRegistry {
  register<T>(providerId: string, runtime: T): void;
  replace<T>(providerId: string, runtime: T): void;
  remove(providerId: string): void;
  get<T>(providerId: string): T | undefined;
  setHealth(providerId: string, health: ProviderRuntimeHealthV010): void;
  getHealth(providerId: string): ProviderRuntimeHealthV010;
  resolve<T>(
    descriptors: readonly ProviderDescriptorLike[],
    capability: string
  ): { providerId: string; runtime: T } | undefined;
  has(providerId: string): boolean;
}

function validateHealth(health: ProviderRuntimeHealthV010): ProviderRuntimeHealthV010 {
  if (!["HEALTHY", "DEGRADED", "UNAVAILABLE", "UNKNOWN"].includes(health.state)) {
    throw new Error(`PROVIDER_HEALTH_STATE_INVALID: ${health.state}`);
  }
  return {
    state: health.state,
    ...(health.message?.trim() ? { message: health.message.trim() } : {}),
    ...(health.checkedAt?.trim() ? { checkedAt: health.checkedAt.trim() } : {})
  };
}

export function createProviderRuntimeRegistry(): ProviderRuntimeRegistry {
  const runtimes = new Map<string, unknown>();
  const health = new Map<string, ProviderRuntimeHealthV010>();

  const ensureHealth = (providerId: string): void => {
    if (!health.has(providerId)) {
      health.set(providerId, {
        state: "UNKNOWN",
        message: "Runtime is registered; no active health probe has reported yet."
      });
    }
  };

  return {
    register<T>(providerId: string, runtime: T) {
      if (runtimes.has(providerId)) throw new Error(`PROVIDER_RUNTIME_DUPLICATE: ${providerId}`);
      runtimes.set(providerId, runtime);
      ensureHealth(providerId);
    },

    replace<T>(providerId: string, runtime: T) {
      runtimes.set(providerId, runtime);
      ensureHealth(providerId);
    },

    remove(providerId: string) {
      runtimes.delete(providerId);
      health.delete(providerId);
    },

    get<T>(providerId: string) {
      const runtime = runtimes.get(providerId);
      return runtime === undefined ? undefined : runtime as T;
    },

    setHealth(providerId, value) {
      if (!runtimes.has(providerId)) {
        throw new Error(`PROVIDER_HEALTH_RUNTIME_NOT_REGISTERED: ${providerId}`);
      }
      health.set(providerId, validateHealth(value));
    },

    getHealth(providerId) {
      if (!runtimes.has(providerId)) {
        return {
          state: "UNAVAILABLE",
          message: "Provider runtime is not registered."
        };
      }
      return structuredClone(
        health.get(providerId)
          ?? {
            state: "UNKNOWN",
            message: "Runtime is registered; no active health probe has reported yet."
          }
      );
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
