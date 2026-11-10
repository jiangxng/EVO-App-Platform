import {
  closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync,
  openSync, readFileSync, renameSync, unlinkSync, writeFileSync
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import type {
  ActivatedFeatureV010,
  InstalledPackageV010,
  PlatformSnapshotV010
} from "../contracts/package.js";

export interface LifecycleStore {
  getInstalledPackage(packageId: string): InstalledPackageV010 | undefined;
  saveInstalledPackage(record: InstalledPackageV010): void;
  deleteInstalledPackage(packageId: string): void;
  getActiveFeature(featureId: string): ActivatedFeatureV010 | undefined;
  saveActiveFeature(record: ActivatedFeatureV010): void;
  deleteActiveFeature(featureId: string): void;
  snapshot(): PlatformSnapshotV010;
}

export function createMemoryLifecycleStore(): LifecycleStore {
  const installed = new Map<string, InstalledPackageV010>();
  const active = new Map<string, ActivatedFeatureV010>();

  return {
    getInstalledPackage(packageId) {
      const item = installed.get(packageId);
      return item ? structuredClone(item) : undefined;
    },

    saveInstalledPackage(record) {
      installed.set(record.packageId, structuredClone(record));
    },

    deleteInstalledPackage(packageId) {
      installed.delete(packageId);
    },

    getActiveFeature(featureId) {
      const item = active.get(featureId);
      return item ? structuredClone(item) : undefined;
    },

    saveActiveFeature(record) {
      active.set(record.featureId, structuredClone(record));
    },

    deleteActiveFeature(featureId) {
      active.delete(featureId);
    },

    snapshot() {
      return {
        contractVersion: "0.1.0",
        installedPackages: [...installed.values()]
          .sort((a, b) => a.packageId.localeCompare(b.packageId))
          .map(x => structuredClone(x)),
        activeFeatures: [...active.values()]
          .sort((a, b) => a.featureId.localeCompare(b.featureId))
          .map(x => structuredClone(x)),
        effectiveCapabilities: []
      };
    }
  };
}


interface PersistedLifecycleStateV010 {
  contractVersion: "0.1.0";
  installedPackages: InstalledPackageV010[];
  activeFeatures: ActivatedFeatureV010[];
}


// A local, cooperating-process commit protocol for the existing PA05 file
// store. Never use this snapshot as a distributed authorization authority.
interface LifecycleFileRevision {
  dev: number;
  ino: number;
  raw: string;
}
function sameLifecycleRevision(
  a: LifecycleFileRevision | null,
  b: LifecycleFileRevision | null
): boolean {
  return a === null ? b === null :
    b !== null && a.dev === b.dev && a.ino === b.ino && a.raw === b.raw;
}

function loadPersistedState(filePath: string): {
  state: PersistedLifecycleStateV010;
  revision: LifecycleFileRevision | null;
} {
  let fd: number;
  try {
    // Reject symlinks at the lifecycle state entry. A non-cooperating writer
    // still requires separate OS/Host identity controls: this is not a KMS.
    fd = openSync(filePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { state: {
        contractVersion: "0.1.0", installedPackages: [], activeFeatures: []
      }, revision: null };
    }
    throw error;
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) {
      throw Error("LIFECYCLE_STATE_UNTRUSTED_FILE");
    }
    const raw = readFileSync(fd, "utf8");
    const parsed = JSON.parse(raw) as PersistedLifecycleStateV010;
    if (parsed.contractVersion !== "0.1.0" ||
        !Array.isArray(parsed.installedPackages) ||
        !Array.isArray(parsed.activeFeatures)) {
      throw Error("LIFECYCLE_STATE_INVALID");
    }
    return {state: parsed, revision: {dev: stat.dev, ino: stat.ino, raw}};
  } finally {
    closeSync(fd);
  }
}

export function createFileLifecycleStore(filePath: string): LifecycleStore {
  const initial = loadPersistedState(filePath);
  let installed = new Map<string, InstalledPackageV010>(
    initial.state.installedPackages.map(item =>
      [item.packageId, structuredClone(item)])
  );
  let active = new Map<string, ActivatedFeatureV010>(
    initial.state.activeFeatures.map(item =>
      [item.featureId, structuredClone(item)])
  );
  let revision = initial.revision;
  let quarantined = false;
  function assertUsable(): void {
    if (quarantined) throw Error("LIFECYCLE_STATE_REOPEN_REQUIRED");
  }

  // Two cooperating stores are serialized by an exclusive host-owned lock.
  // The caller must reopen after a stale file revision: never publish a
  // stale ALLOW or silently overwrite a newer persisted Feature revocation.
  // This is NOT a distributed/DB authority lease or an unsafe stale-lock
  // auto-recovery protocol. Crash-orphaned locks require operator review.
  function persist(
    candidateInstalled: Map<string, InstalledPackageV010>,
    candidateActive: Map<string, ActivatedFeatureV010>
  ): void {
    assertUsable();
    mkdirSync(dirname(filePath), {recursive: true});
    const lockPath = filePath + ".lifecycle-write.lock";
    // Allocate a never-reused staging name before acquiring the lock so a
    // staging-name allocation error cannot strand a lock from this process.
    const stage = filePath + ".tmp." + process.pid + "." + randomUUID();
    let lockFd: number;
    try {
      lockFd = openSync(lockPath,
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
        (constants.O_NOFOLLOW ?? 0), 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST")
        throw Error("LIFECYCLE_STATE_WRITE_LOCKED");
      throw error;
    }
    let stageFd: number | undefined;
    let stageCreated = false;
    let renamed = false;
    try {
      try {
        const current = loadPersistedState(filePath);
        if (!sameLifecycleRevision(current.revision, revision)) {
          quarantined = true;
          throw Error("LIFECYCLE_STATE_STALE_WRITER_REOPEN_REQUIRED");
        }
        const state: PersistedLifecycleStateV010 = {
          contractVersion: "0.1.0",
          installedPackages: [...candidateInstalled.values()]
            .sort((a, b) => a.packageId.localeCompare(b.packageId))
            .map(item => structuredClone(item)),
          activeFeatures: [...candidateActive.values()]
            .sort((a, b) => a.featureId.localeCompare(b.featureId))
            .map(item => structuredClone(item))
        };
        const payload = JSON.stringify(state, null, 2) + "\n";
        stageFd = openSync(stage,
          constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
          (constants.O_NOFOLLOW ?? 0), 0o600);
        stageCreated = true;
        writeFileSync(stageFd, payload, "utf8");
        fsyncSync(stageFd);
        closeSync(stageFd);
        stageFd = undefined;
        renameSync(stage, filePath);
        renamed = true;
        // On Linux/POSIX, commit the rename's containing directory before
        // telling the in-process Manager that this state is persisted.
        if (process.platform !== "win32") {
          const dirFd = openSync(dirname(filePath),
            constants.O_RDONLY | (constants.O_DIRECTORY ?? 0) |
            (constants.O_NOFOLLOW ?? 0));
          try {fsyncSync(dirFd);} finally {closeSync(dirFd);}
        }
        revision = loadPersistedState(filePath).revision;
      } finally {
        if (stageFd !== undefined) closeSync(stageFd);
        if (stageCreated && !renamed) {
          try {unlinkSync(stage);} catch { /* orphaned stage never reused */ }
        }
        // Never remove a lock that another process substituted. Leave it
        // in place for independent investigation if ownership is uncertain.
        try {
          const held = fstatSync(lockFd);
          const onDisk = lstatSync(lockPath);
          if (!onDisk.isFile() || held.dev !== onDisk.dev ||
              held.ino !== onDisk.ino) {
            quarantined = true;
            throw Error("LIFECYCLE_STATE_LOCK_OWNERSHIP_UNCERTAIN");
          }
          unlinkSync(lockPath);
        } finally {
          closeSync(lockFd);
        }
      }
    } catch (error) {
      // A post-rename failure (dir fsync, close, lock cleanup) can mean the
      // new state is on disk with uncertain durability. Never continue using
      // this in-memory instance as an authorization authority.
      if (renamed) quarantined = true;
      throw error;
    }
  }

  return {
    getInstalledPackage(packageId) {
      assertUsable();
      const item = installed.get(packageId);
      return item ? structuredClone(item) : undefined;
    },

    saveInstalledPackage(record) {
      const next = new Map(installed);
      next.set(record.packageId, structuredClone(record));
      persist(next, active);
      installed = next;
    },

    deleteInstalledPackage(packageId) {
      const next = new Map(installed);
      next.delete(packageId);
      persist(next, active);
      installed = next;
    },

    getActiveFeature(featureId) {
      assertUsable();
      const item = active.get(featureId);
      return item ? structuredClone(item) : undefined;
    },

    saveActiveFeature(record) {
      const next = new Map(active);
      next.set(record.featureId, structuredClone(record));
      persist(installed, next);
      active = next;
    },

    deleteActiveFeature(featureId) {
      const next = new Map(active);
      next.delete(featureId);
      persist(installed, next);
      active = next;
    },

    snapshot() {
      assertUsable();
      return {
        contractVersion: "0.1.0",
        installedPackages: [...installed.values()]
          .sort((a, b) => a.packageId.localeCompare(b.packageId))
          .map(item => structuredClone(item)),
        activeFeatures: [...active.values()]
          .sort((a, b) => a.featureId.localeCompare(b.featureId))
          .map(item => structuredClone(item)),
        effectiveCapabilities: []
      };
    }
  };
}
