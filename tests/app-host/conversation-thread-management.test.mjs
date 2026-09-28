import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("P1.8C Eidos Personal Agent exposes durable thread management controls", async () => {
  const source = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/app-host/page-controller.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /data-eidos-chat-thread-controls/);
  assert.match(source, /data-eidos-chat-thread-selector/);
  assert.match(source, /data-eidos-chat-new-thread/);
  assert.match(source, /data-eidos-chat-archive-thread/);
  assert.match(source, /listConversationThreadsV010/);
  assert.match(source, /createConversationThreadV010/);
  assert.match(source, /getConversationThreadV010/);
  assert.match(source, /archiveConversationThreadV010/);
  assert.match(source, /includeArchived:\s*true/);
});

test("P1.8C archived selection is explicitly read-only in Eidos controller", async () => {
  const source = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/app-host/page-controller.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /thread\.state === "ARCHIVED"/);
  assert.match(source, /textarea\.disabled/);
  assert.match(source, /activeThreadState/);
});


test("P1.8C passive durable chat recovery does not publish a global action-result refresh", async () => {
  const source = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/app-host/page-controller.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /appendChatResult\(threadRecovered\.result, false\)/
  );
  assert.match(
    source,
    /appendChatResult\(recovered\.result, false\)/
  );
  assert.doesNotMatch(
    source,
    /onActionResult\?\.\(threadRecovered\.result, page\)/
  );
});
