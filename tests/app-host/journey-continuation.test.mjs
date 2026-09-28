import test from "node:test";
import assert from "node:assert/strict";

import {
  consumeJourneyContinuationV010,
  journeyContinuationStorageKeyV010,
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
