import {
  createAppHost,
  createAppManagerExperienceSource,
  createAppManagerActionHost
} from "../vendor/eidos/src/app-host/index.js";
import {
  mountWorkbenchShell
} from "../vendor/eidos/src/workbench/index.js";
import {
  createLocalizationRuntime,
  eidosAppHostLocalizationBundles
} from "../vendor/eidos/src/localization/index.js";

if (!window.location.hash || window.location.hash === "#") {
  window.location.hash = "/store";
}

const source = createAppManagerExperienceSource({ baseUrl: window.location.origin });
const actionHost = createAppManagerActionHost({ baseUrl: window.location.origin });
const host = createAppHost(source);

const persistedLocale = window.localStorage.getItem("evo.locale")?.trim();
const browserLocale = window.navigator.language?.trim();
const initialLocale = persistedLocale || browserLocale || "en";
const initialBundles = await source.listEffectiveLocalizationBundles();

const localization = createLocalizationRuntime(
  [...eidosAppHostLocalizationBundles, ...initialBundles],
  {
    locale: initialLocale,
    fallbackLocales: ["en"]
  }
);

localization.subscribe(context => {
  window.localStorage.setItem("evo.locale", context.locale);
});

async function refreshLocalizationBundles(): Promise<void> {
  const activeBundles = await source.listEffectiveLocalizationBundles();
  localization.replaceBundles([
    ...eidosAppHostLocalizationBundles,
    ...activeBundles
  ]);
}

await mountWorkbenchShell({
  host,
  container: "#app",
  title: "EVO",
  defaultActivityId: "agent",
  initialWorkspaceRoute: "/store",
  activities: [
    {
      id: "apps",
      title: "Apps",
      icon: "▦",
      kind: "navigation",
      order: 10,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.apps"
      }
    },
    {
      id: "agent",
      title: "Agent",
      icon: "✦",
      kind: "side-route",
      route: "/enterprise-agent",
      order: 20,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.agent"
      }
    },
    {
      id: "plugins",
      title: "Plugins",
      icon: "◇",
      kind: "workspace-route",
      route: "/store",
      order: 30,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.plugins"
      }
    },
    {
      id: "workspace",
      title: "Workspace",
      icon: "▣",
      kind: "workspace-focus",
      order: 40,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.workspace"
      }
    },
    {
      id: "settings",
      title: "Settings",
      icon: "⚙",
      kind: "workspace-route",
      route: "/settings",
      order: 1000,
      localization: {
        namespace: "evo-app-platform",
        key: "workbench.activity.settings"
      }
    }
  ],
  actionHost,
  localization,
  minSidePanelWidth: 260,
  maxSidePanelWidth: 720,
  async onActionResult() {
    await refreshLocalizationBundles();
  }
});
