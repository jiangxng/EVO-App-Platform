import {constants, closeSync, fstatSync, lstatSync, openSync, unlinkSync} from "node:fs";
import {dirname} from "node:path";
import type {PackageCatalog} from "../catalog/catalog.js";
import type {PlatformSnapshotV010} from "../contracts/package.js";
import {createAppManagerService} from "./service.js";
import {createFileLifecycleStore} from "./store.js";
import {createPa05PrestartupAuditJournalV010} from "./pa05-read-owner-prestartup-audit.js";
import {recoverPa05TrustedPrestartupUninstallV010} from "./pa05-read-owner-trusted-prestartup.js";

type RecoveryInput = Parameters<typeof recoverPa05TrustedPrestartupUninstallV010>[0];

/**
 * PA05/E01J4I: standalone Host-internal, one-shot PRESTART recovery composition.
 *
 * Only a separately trusted maintenance supervisor may supply the catalog,
 * identity/authorization/secrets Provider runtimes and credential.
 * A local lock serializes this maintenance entry with itself, NOT a running
 * Host. The supervisor MUST stop all Host writers before invoking this entry.
 *
 * Deliberately NO CLI, environment-boolean authorization, production IdP/DBA
 * provisioner, server startup hook or public Plugin/Agent action.
 */
export async function recoverPa05OneShotHostPrestartupV010(
  input: Omit<RecoveryInput, "manager" | "audit"> & {
    catalog: PackageCatalog;
    stateFile: string;
    auditFile: string;
  }
): Promise<PlatformSnapshotV010> {
  if (input?.mode !== "OPT_IN" || !input.catalog ||
      typeof input.catalog.get !== "function" ||
      typeof input.stateFile !== "string" ||
      typeof input.auditFile !== "string" ||
      !input.stateFile.startsWith("/") || !input.auditFile.startsWith("/") ||
      input.stateFile === input.auditFile ||
      dirname(input.stateFile) !== dirname(input.auditFile) ||
      input.stateFile.endsWith("/") ||
      input.auditFile.endsWith("/") ||
      !/^[a-z0-9][a-z0-9_-]{2,79}$/.test(input.hostId ?? "")) {
    throw Error("PA05_J4I_PRESTART_CONFIGURATION_INVALID");
  }
  // J4F operates on the actual persisted Host snapshot. Missing or
  // replaceable state cannot be substituted with an empty memory store.
  const parent = dirname(input.stateFile);
  const lockPath = input.stateFile + ".pa05-one-shot.lock";
  const uid = process.getuid?.();
  const trustedStat = (stat: ReturnType<typeof lstatSync>) =>
    (stat.mode & 0o077) === 0 &&
    (uid === undefined || stat.uid === uid);
  const isRegular = (stat: ReturnType<typeof lstatSync>) =>
    stat.isFile() && stat.nlink === 1 && trustedStat(stat);
  let lockFd: number | undefined;
  try {
    const dir = lstatSync(parent);
    const state = lstatSync(input.stateFile);
    if (!dir.isDirectory() || !trustedStat(dir) || !isRegular(state))
      throw Error("PA05_J4I_PRESTART_UNTRUSTED_STATE");
    // This is a fail-closed concurrency guard only for one-shot repair
    // processes; a normal Host does not acquire this lock.
    lockFd = openSync(lockPath, constants.O_WRONLY | constants.O_CREAT |
      constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    if (!isRegular(fstatSync(lockFd)))
      throw Error("PA05_J4I_PRESTART_LOCK_INVALID");
    // Guard against symlink substitution between the above lstat and open.
    const stateFd = openSync(input.stateFile, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const checked = fstatSync(stateFd);
      if (!isRegular(checked) ||
          checked.ino !== state.ino || checked.dev !== state.dev)
        throw Error("PA05_J4I_PRESTART_STATE_REPLACED");
    } finally {
      closeSync(stateFd);
    }
    const store = createFileLifecycleStore(input.stateFile);
    const manager = createAppManagerService(input.catalog, store);
    const journal = createPa05PrestartupAuditJournalV010({
      filePath: input.auditFile, hostId: input.hostId
    });
    const {catalog: _catalog, stateFile: _stateFile, auditFile: _auditFile,
      ...trusted} = input;
    return await recoverPa05TrustedPrestartupUninstallV010({
      ...trusted, manager, audit: event => journal.append(event)
    });
  } catch {
    // Never expose the Host state path, bearer, PostgreSQL URL, or Provider
    // exception in a maintenance failure. The DB fence remains authoritative.
    throw Error("PA05_J4I_PRESTART_DENIED_OR_UNKNOWN");
  } finally {
    if (lockFd !== undefined) {
      try {
        const held = fstatSync(lockFd);
        const path = lstatSync(lockPath);
        if (held.ino !== path.ino || held.dev !== path.dev)
          throw Error("PA05_J4I_PRESTART_LOCK_TAMPERED");
        unlinkSync(lockPath);
        closeSync(lockFd);
      } catch {
        try { closeSync(lockFd); } catch {}
        throw Error("PA05_J4I_PRESTART_LOCK_CLEANUP_UNCERTAIN");
      }
    }
  }
}
