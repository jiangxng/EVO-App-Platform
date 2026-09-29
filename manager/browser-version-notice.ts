export interface BrowserVersionNoticeV010 {
  show(hostRevision: string): void;
  dispose(): void;
}

export function mountBrowserVersionNoticeV010(): BrowserVersionNoticeV010 {
  const root = document.createElement("div");
  root.setAttribute("data-evo-web-update", "");
  root.hidden = true;
  root.setAttribute("role", "status");
  root.style.position = "fixed";
  root.style.right = "16px";
  root.style.bottom = "16px";
  root.style.zIndex = "2147483000";
  root.style.maxWidth = "320px";
  root.style.padding = "10px 12px";
  root.style.border = "1px solid currentColor";
  root.style.borderRadius = "8px";
  root.style.background = "Canvas";
  root.style.color = "CanvasText";
  root.style.boxShadow = "0 4px 18px rgba(0,0,0,.18)";

  const text = document.createElement("span");
  text.textContent = "A newer EVO web version is available.";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Reload";
  button.style.marginLeft = "10px";
  button.addEventListener("click", () => window.location.reload());

  root.append(text, button);
  document.body.appendChild(root);

  return {
    show(hostRevision) {
      root.dataset.hostRevision = hostRevision;
      root.hidden = false;
    },
    dispose() {
      root.remove();
    }
  };
}
