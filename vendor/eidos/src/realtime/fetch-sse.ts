import type {
  RealtimeConnectionStateV010,
  RealtimeEventSourceV010,
  RealtimeEventV010
} from "./contracts.js";

export interface FetchSseRealtimeSourceOptionsV010 {
  url: string | (() => string);
  fetchImpl?: typeof fetch;
  headers?: () => Record<string, string>;
  documentRef?: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
  reconnectDelaysMs?: readonly number[];
}

interface ParsedSseMessage {
  id?: string;
  event?: string;
  data?: string;
}

function parseRealtimeEvent(message: ParsedSseMessage): RealtimeEventV010 | undefined {
  if (!message.data) return undefined;
  const parsed = JSON.parse(message.data) as Partial<RealtimeEventV010>;
  if (
    parsed.contractVersion !== "0.1.0"
    || typeof parsed.eventId !== "string"
    || !parsed.eventId
    || typeof parsed.sequence !== "number"
    || !Number.isInteger(parsed.sequence)
    || typeof parsed.topic !== "string"
    || !parsed.topic
    || typeof parsed.type !== "string"
    || typeof parsed.occurredAt !== "string"
  ) {
    throw new Error("EIDOS_REALTIME_EVENT_INVALID");
  }
  return parsed as RealtimeEventV010;
}

export function createFetchSseRealtimeSourceV010(
  options: FetchSseRealtimeSourceOptionsV010
): RealtimeEventSourceV010 {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EIDOS_REALTIME_FETCH_UNAVAILABLE");

  const documentRef = options.documentRef
    ?? (typeof document === "undefined" ? undefined : document);
  const reconnectDelays = options.reconnectDelaysMs?.length
    ? [...options.reconnectDelaysMs]
    : [1000, 2000, 5000, 10000, 30000];

  const listeners = new Set<(event: RealtimeEventV010) => void>();
  const stateListeners = new Set<(state: RealtimeConnectionStateV010) => void>();
  let controller: AbortController | undefined;
  let disposed = false;
  let desiredConnected = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let state: RealtimeConnectionStateV010 = {
    state: "IDLE",
    retryCount: 0
  };

  const emitState = (
    next: RealtimeConnectionStateV010["state"],
    retryCount = state.retryCount
  ) => {
    state = {
      ...state,
      state: next,
      retryCount
    };
    for (const handler of stateListeners) handler({ ...state });
  };

  const clearReconnect = () => {
    if (reconnectTimer !== undefined) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
  };

  const hidden = () => documentRef?.visibilityState === "hidden";

  const scheduleReconnect = () => {
    if (disposed || !desiredConnected || hidden()) return;
    const nextRetry = state.retryCount + 1;
    const delay = reconnectDelays[
      Math.min(nextRetry - 1, reconnectDelays.length - 1)
    ] ?? 30000;
    emitState("RECONNECTING", nextRetry);
    clearReconnect();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      void pump();
    }, delay);
  };

  const dispatchFrame = (frame: ParsedSseMessage) => {
    const event = parseRealtimeEvent(frame);
    if (!event) return;
    if (state.lastEventId === event.eventId) return;
    state = {
      ...state,
      lastEventId: event.eventId,
      retryCount: 0
    };
    for (const handler of listeners) handler(structuredClone(event));
  };

  const consume = async (response: Response, signal: AbortSignal) => {
    if (!response.ok || !response.body) {
      throw new Error(`EIDOS_REALTIME_HTTP_${response.status}`);
    }

    emitState("CONNECTED", 0);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let frame: ParsedSseMessage = {};

    const flushLine = (line: string) => {
      if (line === "") {
        if (frame.data !== undefined) dispatchFrame(frame);
        frame = {};
        return;
      }
      if (line.startsWith(":")) return;
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      let value = colon < 0 ? "" : line.slice(colon + 1);
      if (value.startsWith(" ")) value = value.slice(1);
      if (field === "id") frame.id = value;
      else if (field === "event") frame.event = value;
      else if (field === "data") {
        frame.data = frame.data === undefined
          ? value
          : frame.data + "\n" + value;
      }
    };

    while (!signal.aborted) {
      const next = await reader.read();
      if (next.done) break;
      buffer += decoder.decode(next.value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const raw = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        flushLine(raw.endsWith("\r") ? raw.slice(0, -1) : raw);
        newline = buffer.indexOf("\n");
      }
    }
  };

  async function pump(): Promise<void> {
    if (disposed || !desiredConnected || hidden() || controller) return;
    clearReconnect();
    const currentController = new AbortController();
    controller = currentController;
    emitState(state.retryCount > 0 ? "RECONNECTING" : "CONNECTING");

    try {
      const url = typeof options.url === "function" ? options.url() : options.url;
      const headers: Record<string, string> = {
        accept: "text/event-stream",
        ...(options.headers?.() ?? {})
      };
      if (state.lastEventId) headers["last-event-id"] = state.lastEventId;
      const response = await fetchImpl(url, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: currentController.signal
      });
      await consume(response, currentController.signal);
      if (!currentController.signal.aborted) scheduleReconnect();
    } catch (error) {
      if (!currentController.signal.aborted) {
        console.warn("Eidos realtime stream disconnected.", error);
        scheduleReconnect();
      }
    } finally {
      if (controller === currentController) {
        controller = undefined;
      }
    }
  }

  const onVisibilityChange = () => {
    if (disposed || !desiredConnected) return;
    if (hidden()) {
      clearReconnect();
      controller?.abort();
      controller = undefined;
      emitState("PAUSED_HIDDEN", state.retryCount);
      return;
    }
    void pump();
  };
  documentRef?.addEventListener("visibilitychange", onVisibilityChange);

  return {
    subscribe(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
    subscribeState(handler) {
      stateListeners.add(handler);
      handler({ ...state });
      return () => stateListeners.delete(handler);
    },
    connect() {
      if (disposed) throw new Error("EIDOS_REALTIME_SOURCE_DISPOSED");
      desiredConnected = true;
      if (hidden()) {
        emitState("PAUSED_HIDDEN");
        return;
      }
      void pump();
    },
    disconnect() {
      desiredConnected = false;
      clearReconnect();
      controller?.abort();
      controller = undefined;
      emitState("IDLE", 0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      desiredConnected = false;
      clearReconnect();
      controller?.abort();
      controller = undefined;
      documentRef?.removeEventListener("visibilitychange", onVisibilityChange);
      listeners.clear();
      stateListeners.clear();
      emitState("DISPOSED", 0);
    },
    snapshot() {
      return { ...state };
    }
  };
}
