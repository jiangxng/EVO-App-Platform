const HOST = process.env.HOST;
if (!HOST) throw new Error("HOST is required");

const requestedPrevious = process.env.PREVIOUS_REVISION?.trim();

async function json(path, init) {
  const response = await fetch(HOST + path, init);
  const text = await response.text();
  let body = text;
  try { body = JSON.parse(text); } catch {}
  return { response, body, text };
}

const diagnosticsBefore = await json("/v1/web-delivery/diagnostics");
if (diagnosticsBefore.response.status !== 200) {
  throw new Error("WEB_DELIVERY_DIAGNOSTICS_HTTP_" + diagnosticsBefore.response.status);
}

const currentRevision = diagnosticsBefore.body.currentRevision;
const archivedRevisions = diagnosticsBefore.body.archivedRevisions ?? [];
if (typeof currentRevision !== "string" || !currentRevision) {
  throw new Error("CURRENT_REVISION_MISSING");
}

const previousRevision = requestedPrevious
  || archivedRevisions.find(value => value !== currentRevision);

const staleHeaders = previousRevision
  ? { "x-evo-client-revision": previousRevision }
  : { "x-evo-client-revision": "synthetic-stale-client" };
const stale = await fetch(HOST + "/health", { headers: staleHeaders });
if (stale.status !== 200) throw new Error("STALE_CLIENT_HEALTH_FAILED");
if (stale.headers.get("x-evo-host-revision") !== currentRevision) {
  throw new Error("HOST_REVISION_HEADER_MISMATCH");
}
if (stale.headers.get("x-evo-web-contract") !== "0.1.0") {
  throw new Error("WEB_CONTRACT_HEADER_MISMATCH");
}
if (stale.headers.get("x-evo-client-update") !== "available") {
  throw new Error("STALE_CLIENT_UPDATE_HEADER_MISSING");
}

let archivedProof = null;
if (previousRevision) {
  const paths = [
    "/assets/" + previousRevision + "/manager/app-host-client.js",
    "/assets/" + previousRevision + "/manager/mobile-read-runtime.js",
    "/assets/" + previousRevision + "/manager/desktop-workbench-runtime.js"
  ];
  const results = [];
  for (const path of paths) {
    const response = await fetch(HOST + path);
    const bytes = new Uint8Array(await response.arrayBuffer());
    results.push({
      path,
      status: response.status,
      cacheControl: response.headers.get("cache-control"),
      etag: response.headers.get("etag"),
      bytes: bytes.byteLength
    });
    if (response.status !== 200) throw new Error("ARCHIVED_ASSET_HTTP_" + response.status + ":" + path);
    if (response.headers.get("cache-control") !== "public, max-age=31536000, immutable") {
      throw new Error("ARCHIVED_ASSET_NOT_IMMUTABLE:" + path);
    }
    if (!response.headers.get("etag")) {
      throw new Error("ARCHIVED_ASSET_ETAG_MISSING:" + path);
    }
  }
  archivedProof = { previousRevision, results };
}

const sample = {
  contractVersion: "0.1.0",
  observedAt: new Date().toISOString(),
  clientRevision: previousRevision || currentRevision,
  hostRevision: currentRevision,
  surfaceTarget: "MOBILE_READ",
  navigationType: "reload",
  navigationDurationMs: 120,
  largestContentfulPaintMs: 90,
  firstContentfulPaintMs: 40,
  longTaskCount: 0,
  longTaskTotalMs: 0,
  resourceCount: 5,
  transferBytes: 1024,
  jsTransferBytes: 700,
  cssTransferBytes: 100,
  apiTransferBytes: 224,
  cachedResourceCount: 3
};

const rumPost = await fetch(HOST + "/v1/web-performance", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    accept: "application/json",
    "x-evo-client-revision": previousRevision || currentRevision
  },
  body: JSON.stringify(sample)
});
if (rumPost.status !== 202) {
  throw new Error("RUM_POST_HTTP_" + rumPost.status + ":" + await rumPost.text());
}

const diagnosticsAfter = await json("/v1/web-delivery/diagnostics");
if (diagnosticsAfter.response.status !== 200) {
  throw new Error("WEB_DELIVERY_DIAGNOSTICS_AFTER_HTTP_" + diagnosticsAfter.response.status);
}
const recent = diagnosticsAfter.body.performance?.recent ?? [];
const found = recent.some(item =>
  item.observedAt === sample.observedAt
  && item.surfaceTarget === sample.surfaceTarget
  && item.clientRevision === sample.clientRevision
);
if (!found) throw new Error("RUM_SAMPLE_NOT_OBSERVED");

console.log("WEB_VERSION_SKEW_RUM_PROOF=" + JSON.stringify({
  currentRevision,
  archivedRevisions: diagnosticsAfter.body.archivedRevisions,
  archiveEnabled: diagnosticsAfter.body.archiveEnabled,
  archiveError: diagnosticsAfter.body.archiveError,
  staleClient: {
    clientRevision: previousRevision || "synthetic-stale-client",
    hostRevision: stale.headers.get("x-evo-host-revision"),
    contract: stale.headers.get("x-evo-web-contract"),
    update: stale.headers.get("x-evo-client-update")
  },
  archivedProof,
  rum: {
    postStatus: rumPost.status,
    sampleCount: diagnosticsAfter.body.performance?.sampleCount,
    bySurface: diagnosticsAfter.body.performance?.bySurface,
    observed: found
  }
}));
