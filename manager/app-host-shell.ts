import { eidosProductiveWorkbenchCss } from "../vendor/eidos/src/design-language/index.js";

function safeAssetRevision(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]/gu, "-");
  return normalized || "dev";
}

export const appHostShellCss = eidosProductiveWorkbenchCss;

export const appHostChromeCss = `
[data-evo-context-control]{
  display:flex;align-items:center;gap:var(--eidos-space-xs);min-width:0
}
[data-evo-global-control-label]{
  position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0,0,0,0);white-space:nowrap;border:0
}
[data-evo-context-select]{
  width:auto;min-width:150px;max-width:240px;height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-md);background:var(--eidos-bg);color:var(--eidos-fg)
}
[data-evo-current-user]{position:relative}
[data-evo-current-user]>summary{
  list-style:none;display:flex;align-items:center;gap:var(--eidos-space-xs);
  min-height:var(--eidos-control-compact);padding:0 var(--eidos-space-sm);
  border-radius:var(--eidos-radius-pill);cursor:pointer;white-space:nowrap
}
[data-evo-current-user]>summary::-webkit-details-marker{display:none}
[data-evo-current-user]>summary:hover{background:var(--eidos-bg-hover)}
[data-evo-current-user-avatar]{
  width:24px;height:24px;display:grid;place-items:center;border-radius:50%;
  background:var(--eidos-fg);color:var(--eidos-bg);font-size:10px;font-weight:700
}
[data-evo-current-user-menu]{
  position:absolute;right:0;top:calc(100% + var(--eidos-space-sm));z-index:30;
  width:min(320px,80vw);display:grid;gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);background:var(--eidos-bg);
  box-shadow:0 12px 32px color-mix(in srgb,var(--eidos-fg) 14%,transparent)
}
[data-evo-current-user-row]{display:grid;gap:2px;min-width:0}
[data-evo-current-user-row]>span{font-size:var(--eidos-font-meta);color:var(--eidos-fg-muted)}
[data-evo-current-user-row]>strong{
  overflow-wrap:anywhere;font-size:var(--eidos-font-compact);font-weight:600
}
@media(max-width:700px){
  [data-evo-context-select]{min-width:0;max-width:52vw}
  [data-evo-current-user]>summary>span:last-child{display:none}
}`;

export function createAppHostShellHtmlV010export function createAppHostShellHtmlV010(assetRevision: string): string {
  const revision = safeAssetRevision(assetRevision);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>EVO</title>
<link rel="stylesheet" href="/assets/${revision}/manager/app-host-shell.css">
<style>${appHostChromeCss}</style>
</head>
<body>
<div id="app" aria-live="polite"></div>
<script type="module" src="/assets/${revision}/manager/app-host-client.js"></script>
</body>
</html>`;
}

/**
 * Backward-compatible unversioned shell for tests/legacy consumers.
 * Production Host should call createAppHostShellHtmlV010 with its build revision.
 */
export const appHostShellHtml = createAppHostShellHtmlV010("dev");
