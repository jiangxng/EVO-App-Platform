import test from "node:test";
import assert from "node:assert/strict";

import {
  APP_HOST_ACTION_SELECTOR,
  bindDelegatedAppHostActionsV010
} from "../../dist/vendor/eidos/src/app-host/page-controller.js";

test("delegated App Host action wiring catches Chat actions rendered after initial mount", async () => {
  const previousElement = globalThis.Element;

  class FakeElement {
    constructor({ action = false, parent = undefined } = {}) {
      this.action = action;
      this.parent = parent;
    }

    closest(selector) {
      assert.equal(selector, APP_HOST_ACTION_SELECTOR);
      if (this.action) return this;
      return this.parent?.closest(selector);
    }
  }

  globalThis.Element = FakeElement;

  const handlers = new Map();
  const dynamicButton = new FakeElement({ action: true });
  const dynamicButtonChild = new FakeElement({ parent: dynamicButton });
  const unrelated = new FakeElement();
  const outsideButton = new FakeElement({ action: true });

  const container = {
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (handlers.get(type) === handler) handlers.delete(type);
    },
    contains(value) {
      return value === dynamicButton || value === dynamicButtonChild;
    }
  };

  const handled = [];
  const dispose = bindDelegatedAppHostActionsV010(
    container,
    async button => {
      handled.push(button);
    }
  );

  try {
    assert.equal(
      APP_HOST_ACTION_SELECTOR.includes("[data-eidos-chat-action]"),
      true
    );

    // The action element is created after delegation has already been bound.
    handlers.get("click")({ target: dynamicButtonChild });
    await Promise.resolve();

    assert.deepEqual(handled, [dynamicButton]);

    handlers.get("click")({ target: unrelated });
    handlers.get("click")({ target: outsideButton });
    await Promise.resolve();

    assert.deepEqual(handled, [dynamicButton]);

    dispose();
    assert.equal(handlers.has("click"), false);
  } finally {
    if (previousElement === undefined) delete globalThis.Element;
    else globalThis.Element = previousElement;
  }
});
