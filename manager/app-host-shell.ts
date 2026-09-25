import { eidosProductiveWorkbenchCss } from "../vendor/eidos/src/design-language/index.js";

export const appHostShellHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>EVO</title>
<style>${eidosProductiveWorkbenchCss}</style>
</head>
<body>
<div id="app" aria-live="polite"></div>
<script type="module" src="/assets/manager/app-host-client.js"></script>
</body>
</html>`;
