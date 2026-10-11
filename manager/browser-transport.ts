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
  onCurrentRevision?: (hostRevision: string) => void;
  onAuthenticationRequired?: () => void;
  selectedContextId?: () => string | undefined;
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
    if (sameOrigin) {
      headers.set("x-evo-client-revision", clientRevision);
      const selectedContextId = options.selectedContextId?.()?.trim();
      if (selectedContextId && !headers.has("x-evo-context-id")) {
        headers.set("x-evo-context-id", selectedContextId);
      }
    }

    const requestCredentials =
      init?.credentials
      ?? (input instanceof Request ? input.credentials : undefined)
      ?? (sameOrigin ? "same-origin" : undefined);
    const response = await fetchImpl(input, {
      ...init,
      ...(requestCredentials ? { credentials: requestCredentials } : {}),
      headers
    });

    if (
      sameOrigin
      && response.status === 401
      && !target.pathname.startsWith("/auth/")
    ) {
      options.onAuthenticationRequired?.();
    }

    if (sameOrigin) {
      const hostRevision = response.headers.get("x-evo-host-revision")?.trim();
      if (hostRevision) observedHostRevision = hostRevision;
      const nextUpdateAvailable = Boolean(
        hostRevision
        && hostRevision !== clientRevision
        && response.headers.get("x-evo-client-update") === "available"
      );
      if (nextUpdateAvailable !== updateAvailable && hostRevision) {
        if (nextUpdateAvailable) {
          options.onUpdateAvailable?.(hostRevision);
        } else if (hostRevision === clientRevision) {
          options.onCurrentRevision?.(hostRevision);
        }
      }
      updateAvailable = nextUpdateAvailable;
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
