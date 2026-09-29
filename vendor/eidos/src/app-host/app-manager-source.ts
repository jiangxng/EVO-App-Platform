import type { ExperienceSource } from "./contracts.js";
import type { LocalizationBundleSource, LocalizationBundleV010 } from "../localization/contracts.js";

export interface AppManagerExperienceSourceOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  locale?: () => string | undefined;
}

interface HttpCacheEntryV010 {
  etag?: string;
  body: unknown;
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function errorDetail(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return body ? `: ${body}` : "";
  } catch {
    return "";
  }
}

export function createAppManagerExperienceSource(
  options: AppManagerExperienceSourceOptions
): ExperienceSource & LocalizationBundleSource {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const cache = new Map<string, HttpCacheEntryV010>();

  if (!fetchImpl) {
    throw new Error("EIDOS_APP_MANAGER_SOURCE_FETCH_UNAVAILABLE");
  }

  const withLocale = (path: string): URL => {
    const url = new URL(`${baseUrl}${path}`);
    const locale = options.locale?.()?.trim();
    if (locale) url.searchParams.set("locale", locale);
    return url;
  };

  const readCachedJson = async (
    input: string | URL,
    operation: string
  ): Promise<unknown> => {
    const url = String(input);
    const cached = cache.get(url);
    const headers: Record<string, string> = { accept: "application/json" };
    if (cached?.etag) headers["if-none-match"] = cached.etag;

    const response = await fetchImpl(url, {
      method: "GET",
      headers
    });

    if (response.status === 304) {
      if (!cached) {
        throw new Error(`${operation} returned 304 without a cached representation`);
      }
      return structuredClone(cached.body);
    }

    if (!response.ok) {
      throw new Error(
        `${operation} failed with HTTP ${response.status}${await errorDetail(response)}`
      );
    }

    const body = await response.json();
    cache.set(url, {
      ...(response.headers.get("etag")
        ? { etag: response.headers.get("etag")! }
        : {}),
      body: structuredClone(body)
    });
    return body;
  };

  return {
    async listEffectiveExperienceManifests(): Promise<unknown[]> {
      const body = await readCachedJson(
        withLocale("/v1/experiences/effective"),
        "Experience discovery"
      );
      if (!Array.isArray(body)) {
        throw new Error("EIDOS_APP_MANAGER_SOURCE_INVALID_MANIFEST_LIST");
      }
      return body;
    },

    async listEffectiveLocalizationBundles(): Promise<LocalizationBundleV010[]> {
      const body = await readCachedJson(
        `${baseUrl}/v1/localization/bundles`,
        "Localization bundle discovery"
      );
      if (!Array.isArray(body)) {
        throw new Error("EIDOS_APP_MANAGER_SOURCE_INVALID_LOCALIZATION_BUNDLE_LIST");
      }
      return body as LocalizationBundleV010[];
    },

    async loadPage(page): Promise<unknown> {
      const url = withLocale("/v1/experience-pages");
      url.searchParams.set("source", page.source);
      return readCachedJson(url, `Page load '${page.source}'`);
    }
  };
}
