export const appHostShellHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EVO</title>
<style>
:root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#15171a;background:#f5f6f8}
*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}
[data-eidos-app-host]{background:#f5f6f8}
[data-eidos-app-host] aside{background:#fff;min-height:100vh}
[data-eidos-app-host] nav button{border:0;background:transparent;border-radius:8px;padding:9px 10px;cursor:pointer}
[data-eidos-app-host] nav button:hover{background:#f0f2f5}
[data-eidos-app-host-main]{max-width:1200px}
form[data-eidos-id],[data-eidos-capability="catalog-browser"]{background:#fff;border:1px solid #d9dde4;border-radius:14px;padding:18px}
form[data-eidos-id] h1,[data-eidos-capability="catalog-browser"]>header h1{margin:0 0 8px;font-size:21px}
form[data-eidos-id] label{display:block;font-weight:600;font-size:13px;margin:12px 0}
form[data-eidos-id] input,form[data-eidos-id] select{display:block;width:100%;padding:9px;margin-top:5px;border:1px solid #b7bdc7;border-radius:8px}
form[data-eidos-id] button,[data-eidos-catalog-item] button{padding:9px 12px;border:1px solid #aeb4be;border-radius:8px;background:#fff;cursor:pointer}
[data-eidos-catalog-items]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
[data-eidos-catalog-item]{border:1px solid #d9dde4;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px}
[data-eidos-catalog-item] header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
[data-eidos-catalog-item] h2{font-size:18px;margin:0}
[data-eidos-catalog-version],[data-eidos-catalog-category],[data-eidos-catalog-meta]{font-size:12px;color:#666d78;margin-right:8px}
[data-eidos-catalog-status]{font-size:12px;padding:4px 8px;border:1px solid #cbd0d8;border-radius:999px;white-space:nowrap}
[data-eidos-catalog-status][data-tone="positive"]{color:#0a7137;border-color:#9ac9aa;background:#f0fbf4}
[data-eidos-catalog-badge]{display:inline-block;font-size:11px;background:#eef0f3;border-radius:999px;padding:3px 7px;margin:0 5px 4px 0}
[data-eidos-catalog-item] footer{margin-top:auto}
[data-eidos-catalog-item] button[data-eidos-primary="true"]{background:#15171a;color:#fff;border-color:#15171a}
[data-eidos-action-status]{display:block;white-space:pre-wrap;word-break:break-word;background:#15171a;color:#f5f6f8;border-radius:10px;padding:12px;overflow:auto;max-height:360px}
@media(max-width:850px){[data-eidos-app-host]{grid-template-columns:1fr!important}[data-eidos-app-host] aside{min-height:auto;border-right:0!important;border-bottom:1px solid #ddd}[data-eidos-catalog-items]{grid-template-columns:1fr}}
</style>
</head>
<body>
<div id="app" aria-live="polite"></div>
<script type="module" src="/assets/manager/app-host-client.js"></script>
</body>
</html>`;
