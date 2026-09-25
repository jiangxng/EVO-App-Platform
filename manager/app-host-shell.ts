export const appHostShellHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>EVO</title>
<style>
:root{
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:#202124;
  background:#f7f7f8;
}
*{box-sizing:border-box}
html,body,#app{margin:0;width:100%;height:100%;min-height:100%;overflow:hidden}
button,input,select,textarea{font:inherit}
button{cursor:pointer}

/* Workbench frame */
[data-eidos-app-host-layout="workbench"]{
  --activity-width:50px;
  --splitter-width:5px;
  display:grid;
  grid-template-columns:var(--activity-width) var(--eidos-side-panel-width,360px) var(--splitter-width) minmax(0,1fr);
  grid-template-rows:minmax(0,1fr) 23px;
  width:100%;
  height:100dvh;
  min-height:0;
  overflow:hidden;
  background:#fff;
}
[data-eidos-app-host-layout="workbench"][data-side-panel-visible="false"]{
  grid-template-columns:var(--activity-width) 0 0 minmax(0,1fr);
}

/* Activity bar */
[data-eidos-activity-bar]{
  grid-column:1;
  grid-row:1;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  min-height:0;
  border-right:1px solid #dfe1e5;
  background:#f3f4f6;
  overflow:hidden;
}
[data-eidos-activity-primary],
[data-eidos-activity-secondary]{
  display:flex;
  flex-direction:column;
  align-items:center;
}
[data-eidos-activity-bar] button{
  width:49px;
  height:48px;
  border:0;
  background:transparent;
  color:#6a6d75;
  border-left:2px solid transparent;
  padding:0;
  display:grid;
  place-items:center;
}
[data-eidos-activity-bar] button:hover{background:#e7e9ed;color:#202124}
[data-eidos-activity-bar] button[data-active="true"]{
  color:#111214;
  border-left-color:#111214;
  background:#eceef1;
}
[data-eidos-activity-icon]{
  font-size:21px;
  line-height:1;
}

/* Side panel */
[data-eidos-side-panel]{
  grid-column:2;
  grid-row:1;
  min-width:0;
  min-height:0;
  display:flex;
  flex-direction:column;
  border-right:1px solid #e2e4e8;
  background:#f8f9fa;
  overflow:hidden;
}
[data-side-panel-visible="false"] [data-eidos-side-panel]{display:none}
[data-eidos-side-panel-header]{
  flex:0 0 auto;
  min-height:42px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 10px 0 13px;
  border-bottom:1px solid #e6e7ea;
  text-transform:uppercase;
  letter-spacing:.04em;
  font-size:11px;
  color:#555960;
}
[data-eidos-side-panel-header] button{
  border:0;
  background:transparent;
  color:#767a82;
  font-size:18px;
  border-radius:6px;
  width:28px;
  height:28px;
}
[data-eidos-side-panel-header] button:hover{background:#e8eaee;color:#202124}
[data-eidos-side-panel-content]{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
}
[data-eidos-side-panel-footer]{
  flex:0 0 auto;
  border-top:1px solid #e6e7ea;
  padding:8px 10px;
}
[data-eidos-locale-control]{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:8px;
  align-items:center;
  font-size:11px;
  color:#6a6d75;
}
[data-eidos-locale-control] select{
  min-width:0;
  width:100%;
  border:1px solid #d6d9de;
  border-radius:6px;
  padding:5px 7px;
  background:#fff;
}
[data-eidos-workbench-navigation]{padding:8px}
[data-eidos-workbench-navigation] button{
  width:100%;
  display:block;
  border:0;
  background:transparent;
  border-radius:7px;
  padding:8px 9px;
  margin:1px 0;
  text-align:left;
  color:#34373d;
}
[data-eidos-workbench-navigation] button:hover{background:#e8eaed}

/* Resizer */
[data-eidos-workbench-splitter]{
  grid-column:3;
  grid-row:1;
  cursor:col-resize;
  background:transparent;
  position:relative;
  z-index:2;
}
[data-eidos-workbench-splitter]::after{
  content:"";
  position:absolute;
  left:2px;
  top:0;
  bottom:0;
  width:1px;
  background:#e4e6ea;
}
[data-eidos-workbench-splitter]:hover::after,
[data-eidos-workbench-splitter]:focus::after{
  left:1px;
  width:3px;
  background:#8aa7d8;
}
[data-side-panel-visible="false"] [data-eidos-workbench-splitter]{display:none}

/* Main workspace */
[data-eidos-workspace]{
  grid-column:4;
  grid-row:1;
  min-width:0;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:#fff;
}
[data-side-panel-visible="false"] [data-eidos-workspace]{grid-column:2/5}
[data-eidos-browser-toolbar]{
  flex:0 0 auto;
  display:grid;
  grid-template-columns:minmax(120px,1fr) auto auto;
  gap:6px;
  padding:7px 8px;
  border-bottom:1px solid #e5e7eb;
  background:#fafbfc;
}
[data-eidos-browser-toolbar] input{
  min-width:0;
  border:1px solid #d8dbe1;
  border-radius:7px;
  padding:7px 9px;
  background:#fff;
  outline:none;
}
[data-eidos-browser-toolbar] input:focus{border-color:#9aaad0;box-shadow:0 0 0 2px #eef2fb}
[data-eidos-browser-toolbar] button{
  border:1px solid #d8dbe1;
  border-radius:7px;
  background:#fff;
  padding:7px 10px;
}
[data-eidos-workspace-content]{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  padding:14px;
  background:#f6f7f9;
}
[data-eidos-browser-frame]{
  display:block;
  width:100%;
  height:100%;
  min-height:calc(100dvh - 76px);
  border:0;
  border-radius:8px;
  background:#fff;
}

/* Status bar */
[data-eidos-status-bar]{
  grid-column:1/5;
  grid-row:2;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  min-width:0;
  padding:0 8px;
  background:#f0f1f3;
  border-top:1px solid #dfe1e5;
  color:#555961;
  font-size:11px;
  overflow:hidden;
}
[data-eidos-status-bar] span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Chat side view */
[data-eidos-side-panel] [data-eidos-chat]{
  height:100%;
  display:flex;
  flex-direction:column;
  min-height:0;
  background:#fff;
}
[data-eidos-chat-header]{
  flex:0 0 auto;
  min-height:48px;
  display:flex;
  align-items:center;
  border-bottom:1px solid #eceef1;
  padding:0 12px;
}
[data-eidos-chat-header] h1{margin:0;font-size:14px;font-weight:650}
[data-eidos-chat-transcript]{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  padding:14px 12px 80px;
}
[data-eidos-chat-empty]{
  margin:18vh auto 0;
  max-width:320px;
  text-align:center;
  color:#74777f;
  font-size:13px;
  line-height:1.55;
}
[data-eidos-chat-message]{
  margin:0 0 14px;
  font-size:13px;
  line-height:1.55;
  white-space:pre-wrap;
  word-break:break-word;
}
[data-eidos-chat-message][data-role="user"]{
  margin-left:22px;
  padding:8px 10px;
  border-radius:12px;
  background:#eceef1;
}
[data-eidos-chat-message][data-role="error"]{color:#9b2c2c}
[data-eidos-chat-message-role]{display:none}
[data-eidos-chat-composer]{
  flex:0 0 auto;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:6px;
  padding:8px;
  border-top:1px solid #eceef1;
  background:#fff;
}
[data-eidos-chat-composer] textarea{
  min-width:0;
  resize:none;
  border:1px solid #d5d8de;
  border-radius:11px;
  padding:9px 10px;
  min-height:42px;
  max-height:140px;
  outline:none;
}
[data-eidos-chat-composer] button{
  align-self:end;
  min-height:38px;
  border:0;
  border-radius:9px;
  padding:0 11px;
  background:#222326;
  color:#fff;
}

/* Eidos workspace cards/forms */
form[data-eidos-id],
[data-eidos-capability="catalog-browser"],
[data-eidos-settings-editor]{
  width:min(1100px,100%);
  margin:0 auto;
  background:#fff;
  border:1px solid #dfe2e7;
  border-radius:10px;
  padding:18px;
}
form[data-eidos-id] h1,
[data-eidos-capability="catalog-browser"]>header h1,
[data-eidos-settings-editor]>header h1{margin:0 0 8px;font-size:20px}
form[data-eidos-id] label,
[data-eidos-setting]{
  display:block;
  margin:14px 0;
  font-size:13px;
  font-weight:600;
}
form[data-eidos-id] input,
form[data-eidos-id] select,
[data-eidos-setting] input,
[data-eidos-setting] select{
  display:block;
  width:100%;
  margin-top:6px;
  border:1px solid #c8cdd5;
  border-radius:7px;
  padding:8px 9px;
}
[data-eidos-setting-description]{
  display:block;
  margin-top:4px;
  color:#70757d;
  font-weight:400;
  line-height:1.4;
}
[data-eidos-settings-form]>button,
form[data-eidos-id] button,
[data-eidos-catalog-item] button{
  border:1px solid #b9bec7;
  border-radius:7px;
  background:#fff;
  padding:8px 11px;
}
[data-eidos-settings-form]>button{background:#202124;color:#fff;border-color:#202124}
[data-eidos-catalog-items]{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
  margin-top:14px;
}
[data-eidos-catalog-item]{
  border:1px solid #d9dde4;
  border-radius:9px;
  padding:14px;
  display:flex;
  flex-direction:column;
  gap:9px;
}
[data-eidos-catalog-item] header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
[data-eidos-catalog-item] h2{font-size:17px;margin:0}
[data-eidos-catalog-status]{font-size:11px;padding:3px 7px;border:1px solid #cbd0d8;border-radius:999px;white-space:nowrap}
[data-eidos-catalog-status][data-tone="positive"]{color:#0a7137;border-color:#9ac9aa;background:#f0fbf4}
[data-eidos-catalog-item] footer{margin-top:auto;display:flex;flex-wrap:wrap;gap:6px}
[data-eidos-catalog-item] button[data-eidos-primary="true"]{background:#202124;color:#fff;border-color:#202124}
/* Extension Manager */
[data-eidos-capability="extension-manager"]{
  width:min(1180px,100%);
  margin:0 auto;
}
[data-eidos-extension-manager-header]{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:24px;
  align-items:start;
  padding:4px 2px 18px;
}
[data-eidos-extension-manager-header] h1{margin:0 0 7px;font-size:24px;letter-spacing:-.02em}
[data-eidos-extension-manager-header] p{margin:0;max-width:760px;color:#686c74;font-size:13px;line-height:1.55}
[data-eidos-extension-host-card]{
  min-width:220px;
  display:grid;
  gap:5px;
  border:1px solid #dfe2e7;
  border-radius:10px;
  background:#fff;
  padding:11px 13px;
  font-size:11px;
  color:#656a73;
}
[data-eidos-extension-host-name]{font-size:13px;font-weight:700;color:#24262a}
[data-eidos-extension-protocol]{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
[data-eidos-extension-protocol-status]{
  justify-self:start;
  padding:2px 7px;
  border-radius:999px;
  background:#f1f3f5;
  text-transform:uppercase;
  letter-spacing:.05em;
  font-size:9px;
}
[data-eidos-extension-items]{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}
[data-eidos-extension-item]{
  display:flex;
  flex-direction:column;
  gap:10px;
  min-width:0;
  border:1px solid #dde1e7;
  border-radius:11px;
  background:#fff;
  padding:15px;
  box-shadow:0 1px 2px rgba(20,24,32,.03);
}
[data-eidos-extension-item] header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}
[data-eidos-extension-item] h2{margin:0 0 4px;font-size:16px;letter-spacing:-.01em}
[data-eidos-extension-identity]>div{display:flex;gap:8px;color:#767b84;font-size:11px}
[data-eidos-extension-publisher]::before{content:"·";margin-right:8px}
[data-eidos-extension-status]{
  flex:0 0 auto;
  border:1px solid #cfd4dc;
  border-radius:999px;
  padding:3px 8px;
  font-size:10px;
  white-space:nowrap;
}
[data-eidos-extension-status][data-tone="positive"]{color:#0b6d39;border-color:#a3d2b4;background:#f1fbf5}
[data-eidos-extension-status][data-tone="danger"]{color:#a12626;border-color:#e2b2b2;background:#fff5f5}
[data-eidos-extension-category]{font-size:10px;font-weight:700;letter-spacing:.05em;color:#777c84}
[data-eidos-extension-description]{margin:0;color:#5f646c;font-size:12px;line-height:1.5}
[data-eidos-extension-compatibility]{
  display:flex;
  flex-wrap:wrap;
  gap:6px 10px;
  padding:8px 10px;
  border-radius:8px;
  background:#f7f8fa;
  color:#61666f;
  font-size:10px;
}
[data-eidos-extension-compatibility][data-state="compatible"]{background:#f5faf7}
[data-eidos-extension-section]{display:grid;gap:6px}
[data-eidos-extension-section-title]{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7a7f87}
[data-eidos-extension-tags]{display:flex;flex-wrap:wrap;gap:5px}
[data-eidos-extension-contribution],
[data-eidos-extension-capability],
[data-eidos-extension-muted]{
  border:1px solid #d9dde4;
  border-radius:6px;
  padding:3px 6px;
  background:#fafbfc;
  font-size:10px;
  color:#555a63;
}
[data-eidos-extension-capability][data-direction="provides"]::before{content:"+ ";color:#197246}
[data-eidos-extension-capability][data-direction="requires"]::before{content:"→ ";color:#876800}
[data-eidos-extension-item] footer{margin-top:auto;display:flex;flex-wrap:wrap;gap:6px;padding-top:2px}
[data-eidos-extension-item] button{
  border:1px solid #bfc4cc;
  border-radius:7px;
  background:#fff;
  padding:7px 10px;
  font-size:12px;
}
[data-eidos-extension-item] button:hover{background:#f5f6f8}
[data-eidos-extension-item] button[data-eidos-primary="true"]{background:#202124;color:#fff;border-color:#202124}

[data-eidos-action-status]{
  display:block;
  white-space:pre-wrap;
  word-break:break-word;
  background:#202124;
  color:#f5f6f8;
  border-radius:8px;
  padding:10px;
  overflow:auto;
  max-height:260px;
}

/* Tablet */
@media(max-width:1024px) and (min-width:701px){
  [data-eidos-app-host-layout="workbench"]{--activity-width:46px}
  [data-eidos-catalog-items],
  [data-eidos-extension-items]{grid-template-columns:1fr}
  [data-eidos-browser-toolbar]{grid-template-columns:minmax(100px,1fr) auto}
  [data-eidos-browser-external]{display:none}
}

/* Mobile: persistent narrow Activity Bar + one work surface */
@media(max-width:700px){
  html,body,#app{height:100dvh}
  [data-eidos-app-host-layout="workbench"]{
    --activity-width:44px;
    display:grid;
    grid-template-columns:var(--activity-width) minmax(0,1fr);
    grid-template-rows:minmax(0,1fr) 22px;
  }
  [data-eidos-activity-bar]{grid-column:1;grid-row:1}
  [data-eidos-activity-bar] button{width:43px;height:44px}
  [data-eidos-side-panel],
  [data-eidos-workspace]{
    grid-column:2;
    grid-row:1;
    width:100%;
    height:100%;
    border:0;
  }
  [data-eidos-workbench-splitter]{display:none!important}
  [data-eidos-status-bar]{grid-column:1/3;grid-row:2}
  [data-mobile-surface="panel"] [data-eidos-side-panel]{display:flex}
  [data-mobile-surface="panel"] [data-eidos-workspace]{display:none}
  [data-mobile-surface="workspace"] [data-eidos-side-panel]{display:none}
  [data-mobile-surface="workspace"] [data-eidos-workspace]{display:flex}
  [data-side-panel-visible="false"] [data-eidos-side-panel]{display:none}
  [data-side-panel-visible="false"] [data-eidos-workspace]{display:flex}
  [data-eidos-browser-toolbar]{grid-template-columns:minmax(80px,1fr) auto;padding:6px}
  [data-eidos-browser-external]{display:none}
  [data-eidos-workspace-content]{padding:8px}
  [data-eidos-catalog-items],
  [data-eidos-extension-items]{grid-template-columns:1fr}
  [data-eidos-extension-manager-header]{grid-template-columns:1fr;gap:12px}
  [data-eidos-extension-host-card]{min-width:0}
  form[data-eidos-id],
  [data-eidos-capability="catalog-browser"],
  [data-eidos-settings-editor]{border-radius:7px;padding:13px}
}
</style>
</head>
<body>
<div id="app" aria-live="polite"></div>
<script type="module" src="/assets/manager/app-host-client.js"></script>
</body>
</html>`;
