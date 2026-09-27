import test from "node:test";
import assert from "node:assert/strict";

import {
  createChatConversationHistoryV010
} from "../../dist/vendor/eidos/src/app-host/page-controller.js";

test("Eidos Chat derives bounded discourse history from prior user and assistant text", () => {
  const history = createChatConversationHistoryV010([
    {
      id: "user-1",
      contractVersion: "0.2.0",
      role: "user",
      parts: [{
        type: "text",
        text: "请查询我的 Context Memory，告诉我仓库正常几点截单。"
      }]
    },
    {
      id: "assistant-1",
      contractVersion: "0.2.0",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "我从 Context Memory 查到两条语义重复的 17:00 截单记录。"
        },
        {
          type: "activity",
          label: "Context Memory",
          state: "complete"
        },
        {
          type: "evidence",
          title: "Context Memory",
          source: "evo-app-platform",
          context: "Preview User"
        },
        {
          type: "proposal",
          title: "可处理重复记录",
          summary: "可以通过新的 Proposal 表达 supersession。",
          reasons: ["不会直接修改旧 Memory。"]
        }
      ]
    },
    {
      id: "error-1",
      contractVersion: "0.2.0",
      role: "error",
      parts: [{
        type: "notice",
        tone: "danger",
        text: "ignore this error"
      }]
    }
  ]);

  assert.deepEqual(history, [
    {
      role: "user",
      content: "请查询我的 Context Memory，告诉我仓库正常几点截单。"
    },
    {
      role: "assistant",
      content: [
        "我从 Context Memory 查到两条语义重复的 17:00 截单记录。",
        "可处理重复记录\n可以通过新的 Proposal 表达 supersession。\n不会直接修改旧 Memory。"
      ].join("\n\n")
    }
  ]);
});

test("Eidos Chat keeps only the newest bounded conversation history", () => {
  const messages = Array.from({ length: 20 }, (_, index) => ({
    id: "user-" + index,
    role: "user",
    text: "message-" + index
  }));

  const history = createChatConversationHistoryV010(messages, {
    maxMessages: 4,
    maxTotalCharacters: 100,
    maxCharactersPerMessage: 100
  });

  assert.deepEqual(
    history.map(item => item.content),
    ["message-16", "message-17", "message-18", "message-19"]
  );
});

test("Eidos Chat enforces total history character budget from newest turns backward", () => {
  const history = createChatConversationHistoryV010([
    { id: "u1", role: "user", text: "11111" },
    { id: "a1", role: "assistant", text: "22222" },
    { id: "u2", role: "user", text: "33333" }
  ], {
    maxMessages: 10,
    maxTotalCharacters: 10,
    maxCharactersPerMessage: 100
  });

  assert.deepEqual(history.map(item => item.content), ["22222", "33333"]);
});
