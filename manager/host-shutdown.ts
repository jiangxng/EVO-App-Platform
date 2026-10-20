export interface HostShutdownStepV010 {
  name: string;
  run(): unknown | Promise<unknown>;
}

export interface HostShutdownResultV010 {
  ok: boolean;
  failedSteps: string[];
}

/**
 * Attempt every shutdown step in declared order, even when an earlier
 * resource rejects. A failed step must never be mistaken for clean shutdown.
 */
export async function runHostShutdownStepsV010(
  steps: readonly HostShutdownStepV010[],
  onError: (name: string, error: unknown) => void = () => {}
): Promise<HostShutdownResultV010> {
  const failedSteps: string[] = [];
  for (const step of steps) {
    try {
      await step.run();
    } catch (error) {
      failedSteps.push(step.name);
      try { onError(step.name, error); } catch {
        // Logging must not prevent subsequent resources from being closed.
      }
    }
  }
  return {ok: failedSteps.length === 0, failedSteps};
}

export interface HostShutdownResponseV010 {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  end(body?: string): unknown;
}

/** Refuse new requests, including those arriving on an existing keep-alive connection. */
export function rejectHostShutdownRequestV010(
  shuttingDown: boolean,
  response: HostShutdownResponseV010
): boolean {
  if (!shuttingDown) return false;
  response.statusCode = 503;
  response.setHeader("Connection", "close");
  response.end("Host shutting down");
  return true;
}
