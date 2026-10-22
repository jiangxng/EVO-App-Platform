import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

// A real OS observer outside the target Host process; still only one Linux
// runner, not an authorized cgroup supervisor or all-Worker inventory.
const target = fileURLToPath(
  new URL("../fixtures/pa05-k0-supervised-os-tree.mjs", import.meta.url)
);
function procStat(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return null;
  let raw;
  try {raw = readFileSync(`/proc/${pid}/stat`, "utf8");}
  catch (e) {
    if (e?.code === "ENOENT" || e?.code === "ESRCH") return null;
    throw e;
  }
  const close = raw.lastIndexOf(")");
  if (close < 1) throw new Error("INVALID_PROC_STAT");
  const fields = raw.slice(close + 1).trim().split(/\s+/);
  const parentPid = Number(fields[1]);    // /proc/pid/stat field #4
  const startTicks = fields[19];          // /proc/pid/stat field #22
  if (!Number.isSafeInteger(parentPid) || !/^\d+$/.test(startTicks))
    throw new Error("INVALID_PROC_PROCESS_IDENTITY");
  return {state: fields[0], parentPid, startTicks};
}
function sameLiveProcess(pid, witness) {
  const current = procStat(pid);
  return Boolean(current && current.startTicks === witness?.startTicks
    && current.state !== "Z" && current.state !== "X");
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitAbsent(pid, startTicks, limitMs) {
  const deadline = Date.now() + limitMs;
  while (Date.now() < deadline) {
    if (!sameLiveProcess(pid, {startTicks})) return true;
    await pause(35);
  }
  return !sameLiveProcess(pid, {startTicks});
}
async function readyMessage(child) {
  return Promise.race([
    new Promise((resolve, reject) => {
      const onMessage = message => {
        if (message?.kind !== "tree-ready") return;
        child.off("message", onMessage);
        resolve(message);
      };
      child.on("message", onMessage);
      child.once("error", reject);
      child.once("exit", (code, signal) =>
        reject(new Error(`TARGET_EXITED_BEFORE_READY:${code}:${signal}`)));
    }),
    pause(3500).then(() => {throw new Error("TARGET_TREE_READY_TIMEOUT");})
  ]);
}

test("K0 external OS observer: independently verify two-generation process tree and graceful close", {
  timeout: 11500,
  skip: process.platform !== "linux" && "requires Linux procfs"
}, async () => {
  const host = spawn(process.execPath, [target, "host"], {
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });
  const hostExit = new Promise(resolve => host.once("close", (code, signal) =>
    resolve({code,signal})));
  const hostPid = host.pid;
  let actualHost, actualWorker, workerPid;
  try {
    const registered = await readyMessage(host);
    assert.equal(registered.hostPid, hostPid);
    assert.ok(Number.isSafeInteger(registered.workerPid) && registered.workerPid > 0);
    workerPid = registered.workerPid;
    actualHost = procStat(hostPid);
    actualWorker = procStat(workerPid);
    assert.ok(actualHost?.startTicks);
    assert.ok(actualWorker?.startTicks);
    assert.equal(actualWorker.parentPid, hostPid,
      "external /proc must independently confirm child PPID");
    assert.ok(sameLiveProcess(hostPid, actualHost));
    assert.ok(sameLiveProcess(workerPid, actualWorker));
    const tree = readFileSync(`/proc/${hostPid}/task/${hostPid}/children`, "utf8")
      .trim().split(/\s+/).filter(Boolean).map(Number);
    assert.ok(tree.includes(workerPid),
      "external procfs children enumeration must contain the signed-off worker PID");

    // The target Host stays ALIVE. No parent SIGKILL or orphan experiment.
    assert.equal(host.connected, true);
    host.send({kind: "stop"});
    const ended = await Promise.race([
      hostExit, pause(4000).then(() => {throw new Error("GRACEFUL_HOST_STOP_TIMEOUT");})
    ]);
    assert.equal(ended.code, 0);
    assert.equal(ended.signal, null);
    assert.equal(await waitAbsent(workerPid, actualWorker.startTicks, 900), true);
    assert.equal(await waitAbsent(hostPid, actualHost.startTicks, 900), true);
    console.log("PA05_K0_EXTERNAL_OS_TREE_GRACEFUL_OBSERVATION=" + JSON.stringify({
      scope: "non-production-single-linux-runner",
      targetHostSeparateProcess: true,
      hostRemainedAliveDuringObservation: true,
      childConfirmedByExternalProcfs: true,
      workerParentPidMatched: true,
      hostAndWorkerStartIdentityObserved: true,
      gracefulExitExternallyObserved: true,
      noParentSigkillTestPerformed: true,
      independentCgroupSupervisorVerified: false,
      globalStopCertified: false,
      productionMaterialWriteEnabled: false
    }));
  } finally {
    // The observed child and Host also self-exit after 5/7 s. This external
    // cleanup is a *second* independent fuse, not a destructive test scenario.
    if (host.connected) {
      try {host.send({kind: "stop"});} catch {}
    }
    let closed = host.exitCode !== null || host.signalCode !== null;
    if (!closed) {
      closed = await Promise.race([hostExit.then(() => true),
        pause(550).then(() => false)]);
    }
    // SIGTERM only an exact, already-observed disposable process generation.
    if (!closed && actualHost && sameLiveProcess(hostPid, actualHost)) {
      try {host.kill("SIGTERM");} catch {}
    }
    if (workerPid && actualWorker && sameLiveProcess(workerPid, actualWorker)) {
      try {process.kill(workerPid, "SIGTERM");} catch(e) {
        if(e?.code !== "ESRCH") throw e;
      }
    }
    await Promise.race([hostExit, pause(1300)]);
  }
});
