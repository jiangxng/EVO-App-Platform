export const WEB_DELIVERY_CONTRACT_VERSION_V010 = "0.1.0" as const;

export interface WebRevisionHeadersV010 {
  hostRevision: string;
  contractVersion: typeof WEB_DELIVERY_CONTRACT_VERSION_V010;
  clientUpdateAvailable: boolean;
}

export function normalizeClientRevisionV010(
  value: string | string[] | undefined
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  if (!/^[a-zA-Z0-9._-]{1,128}$/u.test(trimmed)) return undefined;
  return trimmed;
}

export function webRevisionHeadersV010(
  hostRevision: string,
  clientRevision?: string
): WebRevisionHeadersV010 {
  return {
    hostRevision,
    contractVersion: WEB_DELIVERY_CONTRACT_VERSION_V010,
    clientUpdateAvailable: Boolean(
      clientRevision
      && clientRevision !== hostRevision
    )
  };
}

export function applyWebRevisionHeadersV010(
  setHeader: (name: string, value: string) => void,
  hostRevision: string,
  clientRevision?: string
): void {
  const headers = webRevisionHeadersV010(hostRevision, clientRevision);
  setHeader("x-evo-host-revision", headers.hostRevision);
  setHeader("x-evo-web-contract", headers.contractVersion);
  setHeader(
    "x-evo-client-update",
    headers.clientUpdateAvailable ? "available" : "current"
  );
  setHeader("vary", "x-evo-client-revision");
}
