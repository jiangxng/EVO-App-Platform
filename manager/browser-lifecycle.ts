import {
  createBrowserLifecycleControllerV010,
  type BrowserLifecycleControllerV010
} from "../vendor/eidos/src/realtime/browser-lifecycle.js";

export interface BrowserConnectivityNoticeV010 {
  lifecycle: BrowserLifecycleControllerV010;
  dispose(): void;
}

export function mountBrowserConnectivityNoticeV010(): BrowserConnectivityNoticeV010 {
  const lifecycle = createBrowserLifecycleControllerV010();
  const notice = document.createElement("div");
  notice.setAttribute("data-evo-connectivity-notice", "0.1.0");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.hidden = true;
  notice.style.position = "fixed";
  notice.style.left = "50%";
  notice.style.bottom = "12px";
  notice.style.transform = "translateX(-50%)";
  notice.style.zIndex = "2147483647";
  notice.style.maxWidth = "min(92vw, 720px)";
  notice.style.padding = "8px 12px";
  notice.style.border = "1px solid currentColor";
  notice.style.borderRadius = "8px";
  notice.style.background = "Canvas";
  notice.style.color = "CanvasText";
  notice.style.fontSize = "13px";
  notice.textContent =
    "Offline · displayed information may be stale. Material writes require a live connection.";

  document.body.appendChild(notice);

  const unsubscribe = lifecycle.subscribe(snapshot => {
    // Do not mutate the DOM while entering bfcache; preserve the exact mounted
    // page for the browser to freeze and restore.
    if (snapshot.state === "BFCACHE_FROZEN") return;
    notice.hidden = snapshot.state !== "OFFLINE";
    document.documentElement.setAttribute(
      "data-evo-network-state",
      snapshot.online ? "online" : "offline"
    );
  });

  return {
    lifecycle,
    dispose() {
      unsubscribe();
      lifecycle.dispose();
      notice.remove();
      document.documentElement.removeAttribute("data-evo-network-state");
    }
  };
}

export function disposeOnRealPageExitV010(dispose: () => void): () => void {
  let disposed = false;
  const onPageHide = (event: PageTransitionEvent) => {
    if (event.persisted || disposed) return;
    disposed = true;
    window.removeEventListener("pagehide", onPageHide);
    dispose();
  };
  window.addEventListener("pagehide", onPageHide);
  return () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("pagehide", onPageHide);
  };
}
