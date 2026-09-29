import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  renderChatMarkdownToHtml,
  renderChatMessageToHtml
} from "../../dist/vendor/eidos/src/chat/index.js";
import { eidosProductiveWorkbenchCss } from "../../dist/vendor/eidos/src/design-language/index.js";

test("Personal Agent assistant prose renders common Markdown through Eidos", () => {
  const html = renderChatMessageToHtml({
    id: "assistant-markdown",
    contractVersion: "0.2.0",
    role: "assistant",
    parts: [{
      type: "text",
      text: [
        "## 平台概览",
        "",
        "**已安装 Package（2 个）**",
        "",
        "- enterprise-agent",
        "- openai-llm-provider",
        "",
        "| Package | 类型 |",
        "|---|---|",
        "| enterprise-agent | AGENT |"
      ].join("\n")
    }]
  });

  assert.match(html, /data-eidos-chat-message-id="assistant-markdown"/);
  assert.match(html, /data-eidos-chat-markdown/);
  assert.match(html, /<h3[^>]*>平台概览<\/h3>/);
  assert.match(html, /<strong>已安装 Package（2 个）<\/strong>/);
  assert.match(html, /data-eidos-chat-markdown-list/);
  assert.match(html, /data-eidos-chat-markdown-table/);
});

test("Eidos Chat Markdown escapes model HTML and blocks unsafe URL schemes", () => {
  const html = renderChatMarkdownToHtml(
    "<img src=x onerror=alert(1)> [bad](javascript:alert(1)) [good](https://example.com)"
  );

  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /data-eidos-chat-markdown-unsafe-link/);
  assert.match(html, /href="https:\/\/example\.com"/);
});

test("Human-authored chat text stays literal", () => {
  const html = renderChatMessageToHtml({
    id: "user-markdown",
    contractVersion: "0.2.0",
    role: "user",
    parts: [{ type: "text", text: "**literal**" }]
  });
  assert.match(html, /\*\*literal\*\*/);
  assert.doesNotMatch(html, /<strong>literal<\/strong>/);
});

test("Personal Agent Markdown styling remains owned by Eidos Productive Design Language", () => {
  assert.match(eidosProductiveWorkbenchCss, /data-eidos-chat-markdown/);
  assert.match(eidosProductiveWorkbenchCss, /data-eidos-chat-markdown-table/);
  assert.match(eidosProductiveWorkbenchCss, /data-eidos-chat-markdown-code/);
});


test("Eidos high-frequency surfaces preserve mounted DOM instead of full replacement", async () => {
  const pageController = await readFile(
    new URL("../../dist/vendor/eidos/src/app-host/page-controller.js", import.meta.url),
    "utf8"
  );
  const browserShell = await readFile(
    new URL("../../dist/vendor/eidos/src/app-host/browser-shell.js", import.meta.url),
    "utf8"
  );
  const spatial = await readFile(
    new URL("../../dist/vendor/eidos/src/spatial/surface.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(pageController, /transcript\.innerHTML\s*=/);
  assert.match(pageController, /preserveMountedPage/);
  assert.match(browserShell, /preserveMountedPage/);
  assert.doesNotMatch(spatial, /objectLayer\.replaceChildren\(/);
  assert.doesNotMatch(spatial, /svg\.replaceChildren\(/);
  assert.match(spatial, /requestAnimationFrame/);
});
