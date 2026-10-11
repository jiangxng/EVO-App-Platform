import type { PackageManifestV010 } from "../contracts/package.js";
import { createLocalizationRuntime } from "../vendor/eidos/src/localization/index.js";

/** Catalog metadata only. Never activates a Feature or loads its runtime/bundles. */
export function resolvePackageDisplayNameV010(pkg: PackageManifestV010, locale = "en"): string {
  let canonical = "en";
  try { canonical = Intl.getCanonicalLocales(locale.trim())[0] ?? "en"; } catch { /* English fallback. */ }
  const chinese = canonical.startsWith("zh")
    ? /(?:Hant|TW|HK|MO)/.test(canonical) ? "zh-TW" : "zh-CN"
    : undefined;
  const bundles = Object.entries(pkg.displayNameTranslations ?? {})
    .filter(([, title]) => typeof title === "string" && title.trim())
    .map(([language, title]) => ({
      contractVersion: "0.1.0" as const,
      namespace: pkg.packageId,
      locale: language,
      messages: { displayName: title }
    }));
  return createLocalizationRuntime(bundles, {
    locale: canonical,
    fallbackLocales: [...(chinese ? [chinese] : []), "en"]
  }).resolve(pkg.packageId, "displayName", pkg.displayName);
}
