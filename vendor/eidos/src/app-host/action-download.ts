export interface AppHostActionDownloadV010 {
  fileName: string;
  mediaType: string;
  content: string;
}

function requiredText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

export function actionResultDownloadV010(
  payload: unknown
): AppHostActionDownloadV010 | undefined {
  if (
    payload === null
    || typeof payload !== "object"
    || Array.isArray(payload)
  ) {
    return undefined;
  }

  const raw = (payload as { download?: unknown }).download;
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("EIDOS_ACTION_DOWNLOAD_INVALID");
  }

  const candidate = raw as {
    fileName?: unknown;
    mediaType?: unknown;
    content?: unknown;
  };
  const fileName = requiredText(candidate.fileName);
  const mediaType = requiredText(candidate.mediaType);
  if (
    !fileName
    || fileName.length > 180
    || fileName.includes("/")
    || fileName.includes("\\")
    || !mediaType
    || mediaType.length > 120
    || typeof candidate.content !== "string"
  ) {
    throw new Error("EIDOS_ACTION_DOWNLOAD_INVALID");
  }

  return {
    fileName,
    mediaType,
    content: candidate.content
  };
}
