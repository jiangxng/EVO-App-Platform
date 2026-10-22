import { eidosDesignTokenCss } from "./tokens.js";

export const eidosProductiveWorkbenchCss = `
${eidosDesignTokenCss}
*{box-sizing:border-box}
html{font-size:100%;-webkit-text-size-adjust:auto;text-size-adjust:auto}
html[data-eidos-text-scale="small"]{font-size:90%}
html[data-eidos-text-scale="standard"]{font-size:100%}
html[data-eidos-text-scale="large"]{font-size:115%}\nhtml,body,#app{margin:0;width:100%;height:100%;min-height:100%}
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

/* A Host-selected focused workflow is not a permanent user preference.
   Keep the activity strip visible and allow toolbar navigation restore. */
@media (min-width:701px){
  [data-eidos-app-host-layout="workbench"][data-eidos-workspace-focused="true"]{
    grid-template-columns:var(--eidos-activity-width) 0 0 minmax(0,1fr)
  }
  [data-eidos-workspace-focused="true"] [data-eidos-side-panel],
  [data-eidos-workspace-focused="true"] [data-eidos-workbench-splitter]{
    display:none
  }
  [data-eidos-workspace-focused="true"] [data-eidos-workspace]{
    grid-column:2/5
  }
  [data-eidos-workspace-focused="true"] form[data-eidos-id]{
    width:min(var(--eidos-focused-workspace-content-max,1200px),100%)
  }
}
[data-eidos-workspace-focus-toggle]{justify-self:start;min-width:44px;min-height:44px}
[data-eidos-workspace-focus-toggle][hidden]{display:none!important}
@media(max-width:700px){
  [data-eidos-workspace-focus-toggle]{display:none!important}
}

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
[data-eidos-text-scale-control]{
  display:grid;
  gap:var(--eidos-space-xs);
  padding-top:var(--eidos-space-xs);
}
[data-eidos-text-scale-control]>span{
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
}
[data-eidos-text-scale-control] select{
  width:100%;
  min-height:var(--eidos-control-normal);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-md);
  padding:0 var(--eidos-space-md);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
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
form[data-eidos-id] [data-eidos-field-context-link]{
  display:inline-flex;align-items:center;justify-content:center;
  margin-top:var(--eidos-space-sm);min-height:var(--eidos-control-compact);
  border:0;border-radius:var(--eidos-radius-sm);
  background:transparent;color:var(--eidos-primary);
  padding:0 var(--eidos-space-sm);font:inherit;font-weight:600;
  text-align:left;cursor:pointer;
}
form[data-eidos-id] [data-eidos-field-context-link]:hover{text-decoration:underline}
form[data-eidos-id] [data-eidos-field-context-link]:focus-visible{
  outline:2px solid var(--eidos-primary);outline-offset:2px;
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


[data-eidos-catalog-server-search]{display:flex;align-items:flex-end;gap:var(--eidos-space-sm);flex-wrap:wrap;margin-top:var(--eidos-space-lg)}
[data-eidos-catalog-server-search] label{flex:1 1 200px;min-width:0;display:grid;gap:var(--eidos-space-xs)}
[data-eidos-catalog-server-search] input,[data-eidos-catalog-server-search] button{min-height:44px;padding:0 var(--eidos-space-md);border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-sm);background:var(--eidos-bg);color:var(--eidos-fg)}
/* Keep the accessible label, but do not repeat the visible placeholder. */
[data-eidos-catalog-search-label]{
  position:absolute;width:1px;height:1px;padding:0;margin:-1px;
  overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;
}


/* Read-only collection table: compact on desktop, semantic cards on phone. */
[data-eidos-capability="catalog-browser"][data-eidos-catalog-has-table="true"] [data-eidos-catalog-items],
[data-eidos-capability="catalog-browser"][data-eidos-catalog-has-table="true"][data-eidos-catalog-density="compact"] [data-eidos-catalog-items]{display:none}
[data-eidos-catalog-table-wrap]{
  width:100%;max-width:100%;overflow-x:auto;
  margin-top:var(--eidos-space-lg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);background:var(--eidos-bg);
}
[data-eidos-catalog-table]{
  border-collapse:collapse;table-layout:fixed;width:100%;
  background:var(--eidos-bg);color:var(--eidos-fg);
  font-variant-numeric:tabular-nums;
}
[data-eidos-catalog-table] th,[data-eidos-catalog-table] td{
  padding:10px var(--eidos-space-lg);text-align:left;
  border-bottom:1px solid var(--eidos-border);vertical-align:middle;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
[data-eidos-catalog-table] th:first-child,
[data-eidos-catalog-table] td:first-child{width:48%}
[data-eidos-catalog-table] th{
  font-size:var(--eidos-font-meta);font-weight:600;
  background:var(--eidos-bg-subtle);color:var(--eidos-fg-muted);
}
[data-eidos-catalog-table] tbody tr:last-child td{border-bottom:0}
[data-eidos-catalog-table] tbody tr:hover{background:var(--eidos-bg-hover)}
/* Names are actionable text, not bordered form buttons; sort headers are labels. */
[data-eidos-catalog-table] th button,
[data-eidos-catalog-table] td:first-child button{
  display:inline-block;max-width:100%;min-width:0;min-height:0;
  padding:2px 0;border:0;border-radius:0;background:transparent;
  font:inherit;font-weight:inherit;text-align:left;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;vertical-align:middle;
  cursor:pointer;
}
[data-eidos-catalog-table] th button{color:inherit;font-weight:600}
[data-eidos-catalog-table] th button::after{
  content:"↕";margin-left:var(--eidos-space-xs);
  color:var(--eidos-fg-muted);font-weight:400;
}
[data-eidos-catalog-table] td:first-child button{
  color:var(--eidos-primary);font-weight:500;
}
[data-eidos-catalog-table] th button:hover,
[data-eidos-catalog-table] td:first-child button:hover{text-decoration:underline}
[data-eidos-catalog-table] th button:focus-visible,
[data-eidos-catalog-table] td:first-child button:focus-visible{
  outline:2px solid var(--eidos-primary);outline-offset:3px;
}
[data-eidos-catalog-pagination] button{
  min-height:44px;padding:0 var(--eidos-space-md);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);
  background:var(--eidos-bg);color:var(--eidos-fg);cursor:pointer;
}
[data-eidos-catalog-pagination]{display:flex;justify-content:space-between;align-items:center;
  flex-wrap:wrap;gap:var(--eidos-space-md);margin-top:var(--eidos-space-lg)}
[data-eidos-catalog-pagination]>div{display:flex;flex-wrap:wrap;gap:var(--eidos-space-sm)}
@media(max-width:700px){
  [data-eidos-catalog-has-table="true"] [data-eidos-catalog-table-wrap]{display:none}
  [data-eidos-capability="catalog-browser"][data-eidos-catalog-has-table="true"] [data-eidos-catalog-items],
[data-eidos-capability="catalog-browser"][data-eidos-catalog-has-table="true"][data-eidos-catalog-density="compact"] [data-eidos-catalog-items]{display:grid;grid-template-columns:minmax(0,1fr)}
  [data-eidos-catalog-has-table="true"] [data-eidos-catalog-item] button{min-height:44px}
  [data-eidos-catalog-pagination]{padding-bottom:env(safe-area-inset-bottom,0px)}
}

[data-eidos-catalog-items],[data-eidos-extension-items]{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--eidos-space-lg);margin-top:var(--eidos-space-lg);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-layout="list"] [data-eidos-catalog-items]{
  grid-template-columns:minmax(0,1fr);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-layout="list"] [data-eidos-catalog-item]{
  padding:var(--eidos-space-xl);
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

/* Shared business-page hierarchy and context navigation.
   Mirrors the 2D Workspace breadcrumb language without plugin-owned CSS. */
[data-eidos-page-header]{display:grid;gap:var(--eidos-space-sm)}
[data-eidos-page-heading]{
  display:flex;align-items:flex-start;justify-content:space-between;
  gap:var(--eidos-space-section);min-width:0;
}
[data-eidos-page-heading-copy]{min-width:0}
form[data-eidos-id] [data-eidos-page-heading] > [data-eidos-form-task-steps]{
  justify-content:flex-end;align-self:flex-start;flex:0 0 auto;max-width:48%;
  margin:0
}
@media(max-width:850px){
  form[data-eidos-id] [data-eidos-page-heading]:has(> [data-eidos-form-task-steps]){
    flex-wrap:wrap
  }
  form[data-eidos-id] [data-eidos-page-heading] > [data-eidos-form-task-steps]{
    width:100%;max-width:none;justify-content:flex-start
  }
}
form[data-eidos-id] [data-eidos-page-heading] h1,
[data-eidos-capability="catalog-browser"] [data-eidos-page-heading] h1{
  margin:0;font-size:var(--eidos-font-page);line-height:1.25;letter-spacing:-.015em;
}
[data-eidos-page-description]{
  margin:var(--eidos-space-sm) 0 0;max-width:760px;
  color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact);line-height:1.55;
}
[data-eidos-page-actions]{
  display:flex;align-items:center;justify-content:flex-end;
  gap:var(--eidos-space-sm);flex-wrap:wrap;flex:0 0 auto;
}
[data-eidos-page-actions] [data-eidos-action-wrap]{display:block}
[data-eidos-page-actions] button,
[data-eidos-page-actions] [data-eidos-catalog-download]{
  min-height:var(--eidos-control-normal);
  border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-sm);
  background:var(--eidos-bg);color:var(--eidos-fg);
  padding:0 var(--eidos-space-lg);
}
[data-eidos-page-actions] button[data-eidos-primary="true"],
[data-eidos-page-actions] [data-eidos-catalog-download][data-eidos-primary="true"],
form[data-eidos-id] [data-eidos-form-actions] button[data-eidos-primary="true"]{
  border-color:var(--eidos-primary);background:var(--eidos-primary);
  color:var(--eidos-primary-fg);
}
[data-eidos-page-actions] button:not([data-eidos-primary="true"]):hover,
form[data-eidos-id] [data-eidos-form-actions] button:not([data-eidos-primary="true"]):hover{
  background:var(--eidos-bg-hover);
}

[data-eidos-collection-heading]{
  display:flex;align-items:flex-end;justify-content:space-between;
  gap:var(--eidos-space-lg);
  margin-top:var(--eidos-space-section);
  padding-top:var(--eidos-space-lg);
  border-top:1px solid var(--eidos-border);
}
[data-eidos-collection-heading] h2{
  margin:0;font-size:var(--eidos-font-body);line-height:1.35;font-weight:650;
}
[data-eidos-collection-heading] p{
  margin:4px 0 0;color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);line-height:1.45;
}
[data-eidos-context-navigation]{
  min-width:0;min-height:22px;color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);line-height:1.4;
}
[data-eidos-context-navigation-desktop]{
  display:flex;align-items:center;gap:6px;min-width:0;
  white-space:nowrap;overflow:hidden;
}
/* Context navigation follows the Ledger Runtime template-design workspace:
   it is navigation metadata, never a second toolbar or page title. */
form[data-eidos-id] [data-eidos-context-navigation] button,
[data-eidos-capability="catalog-browser"] [data-eidos-context-navigation] button,
[data-eidos-diagram-editor] [data-eidos-context-navigation] button,
[data-eidos-context-navigation-mobile] button{
  appearance:none!important;
  min-height:0!important;height:auto!important;
  border:0!important;border-radius:0!important;
  padding:0!important;margin:0!important;
  background:transparent!important;box-shadow:none!important;
  color:var(--eidos-fg-muted)!important;
  font:inherit!important;font-weight:400!important;line-height:1.4!important;
  cursor:pointer;
}
form[data-eidos-id] [data-eidos-context-navigation] button:hover,
[data-eidos-capability="catalog-browser"] [data-eidos-context-navigation] button:hover,
[data-eidos-diagram-editor] [data-eidos-context-navigation] button:hover,
[data-eidos-context-navigation-mobile] button:hover{
  color:var(--eidos-primary)!important;text-decoration:underline;
}
[data-eidos-context-navigation-desktop] span[aria-current="page"]{
  color:var(--eidos-fg);font-weight:600;overflow:hidden;text-overflow:ellipsis;
}
[data-eidos-context-separator]{
  color:color-mix(in srgb,var(--eidos-fg-muted) 58%,transparent);
}
[data-eidos-context-navigation-mobile]{display:none}

form[data-eidos-id] [data-eidos-form-fields]{margin-top:var(--eidos-space-md)}
form[data-eidos-id] [data-eidos-form-actions]{
  display:flex;justify-content:flex-end;align-items:center;gap:var(--eidos-space-sm);
  flex-wrap:wrap;margin-top:var(--eidos-space-section);
  padding-top:var(--eidos-space-lg);border-top:1px solid var(--eidos-border);
}

/* Productive management lists: continuous, scannable rows.
   Row activation is the default detail affordance; status is informative,
   not a competing action. */
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"]{
  width:min(1180px,100%);border:0;border-radius:0;
  padding:0;background:transparent;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-items]{
  display:block;margin-top:var(--eidos-space-md);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);
  overflow:hidden;background:var(--eidos-bg);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]{
  position:relative;
  border:0;border-bottom:1px solid var(--eidos-border);
  border-radius:0;
  padding:var(--eidos-space-lg) 44px var(--eidos-space-lg) var(--eidos-space-xl);
  gap:var(--eidos-space-sm);box-shadow:none;background:var(--eidos-bg);
  display:grid;grid-template-columns:minmax(0,1fr);
  align-items:center;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]:last-child{
  border-bottom:0;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item][data-eidos-catalog-row-route]{
  cursor:pointer;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item][data-eidos-catalog-row-route]:hover{
  background:var(--eidos-bg-hover);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item][data-eidos-catalog-row-route]:focus-visible{
  outline:2px solid var(--eidos-focus);outline-offset:-2px;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]>header{
  min-width:0;display:flex;align-items:center;justify-content:space-between;
  gap:var(--eidos-space-lg);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item] h2{
  font-size:var(--eidos-font-body);font-weight:650;line-height:1.35;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]>p{
  margin:0;color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-compact);line-height:1.45;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-badges]:empty,
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]>footer:empty{
  display:none;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-metadata]{
  display:flex;align-items:center;flex-wrap:wrap;
  gap:var(--eidos-space-xs) var(--eidos-space-lg);min-width:0;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-meta]{
  color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-status]{
  flex:0 0 auto;
  border:0;border-radius:var(--eidos-radius-pill);
  padding:2px 7px;
  font-size:var(--eidos-font-meta);font-weight:500;line-height:1.35;
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-status][data-tone="positive"]{
  color:var(--eidos-success);
  background:color-mix(in srgb,var(--eidos-success-bg) 72%,transparent);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-status][data-tone="neutral"]{
  color:var(--eidos-fg-muted);background:var(--eidos-bg-subtle);
}
[data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]>footer{
  justify-content:flex-start;margin-top:var(--eidos-space-xs);
}
[data-eidos-catalog-row-disclosure]{
  position:absolute;right:var(--eidos-space-xl);top:50%;
  transform:translateY(-50%);
  color:var(--eidos-fg-subtle);font-size:1.25rem;line-height:1;
  pointer-events:none;
}
@media (max-width:700px){
  [data-eidos-page-heading]{display:grid;grid-template-columns:minmax(0,1fr)}
  [data-eidos-page-actions]{justify-content:flex-start}
  [data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]{
    padding-right:38px;
  }
  [data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]>header{
    align-items:flex-start;
  }
  [data-eidos-capability="catalog-browser"][data-eidos-catalog-density="compact"] [data-eidos-catalog-item]>footer{
    justify-content:flex-start;margin-top:var(--eidos-space-xs);
  }
  [data-eidos-context-navigation-desktop]{display:none}
  [data-eidos-context-navigation-mobile]{
    display:flex;align-items:center;min-height:28px;
  }
  form[data-eidos-id] [data-eidos-form-actions]{
    justify-content:stretch;
  }
  form[data-eidos-id] [data-eidos-form-actions] button{
    flex:1 1 auto;min-height:var(--eidos-touch-target);
  }
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
  [data-eidos-text-scale-control] select{
    min-height:var(--eidos-touch-target);
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


/* Eidos Business Office Visual Language v0.2
   Business content dominates. Standard chrome is calm, approachable and
   office-oriented rather than resembling an IDE or developer console. */
body{
  font-family:var(--eidos-font-family);
  color:var(--eidos-fg);
  background:var(--eidos-bg-subtle);
}
[data-eidos-icon] [data-eidos-icon-accent]{color:currentColor}

[data-eidos-app-host-layout="workbench"],
[data-eidos-app-host-layout="workbench"][data-side-panel-visible="false"]{
  grid-template-rows:minmax(0,1fr);
  background:var(--eidos-bg-subtle);
}
[data-eidos-status-bar]{display:none}

[data-eidos-activity-bar]{
  padding:4px 0;
  border-right:1px solid var(--eidos-border);
  background:var(--eidos-bg-chrome);
}
[data-eidos-activity-primary],
[data-eidos-activity-secondary]{gap:2px}
[data-eidos-activity-bar] button{
  width:44px;
  height:44px;
  margin:0 6px;
  border:0;
  border-radius:var(--eidos-radius-md);
  background:transparent;
  color:var(--eidos-fg-muted);
  transition:background-color .12s ease,color .12s ease,box-shadow .12s ease;
}
[data-eidos-activity-bar] button:hover{
  background:var(--eidos-bg-hover);
  color:var(--eidos-fg);
}
[data-eidos-activity-bar] button[data-active="true"]{
  border:0;
  background:var(--eidos-bg-selected);
  color:var(--eidos-primary);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--eidos-primary) 10%,transparent);
}
[data-eidos-activity-label]{display:none}
[data-eidos-activity-icon] [data-eidos-icon]{
  width:21px;
  height:21px;
}

[data-eidos-side-panel]{
  border-right:1px solid var(--eidos-border);
  background:var(--eidos-bg-chrome);
}
[data-eidos-side-panel-header]{
  color:var(--eidos-fg);
  font-size:var(--eidos-font-compact);
  font-weight:650;
  letter-spacing:0;
  text-transform:none;
  background:var(--eidos-bg-chrome);
}
[data-eidos-side-panel-header] button{
  border-radius:var(--eidos-radius-md);
}
[data-eidos-workbench-navigation]{
  padding:var(--eidos-space-sm) var(--eidos-space-md) var(--eidos-space-lg);
}
[data-eidos-workbench-navigation] button{
  min-height:36px;
  border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  color:var(--eidos-fg);
  font-size:var(--eidos-font-compact);
}
[data-eidos-workbench-navigation] button:hover{
  background:var(--eidos-bg-hover);
}

[data-eidos-workspace]{background:var(--eidos-bg-subtle)}
[data-eidos-browser-toolbar]{
  min-height:52px;
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  border-bottom:1px solid var(--eidos-border);
  background:var(--eidos-bg);
}
[data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"] [data-eidos-browser-toolbar]{
  grid-template-columns:minmax(0,1fr);
}
[data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"][data-eidos-workspace-focus-eligible="true"] [data-eidos-browser-toolbar]{
  grid-template-columns:auto minmax(0,1fr);
}
[data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"][data-eidos-workspace-focus-eligible="true"] [data-eidos-global-controls]{
  grid-column:2;
}
@media(max-width:700px){
  [data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"][data-eidos-workspace-focus-eligible="true"] [data-eidos-global-controls]{grid-column:1}
  [data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"][data-eidos-workspace-focus-eligible="true"] [data-eidos-browser-toolbar]{
    grid-template-columns:minmax(0,1fr)
  }
}
[data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"] [data-eidos-browser-address],
[data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"] [data-eidos-browser-go],
[data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"] [data-eidos-browser-external]{
  display:none;
}
[data-eidos-app-host-layout="workbench"][data-eidos-workspace-mode="app"] [data-eidos-global-controls]{
  grid-column:1;
  width:100%;
  justify-content:flex-end;
  padding-left:0;
  border-left:0;
}
[data-eidos-browser-toolbar] input,
[data-eidos-global-control-select],
[data-eidos-global-controls] [data-eidos-locale-control] select,
[data-eidos-text-scale-control] select{
  border-color:var(--eidos-border);
  border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg-chrome);
}
[data-eidos-browser-toolbar] input:hover,
[data-eidos-global-control-select]:hover,
[data-eidos-global-controls] [data-eidos-locale-control] select:hover,
[data-eidos-text-scale-control] select:hover{
  border-color:var(--eidos-border-strong);
}
[data-eidos-account-avatar]{
  background:var(--eidos-primary-subtle);
  color:var(--eidos-primary);
}
[data-eidos-account-menu]{
  border-color:var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  box-shadow:var(--eidos-shadow-overlay);
}
[data-eidos-workspace-content]{
  padding:var(--eidos-space-section);
  background:var(--eidos-bg-subtle);
}

form[data-eidos-id],
[data-eidos-capability="catalog-browser"],
[data-eidos-settings-editor],
[data-eidos-help-document],
[data-eidos-setup-flow]{
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  box-shadow:var(--eidos-shadow-surface);
}
form[data-eidos-id] h1,
[data-eidos-capability="catalog-browser"]>header h1,
[data-eidos-settings-editor]>header h1,
[data-eidos-extension-manager-header] h1,
[data-eidos-help-header] h1,
[data-eidos-setup-header] h1,
[data-eidos-review-header] h1{
  color:var(--eidos-fg);
  font-weight:700;
  letter-spacing:-.018em;
}
[data-eidos-capability="catalog-browser"]>header p,
[data-eidos-extension-manager-header] p,
[data-eidos-help-summary],
[data-eidos-setup-header] p,
[data-eidos-review-header] p{
  color:var(--eidos-fg-muted);
}

form[data-eidos-id] input,
form[data-eidos-id] select,
[data-eidos-setting] input,
[data-eidos-setting] select,
[data-eidos-catalog-search] input,
[data-eidos-review-field-wrap] input,
[data-eidos-review-field-wrap] select,
[data-eidos-review-field-wrap] textarea{
  border-color:var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
}
form[data-eidos-id] input:focus,
form[data-eidos-id] select:focus,
[data-eidos-setting] input:focus,
[data-eidos-setting] select:focus,
[data-eidos-catalog-search] input:focus,
[data-eidos-review-field-wrap] input:focus,
[data-eidos-review-field-wrap] select:focus,
[data-eidos-review-field-wrap] textarea:focus{
  border-color:var(--eidos-primary);
  box-shadow:0 0 0 2px color-mix(in srgb,var(--eidos-primary) 14%,transparent);
}

[data-eidos-settings-form]>button,
form[data-eidos-id] button,
[data-eidos-catalog-item] button,
[data-eidos-catalog-item] [data-eidos-catalog-download],
[data-eidos-extension-item] button,
[data-eidos-capability="catalog-detail"] button,
[data-eidos-capability="catalog-detail"] [data-eidos-catalog-download],
[data-eidos-review-actions] button,
[data-eidos-setup-step-actions] button,
[data-eidos-setup-footer] button,
[data-eidos-chat-readiness-actions] button,
[data-eidos-chat-suggestions] button,
[data-eidos-chat-proposal-actions] button{
  border-color:var(--eidos-border-strong);
  border-radius:var(--eidos-radius-sm);
  background:var(--eidos-bg);
  color:var(--eidos-fg);
  box-shadow:none;
}
[data-eidos-settings-form]>button:hover,
form[data-eidos-id] button:hover,
[data-eidos-catalog-item] button:not([data-eidos-primary="true"]):hover,
[data-eidos-extension-item] button:not([data-eidos-primary="true"]):hover,
[data-eidos-capability="catalog-detail"] button:not([data-eidos-primary="true"]):hover{
  background:var(--eidos-bg-hover);
}
[data-eidos-settings-form]>button,
[data-eidos-catalog-item] button[data-eidos-primary="true"],
[data-eidos-extension-item] button[data-eidos-primary="true"],
[data-eidos-capability="catalog-detail"] button[data-eidos-primary="true"],
[data-eidos-capability="catalog-detail"] [data-eidos-catalog-download][data-eidos-primary="true"],
[data-eidos-review-actions] button[data-eidos-primary="true"],
[data-eidos-setup-step-actions] button[data-eidos-primary="true"],
[data-eidos-setup-footer] button[data-eidos-primary="true"],
[data-eidos-chat-readiness-actions] button[data-eidos-primary="true"],
[data-eidos-chat-proposal-actions] button[data-eidos-primary="true"]{
  border-color:var(--eidos-primary);
  background:var(--eidos-primary);
  color:var(--eidos-primary-fg);
}
[data-eidos-settings-form]>button:hover,
[data-eidos-catalog-item] button[data-eidos-primary="true"]:hover,
[data-eidos-extension-item] button[data-eidos-primary="true"]:hover,
[data-eidos-capability="catalog-detail"] button[data-eidos-primary="true"]:hover,
[data-eidos-review-actions] button[data-eidos-primary="true"]:hover,
[data-eidos-setup-step-actions] button[data-eidos-primary="true"]:hover,
[data-eidos-setup-footer] button[data-eidos-primary="true"]:hover{
  background:var(--eidos-primary-hover);
  border-color:var(--eidos-primary-hover);
}

[data-eidos-catalog-item],
[data-eidos-extension-item],
[data-eidos-catalog-detail-info],
[data-eidos-review-item],
[data-eidos-review-evidence],
[data-eidos-extension-host-card]{
  border-color:var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  box-shadow:var(--eidos-shadow-surface);
}
[data-eidos-catalog-item],
[data-eidos-extension-item]{
  transition:border-color .12s ease,box-shadow .12s ease;
}
[data-eidos-catalog-item]:hover,
[data-eidos-extension-item]:hover{
  border-color:var(--eidos-border-strong);
  box-shadow:var(--eidos-shadow-raised);
}
[data-eidos-catalog-thumbnail],
[data-eidos-catalog-detail-media]{
  border-color:var(--eidos-border);
  border-radius:var(--eidos-radius-md);
  background:var(--eidos-bg-subtle);
}
[data-eidos-catalog-status],
[data-eidos-extension-status],
[data-eidos-review-status],
[data-eidos-extension-readiness-badge]{
  border-color:var(--eidos-border);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg-muted);
}
[data-eidos-catalog-status][data-tone="positive"],
[data-eidos-extension-status][data-tone="positive"]{
  border-color:color-mix(in srgb,var(--eidos-success) 25%,var(--eidos-border));
  background:var(--eidos-success-bg);
}
[data-eidos-extension-status][data-tone="danger"]{
  border-color:color-mix(in srgb,var(--eidos-danger) 25%,var(--eidos-border));
  background:var(--eidos-danger-bg);
}
[data-eidos-action-status]{
  border:1px solid var(--eidos-border);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg);
  box-shadow:none;
}

[data-eidos-settings-editor][data-settings-version="0.2.0"] [data-eidos-settings-group],
[data-eidos-settings-editor][data-settings-version="0.2.0"] details[data-eidos-settings-group]{
  border-color:var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  box-shadow:var(--eidos-shadow-surface);
}
[data-eidos-settings-editor][data-settings-version="0.2.0"] details[data-eidos-settings-group]>summary{
  background:var(--eidos-bg);
}

[data-eidos-chat-suggestions] button{
  border-color:var(--eidos-border);
  background:var(--eidos-bg);
  box-shadow:var(--eidos-shadow-surface);
}
[data-eidos-chat-message][data-role="user"]{
  border-color:var(--eidos-border);
  background:var(--eidos-primary-subtle);
}
[data-eidos-chat-composer]{
  border-color:var(--eidos-border-strong);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  box-shadow:var(--eidos-shadow-raised);
}
[data-eidos-chat-composer]:focus-within{
  border-color:var(--eidos-primary);
  box-shadow:0 0 0 2px color-mix(in srgb,var(--eidos-primary) 12%,transparent),var(--eidos-shadow-raised);
}
[data-eidos-chat-composer] button{
  background:var(--eidos-primary);
  color:var(--eidos-primary-fg);
}

@media(max-width:1024px) and (min-width:701px){
  [data-eidos-app-host-layout="workbench"]{--eidos-activity-width:52px}
  [data-eidos-activity-bar] button{margin-inline:4px}
}

@media(max-width:700px){
  [data-eidos-activity-bar]{
    gap:0;
    padding-top:2px;
    background:color-mix(in srgb,var(--eidos-bg) 96%,transparent);
    backdrop-filter:blur(18px);
  }
  [data-eidos-activity-primary],
  [data-eidos-activity-secondary]{
    gap:0;
  }
  [data-eidos-activity-bar] button{
    width:64px;
    height:60px;
    min-width:64px;
    margin:1px 2px;
    display:grid;
    grid-template-rows:24px auto;
    place-items:center;
    align-content:center;
    gap:2px;
    border:0;
    border-radius:var(--eidos-radius-lg);
    padding:4px 3px;
  }
  [data-eidos-activity-bar] button[data-active="true"]{
    border:0;
    background:var(--eidos-bg-selected);
    color:var(--eidos-primary);
  }
  [data-eidos-activity-label]{
    display:block;
    width:100%;
    overflow:hidden;
    color:inherit;
    font-size:var(--eidos-font-meta);
    font-weight:600;
    line-height:1.05;
    text-align:center;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  [data-eidos-activity-icon] [data-eidos-icon]{
    width:20px;
    height:20px;
  }
  [data-eidos-side-panel]{
    background:var(--eidos-bg);
  }
  [data-eidos-side-panel-header]{
    background:var(--eidos-bg);
    font-weight:650;
  }
  [data-eidos-browser-toolbar]{
    border-bottom:1px solid var(--eidos-border);
    background:var(--eidos-bg);
  }
  [data-eidos-workspace-content]{
    padding:var(--eidos-space-lg)
      max(var(--eidos-space-lg),var(--eidos-safe-area-right))
      var(--eidos-space-xl)
      max(var(--eidos-space-lg),var(--eidos-safe-area-left));
    background:var(--eidos-bg-subtle);
  }
  form[data-eidos-id],
  [data-eidos-capability="catalog-browser"],
  [data-eidos-settings-editor],
  [data-eidos-settings-editor][data-settings-version="0.2.0"],
  [data-eidos-review-queue],
  [data-eidos-help-document],
  [data-eidos-setup-flow]{
    border:1px solid var(--eidos-border);
    border-radius:var(--eidos-radius-lg);
    padding:var(--eidos-space-lg);
    background:var(--eidos-bg);
    box-shadow:var(--eidos-shadow-surface);
  }
  [data-eidos-account-menu]{
    border-radius:var(--eidos-radius-xl);
    box-shadow:var(--eidos-shadow-overlay);
  }
  [data-eidos-catalog-item],
  [data-eidos-extension-item],
  [data-eidos-catalog-detail-info],
  [data-eidos-review-item]{
    border-radius:var(--eidos-radius-lg);
  }
}


/* Personal Agent conversation chrome.
   A primary chat is a Workbench task surface, not a card floating inside the canvas.
   Thread controls stay quiet, compact and progressively disclosed. */
[data-eidos-workspace-content]:has(> [data-eidos-chat]){
  padding:0;
  overflow:hidden;
  background:var(--eidos-bg);
}
[data-eidos-workspace-content] > [data-eidos-chat],
[data-eidos-side-panel] [data-eidos-chat]{
  height:100%;
  min-height:0;
  display:flex;
  flex-direction:column;
  background:var(--eidos-bg);
  container-type:inline-size;
  container-name:eidos-chat;
}
[data-eidos-side-panel] [data-eidos-chat-header] h1{
  display:none;
}
[data-eidos-workspace-content] > [data-eidos-chat] [data-eidos-chat-header]{
  min-height:var(--eidos-side-header-height);
  padding:0 var(--eidos-space-xl);
  background:var(--eidos-bg);
}
[data-eidos-chat-heading-group]{
  min-width:0;
  flex:1 1 auto;
  display:flex;
  align-items:center;
  gap:var(--eidos-space-md);
}
[data-eidos-chat-heading-group] h1{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
[data-eidos-chat-heading-group] [data-eidos-chat-context]{
  min-width:0;
  max-width:40%;
  flex:0 1 auto;
}
[data-eidos-chat-heading-group] [data-eidos-chat-context]>span{
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
[data-eidos-chat-heading-group] [data-eidos-chat-context]>strong{
  display:block;
  max-width:100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  padding:var(--eidos-space-xs) var(--eidos-space-md);
  border-radius:var(--eidos-radius-pill);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
  font-weight:600;
}
[data-eidos-chat-heading-group] [data-eidos-chat-context] select{
  width:auto;
  min-width:96px;
  max-width:240px;
  height:var(--eidos-control-compact);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-pill);
  padding:0 var(--eidos-space-md);
  background:var(--eidos-bg-subtle);
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
}
[data-eidos-chat-thread-controls]{
  width:auto;
  min-width:0;
  flex:0 0 auto;
  display:flex;
  align-items:center;
  gap:var(--eidos-space-xs);
}
[data-eidos-chat-thread-controls] details{
  position:relative;
}
[data-eidos-chat-thread-controls] summary{
  list-style:none;
}
[data-eidos-chat-thread-controls] summary::-webkit-details-marker{
  display:none;
}
[data-eidos-chat-new-thread],
[data-eidos-chat-history-toggle],
[data-eidos-chat-more-toggle]{
  min-height:var(--eidos-control-compact);
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:var(--eidos-space-sm);
  border:0;
  border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-md);
  background:transparent;
  color:var(--eidos-fg-muted);
  font-size:var(--eidos-font-meta);
  white-space:nowrap;
  cursor:pointer;
}
[data-eidos-chat-new-thread]:hover,
[data-eidos-chat-history-toggle]:hover,
[data-eidos-chat-more-toggle]:hover{
  background:var(--eidos-bg-hover);
  color:var(--eidos-fg);
}
[data-eidos-chat-history][open] > [data-eidos-chat-history-toggle],
[data-eidos-chat-more][open] > [data-eidos-chat-more-toggle]{
  background:var(--eidos-bg-selected);
  color:var(--eidos-primary);
}
[data-eidos-chat-more-toggle]{
  width:var(--eidos-control-compact);
  padding:0;
}
[data-eidos-chat-thread-controls] [data-eidos-icon]{
  width:16px;
  height:16px;
}
[data-eidos-chat-history-menu],
[data-eidos-chat-more-menu]{
  position:absolute;
  top:calc(100% + var(--eidos-space-xs));
  right:0;
  z-index:20;
  padding:var(--eidos-space-xs);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  box-shadow:var(--eidos-shadow-overlay);
}
[data-eidos-chat-history-menu]{
  width:min(320px,82vw);
}
[data-eidos-chat-more-menu]{
  min-width:160px;
}
[data-eidos-chat-history-list]{
  display:grid;
  gap:2px;
  max-height:320px;
  overflow:auto;
}
[data-eidos-chat-history-item],
[data-eidos-chat-archive-thread]{
  width:100%;
  min-height:var(--eidos-control-compact);
  border:0;
  border-radius:var(--eidos-radius-sm);
  padding:0 var(--eidos-space-md);
  background:transparent;
  color:var(--eidos-fg);
  font-size:var(--eidos-font-compact);
  text-align:left;
}
[data-eidos-chat-history-item]{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
[data-eidos-chat-history-item]:hover,
[data-eidos-chat-archive-thread]:hover{
  background:var(--eidos-bg-hover);
}
[data-eidos-chat-history-item][data-active="true"]{
  background:var(--eidos-bg-selected);
  color:var(--eidos-primary);
}
[data-eidos-chat-new-thread]:disabled,
[data-eidos-chat-history-toggle][aria-disabled="true"],
[data-eidos-chat-more-toggle][aria-disabled="true"]{
  cursor:not-allowed;
  opacity:.5;
}
[data-eidos-chat-thread-selector]{
  display:none;
}
[data-eidos-workspace-content] > [data-eidos-chat] [data-eidos-chat-transcript]{
  scrollbar-gutter:stable;
}

@container eidos-chat (max-width:520px){
  [data-eidos-chat-header]{
    display:grid;
    grid-template-columns:minmax(0,1fr);
    align-items:stretch;
    gap:var(--eidos-space-sm);
    min-height:auto;
    padding:var(--eidos-space-sm) var(--eidos-space-md);
  }
  [data-eidos-chat-heading-group]{
    width:100%;
    min-width:0;
  }
  [data-eidos-chat-heading-group] [data-eidos-chat-context]{
    max-width:50%;
  }
  [data-eidos-chat-thread-controls]{
    width:100%;
    justify-content:flex-end;
  }
  [data-eidos-chat-context] select{
    min-width:0;
    max-width:100%;
  }
}

@container eidos-chat (max-width:360px){
  [data-eidos-chat-heading-group]{
    align-items:flex-start;
    flex-direction:column;
    gap:var(--eidos-space-xs);
  }
  [data-eidos-chat-heading-group] [data-eidos-chat-context]{
    width:100%;
    max-width:none;
  }
  [data-eidos-chat-toolbar-label]{
    display:none;
  }
  [data-eidos-chat-new-thread],
  [data-eidos-chat-history-toggle]{
    width:var(--eidos-control-compact);
    padding:0;
  }
}

/* Generic Eidos grouped form review: no product names, source data or decisions. */
[data-eidos-form-review-groups]{display:grid;gap:0;margin-top:var(--eidos-space-lg);border-block-start:1px solid var(--eidos-border)}
[data-eidos-form-review-group]{padding:var(--eidos-space-md) 0;border-block-end:1px solid var(--eidos-border);min-width:0}
[data-eidos-review-group-heading]{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,1fr);gap:var(--eidos-space-lg);align-items:center}
[data-eidos-review-group-heading]>div{min-width:0}
[data-eidos-review-group-heading] strong{display:block;font-size:var(--eidos-font-compact)}
[data-eidos-review-group-heading] p{color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact);margin:var(--eidos-space-xs) 0 0;overflow-wrap:anywhere}
[data-eidos-form-review-group] [data-eidos-form-field] label{margin:0}
[data-eidos-form-review-group] [data-eidos-form-field] select{margin-top:var(--eidos-space-xs)}
[data-eidos-review-group-detail]{margin-top:var(--eidos-space-sm);min-width:0}
[data-eidos-review-group-detail]>summary{cursor:pointer;color:var(--eidos-primary);font-weight:600;font-size:var(--eidos-font-compact);min-height:32px;display:list-item;align-content:center}
[data-eidos-review-group-detail]>summary:focus-visible{outline:2px solid var(--eidos-primary);outline-offset:2px}
[data-eidos-review-group-fields]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--eidos-space-md);padding:var(--eidos-space-md) 0}
[data-eidos-review-group-fields]>[data-eidos-form-field]{min-width:0}
@media(max-width:680px){
 [data-eidos-review-group-heading]{grid-template-columns:minmax(0,1fr);gap:var(--eidos-space-sm)}
 [data-eidos-review-group-fields]{grid-template-columns:minmax(0,1fr)}
}

/* Optional domain-neutral heading before the E2 decision table. */
[data-eidos-form-review-table-heading]{
  display:grid;grid-template-columns:minmax(0,1fr) auto;
  column-gap:var(--eidos-space-md);row-gap:var(--eidos-space-xs);
  margin-top:var(--eidos-space-section);min-width:0
}
[data-eidos-form-review-table-heading] h2{grid-column:1;grid-row:1}
[data-eidos-form-review-table-heading] p{grid-column:1;grid-row:2}
[data-eidos-form-review-table-utility-nav]{
  grid-column:2;grid-row:1 / span 2;justify-self:end;
  min-width:0;max-width:100%;font-size:var(--eidos-font-compact)
}
[data-eidos-form-review-table-utility-nav] summary{
  display:flex;align-items:center;min-height:var(--eidos-control-normal);
  cursor:pointer;color:var(--eidos-primary);font-weight:600;
  padding:0 var(--eidos-space-sm);border-radius:var(--eidos-radius-md);
  border:1px solid var(--eidos-border-strong);background:var(--eidos-bg);
}
[data-eidos-form-review-table-utility-nav] summary:focus-visible{
  outline:2px solid var(--eidos-focus);outline-offset:2px
}
[data-eidos-form-review-table-utility-links]{
  display:grid;gap:var(--eidos-space-xs);padding-top:var(--eidos-space-xs)
}
[data-eidos-form-review-table-utility-links] button{
  text-align:left;white-space:normal;overflow-wrap:anywhere;
  border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-md);
  padding:var(--eidos-space-sm);min-height:var(--eidos-control-normal);
  background:var(--eidos-bg);color:var(--eidos-primary);cursor:pointer
}
[data-eidos-form-review-table-utility-links] button:focus-visible{
  outline:2px solid var(--eidos-focus);outline-offset:2px
}
@media(max-width:700px){
  [data-eidos-form-review-table-utility-nav]{
    grid-column:1 / -1;grid-row:auto;justify-self:start
  }
  [data-eidos-form-review-table-utility-nav] summary,
  [data-eidos-form-review-table-utility-links] button{min-height:44px}
}
[data-eidos-form-review-table-heading] h2{
  margin:0;color:var(--eidos-fg);font-size:var(--eidos-font-section)
}
[data-eidos-form-review-table-heading] p{
  margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact)
}
[data-eidos-form-review-table-heading]+[data-eidos-form-review-table-wrap]{
  margin-top:var(--eidos-space-md)
}
/* Eidos E2: domain-neutral editable review table, never a product-specific mapping skin. */
[data-eidos-form-review-table-wrap]{
  min-width:0;
  margin-block:var(--eidos-space-lg);
  background:var(--eidos-bg);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  overflow:hidden;
}
[data-eidos-form-review-table-toolbar]{
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  align-items:center;
  gap:var(--eidos-space-sm);
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  border-bottom:1px solid var(--eidos-border);
}
[data-eidos-form-review-table-toolbar-context]{display:grid;gap:var(--eidos-space-xs);min-width:0}
[data-eidos-form-review-table-toolbar-hint]{
  margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);
  overflow-wrap:anywhere;
}
[data-eidos-form-review-table-footnote]{
  margin:0;padding:var(--eidos-space-md) var(--eidos-space-lg);
  background:var(--eidos-bg-subtle);border-top:1px solid var(--eidos-border);
  color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);
}
[data-eidos-form-review-table-toolbar-tools]{
  display:flex;align-items:center;justify-content:flex-end;
  flex-wrap:wrap;gap:var(--eidos-space-sm);min-width:0
}
[data-eidos-review-table-agent-action]{
  min-height:var(--eidos-control-normal);border-radius:var(--eidos-radius-md);
  border:1px solid var(--eidos-border-strong);background:var(--eidos-bg);
  color:var(--eidos-primary);padding:0 var(--eidos-space-md);
  font-size:var(--eidos-font-compact);font-weight:600;cursor:pointer
}
[data-eidos-review-table-agent-action]:focus-visible{
  outline:2px solid var(--eidos-focus);outline-offset:2px
}
[data-eidos-review-table-agent-action]:disabled{opacity:.5;cursor:wait}
[data-eidos-form-review-table-toolbar] label{
  display:flex;
  gap:var(--eidos-space-sm);
  align-items:center;
  min-width:0;
  font-size:var(--eidos-font-compact);
}
[data-eidos-form-review-table-toolbar] select{
  background:var(--eidos-bg);
  color:var(--eidos-fg);
  border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-md);
  min-height:var(--eidos-control-normal);
  padding-inline:var(--eidos-space-sm);
}
[data-eidos-form-review-table-toolbar] select:focus-visible{
  outline:2px solid var(--eidos-focus);
  outline-offset:2px;
}
[data-eidos-form-review-table-count]{
  font-size:var(--eidos-font-meta);
  color:var(--eidos-fg-muted);
  font-variant-numeric:tabular-nums;
}
[data-eidos-form-review-table-scroll]{
  max-width:100%;
  overflow-x:auto;
}
[data-eidos-form-review-table-row][hidden]{display:none !important}
[data-eidos-form-review-table]{
  width:100%;
  min-width:680px;
  border-collapse:collapse;
  table-layout:fixed;
}
[data-eidos-form-review-table] thead{
  background:var(--eidos-bg-subtle);
}
[data-eidos-form-review-table] th,
[data-eidos-form-review-table] td{
  padding:var(--eidos-space-md);
  text-align:start;
  vertical-align:middle;
  border-bottom:1px solid var(--eidos-border);
  font-size:var(--eidos-font-compact);
  overflow-wrap:anywhere;
}
[data-eidos-form-review-table] thead th{
  color:var(--eidos-fg-muted);
  font-weight:650;
  font-size:var(--eidos-font-meta);
}
[data-eidos-form-review-table] th:first-child{width:20%}
[data-eidos-form-review-table] th:nth-child(2){width:25%}
[data-eidos-form-review-table] th:nth-child(3){width:38%}
[data-eidos-form-review-table] th:nth-child(4){width:17%}
[data-eidos-review-table-subject]{color:var(--eidos-fg)}
[data-eidos-review-table-evidence]{color:var(--eidos-fg-muted)}
[data-eidos-review-table-status]{
  font-size:var(--eidos-font-meta);
  color:var(--eidos-fg-muted);
}
[data-eidos-review-table-status][data-tone="warning"]{color:var(--eidos-warning)}
[data-eidos-review-table-status][data-tone="positive"]{color:var(--eidos-success)}
[data-eidos-review-table-choice]>[data-eidos-form-field]{margin:0}
[data-eidos-review-table-choice] [data-eidos-form-field] label{
  display:grid;
  gap:var(--eidos-space-xs);
  font-weight:500;
}
[data-eidos-review-table-choice] [data-eidos-form-field] select,
[data-eidos-review-table-choice] [data-eidos-form-field] input{
  width:100%;
  max-width:100%;
  min-height:var(--eidos-control-normal);
}
/* E4: a collapsed disclosure belongs beside its evidence, not in a full-width
   second table row. Expanded details grow only the owning source row. */
[data-eidos-review-table-evidence] [data-eidos-review-group-detail]{
  margin-top:var(--eidos-space-xs);
  min-width:0;
}
[data-eidos-review-table-evidence] [data-eidos-review-group-detail]>summary{
  font-size:var(--eidos-font-meta);
  font-weight:600;
  min-height:var(--eidos-control-normal);
}
[data-eidos-review-table-evidence] [data-eidos-review-group-fields]{
  grid-template-columns:minmax(0,1fr);
  gap:var(--eidos-space-xs);
  padding:var(--eidos-space-sm) 0 0;
}
[data-eidos-review-table-evidence] [data-eidos-review-group-fields] input{
  min-width:0;
  width:100%;
  max-width:100%;
}
[data-eidos-form-review-table-empty]{
  padding:var(--eidos-space-lg);
  margin:0;
  color:var(--eidos-fg-muted);
}
@media(max-width:700px){
 [data-eidos-form-review-table-scroll]{overflow:visible}
 [data-eidos-form-review-table]{display:block;min-width:0}
 [data-eidos-form-review-table] thead{
   position:absolute;width:1px;height:1px;padding:0;margin:-1px;
   overflow:hidden;clip-path:inset(50%);white-space:nowrap;
 }
 [data-eidos-form-review-table] tbody{
   display:block;
   margin:var(--eidos-space-sm);
   border:1px solid var(--eidos-border);
   border-radius:var(--eidos-radius-md);
   min-width:0;
   overflow:hidden;
 }
 /* Keep source identity and read-only status in one glanceable header.
    Editable target and evidence remain full width for 44px touch controls. */
 [data-eidos-form-review-table] tbody>tr{
   display:grid;
   grid-template-columns:minmax(0,1fr) auto;
   align-items:start;
   column-gap:var(--eidos-space-xs);
 }
 [data-eidos-form-review-table] tbody th[data-eidos-review-table-subject]{
   grid-column:1;
   grid-row:1;
   width:100%;
   min-width:0;
   align-self:center;
 }
 [data-eidos-form-review-table] tbody td[data-eidos-review-table-status]{
   grid-column:2;
   grid-row:1;
   align-self:center;
   justify-self:end;
   width:auto;
   white-space:nowrap;
   text-align:end;
 }
 [data-eidos-form-review-table] tbody td[data-eidos-review-table-status][data-heading]:before{
   display:none;
 }
 [data-eidos-form-review-table] tbody td[data-eidos-review-table-evidence],
 [data-eidos-form-review-table] tbody td[data-eidos-review-table-choice]{
   grid-column:1/-1;
 }
 [data-eidos-form-review-table] tbody th,
 [data-eidos-form-review-table] tbody td{
   display:block;
   width:100%;
   min-width:0;
   border-bottom:0;
   padding:var(--eidos-space-sm) var(--eidos-space-md);
 }
 [data-eidos-form-review-table] tbody th{font-size:var(--eidos-font-compact)}
 [data-eidos-form-review-table] tbody td[data-heading]:before{
   content:attr(data-heading);
   display:block;
   font-size:var(--eidos-font-meta);
   color:var(--eidos-fg-subtle);
   margin-bottom:var(--eidos-space-xs);
 }
 [data-eidos-form-review-table] select,
 [data-eidos-form-review-table] input{min-height:44px}
 [data-eidos-form-review-table-toolbar] label{width:100%}
 [data-eidos-form-review-table-toolbar] select{flex:1;min-width:0}
 [data-eidos-review-table-evidence] [data-eidos-review-group-detail]>summary{min-height:44px}
}


/* Generic compact Human review rows; field labels remain screen-reader visible. */
[data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
  [data-eidos-review-table-choice-label]{
  position:absolute;width:1px;height:1px;padding:0;margin:-1px;
  overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0
}
[data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
  [data-eidos-form-review-table] th,
[data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
  [data-eidos-form-review-table] td{padding:var(--eidos-space-sm) var(--eidos-space-md)}
[data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
  [data-eidos-review-table-choice] [data-eidos-form-field] label{display:block;gap:0;line-height:normal}
[data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
  [data-eidos-review-table-choice] select{min-height:var(--eidos-control-normal)}
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
  [data-eidos-form-review-table-toolbar] label{white-space:nowrap;flex-wrap:nowrap}
@media(max-width:700px){
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
   [data-eidos-form-review-table-toolbar-tools]{width:100%;justify-content:space-between}
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
   [data-eidos-review-table-agent-action]{min-height:44px}
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
   [data-eidos-form-review-table-toolbar-context]{width:100%}
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
   [data-eidos-review-table-choice] select{min-height:44px}
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
   [data-eidos-form-review-table-toolbar] label{white-space:normal;width:100%}
}

/* Optional compact desktop evidence only. Open details regain their full width.
   Default tables and 44px mobile controls preserve existing layout. */
@media(min-width:701px){
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"][data-eidos-review-table-evidence-layout="inline-collapsed"]
 [data-eidos-review-table-evidence] [data-eidos-review-group-detail]:not([open]){
   display:inline-block;vertical-align:middle;
   margin:0 0 0 var(--eidos-space-sm);max-width:100%;
 }
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"][data-eidos-review-table-evidence-layout="inline-collapsed"]
 [data-eidos-review-table-evidence] [data-eidos-review-group-detail]:not([open])>summary{
   min-height:var(--eidos-control-normal);
 }
 /* Native compact choice controls were visually 36px tall, yet inherited
    12px label margins above and below inflated table rows to 73px.
    Keep a small breathing space only for this opted-in desktop surface. */
 [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"][data-eidos-review-table-evidence-layout="inline-collapsed"]
 [data-eidos-review-table-choice] [data-eidos-form-field] label{
   margin:3px 0;
 }
}
/* Opt-in Human review workbench: show the original source, the actual counts,
   and every actionable blocker before choices; never conceal business facts. */
[data-eidos-form-task-overview][data-eidos-task-presentation="workbench"]{
  gap:var(--eidos-space-md);
  margin-block:var(--eidos-space-section);
  min-width:0
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-steps]{
  justify-content:flex-end;gap:var(--eidos-space-md);min-width:0
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-context]{
  background:var(--eidos-bg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);padding:var(--eidos-space-lg)
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-identity] strong{
  font-size:var(--eidos-font-section)
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-identity][data-eidos-form-task-has-icon="true"]{
  grid-template-columns:auto minmax(0,1fr);align-items:center;column-gap:var(--eidos-space-md)
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-source-status][data-tone="positive"]{
  color:var(--eidos-success);
  background:color-mix(in srgb,var(--eidos-success) 11%,var(--eidos-bg));
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-source-status][data-tone="warning"]{
  color:var(--eidos-warning);
  background:color-mix(in srgb,var(--eidos-warning) 11%,var(--eidos-bg));
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-icon]{
  display:grid;place-items:center;min-width:46px;min-height:46px;
  border-radius:var(--eidos-radius-md);padding:var(--eidos-space-xs);
  background:var(--eidos-bg-subtle);color:var(--eidos-success);
  font-size:var(--eidos-font-compact);font-weight:var(--eidos-weight-semibold)
}
form[data-eidos-id] [data-eidos-form-task-save-hint]{
  margin-right:auto;color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta)
}
@media(max-width:520px){
  form[data-eidos-id] [data-eidos-form-task-save-hint]{flex-basis:100%}
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-metrics]{
  grid-template-columns:repeat(4,minmax(0,1fr))
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-metric]{
  padding:var(--eidos-space-md) var(--eidos-space-lg)
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-metric][data-tone="warning"]{
  border-color:color-mix(in srgb,var(--eidos-warning) 33%,var(--eidos-border));
  background:color-mix(in srgb,var(--eidos-warning) 3%,var(--eidos-bg));
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]{
  background:var(--eidos-bg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);padding:var(--eidos-space-md);
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]>header h2{
  color:var(--eidos-fg)
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]>ol{
  background:var(--eidos-bg-subtle)
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-help]{
  color:var(--eidos-fg-muted)
}
@media(max-width:850px){
 [data-eidos-task-presentation="workbench"] [data-eidos-form-task-steps]{
   justify-content:flex-start;flex-wrap:wrap
 }
 [data-eidos-task-presentation="workbench"] [data-eidos-form-task-metrics]{
   grid-template-columns:repeat(2,minmax(0,1fr))
 }
}
@media(max-width:360px){
  [data-eidos-form-task-context]{grid-template-columns:minmax(0,1fr)}
  [data-eidos-form-task-identity]{grid-column:1;grid-row:auto}
  [data-eidos-form-task-source-status]{grid-column:1;grid-row:auto;justify-self:start;max-width:100%;text-align:left}
}
@media(max-width:520px){
 [data-eidos-task-presentation="workbench"] [data-eidos-form-task-context]{
   padding:var(--eidos-space-md)
 }
 [data-eidos-task-presentation="workbench"] [data-eidos-form-task-metrics]{
   gap:var(--eidos-space-sm)
 }
 [data-eidos-task-presentation="workbench"] [data-eidos-form-task-metric]{
   padding:var(--eidos-space-md)
 }
 [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]{
   padding:var(--eidos-space-sm)
 }
}


/* Opt-in, accessible two-stage workbench hierarchy. Existing non-workbench
   process indicators remain unchanged; the business app supplies state. */
[data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"]{
  counter-reset:eidos-workbench-step;gap:var(--eidos-space-lg);
}
[data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"] li{
  counter-increment:eidos-workbench-step;position:relative;gap:var(--eidos-space-sm);
}
[data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"] li::before{
  content:counter(eidos-workbench-step);
  width:24px;height:24px;box-sizing:border-box;
  display:grid;place-items:center;flex:0 0 24px;
  border-radius:50%;border:1px solid var(--eidos-border-strong);
  background:var(--eidos-bg-subtle);color:var(--eidos-fg-muted);
  font-weight:700;font-size:var(--eidos-font-meta);
}
[data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"]
  li[data-eidos-task-step-state="complete"]::before{
  content:"✓";background:var(--eidos-bg-subtle);
  border-color:var(--eidos-success);color:var(--eidos-success);
}
[data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"]
  li[data-eidos-task-step-state="current"]::before{
  background:var(--eidos-primary);border-color:var(--eidos-primary);
  color:var(--eidos-bg);
}
[data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"] li+li{
  margin-inline-start:var(--eidos-space-lg);
}
[data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"] li+li::after{
  content:"";position:absolute;inset-inline-start:calc(-1 * (var(--eidos-space-lg) + var(--eidos-space-md)));
  top:50%;width:var(--eidos-space-lg);height:1px;background:var(--eidos-border-strong);
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]>header{
  display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;
  column-gap:var(--eidos-space-md);
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]>header h2{
  grid-column:1;grid-row:1;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]>header p{
  grid-column:1;grid-row:2;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-count]{
  grid-column:2;grid-row:1 / span 2;
  padding:var(--eidos-space-xs) var(--eidos-space-sm);
  border-radius:var(--eidos-radius-lg);
  color:var(--eidos-warning);
  background:color-mix(in srgb,var(--eidos-warning) 10%,var(--eidos-bg));
  font-size:var(--eidos-font-meta);white-space:nowrap;
}
@media(max-width:520px){
  [data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"]{
    gap:var(--eidos-space-sm);
  }
  [data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"] li+li{
    margin-inline-start:var(--eidos-space-sm);
  }
  [data-eidos-form-task-steps][data-eidos-task-steps-presentation="workbench"] li+li::after{
    display:none;
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-count]{
    align-self:start;
  }
}

/* Eidos E3: generic Human review task overview. Business facts stay Host-owned. */
[data-eidos-form-task-overview]{display:grid;gap:var(--eidos-space-lg);min-width:0;margin-block:var(--eidos-space-lg)}
/* Eidos: optional Human decision-first task summary. All evidence, issue
   focus buttons and metrics remain operable inside a native disclosure. */
[data-eidos-form-task-overview][data-eidos-task-presentation="decision-first"]{
  gap:var(--eidos-space-xs);margin-block:var(--eidos-space-sm)
}
[data-eidos-form-task-details]{
  background:var(--eidos-bg);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);min-width:0
}
[data-eidos-form-task-details]>summary{
  cursor:pointer;min-height:44px;box-sizing:border-box;
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  color:var(--eidos-fg);font-size:var(--eidos-font-compact);
  overflow-wrap:anywhere
}
[data-eidos-form-task-details]>summary:focus-visible{
  outline:2px solid var(--eidos-focus);outline-offset:2px
}
[data-eidos-form-task-details]>summary strong{
  font-weight:650;overflow-wrap:anywhere
}
[data-eidos-task-summary-issues]{
  margin-inline-start:var(--eidos-space-md);
  font-size:var(--eidos-font-meta);color:var(--eidos-warning)
}
[data-eidos-form-task-details-content]{
  display:grid;gap:var(--eidos-space-md);padding:var(--eidos-space-lg);
  border-top:1px solid var(--eidos-border);min-width:0
}

[data-eidos-form-task-steps]{display:flex;flex-wrap:wrap;align-items:center;gap:var(--eidos-space-md);padding:0;margin:0;list-style:none;color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact)}
[data-eidos-form-task-steps] li{display:flex;gap:var(--eidos-space-sm);align-items:center}
[data-eidos-form-task-steps] li:before{content:"";width:8px;height:8px;border-radius:50%;border:2px solid var(--eidos-border-strong);background:var(--eidos-bg)}
[data-eidos-form-task-steps] li[data-eidos-task-step-state="complete"]:before{background:var(--eidos-success);border-color:var(--eidos-success)}
[data-eidos-form-task-steps] li[data-eidos-task-step-state="current"]{font-weight:650;color:var(--eidos-fg)}
[data-eidos-form-task-steps] li[data-eidos-task-step-state="current"]:before{background:var(--eidos-primary);border-color:var(--eidos-primary)}
[data-eidos-form-task-context]{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--eidos-space-sm) var(--eidos-space-lg);padding:var(--eidos-space-lg);background:var(--eidos-bg);border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-lg);min-width:0}
[data-eidos-form-task-identity]{display:grid;gap:var(--eidos-space-xs);min-width:0}
[data-eidos-form-task-identity] strong{font-size:var(--eidos-font-section);overflow-wrap:anywhere}
[data-eidos-form-task-identity] p{margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact);overflow-wrap:anywhere}
[data-eidos-form-task-source-status]{align-self:center;border-radius:var(--eidos-radius-md);padding:var(--eidos-space-xs) var(--eidos-space-sm);color:var(--eidos-fg-muted);background:var(--eidos-bg-subtle);font-size:var(--eidos-font-meta)}
[data-eidos-form-task-facts]{display:flex;flex-wrap:wrap;grid-column:1/-1;gap:var(--eidos-space-lg);padding:var(--eidos-space-sm) 0 0;margin:0;border-top:1px solid var(--eidos-border)}
[data-eidos-form-task-fact]{display:grid;gap:var(--eidos-space-xs);min-width:0}
[data-eidos-form-task-fact] dt{color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta)}
[data-eidos-form-task-fact] dd{margin:0;color:var(--eidos-fg);font-size:var(--eidos-font-compact);overflow-wrap:anywhere}
[data-eidos-form-task-metrics]{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,156px),1fr));gap:var(--eidos-space-sm)}
[data-eidos-form-task-metric]{display:grid;gap:var(--eidos-space-xs);background:var(--eidos-bg);border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-lg);padding:var(--eidos-space-lg);min-width:0}
[data-eidos-form-task-metric] strong{font-size:var(--eidos-font-page);font-variant-numeric:tabular-nums;color:var(--eidos-fg);line-height:1.15}
[data-eidos-form-task-metric] span{font-size:var(--eidos-font-compact);color:var(--eidos-fg-muted);overflow-wrap:anywhere}
[data-eidos-form-task-metric][data-tone="warning"] strong{color:var(--eidos-warning)}
[data-eidos-form-task-metric][data-tone="danger"] strong{color:var(--eidos-danger)}
[data-eidos-form-task-issues]{min-width:0}
[data-eidos-form-task-issues]>header{margin:0 0 var(--eidos-space-md)}
[data-eidos-form-task-issues]>header h2{margin:0;font-size:var(--eidos-font-section)}
[data-eidos-form-task-issues]>header p{margin:var(--eidos-space-xs) 0 0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact)}
[data-eidos-form-task-issues]>ol{list-style:none;margin:0;padding:0;border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-lg);background:var(--eidos-bg)}
[data-eidos-form-task-issues] li{display:flex;justify-content:space-between;align-items:center;gap:var(--eidos-space-lg);padding:var(--eidos-space-md) var(--eidos-space-lg);border-bottom:1px solid var(--eidos-border);min-width:0}
[data-eidos-form-task-issues] li:last-child{border-bottom:0}
[data-eidos-form-task-issues] li>div{min-width:0}
[data-eidos-form-task-issues] li strong{font-size:var(--eidos-font-compact);overflow-wrap:anywhere}
[data-eidos-form-task-issues] li p{margin:var(--eidos-space-xs) 0 0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);overflow-wrap:anywhere}
[data-eidos-form-task-issues] li button{flex:0 0 auto;border:1px solid var(--eidos-border-strong);background:var(--eidos-bg);color:var(--eidos-primary);border-radius:var(--eidos-radius-md);padding:var(--eidos-space-sm) var(--eidos-space-md);min-height:var(--eidos-control-normal);font-size:var(--eidos-font-compact);font-weight:600;cursor:pointer}
[data-eidos-form-task-issues] li button:focus-visible{outline:2px solid var(--eidos-focus);outline-offset:2px}
[data-eidos-form-task-help]{font-size:var(--eidos-font-compact);color:var(--eidos-fg-muted);margin:0}
@media(max-width:680px){
  [data-eidos-form-task-context]{grid-template-columns:minmax(0,1fr) auto;align-items:start}
  [data-eidos-form-task-identity]{grid-column:1;grid-row:1}
  [data-eidos-form-task-source-status]{grid-column:2;grid-row:1;justify-self:end;align-self:start;max-width:42vw;white-space:normal;text-align:right}
  [data-eidos-form-task-facts]{grid-column:1/-1}
  [data-eidos-form-task-issues] li{flex-wrap:wrap;gap:var(--eidos-space-sm)}
  [data-eidos-form-task-issues] li button{min-height:44px}
}


/* E6: evidence-led decision preview; presentation only, never Host approval. */
[data-eidos-form-review-plan]{
  margin-block:var(--eidos-space-lg);
  padding:var(--eidos-space-lg);
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  display:grid;
  gap:var(--eidos-space-md);
  min-width:0;
}
[data-eidos-form-review-plan] header{display:grid;gap:var(--eidos-space-xs)}
[data-eidos-form-review-plan] h2{margin:0;font-size:var(--eidos-font-section);color:var(--eidos-fg)}
[data-eidos-form-review-plan] header p{
  margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-compact);
}
[data-eidos-review-plan-counts]{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(min(100%,128px),1fr));
  gap:var(--eidos-space-sm);margin:0;
}
[data-eidos-review-plan-counts]>div{
  padding:var(--eidos-space-sm);border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-md);display:grid;gap:var(--eidos-space-xs);
}
[data-eidos-review-plan-counts] strong{font-size:var(--eidos-font-page);font-variant-numeric:tabular-nums}
[data-eidos-review-plan-counts] span{font-size:var(--eidos-font-compact);color:var(--eidos-fg-muted)}
[data-eidos-review-plan-items]{
  margin:0;padding:0;list-style:none;
  display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));
  gap:var(--eidos-space-xs);
}
[data-eidos-review-plan-items] li{
  padding:var(--eidos-space-sm);border-bottom:1px solid var(--eidos-border);
  display:grid;gap:var(--eidos-space-xs);min-width:0;
}
[data-eidos-review-plan-items] li strong{
  font-size:var(--eidos-font-compact);overflow-wrap:anywhere;
}
[data-eidos-review-plan-items] li span{
  font-size:var(--eidos-font-meta);color:var(--eidos-fg-muted);
  overflow-wrap:anywhere;
}
[data-eidos-review-plan-warning]{
  margin:0;color:var(--eidos-fg-muted);font-size:var(--eidos-font-meta);
}
/* Verified row-correction links within a workbench issue. Native disclosure
   preserves layout and keyboard behavior; navigation is Host-owned. */
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related]{
  align-self:start;min-width:0;max-width:100%;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related] summary{
  display:flex;align-items:center;justify-content:center;
  min-height:var(--eidos-control-normal);box-sizing:border-box;
  padding:0 var(--eidos-space-sm);border:1px solid var(--eidos-border-strong);
  border-radius:var(--eidos-radius-md);background:var(--eidos-bg);
  color:var(--eidos-primary);font-size:var(--eidos-font-compact);
  font-weight:600;cursor:pointer;list-style:none;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related] summary::-webkit-details-marker{display:none}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related] summary:focus-visible{
  outline:2px solid var(--eidos-focus);outline-offset:2px;
}
/* An expanded issue reveals the complete row list underneath its title,
   rather than leaving a tall empty left column beside vertically stacked links. */
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]
  li > [data-eidos-form-task-issue-related][open]{
  grid-column:2 / -1;grid-row:2;justify-self:stretch;width:100%;max-width:none;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related][open] summary{
  width:max-content;max-width:100%;margin-inline-start:auto;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related-links]{
  display:flex;flex-wrap:wrap;gap:var(--eidos-space-xs);
  margin-top:var(--eidos-space-sm);padding:var(--eidos-space-sm);
  background:var(--eidos-bg-subtle);border-radius:var(--eidos-radius-md);
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related-links] button{
  min-height:var(--eidos-control-normal);white-space:nowrap;
}
@media(max-width:850px){
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related]{
    grid-column:2;justify-self:start;
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related] summary,
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-related-links] button{
    min-height:44px;
  }
}
/* BEX-01 workbench parity: distinct, numbered Human actions rather than one
   undifferentiated grey list. Only the opt-in workbench presentation changes. */
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]{
  border:0;background:transparent;padding:0;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]>ol{
  display:grid;gap:var(--eidos-space-sm);counter-reset:eidos-workbench-issue;
  border:0;background:transparent;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues] li{
  display:grid;grid-template-columns:28px minmax(0,1fr) auto;
  align-items:start;gap:var(--eidos-space-md);
  padding:var(--eidos-space-md) var(--eidos-space-lg);
  border:1px solid color-mix(in srgb,var(--eidos-warning) 30%,var(--eidos-border));
  border-radius:var(--eidos-radius-lg);background:var(--eidos-bg);
  counter-increment:eidos-workbench-issue;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues] li::before{
  content:counter(eidos-workbench-issue);display:grid;place-items:center;
  width:24px;height:24px;border-radius:50%;
  background:var(--eidos-bg-subtle);color:var(--eidos-warning);
  font-size:var(--eidos-font-meta);font-weight:700;
}
[data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues] li button{
  align-self:center;
}
@media(max-width:850px){
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues] li{
    grid-template-columns:28px minmax(0,1fr);
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues] li button{
    grid-column:2;justify-self:start;align-self:start;
  }
}


/* An opt-in connected list matches continuous review prototypes while keeping
   the Eidos #204 independent numbered-card default, action semantics and DOM.
   No owner PR or generic issue-card presentation is overwritten. */
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issues][data-eidos-task-issues-layout="connected"]>ol{
  display:grid;gap:0;overflow:hidden;
  border:1px solid color-mix(in srgb,var(--eidos-warning) 32%,var(--eidos-border));
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
}
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issues][data-eidos-task-issues-layout="connected"]>ol>li{
  margin:0;border:0;border-radius:0;
  background:transparent;
}
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issues][data-eidos-task-issues-layout="connected"]>ol>li+li{
  border-top:1px solid var(--eidos-border);
}

/* Desktop workbench source, summary and issue hierarchy. Keep mobile density
   and the independently governed compact evidence table unchanged. */
@media(min-width:851px){
  [data-eidos-form-task-overview][data-eidos-task-presentation="workbench"]{
    gap:24px;
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-context]{
    padding-block:calc(var(--eidos-space-lg) + 7px);
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-metric]{
    padding-block:calc(var(--eidos-space-md) + 15px);
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues] li{
    padding-block:calc(var(--eidos-space-md) + 15px);
  }
}

/* Opt-in 390px Human review rhythm, isolated to Workbench presentation.
   Leave true source filenames, row evidence and mobile 44px controls intact. */
@media(max-width:520px){
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-metric]{
    padding-block:calc(var(--eidos-space-md) + 9px);
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues]>header{
    grid-template-columns:minmax(0,1fr);
    row-gap:var(--eidos-space-sm);
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issue-count]{
    grid-column:1;grid-row:3;justify-self:start;
  }
  [data-eidos-task-presentation="workbench"] [data-eidos-form-task-issues] li{
    padding-block:calc(var(--eidos-space-md) + 11px);
  }
}

/* Opt-in compact phone mapping: put the still-visible source example beside
   its native source disclosure. Open evidence spans full width, never hides
   the original record and retains the 44px touch affordance. */
@media(max-width:700px){
  [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
    [data-eidos-form-review-table] tbody td[data-eidos-review-table-evidence]:has(>details){
    display:grid;grid-template-columns:minmax(0,1fr) auto;
    align-items:center;gap:var(--eidos-space-sm);
  }
  [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
    [data-eidos-form-review-table] tbody td[data-eidos-review-table-evidence]:has(>details)::before{
    display:none;
  }
  [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
    [data-eidos-review-table-evidence] [data-eidos-review-table-sample]{
    min-width:0;overflow-wrap:anywhere;
  }
  [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
    [data-eidos-review-table-evidence] [data-eidos-review-group-detail]{
    margin-top:0;
  }
  [data-eidos-form-review-table-wrap][data-eidos-review-table-presentation="compact"]
    [data-eidos-review-table-evidence] [data-eidos-review-group-detail][open]{
    grid-column:1 / -1;width:100%;
  }
}
/* Mobile task footer: the three real Host operations follow the prototype's
   scan-friendly single column, without pretending changes auto-save. */
@media(max-width:520px){
  form[data-eidos-id]:has(
    [data-eidos-form-task-overview][data-eidos-task-presentation="workbench"]
    + [data-eidos-form-fields] [data-eidos-review-table-presentation="compact"]
  ) footer[data-eidos-form-actions]{
    display:flex;flex-direction:column;align-items:stretch;
  }
  form[data-eidos-id]:has(
    [data-eidos-form-task-overview][data-eidos-task-presentation="workbench"]
    + [data-eidos-form-fields] [data-eidos-review-table-presentation="compact"]
  ) footer[data-eidos-form-actions]>button{
    width:100%;min-height:44px;flex:0 0 auto;
  }
}

/* BEX-01 V3 source-of-truth visual palette and canvas: #909's actual HTML
   :root/.panel/.metric/.issuebox CSS, not measured screenshot dimensions.
   Scope to the real mapping form; the Host shell, authorizations, save
   commands, other forms and other Eidos experiences retain their own skin. */
[data-eidos-workspace-content]:has(form[data-eidos-id="evo-data-import.mapping"]){
  background:#f5f7fa;
}
form[data-eidos-id="evo-data-import.mapping"]{
  --eidos-fg:#172b44;
  --eidos-fg-muted:#6a7c91;
  --eidos-fg-subtle:#718196;
  --eidos-bg:#ffffff;
  --eidos-bg-subtle:#f5f7fa;
  --eidos-bg-hover:#f4f8fc;
  --eidos-bg-selected:#eaf2fb;
  --eidos-border:#e3e9ef;
  --eidos-border-strong:#ced9e4;
  --eidos-focus:#73aaf4;
  --eidos-primary:#2563a6;
  --eidos-primary-hover:#1d538d;
  --eidos-primary-subtle:#eaf2fb;
  --eidos-success:#18765a;
  --eidos-success-bg:#eaf7f1;
  --eidos-warning:#a66712;
  --eidos-warning-bg:#fff6e7;
  --eidos-danger:#b54738;
  --eidos-danger-bg:#fff1ee;
  width:min(1200px,100%);
  padding:0;
  border:0;
  border-radius:0;
  background:transparent;
  color:var(--eidos-fg);
}
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-task-context],
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-task-metric],
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-review-table-wrap]{
  background:var(--eidos-bg);
  border:1px solid var(--eidos-border);
  border-radius:10px;
  box-shadow:0 2px 9px #13284006;
}
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-task-metric][data-tone="warning"]{
  background:#fffdfa;
  border-color:#e8d9bd;
}
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-task-icon]{
  background:#eaf5ed;color:#198354;border-radius:9px;
}
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-task-source-status][data-tone="positive"]{
  background:var(--eidos-success-bg);color:var(--eidos-success);
}
form[data-eidos-id="evo-data-import.mapping"]
  [data-eidos-form-task-issues][data-eidos-task-issues-layout="connected"]>ol{
  border-color:#eddfc6;
}
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-task-issues] li::before{
  background:var(--eidos-warning-bg);color:var(--eidos-warning);
}
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-review-table] thead{
  background:#f7f9fb;
}
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-form-review-table-footnote]{
  background:var(--eidos-bg);
}
/* V3 #909 status chips: preserve native table cells and scoped Eidos semantics.
   Changing a choice updates the existing row status key; no Host mutation. */
form[data-eidos-id="evo-data-import.mapping"] [data-eidos-review-table-status-badge]{
  display:inline-block;max-width:100%;box-sizing:border-box;
  padding:2px 8px;border-radius:4px;white-space:normal;
  background:#f0f3f6;color:var(--eidos-fg-muted);
}
form[data-eidos-id="evo-data-import.mapping"]
  [data-eidos-form-review-table-row][data-eidos-review-table-status-key="matched"]
  [data-eidos-review-table-status-badge]{
  color:#18765a;background:#eaf7f1;
}
form[data-eidos-id="evo-data-import.mapping"]
  [data-eidos-form-review-table-row][data-eidos-review-table-status-key="proposed"]
  [data-eidos-review-table-status-badge]{
  color:#2b65aa;background:#eef5fd;
}
form[data-eidos-id="evo-data-import.mapping"]
  [data-eidos-form-review-table-row]:is([data-eidos-review-table-status-key="pending"],
    [data-eidos-review-table-status-key="attention"],
    [data-eidos-review-table-status-key="suggested"])
  [data-eidos-review-table-status-badge]{
  color:#a66712;background:#fff6e7;
}


/* Optional bounded issue pages: native details retain every Host issue while
   keeping the source-aligned twelve-decision first page. No JS or auto-save. */
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issue-page]{
  border:1px solid var(--eidos-border);
  border-radius:var(--eidos-radius-lg);
  background:var(--eidos-bg);
  margin-top:var(--eidos-space-sm);
}
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issue-page]>summary{
  cursor:pointer;padding:var(--eidos-space-md) var(--eidos-space-lg);
  min-height:44px;box-sizing:border-box;
  display:flex;align-items:center;
  color:var(--eidos-primary);font-weight:var(--eidos-weight-semibold);
}
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issue-page]>summary:focus-visible{
  outline:2px solid var(--eidos-primary);outline-offset:2px;
}
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issue-page]>ol{
  list-style:none;display:grid;gap:var(--eidos-space-sm);
  margin:0;padding:var(--eidos-space-sm);
  counter-reset:eidos-workbench-issue;
}
[data-eidos-task-presentation="workbench"]
  [data-eidos-form-task-issue-page] li{
  display:grid;grid-template-columns:28px minmax(0,1fr) auto;
  align-items:start;gap:var(--eidos-space-md);
  border:1px solid color-mix(in srgb,var(--eidos-warning) 30%,var(--eidos-border));
  border-radius:var(--eidos-radius-lg);background:var(--eidos-bg);
  counter-increment:eidos-workbench-issue;
}
@media(max-width:520px){
  [data-eidos-task-presentation="workbench"]
    [data-eidos-form-task-issue-page] li{
    grid-template-columns:28px minmax(0,1fr);gap:var(--eidos-space-sm);
  }
}
`;
