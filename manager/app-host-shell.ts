import { eidosProductiveWorkbenchCss } from "../vendor/eidos/src/design-language/index.js";

function safeAssetRevision(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]/gu, "-");
  return normalized || "dev";
}

export const appHostShellCss = eidosProductiveWorkbenchCss;


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
