import test from "node:test";
import assert from "node:assert/strict";

import {
  createHostRealtimeEventBusV010
} from "../../dist/manager/realtime-event-bus.js";

test("Host realtime bus scopes events and replays after cursor", () => {
  let now = 0;
  const bus = createHostRealtimeEventBusV010({
    capacity: 64,
    now: () => new Date(1700000000000 + now++)
  });
  const received = [];
  bus.subscribe({
    principalSubjectId: "u1",
    accessibleContextIds: new Set(["personal:u1","enterprise:e1"])
  }, event => received.push(event));

  const visible = bus.publish({
    topic:"resource.eog",
    type:"RESOURCE_INVALIDATED",
    scope:{contextId:"enterprise:e1"},
    resource:{kind:"enterprise-operating-graph",resourceId:"eog:primary",version:2}
  });
  bus.publish({
    topic:"resource.eog",
    type:"RESOURCE_INVALIDATED",
    scope:{contextId:"enterprise:e2"},
    resource:{kind:"enterprise-operating-graph",resourceId:"eog:primary",version:3}
  });
  const personal = bus.publish({
    topic:"agent.run",
    type:"RUN_STATE_CHANGED",
    scope:{principalSubjectId:"u1",contextId:"personal:u1"},
    resource:{kind:"agent-run",resourceId:"run:1",version:"ev:2"}
  });

  assert.deepEqual(received.map(x=>x.eventId), [visible.eventId, personal.eventId]);
  const replay = bus.replayAfter(visible.eventId, {
    principalSubjectId:"u1",
    accessibleContextIds:new Set(["personal:u1","enterprise:e1"])
  });
  assert.equal(replay.resetRequired, false);
  assert.deepEqual(replay.events.map(x=>x.eventId), [personal.eventId]);
  assert.ok(personal.sequence > visible.sequence);
  assert.deepEqual(bus.diagnostics(), {
    subscriberCount: 1,
    bufferedEventCount: 3,
    currentSequence: 3,
    capacity: 64
  });
});

test("Host realtime replay fails closed when visible cursor expired", () => {
  const bus = createHostRealtimeEventBusV010({capacity:64});
  for (let i=0;i<70;i++) {
    bus.publish({
      topic:"resource.eog",
      type:"RESOURCE_INVALIDATED",
      scope:{contextId:"enterprise:e1"},
      resource:{kind:"eog",resourceId:"eog:primary",version:i}
    });
  }
  const replay = bus.replayAfter("realtime:1:expired", {
    principalSubjectId:"u1",
    accessibleContextIds:new Set(["enterprise:e1"])
  });
  assert.equal(replay.resetRequired, true);
  assert.equal(typeof replay.cursorEventId, "string");
  assert.equal(typeof replay.cursorSequence, "number");
});
