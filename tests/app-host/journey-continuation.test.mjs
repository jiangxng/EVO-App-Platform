import test from "node:test";
import assert from "node:assert/strict";

import {
  consumeJourneyContinuationV010,
  journeyContinuationStorageKeyV010,
  peekJourneyContinuationV010,
  persistJourneyContinuationV010
} from "../../dist/vendor/eidos/src/app-host/page-controller.js";

function storage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    size() {
      return values.size;
    }
  };
}

test("setup continuation waits for settings.save and consumes exactly once", () => {
  const state = storage();
  persistJourneyContinuationV010(
    "/settings/openai-llm-provider",
    "settings.save",
    "/enterprise-agent/setup",
    state,
    1_000
  );
  assert.equal(
    consumeJourneyContinuationV010(
      "/settings/openai-llm-provider",
      "status.refresh",
      state,
      1_100
    ),
    undefined
  );
  assert.equal(state.size(), 1);

  assert.deepEqual(
    consumeJourneyContinuationV010(
      "/settings/openai-llm-provider",
      "settings.save",
      state,
      1_200
    ),
    {
      targetRoute: "/settings/openai-llm-provider",
      onActionId: "settings.save",
      returnRoute: "/enterprise-agent/setup",
      createdAt: 1_000
    }
  );
  assert.equal(state.size(), 0);
});

test("setup continuation expires before it can redirect an unrelated later task", () => {
  const state = storage();
  persistJourneyContinuationV010(
    "/providers/llm.inference",
    "settings.save",
    "/enterprise-agent/setup",
    state,
    1_000
  );
  assert.equal(
    consumeJourneyContinuationV010(
      "/providers/llm.inference",
      "settings.save",
      state,
      1_000 + 31 * 60 * 1000
    ),
    undefined
  );
  assert.equal(state.size(), 0);
});

test("continuation storage remains scoped to the destination route", () => {
  assert.equal(
    journeyContinuationStorageKeyV010("/providers/llm.inference"),
    "eidos.journey.continuation:/providers/llm.inference"
  );
});


test("shared Plugin Store continuation waits for an intended package install", () => {
  const state = storage();
  persistJourneyContinuationV010(
    "/store",
    "install",
    "/enterprise-agent/setup",
    state,
    1_000,
    ["deepseek-llm-provider", "openai-llm-provider"]
  );

  assert.equal(
    consumeJourneyContinuationV010(
      "/store",
      "install",
      state,
      1_100,
      "company-notes"
    ),
    undefined
  );
  assert.equal(state.size(), 1);

  assert.deepEqual(
    consumeJourneyContinuationV010(
      "/store",
      "install",
      state,
      1_200,
      "openai-llm-provider"
    ),
    {
      targetRoute: "/store",
      onActionId: "install",
      returnRoute: "/enterprise-agent/setup",
      onItemIds: ["deepseek-llm-provider", "openai-llm-provider"],
      createdAt: 1_000
    }
  );
  assert.equal(state.size(), 0);
});

test("item-scoped continuation does not consume when destination item is missing", () => {
  const state = storage();
  persistJourneyContinuationV010(
    "/store",
    "install",
    "/enterprise-agent/setup",
    state,
    1_000,
    ["openai-llm-provider"]
  );
  assert.equal(
    consumeJourneyContinuationV010("/store", "install", state, 1_100),
    undefined
  );
  assert.equal(state.size(), 1);
});


test("Settings can inspect a pending save continuation without consuming it", () => {
  const state = storage();
  persistJourneyContinuationV010(
    "/settings/openai-llm-provider",
    "settings.save",
    "/enterprise-agent/setup",
    state,
    1_000
  );
  assert.deepEqual(
    peekJourneyContinuationV010(
      "/settings/openai-llm-provider",
      state,
      1_100
    ),
    {
      targetRoute: "/settings/openai-llm-provider",
      onActionId: "settings.save",
      returnRoute: "/enterprise-agent/setup",
      createdAt: 1_000
    }
  );
  assert.equal(state.size(), 1);
});
