// Disposable non-production PROCESS runtime used only by K0 negative-evidence tests.
// Never connects to Railway, secrets, databases, or production HTTP routes.
export async function invoke(request) {
  if (request.method === "pid") return { pid: process.pid };
  if (request.method === "hang") await new Promise(() => {});
  throw new Error("PA05_K0_FIXTURE_UNSUPPORTED_METHOD");
}

export async function deactivate() {
  // Hold the child alive long enough to inspect the stop()/shutdown() overlap.
  // Less than the production runtime's 750 ms local SIGKILL fallback.
  await new Promise(resolve => setTimeout(resolve, 400));
}
