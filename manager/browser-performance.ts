import type {
  WebPerformanceSurfaceTargetV010
} from "./web-performance.js";

export interface BrowserPerformanceReporterV010 {
  dispose(): void;
  flush(): Promise<void>;
}

function numberOrUndefined(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : undefined;
}

export function createBrowserPerformanceReporterV010(options: {
  fetchImpl: typeof fetch;
  clientRevision: string;
  hostRevision: () => string | undefined;
  surfaceTarget: WebPerformanceSurfaceTargetV010;
  sampleRate?: number;
  force?: boolean;
}): BrowserPerformanceReporterV010 {
  const sampleRate = Math.max(0, Math.min(1, options.sampleRate ?? 0.1));
  const selected = options.force === true || Math.random() < sampleRate;
  let disposed = false;
  let sent = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lcpMs: number | undefined;
  let longTaskCount = 0;
  let longTaskTotalMs = 0;
  const observers: PerformanceObserver[] = [];

  if (selected && typeof PerformanceObserver !== "undefined") {
    try {
      const lcp = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          lcpMs = Math.max(lcpMs ?? 0, entry.startTime);
        }
      });
      lcp.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcp);
    } catch {
      // Browser does not expose this performance entry type.
    }

    try {
      const longTasks = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          longTaskCount += 1;
          longTaskTotalMs += entry.duration;
        }
      });
      longTasks.observe({ type: "longtask", buffered: true });
      observers.push(longTasks);
    } catch {
      // Long Task API is not available in every browser.
    }
  }

  const flush = async (): Promise<void> => {
    if (!selected || sent || disposed) return;
    sent = true;

    const navigation = performance.getEntriesByType("navigation")[0]
      as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find(entry => entry.name === "first-contentful-paint");

    let transferBytes = 0;
    let jsTransferBytes = 0;
    let cssTransferBytes = 0;
    let apiTransferBytes = 0;
    let cachedResourceCount = 0;
    const resources = performance.getEntriesByType("resource")
      as PerformanceResourceTiming[];

    for (const resource of resources) {
      const bytes = Math.max(0, resource.transferSize || 0);
      transferBytes += bytes;
      if (bytes === 0 && resource.decodedBodySize > 0) {
        cachedResourceCount += 1;
      }
      const path = (() => {
        try {
          return new URL(resource.name).pathname;
        } catch {
          return "";
        }
      })();
      if (path.endsWith(".js")) jsTransferBytes += bytes;
      else if (path.endsWith(".css")) cssTransferBytes += bytes;
      else if (path.startsWith("/v1/")) apiTransferBytes += bytes;
    }

    const body = {
      contractVersion: "0.1.0",
      observedAt: new Date().toISOString(),
      clientRevision: options.clientRevision,
      ...(options.hostRevision()
        ? { hostRevision: options.hostRevision() }
        : {}),
      surfaceTarget: options.surfaceTarget,
      ...(navigation?.type ? { navigationType: navigation.type } : {}),
      ...(numberOrUndefined(navigation?.duration) !== undefined
        ? { navigationDurationMs: navigation!.duration }
        : {}),
      ...(numberOrUndefined(lcpMs) !== undefined
        ? { largestContentfulPaintMs: lcpMs }
        : {}),
      ...(numberOrUndefined(fcp?.startTime) !== undefined
        ? { firstContentfulPaintMs: fcp!.startTime }
        : {}),
      longTaskCount,
      longTaskTotalMs,
      resourceCount: resources.length,
      transferBytes,
      jsTransferBytes,
      cssTransferBytes,
      apiTransferBytes,
      cachedResourceCount
    };

    try {
      await options.fetchImpl("/v1/web-performance", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(body),
        keepalive: true
      });
    } catch {
      // RUM is explicitly non-authoritative and must never break the product.
    }
  };

  const onPageHide = () => {
    void flush();
  };

  if (selected) {
    timer = setTimeout(() => {
      timer = undefined;
      void flush();
    }, 5000);
    window.addEventListener("pagehide", onPageHide, { once: true });
  }

  return {
    flush,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener("pagehide", onPageHide);
      for (const observer of observers) observer.disconnect();
    }
  };
}
