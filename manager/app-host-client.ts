import {
  createAppHost,
  createAppManagerExperienceSource,
  createAppManagerActionHost,
  mountBrowserAppHostShell
} from "../vendor/eidos/src/app-host/index.js";

if (!window.location.hash || window.location.hash === "#") {
  window.location.hash = "/store";
}

const source = createAppManagerExperienceSource({ baseUrl: window.location.origin });
const actionHost = createAppManagerActionHost({ baseUrl: window.location.origin });
const host = createAppHost(source);

await mountBrowserAppHostShell({
  host,
  container: "#app",
  title: "EVO",
  actionHost
});
