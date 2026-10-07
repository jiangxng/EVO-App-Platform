import { eidosProductiveWorkbenchCss } from "../vendor/eidos/src/design-language/index.js";

function safeAssetRevision(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]/gu, "-");
  return normalized || "dev";
}

export const appHostShellCss = eidosProductiveWorkbenchCss + `
[data-eidos-account-logout]{
  margin-top:var(--eidos-space-xs);
  padding-top:var(--eidos-space-md);
  border-top:1px solid var(--eidos-border);
}
[data-eidos-account-logout] button{
  width:100%;
  min-height:var(--eidos-control-normal);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-md);
  padding:0 var(--eidos-space-md);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
  font:inherit;
  font-size:var(--eidos-font-compact);
  font-weight:600;
  text-align:left;
  cursor:pointer;
}
[data-eidos-account-logout] button:hover{
  border-color:color-mix(in srgb,var(--eidos-danger) 35%,var(--eidos-border-strong));
  background:var(--eidos-danger-bg);
  color:var(--eidos-danger);
}
[data-eidos-account-logout] button:focus-visible{
  outline:2px solid var(--eidos-focus);
  outline-offset:2px;
}
`;


export function createAppHostShellHtmlV010(assetRevision: string): string {
  const revision = safeAssetRevision(assetRevision);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="text-scale" content="scale">
<title>EVO</title>
<link rel="stylesheet" href="/assets/${revision}/manager/app-host-shell.css">
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
