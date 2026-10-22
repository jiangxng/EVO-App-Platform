// PA05 K0: READ-ONLY local hints for an independent-supervisor experiment.
// This code NEVER authorizes a parent SIGKILL, sends signals, changes cgroups,
// elevates privilege, touches Railway, reads secrets or queries databases.
// It is deliberately test-only: an independent authorized infrastructure
// controller (outside the target Host lifecycle) must supply actual receipts.
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, normalize, resolve, sep } from "node:path";

const BASE = "/sys/fs/cgroup";
function readOptional(path) {
  try { return readFileSync(path, "utf8"); } catch { return null; }
}

// Linux cgroup v2 path is kernel text. Reject unusual/unrooted paths;
// never write to any discovered path or infer that a matching directory
// is exclusive to the current test run.
function ownCgroupDirectory(text) {
  const entry = text?.split("\n").find(line => line.startsWith("0::/"));
  if (!entry) return null;
  const raw = entry.slice(3).trim();
  if (!isAbsolute(raw) || raw.includes("\0")) return null;
  const path = resolve(BASE, "." + normalize(raw));
  if (path !== BASE && !path.startsWith(BASE + sep)) return null;
  return path;
}

export function observeK0LocalCgroupHints() {
  const linux = process.platform === "linux";
  const v2Hierarchy = linux && existsSync(BASE + "/cgroup.controllers");
  const selfPath = v2Hierarchy
    ? ownCgroupDirectory(readOptional("/proc/self/cgroup"))
    : null;
  const events = selfPath && readOptional(selfPath + "/cgroup.events");
  const populated = typeof events === "string"
    ? /(?:^|\n)populated\s+([01])(?:\n|$)/.exec(events)?.[1] ?? null
    : null;
  return Object.freeze({
    scope: "test-runner-local-readonly",
    linux,
    cgroupV2Detected: Boolean(v2Hierarchy),
    ownCgroupLocated: Boolean(selfPath),
    eventsReadable: typeof events === "string",
    // Existing cgroup.kill is not proof that this caller can write it.
    cgroupKillPresent: Boolean(selfPath && existsSync(selfPath + "/cgroup.kill")),
    observedPopulated: populated,
    dedicatedCgroupOwnershipVerified: false,
    independentSupervisorLifetimeVerified: false,
    childTreeTerminationAuthorityVerified: false,
    emergencyReaperAndTtlVerified: false,
    independentlySignedExitReceiptVerified: false,
    parentSigkillExperimentAuthorized: false,
    globalStopCertified: false
  });
}

// Deliberately unconditional DENY: local files, a claimed PID, and even
// human-provided booleans cannot authenticate another process's authority.
// A future authorized integration must consume genuine external evidence
// and be reviewed before a destructive child/parent-kill test exists.
export function assertK0IndependentSupervisorReady(_untrustedClaims = {}) {
  throw new Error(
    "PA05_K0_PARENT_SIGKILL_DENIED: no independent authorized supervisor, "
    + "dedicated test cgroup, verified rescue/TTL, and signed exit receipt"
  );
}
