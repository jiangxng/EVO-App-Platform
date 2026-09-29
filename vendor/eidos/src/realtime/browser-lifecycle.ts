export type BrowserLifecycleStateV010 =
  | "ACTIVE_VISIBLE"
  | "ACTIVE_HIDDEN"
  | "BFCACHE_FROZEN"
  | "OFFLINE"
  | "DISPOSED";

export interface BrowserLifecycleSnapshotV010 {
  contractVersion: "0.1.0";
  state: BrowserLifecycleStateV010;
  visible: boolean;
  online: boolean;
  persisted: boolean;
  generation: number;
}

export interface BrowserLifecycleControllerV010 {
  snapshot(): BrowserLifecycleSnapshotV010;
  subscribe(
    listener: (snapshot: BrowserLifecycleSnapshotV010) => void
  ): () => void;
  dispose(): void;
}

export interface BrowserLifecycleWindowV010 {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

export interface BrowserLifecycleDocumentV010 {
  visibilityState: DocumentVisibilityState;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

export interface BrowserLifecycleNavigatorV010 {
  onLine: boolean;
}

export interface CreateBrowserLifecycleControllerOptionsV010 {
  windowRef?: BrowserLifecycleWindowV010;
  documentRef?: BrowserLifecycleDocumentV010;
  navigatorRef?: BrowserLifecycleNavigatorV010;
}

export function createBrowserLifecycleControllerV010(
  options: CreateBrowserLifecycleControllerOptionsV010 = {}
): BrowserLifecycleControllerV010 {
  const windowRef = options.windowRef
    ?? (typeof window === "undefined" ? undefined : window);
  const documentRef = options.documentRef
    ?? (typeof document === "undefined" ? undefined : document);
  const navigatorRef = options.navigatorRef
    ?? (typeof navigator === "undefined" ? undefined : navigator);

  let disposed = false;
  let persisted = false;
  let generation = 0;
  const listeners = new Set<
    (snapshot: BrowserLifecycleSnapshotV010) => void
  >();

  const current = (): BrowserLifecycleSnapshotV010 => {
    const visible = documentRef?.visibilityState !== "hidden";
    const online = navigatorRef?.onLine !== false;
    const state: BrowserLifecycleStateV010 = disposed
      ? "DISPOSED"
      : persisted
        ? "BFCACHE_FROZEN"
        : !online
          ? "OFFLINE"
          : visible
            ? "ACTIVE_VISIBLE"
            : "ACTIVE_HIDDEN";
    return {
      contractVersion: "0.1.0",
      state,
      visible,
      online,
      persisted,
      generation
    };
  };

  const publish = () => {
    generation += 1;
    const next = current();
    for (const listener of listeners) listener({ ...next });
  };

  const onVisibility = () => publish();
  const onOnline = () => publish();
  const onOffline = () => publish();
  const onPageHide = (event: Event) => {
    persisted = Boolean((event as PageTransitionEvent).persisted);
    publish();
  };
  const onPageShow = (event: Event) => {
    persisted = false;
    publish();
  };

  documentRef?.addEventListener("visibilitychange", onVisibility);
  windowRef?.addEventListener("online", onOnline);
  windowRef?.addEventListener("offline", onOffline);
  windowRef?.addEventListener("pagehide", onPageHide);
  windowRef?.addEventListener("pageshow", onPageShow);

  return {
    snapshot() {
      return current();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(current());
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      documentRef?.removeEventListener("visibilitychange", onVisibility);
      windowRef?.removeEventListener("online", onOnline);
      windowRef?.removeEventListener("offline", onOffline);
      windowRef?.removeEventListener("pagehide", onPageHide);
      windowRef?.removeEventListener("pageshow", onPageShow);
      publish();
      listeners.clear();
    }
  };
}

export interface SupersedingRequestTokenV010 {
  generation: number;
  signal: AbortSignal;
  isCurrent(): boolean;
}

export interface SupersedingRequestGateV010 {
  begin(): SupersedingRequestTokenV010;
  cancel(): void;
  dispose(): void;
}

export function createSupersedingRequestGateV010(): SupersedingRequestGateV010 {
  let generation = 0;
  let controller: AbortController | undefined;
  let disposed = false;

  return {
    begin() {
      if (disposed) throw new Error("EIDOS_REQUEST_GATE_DISPOSED");
      generation += 1;
      controller?.abort();
      controller = new AbortController();
      const localGeneration = generation;
      const localController = controller;
      return {
        generation: localGeneration,
        signal: localController.signal,
        isCurrent() {
          return !disposed
            && generation === localGeneration
            && controller === localController
            && !localController.signal.aborted;
        }
      };
    },
    cancel() {
      generation += 1;
      controller?.abort();
      controller = undefined;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      controller?.abort();
      controller = undefined;
    }
  };
}
