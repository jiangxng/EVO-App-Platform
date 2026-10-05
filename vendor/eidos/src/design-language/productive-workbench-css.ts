import { eidosDesignTokenCss } from "./tokens.js";

export const eidosProductiveWorkbenchCss = `
${eidosDesignTokenCss}
*{box-sizing:border-box}
html{font-size:100%;-webkit-text-size-adjust:auto;text-size-adjust:auto}\nhtml,body,#app{margin:0;width:100%;height:100%;min-height:100%}
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
[data-eidos-activity-icon]{font-size:1.25rem;line-height:1}

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
[data-eidos-side-panel-footer]:empty{display:none}
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
  grid-template-columns:minmax(140px,1fr) auto auto auto;
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
[data-eidos-global-controls]{
  min-width:0;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:var(--eidos-space-sm);
  padding-left:var(--eidos-space-sm);
  border-left:1px solid var(--eidos-border);
}

[data-eidos-global-control]{
  display:flex;
  align-items:center;
  gap:var(--eidos-space-xs);
  min-width:0;
}
[data-eidos-global-control-label]{
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0,0,0,0);
  white-space:nowrap;
  border:0;
}
[data-eidos-global-control-select]{
  width:auto;
  min-width:150px;
  max-width:240px;
  height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-md);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
}
[data-eidos-account-control]{position:relative}
[data-eidos-account-control]>summary{
  list-style:none;
  display:flex;
  align-items:center;
  gap:var(--eidos-space-xs);
  min-height:var(--eidos-control-compact);
  padding:0 var(--eidos-space-sm);
  border-radius:var(--eidos-radius-pill);
  cursor:pointer;
  white-space:nowrap;
}
[data-eidos-account-control]>summary::-webkit-details-marker{display:none}
[data-eidos-account-control]>summary:hover{background:var(--eidos-bg-hover)}
[data-eidos-account-avatar]{
  width:24px;
  height:24px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:var(--eidos-fg);
  color:var(--eidos-bg);
  font-size:.625rem;
  font-weight:700;
}
[data-eidos-account-menu]{
  position:absolute;
  right:0;
  top:calc(100% + var(--eidos-space-sm));
  z-index:30;
  width:min(320px,80vw);
  display:grid;
  gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg);
  box-shadow:0 12px 32px color-mix(in srgb,var(--eidos-fg) 14%,transparent);
}
[data-eidos-account-row]{display:grid;gap:2px;min-width:0}
[data-eidos-account-row]>span{
  font-size:var(--eidos-font-meta);
  color:var(--eidos-fg-muted);
}
[data-eidos-account-row]>strong{
  overflow-wrap:anywhere;
  font-size:var(--eidos-font-compact);
  font-weight:600;
}
[data-eidos-global-controls] [data-eidos-locale-control]{
  display:flex;
  align-items:center;
  gap:var(--eidos-space-xs);
}
[data-eidos-global-controls] [data-eidos-locale-control]>span{
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0,0,0,0);
  white-space:nowrap;
  border:0;
}
[data-eidos-global-controls] [data-eidos-locale-control] select{
  width:auto;
  min-width:84px;
  max-width:132px;
}
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
[data-eidos-settings-editor]>header h1{margin:0 0 var(--eidos-space-md);font-size:1.25rem}
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
[data-eidos-catalog-item] [data-eidos-catalog-download],
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

[data-eidos-catalog-search]{margin-top:var(--eidos-space-lg)}
[data-eidos-catalog-search] input{
  width:100%;height:var(--eidos-control-normal);border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);padding:0 var(--eidos-space-md);background:var(--eidos-bg);color:var(--eidos-fg);
}
[data-eidos-catalog-search-empty]{margin:var(--eidos-space-lg) 0 0;color:var(--eidos-fg-muted)}

[data-eidos-catalog-items],[data-eidos-extension-items]{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--eidos-space-lg);margin-top:var(--eidos-space-lg);
}
[data-eidos-catalog-item],[data-eidos-extension-item]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-lg);display:flex;flex-direction:column;gap:var(--eidos-space-md);background:var(--eidos-bg);
}
[data-eidos-catalog-thumbnail]{
  aspect-ratio:16/9;overflow:hidden;border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-sm);background:var(--eidos-bg-subtle);
}
[data-eidos-catalog-thumbnail] img{display:block;width:100%;height:100%;object-fit:cover}
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
  margin-top:auto;display:flex;justify-content:flex-end;align-items:flex-end;flex-wrap:wrap;gap:var(--eidos-space-sm);
}
[data-eidos-catalog-item] [data-eidos-action-wrap]{
  display:grid;gap:var(--eidos-space-xs);justify-items:end;
}
[data-eidos-catalog-item] [data-eidos-action-help]{
  max-width:260px;color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);
  line-height:1.35;text-align:right;
}
[data-eidos-catalog-item] button:disabled{
  cursor:not-allowed;opacity:.5;
}

[data-eidos-capability="catalog-detail"]{
  width:min(1180px,100%);margin:0 auto;display:grid;
  grid-template-columns:minmax(0,1.45fr) minmax(280px,.85fr);
  gap:var(--eidos-space-xl);align-items:start;
}
[data-eidos-catalog-detail-gallery]{min-width:0;display:grid;gap:var(--eidos-space-md)}
[data-eidos-catalog-detail-media]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg-subtle);overflow:hidden;color:inherit;
}
[data-eidos-catalog-detail-media="primary"]{
  width:100%;aspect-ratio:16/9;padding:0;display:block;
}
[data-eidos-catalog-detail-media="primary"] img{
  display:block;width:100%;height:100%;object-fit:cover;
}
button[data-eidos-catalog-detail-media]{cursor:pointer}
button[data-eidos-catalog-detail-media]:hover{background:var(--eidos-bg-hover)}
[data-eidos-catalog-detail-thumbnails]{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--eidos-space-sm);
}
[data-eidos-catalog-detail-media="thumbnail"]{
  min-width:0;padding:0;display:grid;grid-template-rows:auto auto;text-align:left;
}
[data-eidos-catalog-detail-media="thumbnail"] img{
  display:block;width:100%;aspect-ratio:16/9;object-fit:cover;
}
[data-eidos-catalog-detail-media-label]{
  padding:var(--eidos-space-xs) var(--eidos-space-sm);
  font-size:var(--eidos-font-meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
[data-eidos-catalog-detail-info]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg);padding:var(--eidos-space-lg);display:grid;gap:var(--eidos-space-md);
}
[data-eidos-catalog-detail-info] h1{margin:0;font-size:var(--eidos-font-page)}
[data-eidos-catalog-detail-info] p{margin:0;color:var(--eidos-fg-muted);line-height:1.55}
[data-eidos-catalog-detail-info] footer{
  display:flex;justify-content:flex-end;align-items:flex-end;flex-wrap:wrap;gap:var(--eidos-space-sm);
}
[data-eidos-capability="catalog-detail"] [data-eidos-action-wrap]{
  display:grid;gap:var(--eidos-space-xs);justify-items:end;
}
[data-eidos-capability="catalog-detail"] button,
[data-eidos-capability="catalog-detail"] [data-eidos-catalog-download]{
  min-height:var(--eidos-control-compact);border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);background:var(--eidos-bg);color:var(--eidos-fg);
}
[data-eidos-catalog-download]{
  display:inline-flex;align-items:center;justify-content:center;
  padding:0 var(--eidos-space-lg);text-decoration:none;
}
[data-eidos-capability="catalog-detail"] button[data-eidos-primary="true"],
[data-eidos-capability="catalog-detail"] [data-eidos-catalog-download][data-eidos-primary="true"]{
  background:var(--eidos-primary);color:var(--eidos-primary-fg);border-color:var(--eidos-primary);
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
  background:#f1f3f5;text-transform:uppercase;letter-spacing:.05em;font-size:.5625rem;
}
[data-eidos-extension-identity]>div{display:flex;gap:var(--eidos-space-md);color:var(--eidos-fg-subtle);font-size:var(--eidos-font-meta)}
[data-eidos-extension-publisher]::before{content:"·";margin-right:var(--eidos-space-md)}
[data-eidos-extension-category]{font-size:.625rem;font-weight:700;letter-spacing:.05em;color:var(--eidos-fg-subtle)}
[data-eidos-extension-description]{margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-supporting);line-height:1.5}
[data-eidos-extension-compatibility]{
  display:flex;flex-wrap:wrap;gap:var(--eidos-space-sm) var(--eidos-space-lg);
  padding:var(--eidos-space-md) var(--eidos-space-lg);border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg-subtle);color:var(--eidos-fg-muted);font-size:.625rem;
}
[data-eidos-extension-trust]{
  display:flex;flex-wrap:wrap;align-items:center;gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md) var(--eidos-space-lg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);font-size:.625rem;background:var(--eidos-bg-subtle);
}
[data-eidos-extension-trust][data-level="trusted"] strong{color:var(--eidos-success)}
[data-eidos-extension-trust][data-level="review"] strong{color:var(--eidos-warning)}
[data-eidos-extension-trust][data-level="blocked"] strong{color:var(--eidos-danger)}
[data-eidos-extension-integrity]{
  display:flex;flex-wrap:wrap;align-items:center;gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md) var(--eidos-space-lg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);font-size:.625rem;background:#fbfcfe;
}
[data-eidos-extension-integrity][data-state="verified"] strong{color:var(--eidos-success)}
[data-eidos-extension-integrity][data-state="pending"] strong,
[data-eidos-extension-integrity][data-state="unsigned"] strong{color:var(--eidos-warning)}
[data-eidos-extension-integrity][data-state="invalid"] strong,
[data-eidos-extension-integrity][data-state="untrusted"] strong{color:var(--eidos-danger)}
[data-eidos-extension-permission],
[data-eidos-extension-runtime-tag]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-sm);
  padding:3px 6px;background:#fafbfc;font-size:.625rem;color:#555a63;
}
[data-eidos-extension-permission][data-risk="high"]{border-color:#e2b2b2;background:var(--eidos-danger-bg);color:var(--eidos-danger)}
[data-eidos-extension-permission][data-risk="medium"]{border-color:#e3d5a5;background:#fffaf0;color:var(--eidos-warning)}
[data-eidos-extension-section]{display:grid;gap:var(--eidos-space-sm)}
[data-eidos-extension-section-title]{
  font-size:.625rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--eidos-fg-subtle);
}
[data-eidos-extension-tags]{display:flex;flex-wrap:wrap;gap:var(--eidos-space-xs)}
[data-eidos-extension-contribution],[data-eidos-extension-capability],[data-eidos-extension-muted]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-sm);
  padding:3px 6px;background:#fafbfc;font-size:.625rem;color:#555a63;
}
[data-eidos-extension-capability][data-direction="provides"]::before{content:"+ ";color:var(--eidos-success)}
[data-eidos-extension-capability][data-direction="requires"]::before{content:"→ ";color:var(--eidos-warning)}
[data-eidos-extension-runtime-history]{
  margin-top:var(--eidos-space-xs);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-sm);background:var(--eidos-bg-subtle);overflow:hidden;
}
[data-eidos-extension-runtime-history] summary{
  cursor:pointer;padding:var(--eidos-space-sm) var(--eidos-space-md);
  font-size:.625rem;font-weight:700;color:var(--eidos-fg-muted);
}
[data-eidos-extension-runtime-history]>div{border-top:1px solid var(--eidos-border)}
[data-eidos-extension-runtime-event]{
  display:grid;grid-template-columns:auto auto auto auto minmax(0,1fr);
  gap:var(--eidos-space-sm);align-items:start;padding:6px var(--eidos-space-md);
  font-size:.625rem;color:var(--eidos-fg-muted);border-top:1px solid var(--eidos-border);
}
[data-eidos-extension-runtime-event]:first-child{border-top:0}
[data-eidos-extension-runtime-event] strong{color:var(--eidos-fg)}
[data-eidos-extension-runtime-event] span:last-child{overflow:hidden;text-overflow:ellipsis}

[data-eidos-action-status]{
  display:block;white-space:pre-wrap;word-break:break-word;
  background:var(--eidos-primary);color:#f5f6f8;border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-lg);overflow:auto;max-height:260px;
}


[data-eidos-help-document]{
  width:min(920px,100%);margin:0 auto;background:var(--eidos-bg);
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-lg);
  padding:clamp(var(--eidos-space-lg),4vw,var(--eidos-space-xxl));
}
[data-eidos-help-breadcrumbs]{
  display:flex;flex-wrap:wrap;align-items:center;gap:var(--eidos-space-xs);
  margin-bottom:var(--eidos-space-lg);font-size:var(--eidos-font-meta);color:var(--eidos-fg-muted);
}
[data-eidos-help-breadcrumbs] a,[data-eidos-help-related] a{color:var(--eidos-primary);text-decoration:none}
[data-eidos-help-breadcrumbs] a:hover,[data-eidos-help-related] a:hover{text-decoration:underline}
[data-eidos-help-header]{padding-bottom:var(--eidos-space-xl);border-bottom:1px solid var(--eidos-border)}
[data-eidos-help-header] h1{margin:0 0 var(--eidos-space-md);font-size:var(--eidos-font-page);letter-spacing:-.02em}
[data-eidos-help-summary]{margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-supporting);line-height:1.6}
[data-eidos-help-meta]{
  display:flex;flex-wrap:wrap;gap:var(--eidos-space-sm);margin-top:var(--eidos-space-lg);
  color:var(--eidos-fg-subtle);font-size:var(--eidos-font-meta);
}
[data-eidos-help-meta]>span{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-pill);
  padding:3px 8px;background:var(--eidos-bg-subtle);
}
[data-eidos-help-body]{padding:var(--eidos-space-lg) 0;line-height:1.7}
[data-eidos-help-body] h2{margin:var(--eidos-space-xxl) 0 var(--eidos-space-md);font-size:var(--eidos-font-section)}
[data-eidos-help-body] h3{margin:var(--eidos-space-xl) 0 var(--eidos-space-sm);font-size:var(--eidos-font-supporting)}
[data-eidos-help-body] p{margin:var(--eidos-space-md) 0}
[data-eidos-help-list],[data-eidos-help-steps]{padding-left:24px}
[data-eidos-help-list] li,[data-eidos-help-steps] li{margin:var(--eidos-space-sm) 0}
[data-eidos-help-code]{
  overflow:auto;padding:var(--eidos-space-lg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);background:var(--eidos-bg-subtle);
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--eidos-font-meta);line-height:1.55;
}
[data-eidos-help-callout]{
  margin:var(--eidos-space-lg) 0;padding:var(--eidos-space-lg);
  border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg-subtle);
}
[data-eidos-help-callout] strong{display:block;margin-bottom:var(--eidos-space-xs)}
[data-eidos-help-callout] p{margin:0}
[data-eidos-help-callout][data-tone="warning"]{border-left:3px solid var(--eidos-warning)}
[data-eidos-help-callout][data-tone="danger"]{border-left:3px solid var(--eidos-danger)}
[data-eidos-help-callout][data-tone="success"]{border-left:3px solid var(--eidos-success)}
[data-eidos-help-steps]{list-style:none;padding:0;counter-reset:none}
[data-eidos-help-steps] li{
  display:grid;grid-template-columns:28px minmax(0,1fr);gap:var(--eidos-space-md);align-items:start;
}
[data-eidos-help-step-number]{
  display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-pill);font-size:var(--eidos-font-meta);font-weight:700;
}
[data-eidos-help-steps] p{margin:var(--eidos-space-xs) 0 0;color:var(--eidos-fg-muted)}
[data-eidos-help-related]{border-top:1px solid var(--eidos-border);padding-top:var(--eidos-space-lg)}
[data-eidos-help-related] h2{font-size:var(--eidos-font-section);margin:0 0 var(--eidos-space-sm)}
[data-eidos-help-related] ul{margin:0;padding-left:20px}


[data-eidos-chat-header]{gap:var(--eidos-space-md);justify-content:space-between}
[data-eidos-chat-context]{
  min-width:0;display:flex;align-items:center;gap:var(--eidos-space-xs);
  color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);
}
[data-eidos-chat-context] strong{color:var(--eidos-fg);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-eidos-chat-readiness]{
  margin:var(--eidos-space-md);padding:var(--eidos-space-lg);
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);background:var(--eidos-bg-subtle);
  font-size:var(--eidos-font-compact);line-height:1.5;
}
[data-eidos-chat-readiness][data-state="setup-required"],
[data-eidos-chat-readiness][data-state="degraded"]{border-left:3px solid var(--eidos-warning)}
[data-eidos-chat-readiness][data-state="unavailable"]{border-left:3px solid var(--eidos-danger)}
[data-eidos-chat-readiness] p{margin:var(--eidos-space-xs) 0 0;color:var(--eidos-fg-muted)}
[data-eidos-chat-readiness-actions]{margin-top:var(--eidos-space-md)}
[data-eidos-chat-readiness-actions] button,
[data-eidos-chat-suggestions] button,
[data-eidos-chat-proposal-actions] button{
  min-height:var(--eidos-control-compact);border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);padding:0 var(--eidos-space-lg);
  background:var(--eidos-bg);color:var(--eidos-fg);
}
[data-eidos-chat-readiness-actions] button[data-eidos-primary="true"],
[data-eidos-chat-proposal-actions] button[data-eidos-primary="true"]{
  background:var(--eidos-primary);color:var(--eidos-primary-fg);border-color:var(--eidos-primary);
}
[data-eidos-chat-empty]{text-align:left}
[data-eidos-chat-empty]>strong{display:block;margin-bottom:var(--eidos-space-xs);color:var(--eidos-fg)}
[data-eidos-chat-empty]>p{margin:0;color:var(--eidos-fg-muted)}
[data-eidos-chat-suggestions]{display:grid;gap:var(--eidos-space-sm);margin-top:var(--eidos-space-lg)}
[data-eidos-chat-suggestions] button{text-align:left;white-space:normal;height:auto;min-height:var(--eidos-control-compact);padding-block:var(--eidos-space-sm)}
[data-eidos-chat-message-parts]{display:grid;gap:var(--eidos-space-sm)}
[data-eidos-chat-part="notice"],
[data-eidos-chat-part="evidence"],
[data-eidos-chat-part="proposal"]{
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-md) var(--eidos-space-lg);background:var(--eidos-bg-subtle);
}
[data-eidos-chat-part="notice"][data-tone="warning"]{border-left:3px solid var(--eidos-warning)}
[data-eidos-chat-part="notice"][data-tone="danger"]{border-left:3px solid var(--eidos-danger)}
[data-eidos-chat-part="notice"][data-tone="success"]{border-left:3px solid var(--eidos-success)}
[data-eidos-chat-part="notice"] p,[data-eidos-chat-part="proposal"] p{margin:var(--eidos-space-xs) 0 0}
[data-eidos-chat-part="activity"]{
  display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--eidos-space-sm);
  align-items:center;color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);
}
[data-eidos-chat-activity-indicator]{width:7px;height:7px;border-radius:50%;background:var(--eidos-border-strong)}
[data-eidos-chat-part="activity"][data-state="complete"] [data-eidos-chat-activity-indicator]{background:var(--eidos-success)}
[data-eidos-chat-part="activity"][data-state="error"] [data-eidos-chat-activity-indicator]{background:var(--eidos-danger)}
[data-eidos-chat-part="activity"] small{grid-column:2;color:var(--eidos-fg-subtle)}
[data-eidos-chat-part="activity"] a,[data-eidos-chat-part="evidence"] a{color:var(--eidos-primary);text-decoration:none}
[data-eidos-chat-part="evidence"]{display:grid;gap:var(--eidos-space-xs);font-size:var(--eidos-font-meta)}
[data-eidos-chat-part="evidence"] strong{font-size:var(--eidos-font-compact)}
[data-eidos-chat-part="evidence"] span,[data-eidos-chat-part="evidence"] time{color:var(--eidos-fg-muted)}
[data-eidos-chat-part="proposal"] ul{margin:var(--eidos-space-sm) 0;padding-left:18px}
[data-eidos-chat-proposal-risk]{margin-top:var(--eidos-space-sm);color:var(--eidos-warning)}
[data-eidos-chat-proposal-actions]{display:flex;flex-wrap:wrap;gap:var(--eidos-space-sm);margin-top:var(--eidos-space-md)}

/* Safe Markdown inside assistant/system prose.
   Rich text stays subordinate to conversation semantics and inherits Eidos tokens. */
[data-eidos-chat-markdown]{
  min-width:0;
  color:inherit;
  font:inherit;
  line-height:1.62;
  overflow-wrap:anywhere;
}
[data-eidos-chat-markdown]>:first-child{margin-top:0}
[data-eidos-chat-markdown]>:last-child{margin-bottom:0}
[data-eidos-chat-markdown-paragraph]{margin:0 0 var(--eidos-space-md)}
[data-eidos-chat-markdown-heading]{
  margin:var(--eidos-space-xl) 0 var(--eidos-space-sm);
  color:var(--eidos-fg);
  font-weight:700;
  line-height:1.35;
  letter-spacing:-.01em;
}
h2[data-eidos-chat-markdown-heading]{font-size:var(--eidos-font-section)}
h3[data-eidos-chat-markdown-heading],
h4[data-eidos-chat-markdown-heading],
h5[data-eidos-chat-markdown-heading]{font-size:var(--eidos-font-supporting)}
[data-eidos-chat-markdown-list]{
  margin:0 0 var(--eidos-space-md);
  padding-left:1.45rem;
}
[data-eidos-chat-markdown-list] li{margin:var(--eidos-space-xs) 0}
[data-eidos-chat-markdown-inline-code]{
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-sm);
  padding:1px 5px;
  background:var(--eidos-bg-subtle);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-size:.92em;
}
[data-eidos-chat-markdown-code]{
  max-width:100%;
  margin:var(--eidos-space-md) 0;
  overflow:auto;
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  background:var(--eidos-bg-subtle);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-size:var(--eidos-font-meta);
  line-height:1.55;
  white-space:pre;
}
[data-eidos-chat-markdown-quote]{
  margin:var(--eidos-space-md) 0;
  border-left:3px solid var(--eidos-border-strong);
  padding:var(--eidos-space-xs) 0 var(--eidos-space-xs) var(--eidos-space-lg);
  color:var(--eidos-fg-muted);
}
[data-eidos-chat-markdown-table-scroll]{
  max-width:100%;
  margin:var(--eidos-space-md) 0;
  overflow:auto;
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);
}
[data-eidos-chat-markdown-table]{
  width:100%;
  min-width:420px;
  border-collapse:collapse;
  background:var(--eidos-bg);
  font-size:var(--eidos-font-compact);
}
[data-eidos-chat-markdown-table] th,
[data-eidos-chat-markdown-table] td{
  padding:var(--eidos-space-sm) var(--eidos-space-md);
  border-bottom:1px solid var(--eidos-border);
  text-align:left;
  vertical-align:top;
}
[data-eidos-chat-markdown-table] th{
  background:var(--eidos-bg-subtle);
  font-weight:700;
}
[data-eidos-chat-markdown-table] tbody tr:last-child td{border-bottom:0}
[data-eidos-chat-markdown-link]{color:var(--eidos-primary);text-decoration:none}
[data-eidos-chat-markdown-link]:hover{text-decoration:underline}
[data-eidos-chat-markdown-rule]{
  margin:var(--eidos-space-lg) 0;
  border:0;
  border-top:1px solid var(--eidos-border);
}
[data-eidos-chat-markdown-unsafe-link]{color:var(--eidos-fg-muted)}

[data-eidos-setup-flow]{
  width:min(880px,100%);margin:0 auto;background:var(--eidos-bg);
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-lg);padding:var(--eidos-space-xl);
}
[data-eidos-setup-header]{padding-bottom:var(--eidos-space-lg);border-bottom:1px solid var(--eidos-border)}
[data-eidos-setup-header] h1{margin:0 0 var(--eidos-space-sm);font-size:var(--eidos-font-page)}
[data-eidos-setup-header] p{margin:0;color:var(--eidos-fg-muted);line-height:1.5}
[data-eidos-setup-steps]{list-style:none;margin:0;padding:var(--eidos-space-lg) 0;display:grid;gap:var(--eidos-space-sm)}
[data-eidos-setup-step]{
  display:grid;grid-template-columns:28px minmax(0,1fr);gap:var(--eidos-space-md);
  padding:var(--eidos-space-md);border-radius:var(--eidos-radius-md);
}
[data-eidos-setup-step][data-state="current"],
[data-eidos-setup-step][data-state="error"]{background:var(--eidos-bg-subtle)}
[data-eidos-setup-step][data-state="error"]{box-shadow:inset 3px 0 0 var(--eidos-danger)}
[data-eidos-setup-step-marker]{
  display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-pill);font-size:var(--eidos-font-meta);font-weight:700;
}
[data-eidos-setup-step][data-state="complete"] [data-eidos-setup-step-marker]{color:var(--eidos-success);border-color:var(--eidos-success)}
[data-eidos-setup-step-body] header{display:flex;align-items:baseline;justify-content:space-between;gap:var(--eidos-space-md)}
[data-eidos-setup-step-body] p{margin:var(--eidos-space-xs) 0 0;color:var(--eidos-fg-muted);line-height:1.5}
[data-eidos-setup-step-status]{font-size:var(--eidos-font-meta);color:var(--eidos-fg-subtle);white-space:nowrap}
[data-eidos-setup-step-actions],[data-eidos-setup-footer]{display:flex;flex-wrap:wrap;gap:var(--eidos-space-sm);margin-top:var(--eidos-space-md)}
[data-eidos-setup-step-actions] button,[data-eidos-setup-footer] button{
  min-height:var(--eidos-control-compact);border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);padding:0 var(--eidos-space-lg);background:var(--eidos-bg);color:var(--eidos-fg);
}
[data-eidos-setup-step-actions] button[data-eidos-primary="true"],
[data-eidos-setup-footer] button[data-eidos-primary="true"]{
  background:var(--eidos-primary);color:var(--eidos-primary-fg);border-color:var(--eidos-primary);
}

[data-eidos-extension-state-stack]{display:flex;flex-wrap:wrap;gap:var(--eidos-space-xs);justify-content:flex-end}
[data-eidos-extension-readiness-badge]{
  font-size:var(--eidos-font-meta);padding:3px 7px;border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-pill);white-space:nowrap;
}
[data-eidos-extension-readiness]{
  display:grid;gap:var(--eidos-space-xs);padding:var(--eidos-space-md) var(--eidos-space-lg);
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);background:var(--eidos-bg-subtle);
  font-size:var(--eidos-font-meta);
}
[data-eidos-extension-readiness] span{color:var(--eidos-fg-muted)}
[data-eidos-extension-readiness-badge][data-tone="positive"]{color:var(--eidos-success)}
[data-eidos-extension-readiness-badge][data-tone="warning"]{color:var(--eidos-warning)}
[data-eidos-extension-readiness-badge][data-tone="danger"]{color:var(--eidos-danger)}
[data-eidos-extension-technical]{
  border-top:1px solid var(--eidos-border);padding-top:var(--eidos-space-sm);
}
[data-eidos-extension-technical]>summary{cursor:pointer;color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta)}
[data-eidos-extension-technical-body]{display:grid;gap:var(--eidos-space-md);padding-top:var(--eidos-space-md)}

[data-eidos-settings-editor][data-settings-version="0.2.0"]{width:min(920px,100%)}
[data-eidos-settings-notice]{
  margin:var(--eidos-space-lg) 0;padding:var(--eidos-space-lg);
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);background:var(--eidos-bg-subtle);
}
[data-eidos-settings-notice][data-tone="warning"]{border-left:3px solid var(--eidos-warning)}
[data-eidos-settings-notice][data-tone="danger"]{border-left:3px solid var(--eidos-danger)}
[data-eidos-settings-notice] p{margin:var(--eidos-space-xs) 0 0;color:var(--eidos-fg-muted)}
[data-eidos-settings-group]{display:block;margin:var(--eidos-space-xl) 0;padding-top:var(--eidos-space-lg);border-top:1px solid var(--eidos-border)}
[data-eidos-settings-group-header] h2{margin:0;font-size:var(--eidos-font-section)}
[data-eidos-settings-group-header] p,[data-eidos-settings-group-description]{margin:var(--eidos-space-xs) 0 0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact)}
details[data-eidos-settings-group]>summary{cursor:pointer;font-weight:650;font-size:var(--eidos-font-section)}
[data-eidos-setting-label-row]{display:flex;align-items:center;justify-content:space-between;gap:var(--eidos-space-md)}
[data-eidos-setting-status]{font-size:var(--eidos-font-meta);font-weight:500;color:var(--eidos-fg-muted)}
[data-eidos-setting-status][data-tone="positive"]{color:var(--eidos-success)}
[data-eidos-setting-status][data-tone="warning"]{color:var(--eidos-warning)}
[data-eidos-setting-status][data-tone="danger"]{color:var(--eidos-danger)}
[data-eidos-settings-footer]{display:flex;justify-content:flex-end;padding-top:var(--eidos-space-lg);border-top:1px solid var(--eidos-border)}


/* Modern AI workbench conversation surface.
   Keeps Eidos productive/quiet semantics while giving long-running agent chat
   a stable reading column, lightweight thread chrome and floating composer. */
[data-eidos-side-panel] [data-eidos-chat]{
  position:relative;
  isolation:isolate;
}
[data-eidos-chat-header]{
  min-height:52px;
  gap:var(--eidos-space-md);
  padding:var(--eidos-space-sm) var(--eidos-space-lg);
  background:var(--eidos-bg);
}
[data-eidos-chat-header] h1{
  flex:0 0 auto;
  font-size:var(--eidos-font-compact);
  letter-spacing:-.01em;
}
[data-eidos-chat-context]{
  min-width:0;
  margin-left:auto;
}
[data-eidos-chat-context] select{
  max-width:180px;
  height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-pill);
  padding:0 28px 0 var(--eidos-space-md);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg);
}
[data-eidos-chat-thread-controls]{
  display:flex;
  align-items:center;
  gap:var(--eidos-space-xs);
  min-width:0;
}
[data-eidos-chat-thread-selector]{
  min-width:88px;
  max-width:180px;
  height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-pill);
  padding:0 28px 0 var(--eidos-space-md);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg);
  font-size:var(--eidos-font-meta);
}
[data-eidos-chat-new-thread],
[data-eidos-chat-archive-thread]{
  min-height:var(--eidos-control-compact);
  border:1px solid transparent;
  border-radius:var(--eidos-radius-pill);
  padding:0 var(--eidos-space-md);
  background:transparent;
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
}
[data-eidos-chat-new-thread]:hover{
  background:var(--eidos-bg-hover);
  color:var(--eidos-fg);
}
[data-eidos-chat-archive-thread]:hover{
  border-color:var(--eidos-border);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-danger);
}
[data-eidos-chat-transcript]{
  scrollbar-gutter:stable;
  padding:var(--eidos-space-xl) var(--eidos-space-lg) var(--eidos-space-xl);
}
[data-eidos-chat-empty]{
  margin:clamp(56px,14vh,132px) auto 0;
  max-width:360px;
}
[data-eidos-chat-empty]>strong{
  font-size:var(--eidos-font-section);
  letter-spacing:-.01em;
}
[data-eidos-chat-suggestions]{
  grid-template-columns:1fr;
}
[data-eidos-chat-suggestions] button{
  border-color:var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  transition:background-color .12s ease,border-color .12s ease,transform .12s ease;
}
[data-eidos-chat-suggestions] button:hover{
  background:var(--eidos-bg-subtle);
  border-color:var(--eidos-border-strong);
  transform:translateY(-1px);
}
[data-eidos-chat-message]{
  max-width:100%;
  margin-bottom:var(--eidos-space-xl);
  line-height:1.65;
}
[data-eidos-chat-message][data-role="assistant"],
[data-eidos-chat-message][data-role="system"]{
  padding-right:var(--eidos-space-sm);
}
[data-eidos-chat-message][data-role="user"]{
  width:fit-content;
  max-width:92%;
  margin-left:auto;
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg-subtle);
}
[data-eidos-chat-message][data-role="system"]{
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
}
[data-eidos-chat-part="text"]{
  line-height:1.65;
}
[data-eidos-chat-part="activity"]{
  width:fit-content;
  max-width:100%;
  padding:2px 0;
}
[data-eidos-chat-part="evidence"],
[data-eidos-chat-part="proposal"],
[data-eidos-chat-part="notice"]{
  border-radius:var(--eidos-radius-lg);
}
[data-eidos-chat-composer]{
  position:relative;
  z-index:2;
  grid-template-columns:minmax(0,1fr) auto;
  gap:var(--eidos-space-sm);
  margin:0 var(--eidos-space-md) var(--eidos-space-md);
  padding:var(--eidos-space-sm);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  box-shadow:0 8px 28px color-mix(in srgb,var(--eidos-fg) 9%,transparent);
}
[data-eidos-chat-composer]:focus-within{
  border-color:var(--eidos-focus);
  box-shadow:0 0 0 2px color-mix(in srgb,var(--eidos-focus) 18%,transparent),
    0 10px 30px color-mix(in srgb,var(--eidos-fg) 10%,transparent);
}
[data-eidos-chat-composer] textarea{
  min-height:44px;
  max-height:180px;
  border:0;
  border-radius:var(--eidos-radius-md);
  padding:10px var(--eidos-space-md);
  background:transparent;
  color:var(--eidos-fg);
  line-height:1.5;
}
[data-eidos-chat-composer] textarea:focus-visible{
  outline:0;
}
[data-eidos-chat-composer] button{
  min-height:36px;
  align-self:end;
  border-radius:var(--eidos-radius-pill);
  padding:0 var(--eidos-space-xl);
}
[data-eidos-chat-composer] button:disabled{
  cursor:not-allowed;
  opacity:.5;
}

/* Settings v0.2 is the preferred contemporary enterprise configuration surface.
   Groups provide information architecture; fields use a compact two-column row
   instead of a long stacked form, while mobile reflows to one column. */
[data-eidos-settings-editor][data-settings-version="0.2.0"]{
  width:min(960px,100%);
  border:0;
  background:transparent;
  padding:var(--eidos-space-sm);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"]>header{
  max-width:760px;
  padding:var(--eidos-space-sm) 0 var(--eidos-space-lg);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"]>header h1{
  margin-bottom:var(--eidos-space-sm);
  font-size:var(--eidos-font-page);
  letter-spacing:-.02em;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"]>header p{
  margin:0;
  color:var(--eidos-fg-muted);
  line-height:1.55;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-group]{
  margin:0 0 var(--eidos-space-lg);
  padding:var(--eidos-space-lg);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-group-header]{
  padding-bottom:var(--eidos-space-md);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-group-header] h2{
  letter-spacing:-.01em;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] details[data-eidos-settings-group]{
  padding:0;
  overflow:hidden;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] details[data-eidos-settings-group]>summary{
  padding:var(--eidos-space-lg);
  background:var(--eidos-bg);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] details[data-eidos-settings-group][open]>summary{
  border-bottom:1px solid var(--eidos-border);
  background:var(--eidos-bg-subtle);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] details[data-eidos-settings-group]>[data-eidos-settings-group-description]{
  margin:var(--eidos-space-lg) var(--eidos-space-lg) 0;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] details[data-eidos-settings-group]>[data-eidos-settings-group-body]{
  padding:0 var(--eidos-space-lg) var(--eidos-space-lg);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting]{
  display:grid;
  grid-template-columns:minmax(180px,.8fr) minmax(260px,1.2fr);
  grid-template-rows:auto auto;
  column-gap:var(--eidos-space-section);
  row-gap:var(--eidos-space-xs);
  align-items:start;
  margin:0;
  padding:var(--eidos-space-lg) 0;
  border-top:1px solid var(--eidos-border);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting]:first-child{
  border-top:0;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting-label-row]{
  grid-column:1;
  grid-row:1;
  align-self:end;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting-description]{
  grid-column:1;
  grid-row:2;
  margin:0;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting] input,
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting] select{
  grid-column:2;
  grid-row:1 / span 2;
  align-self:center;
  margin:0;
  border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting] input[type="checkbox"]{
  width:18px;
  height:18px;
  justify-self:start;
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting] input:disabled,
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting] select:disabled{
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg-muted);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-footer]{
  position:sticky;
  bottom:0;
  z-index:2;
  display:flex;
  justify-content:flex-end;
  align-items:center;
  gap:var(--eidos-space-sm);
  margin-top:var(--eidos-space-lg);
  padding:var(--eidos-space-md) 0;
  background:var(--eidos-bg-subtle);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-footer] button{
  min-height:var(--eidos-control-normal);
  border:0;
  border-radius:var(--eidos-radius-pill);
  padding:0 var(--eidos-space-xl);
  background:var(--eidos-primary);
  color:var(--eidos-primary-fg);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-return]{
  border:1px solid var(--eidos-border-strong);
  background:var(--eidos-bg);
  color:var(--eidos-fg-muted);
}



/* Review / Decision surface.
   Review is a judgment workspace, not an unstyled form. Human meaning stays
   prominent while machine identifiers and diagnostics use progressive disclosure. */
[data-eidos-review-queue]{
  width:min(1040px,100%);
  margin:0 auto;
  padding:var(--eidos-space-sm);
}
[data-eidos-review-header]{
  max-width:760px;
  padding:var(--eidos-space-sm) 0 var(--eidos-space-xl);
}
[data-eidos-review-header] h1{
  margin:0 0 var(--eidos-space-sm);
  font-size:var(--eidos-font-page);
  letter-spacing:-.02em;
}
[data-eidos-review-header] p{
  margin:0;
  color:var(--eidos-fg-muted);
  line-height:1.55;
}
[data-eidos-review-items]{
  list-style:none;
  display:grid;
  gap:var(--eidos-space-lg);
  margin:0;
  padding:0;
}
[data-eidos-review-item]{
  overflow:hidden;
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
}
[data-eidos-review-item][data-state="attention"]{
  border-left:3px solid var(--eidos-warning);
}
[data-eidos-review-item][data-state="accepted"]{
  border-left:3px solid var(--eidos-success);
}
[data-eidos-review-item][data-state="rejected"]{
  border-left:3px solid var(--eidos-danger);
}
[data-eidos-review-form]{
  display:grid;
}
[data-eidos-review-item-header]{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:var(--eidos-space-lg);
  align-items:start;
  padding:var(--eidos-space-lg);
}
[data-eidos-review-item-header] strong{
  display:block;
  font-size:var(--eidos-font-section);
  line-height:1.35;
  letter-spacing:-.01em;
}
[data-eidos-review-item-header] p{
  max-width:760px;
  margin:var(--eidos-space-xs) 0 0;
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-compact);
  line-height:1.55;
}
[data-eidos-review-status]{
  display:inline-flex;
  align-items:center;
  min-height:24px;
  padding:2px var(--eidos-space-sm);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-pill);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
  white-space:nowrap;
}
[data-eidos-review-item][data-state="attention"] [data-eidos-review-status]{
  color:var(--eidos-warning);
}
[data-eidos-review-item][data-state="accepted"] [data-eidos-review-status]{
  color:var(--eidos-success);
}
[data-eidos-review-item][data-state="rejected"] [data-eidos-review-status]{
  color:var(--eidos-danger);
}
[data-eidos-review-metrics]{
  display:flex;
  flex-wrap:wrap;
  gap:var(--eidos-space-sm);
  padding:0 var(--eidos-space-lg) var(--eidos-space-lg);
}
[data-eidos-review-metric]{
  min-width:108px;
  display:grid;
  gap:2px;
  padding:var(--eidos-space-sm) var(--eidos-space-md);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg-subtle);
}
[data-eidos-review-metric]>span{
  color:var(--eidos-fg-subtle);
  font-size:var(--eidos-font-meta);
}
[data-eidos-review-metric]>strong{
  color:var(--eidos-fg);
  font-size:var(--eidos-font-compact);
}
[data-eidos-review-metric][data-tone="positive"]>strong{color:var(--eidos-success)}
[data-eidos-review-metric][data-tone="warning"]>strong{color:var(--eidos-warning)}
[data-eidos-review-metric][data-tone="danger"]>strong{color:var(--eidos-danger)}
[data-eidos-review-fields]{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:var(--eidos-space-lg);
  padding:var(--eidos-space-lg);
  border-top:1px solid var(--eidos-border);
  background:var(--eidos-bg-subtle);
}
[data-eidos-review-field-wrap]{
  display:grid;
  align-content:start;
  gap:var(--eidos-space-sm);
  margin:0;
  color:var(--eidos-fg);
  font-size:var(--eidos-font-compact);
  font-weight:650;
}
[data-eidos-review-field-wrap]:has(textarea){
  grid-column:1/-1;
}
[data-eidos-review-field-wrap] input,
[data-eidos-review-field-wrap] select,
[data-eidos-review-field-wrap] textarea{
  width:100%;
  margin:0;
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
  font:inherit;
  font-weight:400;
}
[data-eidos-review-field-wrap] input,
[data-eidos-review-field-wrap] select{
  min-height:var(--eidos-control-normal);
  padding:0 var(--eidos-space-md);
}
[data-eidos-review-field-wrap] textarea{
  min-height:88px;
  resize:vertical;
  padding:var(--eidos-space-md);
  line-height:1.5;
}
[data-eidos-review-field-wrap] input:focus-visible,
[data-eidos-review-field-wrap] select:focus-visible,
[data-eidos-review-field-wrap] textarea:focus-visible{
  outline:2px solid var(--eidos-focus);
  outline-offset:1px;
}
[data-eidos-review-field-wrap] input:disabled,
[data-eidos-review-field-wrap] select:disabled,
[data-eidos-review-field-wrap] textarea:disabled{
  color:var(--eidos-fg-muted);
  background:var(--eidos-bg-subtle);
}
[data-eidos-review-evidence-list]{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:var(--eidos-space-sm);
  padding:var(--eidos-space-lg);
  border-top:1px solid var(--eidos-border);
}
[data-eidos-review-evidence]{
  min-width:0;
  display:grid;
  gap:var(--eidos-space-xs);
  padding:var(--eidos-space-md);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg);
}
[data-eidos-review-evidence] strong{
  overflow-wrap:anywhere;
  font-size:var(--eidos-font-compact);
}
[data-eidos-review-evidence] span{
  color:var(--eidos-fg-subtle);
  font-size:var(--eidos-font-meta);
}
[data-eidos-review-evidence] p{
  margin:0;
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
  line-height:1.45;
  overflow-wrap:anywhere;
}
[data-eidos-review-evidence] a{
  justify-self:start;
  color:var(--eidos-primary);
  font-size:var(--eidos-font-meta);
  text-decoration:none;
}
[data-eidos-review-technical]{
  border-top:1px solid var(--eidos-border);
  color:var(--eidos-fg-muted);
}
[data-eidos-review-technical]>summary{
  cursor:pointer;
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  font-size:var(--eidos-font-meta);
  user-select:none;
}
[data-eidos-review-technical][open]>summary{
  background:var(--eidos-bg-subtle);
}
[data-eidos-review-technical] dl{
  display:grid;
  gap:var(--eidos-space-xs);
  margin:0;
  padding:0 var(--eidos-space-lg) var(--eidos-space-lg);
}
[data-eidos-review-technical-row]{
  display:grid;
  grid-template-columns:minmax(120px,180px) minmax(0,1fr);
  gap:var(--eidos-space-md);
  padding-top:var(--eidos-space-xs);
  font-size:var(--eidos-font-meta);
}
[data-eidos-review-technical-row] dt{
  color:var(--eidos-fg-subtle);
}
[data-eidos-review-technical-row] dd{
  min-width:0;
  margin:0;
  color:var(--eidos-fg-muted);
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  overflow-wrap:anywhere;
}
[data-eidos-review-actions]{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  border-top:1px solid var(--eidos-border);
  background:var(--eidos-bg-subtle);
}
[data-eidos-review-actions] button{
  min-height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-pill);
  padding:0 var(--eidos-space-lg);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
}
[data-eidos-review-actions] button:hover:not(:disabled){
  background:var(--eidos-bg-hover);
}
[data-eidos-review-actions] button[data-eidos-primary="true"]{
  margin-left:auto;
  border-color:var(--eidos-primary);
  background:var(--eidos-primary);
  color:var(--eidos-primary-fg);
}
[data-eidos-review-actions] button:focus-visible{
  outline:2px solid var(--eidos-focus);
  outline-offset:2px;
}
[data-eidos-review-actions] button:disabled{
  cursor:not-allowed;
  opacity:.5;
}
[data-eidos-review-empty]{
  padding:var(--eidos-space-xxl);
  border:1px dashed var(--eidos-border-strong);
  border-radius:var(--eidos-radius-lg);
  color:var(--eidos-fg-muted);
  text-align:center;
}

@media(max-width:700px){
  [data-eidos-global-control-select]{min-width:0;max-width:52vw}
  [data-eidos-account-control]>summary>span:last-child{display:none}

  [data-eidos-review-queue]{padding:0}
  [data-eidos-review-item-header]{grid-template-columns:1fr;gap:var(--eidos-space-sm)}
  [data-eidos-review-status]{justify-self:start}
  [data-eidos-review-fields]{grid-template-columns:1fr}
  [data-eidos-review-field-wrap]:has(textarea){grid-column:auto}
  [data-eidos-review-evidence-list]{grid-template-columns:1fr}
  [data-eidos-review-technical-row]{grid-template-columns:1fr;gap:2px}
  [data-eidos-review-actions] button{min-height:44px}
  [data-eidos-review-actions] button[data-eidos-primary="true"]{
    flex:1 1 100%;
    margin-left:0;
    order:2;
  }
}

@media(max-width:1024px) and (min-width:701px){
  [data-eidos-app-host-layout="workbench"]{--eidos-activity-width:46px}
  [data-eidos-catalog-items],[data-eidos-extension-items]{grid-template-columns:1fr}
  [data-eidos-browser-toolbar]{grid-template-columns:minmax(120px,1fr) auto auto}
  [data-eidos-browser-external]{display:none}
  [data-eidos-global-controls]{grid-column:3}
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
  [data-eidos-browser-toolbar]{
    grid-template-columns:minmax(80px,1fr) auto;
    padding:var(--eidos-space-sm)
  }
  [data-eidos-browser-toolbar] button{min-width:44px;min-height:44px}
  [data-eidos-browser-external]{display:none}
  [data-eidos-global-controls]{
    grid-column:1/-1;
    justify-content:flex-end;
    padding:var(--eidos-space-xs) 0 0;
    border-left:0;
    border-top:1px solid var(--eidos-border);
  }
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
  [data-eidos-capability="catalog-detail"]{
    grid-template-columns:1fr;
  }
  [data-eidos-catalog-detail-thumbnails]{
    grid-template-columns:repeat(3,minmax(0,1fr));
  }
  [data-eidos-capability="catalog-detail"] button,
  [data-eidos-capability="catalog-detail"] [data-eidos-catalog-download]{
    min-height:44px;
  }
  [data-eidos-chat-header]{align-items:flex-start;flex-wrap:wrap}
  [data-eidos-chat-context]{margin-left:0;order:2;flex:1 1 100%}
  [data-eidos-chat-thread-controls]{order:3;flex:1 1 100%}
  [data-eidos-chat-thread-selector]{flex:1 1 auto;max-width:none}
  [data-eidos-chat-new-thread],[data-eidos-chat-archive-thread]{min-height:44px}
  [data-eidos-chat-transcript]{padding-inline:var(--eidos-space-md)}
  [data-eidos-chat-composer]{margin:0 var(--eidos-space-sm) var(--eidos-space-sm)}
  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting]{
    grid-template-columns:1fr;
    grid-template-rows:auto auto auto;
    row-gap:var(--eidos-space-sm);
  }
  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting-label-row],
  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting-description],
  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting] input,
  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-setting] select{
    grid-column:1;
    grid-row:auto;
  }
}

/* Eidos Mobile Design Language v0.1 reference realization.
   Phone UI is a semantic reflow of the same capabilities, not a reduced desktop shell. */
@media(max-width:700px){
  :root{
    --eidos-activity-width:var(--eidos-mobile-nav-height);
  }

  [data-eidos-app-host-layout="workbench"],
  [data-eidos-app-host-layout="workbench"][data-side-panel-visible="false"]{
    grid-template-columns:minmax(0,1fr);
    grid-template-rows:minmax(0,1fr) auto;
    padding:0;
  }

  [data-eidos-activity-bar]{
    grid-column:1;
    grid-row:2;
    min-width:0;
    min-height:calc(var(--eidos-mobile-nav-height) + var(--eidos-safe-area-bottom));
    flex-direction:row;
    align-items:flex-start;
    justify-content:space-between;
    padding:0 var(--eidos-safe-area-right) var(--eidos-safe-area-bottom) var(--eidos-safe-area-left);
    border-right:0;
    border-top:1px solid var(--eidos-border);
    background:color-mix(in srgb,var(--eidos-bg) 96%,transparent);
    overflow-x:auto;
    overflow-y:hidden;
    overscroll-behavior-x:contain;
    scrollbar-width:none;
    z-index:20;
  }
  [data-eidos-activity-bar]::-webkit-scrollbar{display:none}
  [data-eidos-activity-primary],
  [data-eidos-activity-secondary]{
    min-width:max-content;
    flex-direction:row;
    align-items:center;
  }
  [data-eidos-activity-secondary]{margin-left:auto}
  [data-eidos-activity-bar] button{
    width:var(--eidos-mobile-nav-height);
    height:var(--eidos-mobile-nav-height);
    min-width:var(--eidos-mobile-nav-height);
    min-height:var(--eidos-touch-target);
    border-left:0;
    border-top:2px solid transparent;
  }
  [data-eidos-activity-bar] button[data-active="true"]{
    border-left-color:transparent;
    border-top-color:var(--eidos-fg);
    background:transparent;
  }

  [data-eidos-side-panel],
  [data-eidos-workspace],
  [data-side-panel-visible="false"] [data-eidos-workspace]{
    grid-column:1;
    grid-row:1;
    width:100%;
    height:100%;
    min-width:0;
    min-height:0;
    border:0;
  }
  [data-eidos-status-bar]{display:none}

  [data-eidos-side-panel-header]{
    min-height:var(--eidos-mobile-chrome-min-height);
    flex-basis:var(--eidos-mobile-chrome-min-height);
    padding-left:max(var(--eidos-space-lg),var(--eidos-safe-area-left));
    padding-right:max(var(--eidos-space-md),var(--eidos-safe-area-right));
    text-transform:none;
    letter-spacing:0;
    font-size:var(--eidos-font-compact);
    background:var(--eidos-bg);
  }
  [data-eidos-side-panel-header] button{
    width:var(--eidos-touch-target);
    height:var(--eidos-touch-target);
  }
  [data-eidos-workbench-navigation]{
    padding:var(--eidos-space-sm) max(var(--eidos-space-md),var(--eidos-safe-area-right))
      var(--eidos-space-lg) max(var(--eidos-space-md),var(--eidos-safe-area-left));
  }
  [data-eidos-workbench-navigation] button{
    min-height:48px;
    padding:var(--eidos-space-md) var(--eidos-space-lg);
    border-radius:var(--eidos-radius-md);
    font-size:var(--eidos-font-body);
  }

  [data-eidos-browser-toolbar]{
    min-height:calc(var(--eidos-mobile-chrome-min-height) + var(--eidos-safe-area-top));
    grid-template-columns:minmax(0,1fr);
    padding:var(--eidos-safe-area-top) max(var(--eidos-space-md),var(--eidos-safe-area-right))
      0 max(var(--eidos-space-md),var(--eidos-safe-area-left));
    background:var(--eidos-bg);
  }
  [data-eidos-browser-address],
  [data-eidos-browser-go],
  [data-eidos-browser-external]{display:none!important}
  [data-eidos-global-controls]{
    grid-column:1;
    width:100%;
    min-height:var(--eidos-mobile-chrome-min-height);
    justify-content:space-between;
    gap:var(--eidos-space-sm);
    padding:0;
    border:0;
  }
  [data-eidos-global-control]{min-width:0}
  [data-eidos-global-control-select],
  [data-eidos-global-controls] [data-eidos-locale-control] select{
    min-height:var(--eidos-touch-target);
    height:var(--eidos-touch-target);
    border-radius:var(--eidos-radius-pill);
  }
  [data-eidos-global-control-select]{
    min-width:0;
    max-width:58vw;
  }
  [data-eidos-global-controls] [data-eidos-locale-control] select{
    min-width:72px;
    max-width:92px;
  }
  [data-eidos-account-control]>summary{
    min-width:var(--eidos-touch-target);
    min-height:var(--eidos-touch-target);
    justify-content:center;
    padding:0 var(--eidos-space-sm);
  }
  [data-eidos-account-avatar]{
    width:28px;
    height:28px;
  }
  [data-eidos-account-menu]{
    position:fixed;
    left:max(var(--eidos-space-lg),var(--eidos-safe-area-left));
    right:max(var(--eidos-space-lg),var(--eidos-safe-area-right));
    top:auto;
    bottom:calc(var(--eidos-mobile-nav-height) + var(--eidos-safe-area-bottom) + var(--eidos-space-lg));
    width:auto;
    max-height:min(62dvh,520px);
    overflow:auto;
    padding:var(--eidos-space-lg);
    border-radius:var(--eidos-radius-lg);
    box-shadow:0 -8px 36px color-mix(in srgb,var(--eidos-fg) 18%,transparent);
  }

  [data-eidos-workspace-content]{
    padding:var(--eidos-space-md)
      max(var(--eidos-space-md),var(--eidos-safe-area-right))
      var(--eidos-space-xl)
      max(var(--eidos-space-md),var(--eidos-safe-area-left));
    background:var(--eidos-bg);
  }

  form[data-eidos-id],
  [data-eidos-capability="catalog-browser"],
  [data-eidos-settings-editor],
  [data-eidos-settings-editor][data-settings-version="0.2.0"],
  [data-eidos-review-queue],
  [data-eidos-help-document],
  [data-eidos-setup-flow]{
    width:100%;
    margin:0;
    border:0;
    border-radius:0;
    padding:var(--eidos-space-md);
    background:var(--eidos-bg);
  }
  form[data-eidos-id] input,
  form[data-eidos-id] select,
  [data-eidos-setting] input,
  [data-eidos-setting] select,
  [data-eidos-catalog-search] input{
    min-height:var(--eidos-touch-target);
    height:var(--eidos-touch-target);
    border-radius:var(--eidos-radius-md);
  }

  [data-eidos-catalog-items],
  [data-eidos-extension-items]{
    grid-template-columns:1fr;
    gap:var(--eidos-space-md);
  }
  [data-eidos-catalog-item],
  [data-eidos-extension-item]{
    gap:var(--eidos-space-md);
    padding:var(--eidos-space-lg);
    border-radius:var(--eidos-radius-lg);
  }
  [data-eidos-catalog-item] header,
  [data-eidos-extension-item] header{
    gap:var(--eidos-space-md);
  }
  [data-eidos-catalog-item] footer,
  [data-eidos-extension-item] footer{
    display:grid;
    grid-template-columns:1fr;
    align-items:stretch;
    justify-content:stretch;
  }
  [data-eidos-catalog-item] [data-eidos-action-wrap],
  [data-eidos-capability="catalog-detail"] [data-eidos-action-wrap]{
    width:100%;
    justify-items:stretch;
  }
  [data-eidos-catalog-item] [data-eidos-action-help]{
    max-width:none;
    text-align:left;
  }
  [data-eidos-catalog-item] footer button,
  [data-eidos-catalog-item] footer [data-eidos-catalog-download],
  [data-eidos-extension-item] footer button{
    width:100%;
    min-height:var(--eidos-touch-target);
  }

  [data-eidos-capability="catalog-detail"]{
    width:100%;
    grid-template-columns:1fr;
    gap:var(--eidos-space-lg);
  }
  [data-eidos-catalog-detail-thumbnails]{
    display:flex;
    gap:var(--eidos-space-sm);
    overflow-x:auto;
    overscroll-behavior-x:contain;
    scroll-snap-type:x proximity;
    padding-bottom:var(--eidos-space-xs);
  }
  [data-eidos-catalog-detail-media="thumbnail"]{
    flex:0 0 min(44vw,180px);
    scroll-snap-align:start;
  }
  [data-eidos-catalog-detail-info]{
    border-radius:var(--eidos-radius-lg);
    padding:var(--eidos-space-lg);
  }
  [data-eidos-catalog-detail-info] footer{
    display:grid;
    grid-template-columns:1fr;
    align-items:stretch;
  }
  [data-eidos-capability="catalog-detail"] button,
  [data-eidos-capability="catalog-detail"] [data-eidos-catalog-download]{
    width:100%;
    min-height:var(--eidos-touch-target);
  }

  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-group]{
    padding:var(--eidos-space-lg);
  }
  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-footer]{
    bottom:0;
    margin-inline:calc(-1 * var(--eidos-space-md));
    padding:var(--eidos-space-md);
    border-top:1px solid var(--eidos-border);
    background:color-mix(in srgb,var(--eidos-bg) 96%,transparent);
  }
  [data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-footer] button{
    min-height:var(--eidos-touch-target);
  }

  [data-eidos-chat-transcript]{
    padding-left:max(var(--eidos-space-md),var(--eidos-safe-area-left));
    padding-right:max(var(--eidos-space-md),var(--eidos-safe-area-right));
  }
  [data-eidos-chat-composer]{
    margin-left:max(var(--eidos-space-sm),var(--eidos-safe-area-left));
    margin-right:max(var(--eidos-space-sm),var(--eidos-safe-area-right));
  }

  [data-eidos-review-actions]{
    display:grid;
    grid-template-columns:1fr;
  }
  [data-eidos-review-actions] button,
  [data-eidos-review-actions] button[data-eidos-primary="true"]{
    width:100%;
    min-height:var(--eidos-touch-target);
    margin-left:0;
  }
}

`;
