import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type {
  IdentityUserDirectoryEntryV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";

export interface IdentityUserDirectorySnapshotV010 {
  contractVersion: "0.1.0";
  entries: IdentityUserDirectoryEntryV010[];
}

export interface IdentityUserDirectoryStoreV010 {
  snapshot(): IdentityUserDirectorySnapshotV010;
  save(next: IdentityUserDirectorySnapshotV010): void;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function emptySnapshot(): IdentityUserDirectorySnapshotV010 {
  return {
    contractVersion: "0.1.0",
    entries: []
  };
}

function validatePrincipal(principal: PlatformPrincipalV010): void {
  if (
    principal.contractVersion !== "0.1.0"
    || principal.actorType !== "HUMAN"
    || !principal.subjectId.trim()
    || !principal.identityProviderId.trim()
  ) {
    throw new Error("IDENTITY_USER_DIRECTORY_PRINCIPAL_INVALID");
  }
}

function validateSnapshot(snapshot: IdentityUserDirectorySnapshotV010): void {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.entries)
  ) {
    throw new Error("IDENTITY_USER_DIRECTORY_SNAPSHOT_INVALID");
  }
  const seen = new Set<string>();
  for (const entry of snapshot.entries) {
    validatePrincipal(entry.principal);
    if (seen.has(entry.principal.subjectId)) {
      throw new Error(
        "IDENTITY_USER_DIRECTORY_SUBJECT_DUPLICATE: "
        + entry.principal.subjectId
      );
    }
    seen.add(entry.principal.subjectId);
    if (
      (entry.state !== "ACTIVE" && entry.state !== "REVOKED")
      || !Number.isFinite(Date.parse(entry.firstAuthenticatedAt))
      || !Number.isFinite(Date.parse(entry.lastAuthenticatedAt))
    ) {
      throw new Error("IDENTITY_USER_DIRECTORY_ENTRY_INVALID");
    }
    if (
      entry.state === "REVOKED"
      && (!entry.revokedAt || !entry.revokedBySubjectId)
    ) {
      throw new Error("IDENTITY_USER_DIRECTORY_REVOCATION_INVALID");
    }
  }
}

export function createMemoryIdentityUserDirectoryStoreV010(
  initial: IdentityUserDirectorySnapshotV010 = emptySnapshot()
): IdentityUserDirectoryStoreV010 {
  validateSnapshot(initial);
  let current = clone(initial);
  return {
    snapshot: () => clone(current),
    save(next) {
      validateSnapshot(next);
      current = clone(next);
    }
  };
}

export function createFileIdentityUserDirectoryStoreV010(
  path: string
): IdentityUserDirectoryStoreV010 {
  let current = emptySnapshot();
  try {
    const raw = readFileSync(path, "utf8");
    current = JSON.parse(raw) as IdentityUserDirectorySnapshotV010;
    validateSnapshot(current);
  } catch (error) {
    if (
      !(error instanceof Error)
      || !("code" in error)
      || (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      throw error;
    }
  }

  function persist(next: IdentityUserDirectorySnapshotV010): void {
    validateSnapshot(next);
    mkdirSync(dirname(path), { recursive: true });
    const temp = path + ".tmp";
    writeFileSync(temp, JSON.stringify(next, null, 2) + "\n", "utf8");
    renameSync(temp, path);
    current = clone(next);
  }

  return {
    snapshot: () => clone(current),
    save: persist
  };
}
