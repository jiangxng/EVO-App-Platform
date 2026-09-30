import type {
  IdentitySessionRequestV010,
  RequestIdentitySessionProviderV010
} from "../../contracts/platform-services.js";
import type {
  ManagedIdentitySessionServiceV010
} from "../../manager/identity-session-store.js";
import { HOST_MANAGED_SESSION_PROVIDER_ID } from "./package.js";

export function createHostManagedSessionProviderV010(
  service: ManagedIdentitySessionServiceV010
): RequestIdentitySessionProviderV010 {
  return {
    providerId: HOST_MANAGED_SESSION_PROVIDER_ID,
    resolve(input: IdentitySessionRequestV010) {
      const sessionToken = input.sessionToken?.trim();
      const bearerToken = input.bearerToken?.trim();
      if (sessionToken && bearerToken && sessionToken !== bearerToken) {
        return undefined;
      }
      const token = sessionToken || bearerToken;
      return token ? service.resolveToken(token) : undefined;
    }
  };
}

export function createHostManagedSessionHealthProbeV010(
  service: ManagedIdentitySessionServiceV010
) {
  return () => {
    const records = service.list();
    const active = records.filter(
      item => !item.revokedAt
        && !!item.session.expiresAt
        && Date.parse(item.session.expiresAt) > Date.now()
    ).length;
    return {
      state: "HEALTHY" as const,
      message:
        `Managed Session store loaded with ${records.length} session(s), ${active} currently unexpired/unrevoked.`
    };
  };
}
