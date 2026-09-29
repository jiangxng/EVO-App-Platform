export interface BrowserAssetRequestV010 {
  assetPath: string;
  revisioned: boolean;
  cacheControl: string;
  contentType: "text/javascript; charset=utf-8" | "text/css; charset=utf-8";
}

export function normalizeAssetRevisionV010(value: string | undefined): string {
  const normalized = (value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/gu, "-");
  return normalized || "dev";
}

export function resolveBrowserAssetRequestV010(
  pathname: string,
  currentRevision: string
): BrowserAssetRequestV010 | undefined {
  if (!pathname.startsWith("/assets/")) return undefined;

  const raw = pathname.slice("/assets/".length);
  if (!raw || raw.includes("..") || raw.startsWith("/")) return undefined;

  const revisionPrefix = currentRevision + "/";
  const revisioned = raw.startsWith(revisionPrefix);
  const assetPath = revisioned ? raw.slice(revisionPrefix.length) : raw;

  if (!assetPath || assetPath.includes("..")) {
    return undefined;
  }

  const contentType = assetPath.endsWith(".js")
    ? "text/javascript; charset=utf-8" as const
    : assetPath.endsWith(".css")
      ? "text/css; charset=utf-8" as const
      : undefined;
  if (!contentType) return undefined;

  return {
    assetPath,
    revisioned,
    cacheControl: revisioned
      ? "public, max-age=31536000, immutable"
      : "public, max-age=0, must-revalidate",
    contentType
  };
}
