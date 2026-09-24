import {
  createAppHost,
  createAppManagerExperienceSource,
  createAppManagerActionHost
} from "../vendor/eidos/src/app-host/index.js";
import {
  mountWorkbenchShell,
  type WorkbenchActivityV010,
  type WorkbenchShell
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

const platformActivities: WorkbenchActivityV010[] = [
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
    placement: "secondary",
    localization: {
      namespace: "evo-app-platform",
      key: "workbench.activity.settings"
    }
  }
];

let lastEffectiveActivities = [...platformActivities];

async function loadEffectiveWorkbenchActivities(): Promise<WorkbenchActivityV010[]> {
  try {
    const response = await fetch("/v1/workbench/activities", {
      headers: { accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`WORKBENCH_ACTIVITIES_HTTP_${response.status}`);
    }
    const contributions = await response.json() as Array<
      WorkbenchActivityV010 & {
        contractVersion?: string;
        packageId?: string;
        featureId?: string;
      }
    >;
    lastEffectiveActivities = [
      ...platformActivities,
      ...contributions.map(({ contractVersion: _contractVersion, packageId: _packageId, featureId: _featureId, ...activity }) => activity)
    ];
  } catch (error) {
    console.error("Failed to refresh Workbench activities; keeping last known effective set.", error);
  }
  return [...lastEffectiveActivities];
}

let workbench: WorkbenchShell | undefined;
const initialActivities = await loadEffectiveWorkbenchActivities();

workbench = await mountWorkbenchShell({
  host,
  container: "#app",
  title: "EVO",
  defaultActivityId: "plugins",
  initialWorkspaceRoute: "/store",
  activities: initialActivities,
  actionHost,
  localization,
  minSidePanelWidth: 260,
  maxSidePanelWidth: 720,
  async onActionResult() {
    await refreshLocalizationBundles();
    const activities = await loadEffectiveWorkbenchActivities();
    await workbench?.setActivities(activities);
  }
});
