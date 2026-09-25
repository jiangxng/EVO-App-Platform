export async function invoke(request, host) {
  if (request.method === "echo") {
    return { input: request.input, packageId: host.packageId };
  }

  if (request.method === "permission") {
    return {
      allowed: await host.permissions.has(String(request.input)),
      granted: await host.permissions.granted()
    };
  }

  if (request.method === "storage") {
    await host.storage.set("state", request.input);
    return await host.storage.get("state");
  }

  if (request.method === "publish") {
    return await host.events.publish("process-plugin.changed", request.input);
  }

  if (request.method === "environment") {
    return {
      leakedSecret: process.env.EVO_PROCESS_TEST_SECRET ?? null
    };
  }

  if (request.method === "read-file") {
    try {
      const { readFile } = await import("node:fs/promises");
      await readFile(String(request.input), "utf8");
      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        code: error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "UNKNOWN"
      };
    }
  }

  if (request.method === "hang") {
    await new Promise(() => {});
  }

  if (request.method === "crash") {
    process.exit(42);
  }

  throw new Error(`UNKNOWN_METHOD: ${request.method}`);
}
