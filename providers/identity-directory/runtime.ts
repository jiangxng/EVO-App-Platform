import type {
  IdentityUserDirectoryEntryV010,
  IdentityUserDirectoryProviderV010,
  PlatformPrincipalV010
} from "../../contracts/platform-services.js";
import type {
  IdentityUserDirectoryStoreV010
} from "../../manager/identity-user-directory-store.js";
import { HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID } from "./package.js";

function clonePrincipal(principal: PlatformPrincipalV010): PlatformPrincipalV010 {
  return structuredClone({
    ...principal,
    sessionId: undefined
  });
}

export interface HostIdentityUserDirectoryServiceV010 {
  provider: IdentityUserDirectoryProviderV010;
  recordAuthenticatedPrincipal(principal: PlatformPrincipalV010): IdentityUserDirectoryEntryV010;
  revoke(subjectId: string, actorSubjectId: string): IdentityUserDirectoryEntryV010;
}

export function createHostIdentityUserDirectoryServiceV010(input: {
  store: IdentityUserDirectoryStoreV010;
  now?: () => Date;
}): HostIdentityUserDirectoryServiceV010 {
  const now = input.now ?? (() => new Date());

  function get(subjectId: string): IdentityUserDirectoryEntryV010 | undefined {
    return input.store.snapshot().entries.find(
      item => item.principal.subjectId === subjectId
    );
  }

  function saveEntry(next: IdentityUserDirectoryEntryV010): void {
    const snapshot = input.store.snapshot();
    const entries = snapshot.entries.filter(
      item => item.principal.subjectId !== next.principal.subjectId
    );
    entries.push(structuredClone(next));
    entries.sort((a, b) =>
      a.principal.subjectId.localeCompare(b.principal.subjectId)
    );
    input.store.save({
      contractVersion: "0.1.0",
      entries
    });
  }

  return {
    provider: {
      providerId: HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID,
      get(subjectId) {
        const entry = get(subjectId.trim());
        return entry ? structuredClone(entry) : undefined;
      },
      list() {
        return input.store.snapshot().entries.map(item => structuredClone(item));
      }
    },

    recordAuthenticatedPrincipal(principal) {
      if (
        principal.contractVersion !== "0.1.0"
        || principal.actorType !== "HUMAN"
        || !principal.subjectId.trim()
        || !principal.identityProviderId.trim()
      ) {
        throw new Error("IDENTITY_USER_DIRECTORY_PRINCIPAL_INVALID");
      }
      const timestamp = now().toISOString();
      const existing = get(principal.subjectId);
      if (existing?.state === "REVOKED") {
        throw new Error("IDENTITY_USER_DIRECTORY_PRINCIPAL_REVOKED");
      }
      if (
        existing
        && existing.principal.identityProviderId !== principal.identityProviderId
      ) {
        throw new Error("IDENTITY_USER_DIRECTORY_PROVIDER_MISMATCH");
      }
      const next: IdentityUserDirectoryEntryV010 = {
        contractVersion: "0.1.0",
        principal: clonePrincipal(principal),
        state: "ACTIVE",
        firstAuthenticatedAt: existing?.firstAuthenticatedAt ?? timestamp,
        lastAuthenticatedAt: timestamp
      };
      saveEntry(next);
      return structuredClone(next);
    },

    revoke(subjectId, actorSubjectId) {
      const normalized = subjectId.trim();
      const actor = actorSubjectId.trim();
      if (!normalized || !actor) {
        throw new Error("IDENTITY_USER_DIRECTORY_REVOCATION_INVALID");
      }
      const existing = get(normalized);
      if (!existing) {
        throw new Error("IDENTITY_USER_DIRECTORY_PRINCIPAL_NOT_FOUND");
      }
      if (existing.state === "REVOKED") return structuredClone(existing);
      const next: IdentityUserDirectoryEntryV010 = {
        ...structuredClone(existing),
        state: "REVOKED",
        revokedAt: now().toISOString(),
        revokedBySubjectId: actor
      };
      saveEntry(next);
      return structuredClone(next);
    }
  };
}

export function createHostIdentityUserDirectoryHealthProbeV010(
  provider: IdentityUserDirectoryProviderV010
) {
  return () => {
    const entries = provider.list();
    const active = entries.filter(item => item.state === "ACTIVE").length;
    return {
      state: "HEALTHY" as const,
      message:
        `Identity user directory loaded with ${entries.length} principal(s), ${active} active.`
    };
  };
}
