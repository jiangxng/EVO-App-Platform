import test from "node:test";
import assert from "node:assert/strict";
import {runHostShutdownStepsV010} from "../../dist/manager/host-shutdown.js";

const names = [
  "scheduler", "managed runtime", "async reader", "write lifecycle Host",
  "process runtime Host"
];

test("Host shutdown attempts every later cleanup boundary after any one rejection", async () => {
  for (let failedAt = 0; failedAt < names.length; failedAt++) {
    const attempted = [];
    const errors = [];
    const result = await runHostShutdownStepsV010(names.map((name, index) => ({
      name,
      async run() {
        attempted.push(name);
        if (index === failedAt) throw new Error("injected cleanup failure");
      }
    })), (name, error) => errors.push({name, message: error.message}));

    assert.deepEqual(attempted, names, `all cleanup steps must run after failure at ${names[failedAt]}`);
    assert.deepEqual(result, {ok: false, failedSteps: [names[failedAt]]});
    assert.deepEqual(errors, [{name: names[failedAt], message: "injected cleanup failure"}]);
  }
});

test("Host shutdown records multiple failures and still attempts all cleanup", async () => {
  const attempted = [];
  const errors = [];
  const result = await runHostShutdownStepsV010(names.map((name, index) => ({
    name,
    run() {
      attempted.push(name);
      if (index === 1 || index === 3) throw Error(name);
    }
  })), (name, error) => errors.push([name, error.message]));

  assert.deepEqual(attempted, names);
  assert.deepEqual(result, {ok: false, failedSteps: [names[1], names[3]]});
  assert.deepEqual(errors, [[names[1], names[1]], [names[3], names[3]]]);
});

test("Host shutdown reports clean completion only when every cleanup succeeds", async () => {
  const attempted = [];
  const result = await runHostShutdownStepsV010(names.map(name => ({
    name,
    run() { attempted.push(name); }
  })));

  assert.deepEqual(attempted, names);
  assert.deepEqual(result, {ok: true, failedSteps: []});
});
