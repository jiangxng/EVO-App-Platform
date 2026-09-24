import {
  createAppHost,
  createAppManagerExperienceSource,
  createAppManagerActionHost,
  mountBrowserAppHostShell
} from "../vendor/eidos/src/app-host/index.js";
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

await mountBrowserAppHostShell({
  host,
  container: "#app",
  title: "EVO",
  actionHost,
  localization,
  async onActionResult() {
    await refreshLocalizationBundles();
  }
});
