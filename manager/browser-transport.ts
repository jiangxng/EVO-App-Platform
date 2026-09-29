export interface RevisionAwareBrowserTransportV010 {
  readonly clientRevision: string;
  readonly fetch: typeof fetch;
  readonly hostRevision: () => string | undefined;
  readonly updateAvailable: () => boolean;
}

function revisionFromImportUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/assets\/([^/]+)\//u);
    return match?.[1] ?? "dev";
  } catch {
    return "dev";
  }
}

export function createRevisionAwareBrowserTransportV010(options: {
  importUrl: string;
  fetchImpl?: typeof fetch;
  onUpdateAvailable?: (hostRevision: string) => void;
}): RevisionAwareBrowserTransportV010 {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EVO_BROWSER_FETCH_UNAVAILABLE");

  const clientRevision = revisionFromImportUrl(options.importUrl);
  let observedHostRevision: string | undefined;
  let updateAvailable = false;

  const wrapped: typeof fetch = async (input, init) => {
    const target = typeof input === "string"
      ? new URL(input, window.location.origin)
      : input instanceof URL
        ? new URL(input.toString(), window.location.origin)
        : new URL(input.url, window.location.origin);

    const sameOrigin = target.origin === window.location.origin;
    const headers = new Headers(init?.headers ?? (
      input instanceof Request ? input.headers : undefined
    ));
    if (sameOrigin) headers.set("x-evo-client-revision", clientRevision);

    const response = await fetchImpl(input, {
      ...init,
      headers
    });

    if (sameOrigin) {
      const hostRevision = response.headers.get("x-evo-host-revision")?.trim();
      if (hostRevision) observedHostRevision = hostRevision;
      const nextUpdateAvailable =
        response.headers.get("x-evo-client-update") === "available";
      if (nextUpdateAvailable && !updateAvailable && hostRevision) {
        options.onUpdateAvailable?.(hostRevision);
      }
      updateAvailable ||= nextUpdateAvailable;
    }

    return response;
  };

  return {
    clientRevision,
    fetch: wrapped,
    hostRevision: () => observedHostRevision,
    updateAvailable: () => updateAvailable
  };
}
