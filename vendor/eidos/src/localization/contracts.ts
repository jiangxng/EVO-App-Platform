export interface LocalizationBundleV010 {
  contractVersion: "0.1.0";
  namespace: string;
  locale: string;
  messages: Record<string, string>;
}

export interface LocaleContextV010 {
  locale: string;
  fallbackLocales: string[];
}

export interface LocalizationRuntime {
  getContext(): LocaleContextV010;
  setLocale(locale: string): void;
  replaceBundles(bundles: readonly LocalizationBundleV010[]): void;
  availableLocales(): string[];
  resolve(
    namespace: string,
    key: string,
    fallback: string,
    params?: Record<string, string | number | boolean | null>
  ): string;
  subscribe(listener: (context: LocaleContextV010) => void): () => void;
}

export interface LocalizationBundleSource {
  listEffectiveLocalizationBundles(): Promise<LocalizationBundleV010[]>;
}
