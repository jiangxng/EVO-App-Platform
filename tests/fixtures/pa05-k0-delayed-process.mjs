// Disposable non-production PROCESS runtime used only by K0 negative-evidence tests.
// Never connects to Railway, secrets, databases, or production HTTP routes.
export async function invoke(request) {
  if (request.method === "pid") return { pid: process.pid };
  if (request.method === "hang") await new Promise(() => {});
  if (request.method === "disconnect-ipc") {
    process.disconnect?.();
    await new Promise(resolve => setTimeout(resolve, 50));
    return { disconnected: true };
  }
  throw new Error("PA05_K0_FIXTURE_UNSUPPORTED_METHOD");
}

let hangOnDeactivate = false;

// Only the explicitly named disposable startup-negative case hangs.
// Self-exit is an extra cleanup fuse; the parent Host remains alive to
// supervise and reap the child during the test. Never simulate parent SIGKILL.
export async function activate(host) {
  if (host.packageId === "pa05-k0-deactivate-hang-process") {
    hangOnDeactivate = true;
    return;
  }
  if (host.packageId !== "pa05-k0-activate-hang-process") return;
  setTimeout(() => process.exit(39), 5000).unref();
  // Real activation handshake + OS PID over the existing scoped Host IPC.
  // The test-only memory store supplies independent pre/post liveness checks.
  await host.storage.set("pa05-k0-activation-pid", process.pid);
  await new Promise(() => {});
}

export async function deactivate() {
  if (hangOnDeactivate) {
    // A separate self-exit fuse means a test runner cannot retain this child
    // indefinitely even if the Host fails to enforce its local stop timer.
    setTimeout(() => process.exit(40), 5000).unref();
    await new Promise(() => {});
  }
  // Hold the child alive long enough to inspect the stop()/shutdown() overlap.
  // Less than the production runtime's 750 ms local SIGKILL fallback.
  await new Promise(resolve => setTimeout(resolve, 400));
}
