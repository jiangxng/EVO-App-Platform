import test from "node:test";
import assert from "node:assert/strict";

import {
  createTransportTrafficDiagnosticsV010
} from "../../dist/manager/transport-traffic-diagnostics.js";

test("transport traffic diagnostics separate action, conditional, JSON and SSE budgets", () => {
  const diagnostics = createTransportTrafficDiagnosticsV010(
    () => new Date("2026-09-29T06:00:00.000Z")
  );

  diagnostics.recordRequest("GET", "/v1/experiences/effective", true);
  diagnostics.recordRequest("POST", "/v1/actions");
  diagnostics.recordRequest("GET", "/v1/events");
  diagnostics.recordNotModified();
  diagnostics.recordJson(128);
  diagnostics.openSse();
  diagnostics.recordSseEvent(80);
  diagnostics.recordSseHeartbeat(13);
  diagnostics.closeSse();

  assert.deepEqual(diagnostics.snapshot(), {
    contractVersion: "0.1.0",
    startedAt: "2026-09-29T06:00:00.000Z",
    requests: {
      total: 3,
      byRoute: {
        "GET /v1/events": 1,
        "GET /v1/experiences/effective": 1,
        "POST /v1/actions": 1
      },
      actionRequests: 1,
      conditionalRequests: 1,
      notModifiedResponses: 1
    },
    responses: {
      jsonResponses: 1,
      jsonBytesSent: 128
    },
    sse: {
      connectionsOpened: 1,
      connectionsClosed: 1,
      activeConnections: 0,
      eventsSent: 1,
      eventBytesSent: 80,
      heartbeatsSent: 1,
      heartbeatBytesSent: 13
    }
  });
});
