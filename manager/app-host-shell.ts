export const appHostShellHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>EVO</title>
<style>
:root{
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:#202123;
  background:#f7f7f8;
}
*{box-sizing:border-box}
html,body,#app{margin:0;width:100%;height:100%;min-height:100%;overflow:hidden}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
[data-eidos-app-host]{background:#f7f7f8;color:#202123}

/* Agent workspace */
[data-eidos-app-host-layout="agent-workspace"]{
  display:grid;
  grid-template-columns:220px minmax(340px,.86fr) minmax(420px,1.34fr);
  height:100dvh;
  min-height:0;
  overflow:hidden;
}
[data-eidos-workspace-pane]{min-width:0;min-height:0}
[data-eidos-workspace-pane="menu"]{
  background:#f3f4f6;
  border-right:1px solid #e2e4e8;
  padding:14px 12px;
  overflow:auto;
}
[data-eidos-app-host-title]{
  margin:2px 8px 18px;
  font-size:18px;
  font-weight:650;
  letter-spacing:-.01em;
}
[data-eidos-locale-control]{
  display:block;
  margin:0 8px 16px;
  font-size:12px;
  color:#666;
}
[data-eidos-locale-control] span{display:block;margin-bottom:5px}
[data-eidos-locale-control] select{
  width:100%;
  border:1px solid #d8dadd;
  border-radius:9px;
  background:#fff;
  padding:7px 9px;
}
[data-eidos-app-navigation] button{
  width:100%;
  display:block;
  border:0;
  background:transparent;
  border-radius:9px;
  padding:9px 10px;
  margin:2px 0;
  text-align:left;
  color:#343541;
}
[data-eidos-app-navigation] button:hover{background:#e7e8eb}
[data-eidos-app-navigation] button[data-assistant-route="true"]{
  font-weight:600;
}

[data-eidos-workspace-pane="chat"]{
  display:flex;
  flex-direction:column;
  background:#fff;
  border-right:1px solid #e2e4e8;
  overflow:hidden;
}
[data-eidos-assistant-content]{height:100%;min-height:0}
[data-eidos-chat]{
  height:100%;
  display:flex;
  flex-direction:column;
  min-height:0;
  background:#fff;
}
[data-eidos-chat-header]{
  flex:0 0 auto;
  min-height:58px;
  display:flex;
  align-items:center;
  border-bottom:1px solid #ececef;
  padding:0 18px;
}
[data-eidos-chat-header] h1{
  margin:0;
  font-size:15px;
  font-weight:650;
}
[data-eidos-chat-transcript]{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  padding:22px 18px 120px;
}
[data-eidos-chat-empty]{
  max-width:620px;
  margin:18vh auto 0;
  color:#6b6d76;
  text-align:center;
  line-height:1.55;
  padding:0 18px;
}
[data-eidos-chat-message]{
  max-width:720px;
  margin:0 auto 18px;
  line-height:1.55;
  white-space:pre-wrap;
  word-break:break-word;
}
[data-eidos-chat-message][data-role="user"]{
  width:max-content;
  max-width:min(82%,720px);
  margin-left:auto;
  margin-right:0;
  padding:10px 14px;
  border-radius:18px;
  background:#f1f1f3;
}
[data-eidos-chat-message][data-role="assistant"]{
  margin-left:auto;
  margin-right:auto;
}
[data-eidos-chat-message][data-role="error"]{
  margin-left:auto;
  margin-right:auto;
  color:#9b2c2c;
  background:#fff3f3;
  border:1px solid #ffd4d4;
  padding:10px 12px;
  border-radius:10px;
}
[data-eidos-chat-message-role]{display:none}
[data-eidos-chat-composer]{
  flex:0 0 auto;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  padding:12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid #ececef;
  background:rgba(255,255,255,.96);
}
[data-eidos-chat-composer] textarea{
  width:100%;
  resize:none;
  min-height:48px;
  max-height:160px;
  border:1px solid #d7d9dd;
  border-radius:16px;
  padding:12px 14px;
  outline:none;
  line-height:1.45;
}
[data-eidos-chat-composer] textarea:focus{border-color:#9ea2aa;box-shadow:0 0 0 3px #f0f1f3}
[data-eidos-chat-composer] button{
  align-self:end;
  min-height:44px;
  border:0;
  border-radius:14px;
  padding:0 15px;
  background:#202123;
  color:#fff;
}
[data-eidos-assistant-unavailable]{
  margin:28px;
  padding:18px;
  border:1px dashed #cfd2d8;
  border-radius:12px;
  color:#666;
  background:#fafafa;
}

[data-eidos-workspace-pane="workspace"]{
  display:flex;
  flex-direction:column;
  background:#fff;
  overflow:hidden;
}
[data-eidos-browser-toolbar]{
  flex:0 0 auto;
  display:grid;
  grid-template-columns:minmax(120px,1fr) auto auto;
  gap:7px;
  padding:9px 10px;
  border-bottom:1px solid #e2e4e8;
  background:#fafafa;
}
[data-eidos-browser-toolbar] input{
  min-width:0;
  border:1px solid #d5d8dd;
  border-radius:9px;
  padding:8px 10px;
  background:#fff;
  outline:none;
}
[data-eidos-browser-toolbar] button{
  border:1px solid #d5d8dd;
  border-radius:9px;
  padding:8px 10px;
  background:#fff;
}
[data-eidos-browser-status]{
  flex:0 0 auto;
  min-height:0;
  padding:0 12px;
  font-size:11px;
  color:#777;
}
[data-eidos-browser-content]{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  padding:16px;
  background:#f7f7f8;
}
[data-eidos-browser-frame]{
  display:block;
  width:100%;
  height:100%;
  min-height:calc(100dvh - 72px);
  border:0;
  border-radius:10px;
  background:#fff;
}

[data-eidos-mobile-tabs]{display:none}

/* Eidos app surfaces inside workspace */
form[data-eidos-id],
[data-eidos-capability="catalog-browser"]{
  width:100%;
  background:#fff;
  border:1px solid #dfe1e5;
  border-radius:14px;
  padding:18px;
}
form[data-eidos-id] h1,
[data-eidos-capability="catalog-browser"]>header h1{
  margin:0 0 8px;
  font-size:21px;
}
form[data-eidos-id] label{display:block;font-weight:600;font-size:13px;margin:12px 0}
form[data-eidos-id] input,
form[data-eidos-id] select{
  display:block;
  width:100%;
  padding:9px;
  margin-top:5px;
  border:1px solid #b7bdc7;
  border-radius:8px;
}
form[data-eidos-id] button,
[data-eidos-catalog-item] button{
  padding:9px 12px;
  border:1px solid #aeb4be;
  border-radius:8px;
  background:#fff;
}
[data-eidos-catalog-items]{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
  margin-top:16px;
}
[data-eidos-catalog-item]{
  border:1px solid #d9dde4;
  border-radius:12px;
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:10px;
}
[data-eidos-catalog-item] header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
[data-eidos-catalog-item] h2{font-size:18px;margin:0}
[data-eidos-catalog-version],
[data-eidos-catalog-category],
[data-eidos-catalog-meta]{font-size:12px;color:#666d78;margin-right:8px}
[data-eidos-catalog-status]{
  font-size:12px;
  padding:4px 8px;
  border:1px solid #cbd0d8;
  border-radius:999px;
  white-space:nowrap;
}
[data-eidos-catalog-status][data-tone="positive"]{color:#0a7137;border-color:#9ac9aa;background:#f0fbf4}
[data-eidos-catalog-badge]{display:inline-block;font-size:11px;background:#eef0f3;border-radius:999px;padding:3px 7px;margin:0 5px 4px 0}
[data-eidos-catalog-item] footer{margin-top:auto}
[data-eidos-catalog-item] button[data-eidos-primary="true"]{background:#202123;color:#fff;border-color:#202123}
[data-eidos-action-status]{
  display:block;
  white-space:pre-wrap;
  word-break:break-word;
  background:#202123;
  color:#f5f6f8;
  border-radius:10px;
  padding:12px;
  overflow:auto;
  max-height:320px;
}

/* Standard shell remains supported */
[data-eidos-app-host-layout="standard"] aside{background:#fff;min-height:100vh}
[data-eidos-app-host-layout="standard"] nav button{
  border:0;background:transparent;border-radius:8px;padding:9px 10px;cursor:pointer
}

/* Tablet */
@media(max-width:1180px) and (min-width:761px){
  [data-eidos-app-host-layout="agent-workspace"]{
    grid-template-columns:190px minmax(320px,.9fr) minmax(360px,1.1fr);
  }
  [data-eidos-catalog-items]{grid-template-columns:1fr}
  [data-eidos-browser-toolbar]{grid-template-columns:minmax(100px,1fr) auto}
  [data-eidos-browser-external]{display:none}
}

/* Mobile: one pane at a time */
@media(max-width:760px){
  html,body,#app{height:100dvh}
  [data-eidos-app-host-layout="agent-workspace"]{
    display:block;
    height:100dvh;
    padding-bottom:calc(58px + env(safe-area-inset-bottom));
    background:#fff;
  }
  [data-eidos-app-host-layout="agent-workspace"] [data-eidos-workspace-pane]{
    display:none;
    height:calc(100dvh - 58px - env(safe-area-inset-bottom));
    border:0;
  }
  [data-eidos-app-host-layout="agent-workspace"][data-eidos-mobile-pane="menu"] [data-eidos-workspace-pane="menu"]{
    display:block;
  }
  [data-eidos-app-host-layout="agent-workspace"][data-eidos-mobile-pane="chat"] [data-eidos-workspace-pane="chat"]{
    display:flex;
  }
  [data-eidos-app-host-layout="agent-workspace"][data-eidos-mobile-pane="workspace"] [data-eidos-workspace-pane="workspace"]{
    display:flex;
  }
  [data-eidos-workspace-pane="menu"]{padding:16px 14px;overflow:auto}
  [data-eidos-chat-header]{min-height:50px;padding:0 14px}
  [data-eidos-chat-transcript]{padding:16px 12px 90px}
  [data-eidos-chat-composer]{padding:9px 10px}
  [data-eidos-chat-composer] textarea{min-height:44px}
  [data-eidos-browser-toolbar]{
    grid-template-columns:minmax(80px,1fr) auto;
    padding:7px;
  }
  [data-eidos-browser-external]{display:none}
  [data-eidos-browser-content]{padding:10px}
  [data-eidos-catalog-items]{grid-template-columns:1fr}
  [data-eidos-mobile-tabs]{
    position:fixed;
    left:0;
    right:0;
    bottom:0;
    z-index:100;
    height:calc(58px + env(safe-area-inset-bottom));
    padding:6px 8px env(safe-area-inset-bottom);
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:6px;
    border-top:1px solid #e1e3e7;
    background:rgba(255,255,255,.97);
    backdrop-filter:blur(14px);
  }
  [data-eidos-mobile-tabs] button{
    border:0;
    border-radius:10px;
    background:transparent;
    color:#555;
    font-size:12px;
  }
  [data-eidos-app-host-layout="agent-workspace"][data-eidos-mobile-pane="menu"] [data-eidos-mobile-pane-target="menu"],
  [data-eidos-app-host-layout="agent-workspace"][data-eidos-mobile-pane="chat"] [data-eidos-mobile-pane-target="chat"],
  [data-eidos-app-host-layout="agent-workspace"][data-eidos-mobile-pane="workspace"] [data-eidos-mobile-pane-target="workspace"]{
    background:#eceef1;
    color:#202123;
    font-weight:650;
  }
}
</style>
</head>
<body>
<div id="app" aria-live="polite"></div>
<script type="module" src="/assets/manager/app-host-client.js"></script>
</body>
</html>`;
