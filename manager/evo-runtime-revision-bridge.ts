export interface EvoRuntimeRevisionInterestV010 {
  connectionId: string;
  contextId: string;
  enterpriseId: string;
  evoEnterpriseCode: string;
  resourceId: string;
}

export interface EvoRuntimeRevisionBridgeEventV010 {
  contextId: string;
  enterpriseId: string;
  resourceId: string;
  evoEnterpriseCode: string;
  etag: string;
}

export interface EvoRuntimeRevisionBridgeV010 {
  register(interests: readonly EvoRuntimeRevisionInterestV010[]): () => void;
  pollNow(): Promise<void>;
  diagnostics(): {
    interestCount: number;
    uniqueRuntimeEnterpriseCount: number;
    timerActive: boolean;
    checks: number;
    notModified: number;
    changed: number;
    errors: number;
    lastCheckAt?: string;
    lastChangeAt?: string;
  };
  dispose(): void;
}

export function createEvoRuntimeRevisionBridgeV010(options: {
  baseUrl: string;
  intervalMs?: number;
  requestTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  onChanged(event: EvoRuntimeRevisionBridgeEventV010): void;
  onError?(input: { evoEnterpriseCode: string; error: unknown }): void;
}): EvoRuntimeRevisionBridgeV010 {
  const fetchImpl = options.fetchImpl ?? fetch;
  const intervalMs = options.intervalMs ?? 15_000;
  if (!Number.isFinite(intervalMs) || intervalMs < 1_000) {
    throw new Error("EVO_RUNTIME_REVISION_BRIDGE_INTERVAL_INVALID");
  }

  const requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs < 1 || requestTimeoutMs > 2_147_483_647) {
    throw new Error("EVO_RUNTIME_REVISION_BRIDGE_TIMEOUT_INVALID");
  }
  const owners = new Map<string, number>();
  const requests = new Map<string, AbortController>();
  const interests = new Map<string, EvoRuntimeRevisionInterestV010>();
  const etags = new Map<string, string>();
  const initialized = new Set<string>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let disposed = false;
  let polling: Promise<void> | undefined;
  let checks = 0;
  let notModified = 0;
  let changed = 0;
  let errors = 0;
  let lastCheckAt: string | undefined;
  let lastChangeAt: string | undefined;

  const activeCodes = (): string[] => [
    ...new Set([...interests.values()].map(item => item.evoEnterpriseCode))
  ].sort();

  const releaseUnused = () => {
    const active = new Set(activeCodes());
    for (const [code, controller] of requests) {
      if (!active.has(code)) controller.abort();
    }
    for (const code of etags.keys()) {
      if (!active.has(code)) { etags.delete(code); initialized.delete(code); }
    }
  };

  const stopIfIdle = () => {
    releaseUnused();
    if (interests.size > 0 || timer === undefined) return;
    clearInterval(timer);
    timer = undefined;
  };

  const pollCode = async (code: string): Promise<void> => {
    if (disposed || !activeCodes().includes(code)) return;
    const previous = etags.get(code);
    const controller = new AbortController();
    requests.set(code, controller);
    let timedOut = false;
    let response: Response | undefined;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error("EVO_RUNTIME_REVISION_TIMEOUT"));
    }, requestTimeoutMs);
    timeout.unref?.();
    const cancelled = () => disposed || controller.signal.aborted || !activeCodes().includes(code);
    try {
      checks += 1;
      lastCheckAt = new Date().toISOString();
      response = await fetchImpl(
        options.baseUrl.replace(/\/$/u, "")
          + "/api/v1/enterprises/"
          + encodeURIComponent(code)
          + "/runtime-revision",
        {
          signal: controller.signal,
          headers: {
            accept: "application/json",
            ...(previous ? { "if-none-match": previous } : {})
          }
        }
      );

      if (cancelled()) return;
      if (response.status === 304) {
        notModified += 1;
        return;
      }
      if (!response.ok) {
        throw new Error(
          "EVO_RUNTIME_REVISION_HTTP_"
          + response.status
        );
      }

      const etag = response.headers.get("etag")?.trim();
      if (!etag) {
        throw new Error("EVO_RUNTIME_REVISION_ETAG_REQUIRED");
      }
      // Drain and validate the response body before accepting the validator.
      const body = await response.json() as {
        contractVersion?: unknown;
        enterpriseId?: unknown;
        enterpriseCode?: unknown;
      };
      if (
        body.contractVersion !== "0.1.0"
        || typeof body.enterpriseId !== "string"
        || body.enterpriseCode !== code
      ) {
        throw new Error("EVO_RUNTIME_REVISION_RESPONSE_INVALID");
      }

      if (cancelled()) return;
      etags.set(code, etag);
      if (!initialized.has(code)) {
        initialized.add(code);
        return;
      }
      if (previous === etag) return;

      changed += 1;
      lastChangeAt = new Date().toISOString();
      for (const item of interests.values()) {
        if (item.evoEnterpriseCode !== code) continue;
        options.onChanged({
          contextId: item.contextId,
          enterpriseId: item.enterpriseId,
          resourceId: item.resourceId,
          evoEnterpriseCode: code,
          etag
        });
      }
    } catch (error) {
      if (cancelled() && !timedOut) return;
      errors += 1;
      options.onError?.({ evoEnterpriseCode: code, error: timedOut
        ? new Error("EVO_RUNTIME_REVISION_TIMEOUT", { cause: error }) : error });
    } finally {
      clearTimeout(timeout);
      requests.delete(code);
      // Release unread error/304 bodies as well as successful bodies.
      if (response?.body && !response.body.locked) {
        await response.body.cancel().catch(() => undefined);
      }
    }
  };

  const pollNow = async (): Promise<void> => {
    if (disposed || interests.size === 0) return;
    if (polling) return polling;
    polling = (async () => {
      for (const code of activeCodes()) await pollCode(code);
    })().finally(() => {
      polling = undefined;
    });
    return polling;
  };

  const ensureTimer = () => {
    if (disposed || timer !== undefined || interests.size === 0) return;
    timer = setInterval(() => {
      void pollNow();
    }, intervalMs);
    timer.unref?.();
  };

  return {
    register(next) {
      if (disposed) throw new Error("EVO_RUNTIME_REVISION_BRIDGE_DISPOSED");
      const ownedKeys: string[] = [];
      for (const item of next) {
        const key = [
          item.connectionId,
          item.contextId,
          item.enterpriseId,
          item.evoEnterpriseCode,
          item.resourceId
        ].join("\u001f");
        interests.set(key, { ...item });
        owners.set(key, (owners.get(key) ?? 0) + 1);
        ownedKeys.push(key);
      }
      if (ownedKeys.length > 0) {
        ensureTimer();
        void pollNow();
      }
      let closed = false;
      return () => {
        if (closed) return;
        closed = true;
        for (const key of ownedKeys) {
          const remaining = (owners.get(key) ?? 1) - 1;
          if (remaining > 0) owners.set(key, remaining);
          else { owners.delete(key); interests.delete(key); }
        }
        stopIfIdle();
      };
    },
    pollNow,
    diagnostics() {
      return {
        interestCount: interests.size,
        uniqueRuntimeEnterpriseCount: activeCodes().length,
        timerActive: timer !== undefined,
        checks,
        notModified,
        changed,
        errors,
        ...(lastCheckAt ? { lastCheckAt } : {}),
        ...(lastChangeAt ? { lastChangeAt } : {})
      };
    },
    dispose() {
      disposed = true;
      interests.clear();
      owners.clear();
      releaseUnused();
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    }
  };
}
