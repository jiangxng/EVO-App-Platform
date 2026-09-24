import type { ExperienceSource } from "./contracts.js";

export interface AppManagerExperienceSourceOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function readJsonResponse(response: Response, operation: string): Promise<unknown> {
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.text();
      detail = body ? `: ${body}` : "";
    } catch {}
    throw new Error(`${operation} failed with HTTP ${response.status}${detail}`);
  }
  return response.json();
}

export function createAppManagerExperienceSource(
  options: AppManagerExperienceSourceOptions
): ExperienceSource {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error("EIDOS_APP_MANAGER_SOURCE_FETCH_UNAVAILABLE");
  }

  return {
    async listEffectiveExperienceManifests(): Promise<unknown[]> {
      const response = await fetchImpl(`${baseUrl}/v1/experiences/effective`, {
        method: "GET",
        headers: { accept: "application/json" }
      });
      const body = await readJsonResponse(response, "Experience discovery");
      if (!Array.isArray(body)) {
        throw new Error("EIDOS_APP_MANAGER_SOURCE_INVALID_MANIFEST_LIST");
      }
      return body;
    },

    async loadPage(page): Promise<unknown> {
      const url = new URL(`${baseUrl}/v1/experience-pages`);
      url.searchParams.set("source", page.source);

      const response = await fetchImpl(url, {
        method: "GET",
        headers: { accept: "application/json" }
      });
      return readJsonResponse(response, `Page load '${page.source}'`);
    }
  };
}
