import { eidosDesignTokenCss } from "./tokens.js";

export const eidosProductiveWorkbenchCss = `
${eidosDesignTokenCss}
*{box-sizing:border-box}
html,body,#app{margin:0;width:100%;height:100%;min-height:100%}
body{
  overflow:hidden;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:var(--eidos-font-body);
  color:var(--eidos-fg);
  background:var(--eidos-bg-subtle);
}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
[data-eidos-icon]{
  display:block;
  flex:none;
  color:currentColor;
}
[data-eidos-icon] [data-eidos-icon-accent]{
  color:var(--eidos-icon-accent);
}
[data-eidos-activity-icon]{
  width:24px;
  height:24px;
  display:grid;
  place-items:center;
  line-height:1;
}
[data-eidos-activity-icon] [data-eidos-icon]{
  width:22px;
  height:22px;
}
[data-eidos-icon-button]{
  display:grid!important;
  place-items:center;
  padding:0!important;
}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{
  outline:2px solid var(--eidos-focus);
  outline-offset:1px;
}

[data-eidos-app-host-layout="workbench"]{
  --eidos-side-panel-width:336px;
  --eidos-splitter-width:5px;
  display:grid;
  grid-template-columns:var(--eidos-activity-width) var(--eidos-side-panel-width) var(--eidos-splitter-width) minmax(0,1fr);
  grid-template-rows:minmax(0,1fr) var(--eidos-status-height);
  width:100%;
  height:100dvh;
  min-height:0;
  overflow:hidden;
  background:var(--eidos-bg);
}
[data-eidos-app-host-layout="workbench"][data-side-panel-visible="false"]{
  grid-template-columns:var(--eidos-activity-width) 0 0 minmax(0,1fr);
}

[data-eidos-activity-bar]{
  grid-column:1;
  grid-row:1;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  min-height:0;
  border-right:1px solid var(--eidos-border);
  background:var(--eidos-bg-chrome);
  overflow:hidden;
}
[data-eidos-activity-primary],[data-eidos-activity-secondary]{
  display:flex;
  flex-direction:column;
  align-items:center;
}
[data-eidos-activity-bar] button{
  width:var(--eidos-activity-width);
  height:var(--eidos-activity-width);
  border:0;
  border-left:2px solid transparent;
  padding:0;
  display:grid;
  place-items:center;
  background:transparent;
  color:var(--eidos-fg-muted);
}
[data-eidos-activity-bar] button:hover{background:var(--eidos-bg-hover);color:var(--eidos-fg)}
[data-eidos-activity-bar] button[data-active="true"]{
  color:var(--eidos-fg);
  border-left-color:var(--eidos-fg);
  background:var(--eidos-bg-hover);
}
[data-eidos-activity-icon]{font-size:20px;line-height:1}

[data-eidos-side-panel]{
  grid-column:2;
  grid-row:1;
  min-width:0;
  min-height:0;
  display:flex;
  flex-direction:column;
  border-right:1px solid var(--eidos-border);
  background:var(--eidos-bg-subtle);
  overflow:hidden;
}
[data-side-panel-visible="false"] [data-eidos-side-panel]{display:none}
[data-eidos-side-panel-header]{
  flex:0 0 var(--eidos-side-header-height);
  min-height:var(--eidos-side-header-height);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:var(--eidos-space-md);
  padding:0 var(--eidos-space-md) 0 var(--eidos-space-lg);
  border-bottom:1px solid var(--eidos-border);
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
  letter-spacing:.04em;
  text-transform:uppercase;
}
[data-eidos-side-panel-header] button{
  width:var(--eidos-control-compact);
  height:var(--eidos-control-compact);
  border:0;
  border-radius:var(--eidos-radius-sm);
  background:transparent;
  color:var(--eidos-fg-muted);
}
[data-eidos-side-panel-header] button:hover{background:var(--eidos-bg-hover);color:var(--eidos-fg)}
[data-eidos-side-panel-content]{flex:1 1 auto;min-height:0;overflow:auto}
[data-eidos-side-panel-footer]{
  flex:0 0 auto;
  border-top:1px solid var(--eidos-border);
  padding:var(--eidos-space-md) var(--eidos-space-lg);
}
[data-eidos-locale-control]{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:var(--eidos-space-md);
  align-items:center;
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
}
[data-eidos-locale-control] select{
  min-width:0;width:100%;height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-md);
  background:var(--eidos-bg);
}
[data-eidos-workbench-navigation]{padding:var(--eidos-space-md)}
[data-eidos-workbench-navigation] button{
  width:100%;
  min-height:var(--eidos-control-compact);
  display:block;
  border:0;
  border-radius:var(--eidos-radius-sm);
  padding:var(--eidos-space-sm) var(--eidos-space-md);
  margin:1px 0;
  text-align:left;
  background:transparent;
  color:var(--eidos-fg);
}
[data-eidos-workbench-navigation] button:hover{background:var(--eidos-bg-hover)}

[data-eidos-workbench-splitter]{
  grid-column:3;grid-row:1;cursor:col-resize;background:transparent;position:relative;z-index:2;
}
[data-eidos-workbench-splitter]::after{
  content:"";position:absolute;left:2px;top:0;bottom:0;width:1px;background:var(--eidos-border);
}
[data-eidos-workbench-splitter]:hover::after,[data-eidos-workbench-splitter]:focus::after{
  left:1px;width:3px;background:var(--eidos-focus);
}
[data-side-panel-visible="false"] [data-eidos-workbench-splitter]{display:none}

[data-eidos-workspace]{
  grid-column:4;grid-row:1;min-width:0;min-height:0;
  display:flex;flex-direction:column;overflow:hidden;background:var(--eidos-bg);
}
[data-side-panel-visible="false"] [data-eidos-workspace]{grid-column:2/5}
[data-eidos-browser-toolbar]{
  flex:0 0 auto;
  display:grid;
  grid-template-columns:minmax(140px,1fr) auto auto;
  gap:var(--eidos-space-sm);
  align-items:center;
  min-height:44px;
  padding:var(--eidos-space-sm) var(--eidos-space-md);
  border-bottom:1px solid var(--eidos-border);
  background:#fafbfc;
}
[data-eidos-browser-toolbar] input{
  min-width:0;height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-md);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
}
[data-eidos-browser-toolbar] button{
  min-height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-lg);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
}
[data-eidos-browser-toolbar] button:hover{background:var(--eidos-bg-hover)}
[data-eidos-workspace-content]{
  flex:1 1 auto;min-height:0;overflow:auto;
  padding:var(--eidos-space-lg);
  background:var(--eidos-bg-subtle);
}
[data-eidos-browser-frame]{
  display:block;width:100%;height:100%;
  min-height:calc(100dvh - 72px);
  border:0;border-radius:var(--eidos-radius-md);background:var(--eidos-bg);
}

[data-eidos-status-bar]{
  grid-column:1/5;grid-row:2;
  display:flex;align-items:center;justify-content:space-between;gap:var(--eidos-space-lg);
  min-width:0;padding:0 var(--eidos-space-md);
  background:#f0f1f3;border-top:1px solid var(--eidos-border);
  color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);overflow:hidden;
}
[data-eidos-status-bar] span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

[data-eidos-side-panel] [data-eidos-chat]{
  height:100%;display:flex;flex-direction:column;min-height:0;background:var(--eidos-bg);
}
[data-eidos-chat-header]{
  flex:0 0 auto;min-height:44px;display:flex;align-items:center;
  border-bottom:1px solid var(--eidos-border);padding:0 var(--eidos-space-lg);
}
[data-eidos-chat-header] h1{margin:0;font-size:var(--eidos-font-body);font-weight:650}
[data-eidos-chat-transcript]{
  flex:1 1 auto;min-height:0;overflow:auto;padding:var(--eidos-space-lg) var(--eidos-space-lg) 72px;
}
[data-eidos-chat-empty]{
  margin:18vh auto 0;max-width:320px;text-align:center;color:var(--eidos-fg-subtle);
  font-size:var(--eidos-font-compact);line-height:1.55;
}
[data-eidos-chat-message]{
  margin:0 0 var(--eidos-space-lg);font-size:var(--eidos-font-compact);line-height:1.55;
  white-space:pre-wrap;word-break:break-word;
}
[data-eidos-chat-message][data-role="user"]{
  margin-left:var(--eidos-space-xxl);padding:var(--eidos-space-md) var(--eidos-space-lg);
  border-radius:var(--eidos-radius-lg);background:var(--eidos-bg-hover);
}
[data-eidos-chat-message][data-role="error"]{color:var(--eidos-danger)}
[data-eidos-chat-message-role]{display:none}
[data-eidos-chat-composer]{
  flex:0 0 auto;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md);border-top:1px solid var(--eidos-border);background:var(--eidos-bg);
}
[data-eidos-chat-composer] textarea{
  min-width:0;resize:none;min-height:40px;max-height:140px;
  border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-lg);
  padding:var(--eidos-space-md) var(--eidos-space-lg);outline:none;
}
[data-eidos-chat-composer] button{
  align-self:end;min-height:var(--eidos-control-normal);
  border:0;border-radius:var(--eidos-radius-md);
  padding:0 var(--eidos-space-lg);background:var(--eidos-primary);color:var(--eidos-primary-fg);
}

form[data-eidos-id],
[data-eidos-capability="catalog-browser"],
[data-eidos-settings-editor]{
  width:min(1100px,100%);margin:0 auto;background:var(--eidos-bg);
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-lg);
  padding:var(--eidos-space-xl);
}
form[data-eidos-id] h1,
[data-eidos-capability="catalog-browser"]>header h1,
[data-eidos-settings-editor]>header h1{margin:0 0 var(--eidos-space-md);font-size:20px}
form[data-eidos-id] label,[data-eidos-setting]{
  display:block;margin:var(--eidos-space-lg) 0;font-size:var(--eidos-font-compact);font-weight:600;
}
form[data-eidos-id] input,form[data-eidos-id] select,
[data-eidos-setting] input,[data-eidos-setting] select{
  display:block;width:100%;height:var(--eidos-control-normal);margin-top:var(--eidos-space-sm);
  border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-md);background:var(--eidos-bg);
}
[data-eidos-setting-description]{
  display:block;margin-top:var(--eidos-space-xs);color:var(--eidos-fg-muted);font-weight:400;line-height:1.45;
}
[data-eidos-settings-form]>button,
form[data-eidos-id] button,
[data-eidos-catalog-item] button,
[data-eidos-extension-item] button{
  min-height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-sm);
  background:var(--eidos-bg);padding:0 var(--eidos-space-lg);color:var(--eidos-fg);
}
[data-eidos-settings-form]>button,
[data-eidos-catalog-item] button[data-eidos-primary="true"],
[data-eidos-extension-item] button[data-eidos-primary="true"]{
  background:var(--eidos-primary);color:var(--eidos-primary-fg);border-color:var(--eidos-primary);
}
[data-eidos-catalog-item] button:not([data-eidos-primary="true"]):hover,
[data-eidos-extension-item] button:not([data-eidos-primary="true"]):hover{background:var(--eidos-bg-hover)}

[data-eidos-catalog-items],[data-eidos-extension-items]{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--eidos-space-lg);margin-top:var(--eidos-space-lg);
}
[data-eidos-catalog-item],[data-eidos-extension-item]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-lg);display:flex;flex-direction:column;gap:var(--eidos-space-md);background:var(--eidos-bg);
}
[data-eidos-catalog-item] header,[data-eidos-extension-item] header{
  display:flex;justify-content:space-between;align-items:flex-start;gap:var(--eidos-space-lg);
}
[data-eidos-catalog-item] h2,[data-eidos-extension-item] h2{font-size:var(--eidos-font-section);margin:0}
[data-eidos-catalog-status],[data-eidos-extension-status]{
  font-size:var(--eidos-font-meta);padding:3px 7px;border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-pill);white-space:nowrap;
}
[data-eidos-catalog-status][data-tone="positive"],
[data-eidos-extension-status][data-tone="positive"]{
  color:var(--eidos-success);border-color:#a3d2b4;background:var(--eidos-success-bg);
}
[data-eidos-extension-status][data-tone="danger"]{
  color:var(--eidos-danger);border-color:#e2b2b2;background:var(--eidos-danger-bg);
}
[data-eidos-catalog-item] footer,[data-eidos-extension-item] footer{
  margin-top:auto;display:flex;justify-content:flex-end;flex-wrap:wrap;gap:var(--eidos-space-sm);
}

[data-eidos-capability="extension-manager"]{width:min(1180px,100%);margin:0 auto}
[data-eidos-extension-manager-header]{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--eidos-space-section);
  align-items:start;padding:var(--eidos-space-xs) 0 var(--eidos-space-xl);
}
[data-eidos-extension-manager-header] h1{margin:0 0 var(--eidos-space-sm);font-size:var(--eidos-font-page);letter-spacing:-.02em}
[data-eidos-extension-manager-header] p{
  margin:0;max-width:760px;color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact);line-height:1.55;
}
[data-eidos-extension-host-card]{
  min-width:220px;display:grid;gap:var(--eidos-space-xs);
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg);padding:var(--eidos-space-md) var(--eidos-space-lg);
  font-size:var(--eidos-font-meta);color:var(--eidos-fg-muted);
}
[data-eidos-extension-host-name]{font-size:var(--eidos-font-compact);font-weight:700;color:var(--eidos-fg)}
[data-eidos-extension-protocol]{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
[data-eidos-extension-protocol-status]{
  justify-self:start;padding:2px 7px;border-radius:var(--eidos-radius-pill);
  background:#f1f3f5;text-transform:uppercase;letter-spacing:.05em;font-size:9px;
}
[data-eidos-extension-identity]>div{display:flex;gap:var(--eidos-space-md);color:var(--eidos-fg-subtle);font-size:var(--eidos-font-meta)}
[data-eidos-extension-publisher]::before{content:"·";margin-right:var(--eidos-space-md)}
[data-eidos-extension-category]{font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--eidos-fg-subtle)}
[data-eidos-extension-description]{margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-supporting);line-height:1.5}
[data-eidos-extension-compatibility]{
  display:flex;flex-wrap:wrap;gap:var(--eidos-space-sm) var(--eidos-space-lg);
  padding:var(--eidos-space-md) var(--eidos-space-lg);border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg-subtle);color:var(--eidos-fg-muted);font-size:10px;
}
[data-eidos-extension-trust]{
  display:flex;flex-wrap:wrap;align-items:center;gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md) var(--eidos-space-lg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);font-size:10px;background:var(--eidos-bg-subtle);
}
[data-eidos-extension-trust][data-level="trusted"] strong{color:var(--eidos-success)}
[data-eidos-extension-trust][data-level="review"] strong{color:var(--eidos-warning)}
[data-eidos-extension-trust][data-level="blocked"] strong{color:var(--eidos-danger)}
[data-eidos-extension-integrity]{
  display:flex;flex-wrap:wrap;align-items:center;gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md) var(--eidos-space-lg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);font-size:10px;background:#fbfcfe;
}
[data-eidos-extension-integrity][data-state="verified"] strong{color:var(--eidos-success)}
[data-eidos-extension-integrity][data-state="pending"] strong,
[data-eidos-extension-integrity][data-state="unsigned"] strong{color:var(--eidos-warning)}
[data-eidos-extension-integrity][data-state="invalid"] strong,
[data-eidos-extension-integrity][data-state="untrusted"] strong{color:var(--eidos-danger)}
[data-eidos-extension-permission],
[data-eidos-extension-runtime-tag]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-sm);
  padding:3px 6px;background:#fafbfc;font-size:10px;color:#555a63;
}
[data-eidos-extension-permission][data-risk="high"]{border-color:#e2b2b2;background:var(--eidos-danger-bg);color:var(--eidos-danger)}
[data-eidos-extension-permission][data-risk="medium"]{border-color:#e3d5a5;background:#fffaf0;color:var(--eidos-warning)}
[data-eidos-extension-section]{display:grid;gap:var(--eidos-space-sm)}
[data-eidos-extension-section-title]{
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--eidos-fg-subtle);
}
[data-eidos-extension-tags]{display:flex;flex-wrap:wrap;gap:var(--eidos-space-xs)}
[data-eidos-extension-contribution],[data-eidos-extension-capability],[data-eidos-extension-muted]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-sm);
  padding:3px 6px;background:#fafbfc;font-size:10px;color:#555a63;
}
[data-eidos-extension-capability][data-direction="provides"]::before{content:"+ ";color:var(--eidos-success)}
[data-eidos-extension-capability][data-direction="requires"]::before{content:"→ ";color:var(--eidos-warning)}

[data-eidos-action-status]{
  display:block;white-space:pre-wrap;word-break:break-word;
  background:var(--eidos-primary);color:#f5f6f8;border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-lg);overflow:auto;max-height:260px;
}

@media(max-width:1024px) and (min-width:701px){
  [data-eidos-app-host-layout="workbench"]{--eidos-activity-width:46px}
  [data-eidos-catalog-items],[data-eidos-extension-items]{grid-template-columns:1fr}
  [data-eidos-browser-toolbar]{grid-template-columns:minmax(120px,1fr) auto}
  [data-eidos-browser-external]{display:none}
}
@media(max-width:700px){
  :root{--eidos-activity-width:44px}
  html,body,#app{height:100dvh}
  [data-eidos-app-host-layout="workbench"]{
    display:grid;grid-template-columns:var(--eidos-activity-width) minmax(0,1fr);
    grid-template-rows:minmax(0,1fr) var(--eidos-status-height);
  }
  [data-eidos-activity-bar]{grid-column:1;grid-row:1}
  [data-eidos-activity-bar] button{width:44px;height:44px}
  [data-eidos-side-panel],[data-eidos-workspace]{
    grid-column:2;grid-row:1;width:100%;height:100%;border:0;
  }
  [data-eidos-workbench-splitter]{display:none!important}
  [data-eidos-status-bar]{grid-column:1/3;grid-row:2}
  [data-mobile-surface="panel"] [data-eidos-side-panel]{display:flex}
  [data-mobile-surface="panel"] [data-eidos-workspace]{display:none}
  [data-mobile-surface="workspace"] [data-eidos-side-panel]{display:none}
  [data-mobile-surface="workspace"] [data-eidos-workspace]{display:flex}
  [data-side-panel-visible="false"] [data-eidos-side-panel]{display:none}
  [data-side-panel-visible="false"] [data-eidos-workspace]{display:flex}
  [data-eidos-browser-toolbar]{grid-template-columns:minmax(80px,1fr) auto;padding:var(--eidos-space-sm)}
  [data-eidos-browser-toolbar] button{min-width:44px;min-height:44px}
  [data-eidos-browser-external]{display:none}
  [data-eidos-workspace-content]{padding:var(--eidos-space-md)}
  [data-eidos-catalog-items],[data-eidos-extension-items]{grid-template-columns:1fr}
  [data-eidos-extension-manager-header]{grid-template-columns:1fr;gap:var(--eidos-space-lg)}
  [data-eidos-extension-host-card]{min-width:0}
  form[data-eidos-id],[data-eidos-capability="catalog-browser"],[data-eidos-settings-editor]{
    border-radius:var(--eidos-radius-md);padding:var(--eidos-space-lg);
  }
  [data-eidos-catalog-item] footer,[data-eidos-extension-item] footer{
    justify-content:stretch;
  }
  [data-eidos-catalog-item] footer button,[data-eidos-extension-item] footer button{
    min-height:44px;
  }
}
`;
