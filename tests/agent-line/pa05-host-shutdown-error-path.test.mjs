import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rejectHostShutdownRequestV010, runHostShutdownStepsV010} from "../../dist/manager/host-shutdown.js";

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

test("Host shutdown admission rejects requests and closes keep-alive", () => {
  const response = {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(body) { this.body = body; return this; }
  };
  assert.equal(rejectHostShutdownRequestV010(false, response), false);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.headers, {});
  assert.equal(response.body, "");

  assert.equal(rejectHostShutdownRequestV010(true, response), true);
  assert.equal(response.statusCode, 503);
  assert.equal(response.headers.Connection, "close");
  assert.equal(response.body, "Host shutting down");
});
test("Host shutdown deadline is armed before the first awaited cleanup and fails closed", () => {
  // Static wiring guard over the actual Host entrypoint. This is deliberately
  // not evidence that Railway routes a platform signal to Node PID1.
  const source = readFileSync(new URL("../../manager/server.ts", import.meta.url), "utf8");
  const begin = source.indexOf("async function shutdown(signal: string)");
  const handler = source.indexOf('process.once("SIGTERM"', begin);
  assert.ok(begin >= 0 && handler > begin, "actual SIGTERM shutdown entrypoint missing");
  const shutdown = source.slice(begin, handler);

  assert.match(shutdown, /if \(shuttingDown\) return;\s*shuttingDown = true;/);
  const deadline = shutdown.indexOf("const shutdownDeadline = setTimeout(");
  const serverClose = shutdown.indexOf("const serverClosed = new Promise");
  const firstAwait = shutdown.search(/\bawait\s/);
  assert.ok(deadline >= 0 && serverClose > deadline && firstAwait > serverClose,
    "deadline and HTTP listener closure must be armed before any awaited cleanup");

  const timer = shutdown.slice(deadline, serverClose);
  assert.match(timer, /process\.exit\(1\)/, "a hung cleanup must never exit cleanly");
  assert.doesNotMatch(timer, /\.unref\(\)/, "deadline must remain referenced");
  assert.match(shutdown, /const cleanup = await runHostShutdownStepsV010\(/);
  assert.match(shutdown, /\{name: "Process runtime Host", run: \(\) => processRuntimeHost\.shutdown\(\)\}/);
  assert.match(shutdown, /const closed = await serverClosed;/);
  assert.match(shutdown, /clearTimeout\(shutdownDeadline\)/);
  assert.match(shutdown, /process\.exit\(cleanup\.ok && closed\.ok \? 0 : 1\)/);
});
