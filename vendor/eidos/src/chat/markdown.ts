function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeHref(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  if (
    value.startsWith("https://")
    || value.startsWith("http://")
    || value.startsWith("mailto:")
    || value.startsWith("/")
    || value.startsWith("#")
  ) return value;
  return undefined;
}

function renderInline(input: string): string {
  const tokens: string[] = [];
  const token = (html: string): string => {
    const id = tokens.length;
    tokens.push(html);
    return `\u0000EIDOSMD${id}X\u0000`;
  };

  let value = input.replace(/\`([^\`\n]+)\`/g, (_match, code: string) =>
    token(`<code data-eidos-chat-markdown-inline-code>${esc(code)}</code>`)
  );

  value = value.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_match, label: string, rawHref: string) => {
    const href = safeHref(rawHref);
    if (!href) return token(`<span data-eidos-chat-markdown-unsafe-link>${esc(label)} (${esc(rawHref)})</span>`);
    const external = href.startsWith("https://") || href.startsWith("http://");
    return token(
      `<a data-eidos-chat-markdown-link href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>`
    );
  });

  value = esc(value)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~\n]+)~~/g, "<del>$1</del>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");

  return value.replace(/\u0000EIDOSMD(\d+)X\u0000/g, (_match, index: string) =>
    tokens[Number(index)] ?? ""
  );
}

function splitTableRow(line: string): string[] {
  let value = line.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|")) value = value.slice(0, -1);
  return value.split("|").map(cell => cell.trim());
}

function isTableDivider(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index] ?? "";
  if (!line.trim()) return true;
  if (/^\s*\`\`\`/.test(line)) return true;
  if (/^\s*#{1,4}\s+/.test(line)) return true;
  if (/^\s*>\s?/.test(line)) return true;
  if (/^\s*[-*+]\s+/.test(line)) return true;
  if (/^\s*\d+[.)]\s+/.test(line)) return true;
  if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) return true;
  if (index + 1 < lines.length && line.includes("|") && isTableDivider(lines[index + 1] ?? "")) return true;
  return false;
}

export function renderChatMarkdownToHtml(markdown: string): string {
  const lines = markdown.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  const out: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*\`\`\`([^\s\`]*)\s*$/);
    if (fence) {
      const language = fence[1]?.trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*\`\`\`\s*$/.test(lines[index] ?? "")) {
        code.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) index += 1;
      out.push(
        `<pre data-eidos-chat-markdown-code${language ? ` data-language="${esc(language)}"` : ""}><code>${esc(code.join("\n"))}</code></pre>`
      );
      continue;
    }

    const heading = line.match(/^\s*(#{1,4})\s+(.+?)\s*$/);
    if (heading) {
      const level = Math.min(4, heading[1]?.length ?? 1) + 1;
      out.push(`<h${level} data-eidos-chat-markdown-heading>${renderInline(heading[2] ?? "")}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      out.push("<hr data-eidos-chat-markdown-rule>");
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? "")) {
        quote.push((lines[index] ?? "").replace(/^\s*>\s?/, ""));
        index += 1;
      }
      out.push(`<blockquote data-eidos-chat-markdown-quote>${renderChatMarkdownToHtml(quote.join("\n"))}</blockquote>`);
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isTableDivider(lines[index + 1] ?? "")) {
      const headers = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && (lines[index] ?? "").includes("|") && (lines[index] ?? "").trim()) {
        rows.push(splitTableRow(lines[index] ?? ""));
        index += 1;
      }
      const head = headers.map(cell => `<th>${renderInline(cell)}</th>`).join("");
      const body = rows.map(row =>
        `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] ?? "")}</td>`).join("")}</tr>`
      ).join("");
      out.push(
        `<div data-eidos-chat-markdown-table-scroll><table data-eidos-chat-markdown-table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
      );
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    if (unordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = (lines[index] ?? "").match(/^\s*[-*+]\s+(.+)$/);
        if (!match) break;
        items.push(match[1] ?? "");
        index += 1;
      }
      out.push(`<ul data-eidos-chat-markdown-list>${items.map(item => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = (lines[index] ?? "").match(/^\s*\d+[.)]\s+(.+)$/);
        if (!match) break;
        items.push(match[1] ?? "");
        index += 1;
      }
      out.push(`<ol data-eidos-chat-markdown-list>${items.map(item => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && (lines[index] ?? "").trim() && !isBlockStart(lines, index)) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    if (paragraph.length === 0) {
      paragraph.push(line);
      index += 1;
    }
    out.push(`<p data-eidos-chat-markdown-paragraph>${paragraph.map(renderInline).join("<br>")}</p>`);
  }

  return `<div data-eidos-chat-markdown>${out.join("")}</div>`;
}
