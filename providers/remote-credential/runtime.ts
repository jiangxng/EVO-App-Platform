import type { RemoteRuntimeCredentialProviderV010 } from "../../manager/plugin-runtime-remote.js";

export interface HostRemoteBearerTokenMapV010 {
  audiences?: Record<string, string>;
  packages?: Record<string, string>;
  packageAudiences?: Record<string, string>;
}

export function parseHostRemoteBearerTokenMapV010(
  raw: string | undefined
): HostRemoteBearerTokenMapV010 | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as HostRemoteBearerTokenMapV010;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("REMOTE_CREDENTIAL_TOKEN_MAP_INVALID");
  }
  return parsed;
}

export function createHostRemoteBearerCredentialProviderV010(
  tokens: HostRemoteBearerTokenMapV010
): RemoteRuntimeCredentialProviderV010 {
  const clean = (record: Record<string, string> | undefined): Record<string, string> =>
    Object.fromEntries(
      Object.entries(record ?? {})
        .filter(([key, value]) => key.trim() && typeof value === "string" && value.trim())
        .map(([key, value]) => [key.trim(), value.trim()])
    );

  const byAudience = clean(tokens.audiences);
  const byPackage = clean(tokens.packages);
  const byPackageAudience = clean(tokens.packageAudiences);

  return {
    async getBearerToken(input) {
      const packageAudienceKey = `${input.packageId}::${input.audience}`;
      const token = byPackageAudience[packageAudienceKey]
        ?? byAudience[input.audience]
        ?? byPackage[input.packageId];
      if (!token) {
        throw new Error(
          `REMOTE_CREDENTIAL_NOT_FOUND: ${input.packageId}: ${input.audience}`
        );
      }
      return token;
    }
  };
}
