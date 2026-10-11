export interface BrowserVersionNoticeV010 {
  show(hostRevision: string): void;
  hide(): void;
  dispose(): void;
}

export function currentRevisionNavigationUrlV010(
  currentHref: string,
  hostRevision: string
): string {
  const revision = hostRevision.trim();
  if (!revision) throw new Error("WEB_HOST_REVISION_REQUIRED");
  const url = new URL(currentHref);
  url.searchParams.set("evo-web-revision", revision);
  return url.toString();
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
  button.textContent = "Update";
  button.style.marginLeft = "10px";

  let latestHostRevision: string | undefined;
  button.addEventListener("click", () => {
    if (!latestHostRevision) return;
    button.disabled = true;
    button.textContent = "Updating…";
    window.location.replace(
      currentRevisionNavigationUrlV010(
        window.location.href,
        latestHostRevision
      )
    );
  });

  root.append(text, button);
  document.body.appendChild(root);

  return {
    show(hostRevision) {
      latestHostRevision = hostRevision.trim() || latestHostRevision;
      if (!latestHostRevision) return;
      root.dataset.hostRevision = latestHostRevision;
      root.hidden = false;
      button.disabled = false;
      button.textContent = "Update";
    },
    hide() {
      latestHostRevision = undefined;
      root.hidden = true;
      delete root.dataset.hostRevision;
    },
    dispose() {
      root.remove();
    }
  };
}
