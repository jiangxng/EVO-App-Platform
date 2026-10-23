// PA05 K0 — non-production, auto-expiring OS process tree fixture.
// Target Host and Worker both have independent self-exit fuses.
// The real test observer is a separate, still-living parent process.
// No production resources, cgroup writes, parent SIGKILL or secret access.
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";

const ownPath = fileURLToPath(import.meta.url);
const mode = process.argv[2];

if (mode === "worker") {
  // Do not depend on a Host IPC connection to eventually exit.
  const fuse = setTimeout(() => process.exit(77), 5000);
  process.on("message", msg => {
    if (msg?.kind !== "stop") return;
    clearTimeout(fuse);
    process.exit(0);
  });
  process.on("SIGTERM", () => process.exit(0));
  process.send?.({kind: "ready", workerPid: process.pid});
} else if (mode === "host") {
  // This fixture does not use detached:true and does not create sessions.
  const worker = spawn(process.execPath, [ownPath, "worker"], {
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });
  const fuse = setTimeout(() => shutdown(), 7000);
  let shuttingDown = false;
  let ready = false;
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    try { if (worker.connected) worker.send({kind: "stop"}); }
    catch { /* Worker still has a 5-second self-exit fuse. */ }
    // A second independent host fuse avoids depending on a broken IPC channel.
    setTimeout(() => process.exit(78), 1400).unref();
  }
  worker.on("message", msg => {
    if (msg?.kind === "ready" && !ready) {
      ready = true;
      process.send?.({kind: "tree-ready", hostPid: process.pid,
        workerPid: msg.workerPid});
    }
  });
  worker.on("error", () => shutdown());
  worker.on("close", (code, signal) => {
    clearTimeout(fuse);
    if (process.connected) {
      process.send({kind: "tree-closed", workerExitCode: code, workerSignal: signal},
        () => process.exit(0));
    } else {
      process.exit(0);
    }
  });
  process.on("message", msg => {
    if (msg?.kind === "stop") shutdown();
  });
  process.on("SIGTERM", () => shutdown());
} else {
  throw new Error("PA05_K0_TEST_FIXTURE_BAD_MODE");
}
