import {closeSync, constants, fstatSync, lstatSync, openSync, unlinkSync} from "node:fs";
import type {Stats} from "node:fs";
import {dirname} from "node:path";

/**
 * PA05/E01J4J — optional POSIX cooperative Host exclusion.
 *
 * When and only when the main Host OPTS IN, it holds the exact J4I one-shot
 * lock for its entire process lifetime. This protects a *single shared
 * filesystem namespace* only if ALL Host processes using that state opt in.
 *
 * No stale lock stealing, PID-based override, startup default or distributed
 * Worker certification. After SIGKILL the lock deliberately stays behind
 * until an independently authorized operator verifies the Host is gone.
 */
export function acquirePa05CooperativeHostStateLockV010(input: {
  mode: "OPT_IN";
  stateFile: string;
}): {release(): void} {
  if (input?.mode !== "OPT_IN" ||
      typeof input.stateFile !== "string" ||
      !input.stateFile.startsWith("/") || input.stateFile.endsWith("/") ||
      (process.umask() & 0o077) !== 0o077)
    throw Error("PA05_J4J_COOPERATIVE_LOCK_CONFIGURATION_INVALID");

  const owner = process.getuid?.();
  const secure = (stat: Stats) =>
    (stat.mode & 0o077) === 0 &&
    (owner === undefined || stat.uid === owner);
  const path = input.stateFile + ".pa05-one-shot.lock";
  let fd: number | undefined;
  try {
    const dir = lstatSync(dirname(input.stateFile));
    const original = lstatSync(input.stateFile);
    if (!dir.isDirectory() || !secure(dir) ||
        !original.isFile() || original.nlink !== 1 || !secure(original))
      throw Error("PA05_J4J_COOPERATIVE_STATE_UNTRUSTED");
    fd = openSync(path, constants.O_CREAT | constants.O_EXCL |
      constants.O_NOFOLLOW | constants.O_WRONLY, 0o600);
    const held = fstatSync(fd);
    if (!held.isFile() || held.nlink !== 1 || !secure(held))
      throw Error("PA05_J4J_COOPERATIVE_LOCK_UNTRUSTED");
    // A state replacement after lock acquisition invalidates the handshake.
    const stateFd = openSync(input.stateFile, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const verified = fstatSync(stateFd);
      if (!verified.isFile() || verified.ino !== original.ino ||
          verified.dev !== original.dev || !secure(verified))
        throw Error("PA05_J4J_COOPERATIVE_STATE_REPLACED");
    } finally { closeSync(stateFd); }
  } catch {
    if (fd !== undefined) {
      // Only remove the just-created lock, and never an attacker replacement.
      try {
        const live = lstatSync(path), ours = fstatSync(fd);
        if (ours.ino === live.ino && ours.dev === live.dev) unlinkSync(path);
      } catch {}
      try { closeSync(fd); } catch {}
    }
    throw Error("PA05_J4J_COOPERATIVE_LOCK_DENIED");
  }
  const heldFd = fd!;
  let released = false;
  return {
    release() {
      if (released) return;
      // Never delete a lock path belonging to a different inode. Crash or
      // pathname manipulation must leave future maintenance denied.
      try {
        const live = lstatSync(path), ours = fstatSync(heldFd);
        if (live.ino !== ours.ino || live.dev !== ours.dev)
          throw Error("PA05_J4J_COOPERATIVE_LOCK_TAMPERED");
        unlinkSync(path);
        closeSync(heldFd);
        released = true;
      } catch {
        try { closeSync(heldFd); } catch {}
        released = true;
        throw Error("PA05_J4J_COOPERATIVE_LOCK_RELEASE_UNCERTAIN");
      }
    }
  };
}
