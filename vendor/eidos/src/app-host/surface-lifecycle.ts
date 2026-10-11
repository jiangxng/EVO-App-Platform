export interface SurfaceInstanceIdentityV010 {
  contractVersion: "0.1.0";
  surfaceId: string;
  semanticId: string;
  instanceKey: string;
  structuralVersion: string;
}

export interface CreateSurfaceInstanceIdentityInputV010 {
  surfaceId: string;
  semanticId: string;
  routePath: string;
  structuralVersion?: string;
  params?: Readonly<Record<string, unknown>>;
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      const item = input[key];
      if (item !== undefined) output[key] = canonicalValue(item);
    }
    return output;
  }
  return value;
}

export function stableSerializeSurfaceValueV010(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

export function createSurfaceInstanceIdentityV010(
  input: CreateSurfaceInstanceIdentityInputV010
): SurfaceInstanceIdentityV010 {
  const instancePayload = {
    routePath: input.routePath,
    ...(input.params ? { params: input.params } : {})
  };
  return {
    contractVersion: "0.1.0",
    surfaceId: input.surfaceId,
    semanticId: input.semanticId,
    instanceKey: `${input.semanticId}:${stableSerializeSurfaceValueV010(instancePayload)}`,
    structuralVersion: input.structuralVersion ?? "0"
  };
}

export function sameSurfaceInstanceV010(
  left: SurfaceInstanceIdentityV010 | undefined,
  right: SurfaceInstanceIdentityV010 | undefined
): boolean {
  if (!left || !right) return false;
  return left.surfaceId === right.surfaceId
    && left.instanceKey === right.instanceKey
    && left.structuralVersion === right.structuralVersion;
}

export function requiresSurfaceRemountV010(
  current: SurfaceInstanceIdentityV010 | undefined,
  next: SurfaceInstanceIdentityV010
): boolean {
  return !sameSurfaceInstanceV010(current, next);
}
