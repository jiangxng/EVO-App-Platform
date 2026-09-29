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
  fetchImpl?: typeof fetch;
  onChanged(event: EvoRuntimeRevisionBridgeEventV010): void;
  onError?(input: { evoEnterpriseCode: string; error: unknown }): void;
}): EvoRuntimeRevisionBridgeV010 {
  const fetchImpl = options.fetchImpl ?? fetch;
  const intervalMs = options.intervalMs ?? 15_000;
  if (!Number.isFinite(intervalMs) || intervalMs < 1_000) {
    throw new Error("EVO_RUNTIME_REVISION_BRIDGE_INTERVAL_INVALID");
  }

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

  const stopIfIdle = () => {
    if (interests.size > 0 || timer === undefined) return;
    clearInterval(timer);
    timer = undefined;
  };

  const pollCode = async (code: string): Promise<void> => {
    const previous = etags.get(code);
    try {
      checks += 1;
      lastCheckAt = new Date().toISOString();
      const response = await fetchImpl(
        options.baseUrl.replace(/\/$/u, "")
          + "/api/v1/enterprises/"
          + encodeURIComponent(code)
          + "/runtime-revision",
        {
          headers: {
            accept: "application/json",
            ...(previous ? { "if-none-match": previous } : {})
          }
        }
      );

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
      errors += 1;
      options.onError?.({ evoEnterpriseCode: code, error });
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
        for (const key of ownedKeys) interests.delete(key);
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
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    }
  };
}
