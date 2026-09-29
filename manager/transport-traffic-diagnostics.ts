export interface TransportTrafficSnapshotV010 {
  contractVersion: "0.1.0";
  startedAt: string;
  requests: {
    total: number;
    byRoute: Record<string, number>;
    actionRequests: number;
    conditionalRequests: number;
    notModifiedResponses: number;
  };
  responses: {
    jsonResponses: number;
    jsonBytesSent: number;
  };
  sse: {
    connectionsOpened: number;
    connectionsClosed: number;
    activeConnections: number;
    eventsSent: number;
    eventBytesSent: number;
    heartbeatsSent: number;
    heartbeatBytesSent: number;
  };
}

export interface TransportTrafficDiagnosticsV010 {
  recordRequest(method: string, pathname: string, conditional?: boolean): void;
  recordJson(bytes: number): void;
  recordNotModified(): void;
  openSse(): void;
  closeSse(): void;
  recordSseEvent(bytes: number): void;
  recordSseHeartbeat(bytes: number): void;
  snapshot(): TransportTrafficSnapshotV010;
}

export function createTransportTrafficDiagnosticsV010(
  now: () => Date = () => new Date()
): TransportTrafficDiagnosticsV010 {
  const startedAt = now().toISOString();
  const byRoute = new Map<string, number>();
  let total = 0;
  let actionRequests = 0;
  let conditionalRequests = 0;
  let notModifiedResponses = 0;
  let jsonResponses = 0;
  let jsonBytesSent = 0;
  let connectionsOpened = 0;
  let connectionsClosed = 0;
  let activeConnections = 0;
  let eventsSent = 0;
  let eventBytesSent = 0;
  let heartbeatsSent = 0;
  let heartbeatBytesSent = 0;

  return {
    recordRequest(method, pathname, conditional = false) {
      total += 1;
      const key = method.toUpperCase() + " " + pathname;
      byRoute.set(key, (byRoute.get(key) ?? 0) + 1);
      if (method.toUpperCase() === "POST" && pathname === "/v1/actions") {
        actionRequests += 1;
      }
      if (conditional) conditionalRequests += 1;
    },
    recordJson(bytes) {
      jsonResponses += 1;
      jsonBytesSent += Math.max(0, Math.trunc(bytes));
    },
    recordNotModified() {
      notModifiedResponses += 1;
    },
    openSse() {
      connectionsOpened += 1;
      activeConnections += 1;
    },
    closeSse() {
      connectionsClosed += 1;
      activeConnections = Math.max(0, activeConnections - 1);
    },
    recordSseEvent(bytes) {
      eventsSent += 1;
      eventBytesSent += Math.max(0, Math.trunc(bytes));
    },
    recordSseHeartbeat(bytes) {
      heartbeatsSent += 1;
      heartbeatBytesSent += Math.max(0, Math.trunc(bytes));
    },
    snapshot() {
      return {
        contractVersion: "0.1.0",
        startedAt,
        requests: {
          total,
          byRoute: Object.fromEntries(
            [...byRoute.entries()].sort(([a], [b]) => a.localeCompare(b))
          ),
          actionRequests,
          conditionalRequests,
          notModifiedResponses
        },
        responses: {
          jsonResponses,
          jsonBytesSent
        },
        sse: {
          connectionsOpened,
          connectionsClosed,
          activeConnections,
          eventsSent,
          eventBytesSent,
          heartbeatsSent,
          heartbeatBytesSent
        }
      };
    }
  };
}
