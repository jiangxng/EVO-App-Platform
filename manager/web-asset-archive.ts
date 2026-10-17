import {
  mkdir,
  mkdtemp,
  rename,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, relative, sep } from "node:path";

export interface WebAssetArchiveV010 {
  currentRevision: string;
  archiveRoot?: string;
  ensureCurrent(): Promise<void>;
  readArchived(revision: string, assetPath: string): Promise<Buffer | undefined>;
  revisions(): Promise<string[]>;
}

function safeRevision(value: string): boolean {
  return /^[a-zA-Z0-9._-]{1,128}$/u.test(value)
    && value !== "." && value !== ".." && value !== ".staging";
}

function safeAssetPath(value: string): boolean {
  return Boolean(value)
    && !value.includes("..")
    && !value.startsWith("/")
    && !value.includes("\\")
    && !value.includes(":")
    && (value.endsWith(".js") || value.endsWith(".css"));
}

async function copyJavaScriptTree(
  sourceRoot: string,
  targetRoot: string
): Promise<void> {
  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const source = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(source);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
      const rel = relative(sourceRoot, source);
      const target = join(targetRoot, rel);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, await readFile(source));
    }
  };
  await walk(sourceRoot);
}

export function createWebAssetArchiveV010(options: {
  currentRevision: string;
  sourceRoot: string;
  archiveRoot?: string;
  shellCss: string;
  retention?: number;
  /** Explicit opt-in for legacy callers; the production Host always supplies it. */
  manifestPath?: string;
}): WebAssetArchiveV010 {
  const configuredRetention = options.retention ?? 5;
  const retention = Number.isFinite(configuredRetention)
    ? Math.max(2, Math.min(20, Math.trunc(configuredRetention))) : 5;
  const archiveRoot = options.archiveRoot?.trim() || undefined;

  const ensureCurrent = async (): Promise<void> => {
    if (!archiveRoot) return;
    if (!safeRevision(options.currentRevision)) {
      throw new Error("WEB_ASSET_ARCHIVE_REVISION_INVALID");
    }

    const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
    type Entry = { path: string; bytes: number; sha256: string };
    let manifest: { files: Entry[]; shellCss: Entry } | undefined;
    let manifestDigest: string | undefined;
    if (options.manifestPath) {
      const bytes = await readFile(options.manifestPath);
      const raw = JSON.parse(bytes.toString("utf8"));
      const validEntry = (entry: Entry) => entry && typeof entry.path === "string"
        && safeAssetPath(entry.path) && Number.isSafeInteger(entry.bytes) && entry.bytes >= 0
        && typeof entry.sha256 === "string" && /^[a-f0-9]{64}$/u.test(entry.sha256);
      if (raw.schemaVersion !== 1 || !Array.isArray(raw.files) || !raw.files.length
        || !raw.files.every((entry: Entry) => validEntry(entry) && entry.path.endsWith(".js"))
        || new Set(raw.files.map((entry: Entry) => entry.path)).size !== raw.files.length
        || !validEntry(raw.shellCss) || raw.shellCss.path !== "manager/app-host-shell.css") {
        throw new Error("WEB_ASSET_MANIFEST_INVALID");
      }
      manifest = raw;
      manifestDigest = hash(bytes);
    }
    const revisionRoot = join(archiveRoot, options.currentRevision);
    const ready = join(revisionRoot, ".ready");
    const existingReady = async (): Promise<boolean> => {
      let contents: string;
      try { contents = await readFile(ready, "utf8"); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
        throw error;
      }
      const record = JSON.parse(contents);
      if (record.revision !== options.currentRevision
        || (record.manifestDigest && record.manifestDigest !== manifestDigest)) {
        throw new Error("WEB_ASSET_REVISION_CONFLICT");
      }
      // Old full snapshots have no manifest digest: preserve them unchanged.
      return true;
    };
    if (await existingReady()) return;

    const stagingParent = join(archiveRoot, ".staging");
    await mkdir(stagingParent, { recursive: true });
    const stagingRoot = await mkdtemp(join(stagingParent, "snapshot-"));
    try {
      if (manifest) {
        for (const entry of manifest.files) {
          const bytes = await readFile(join(options.sourceRoot, entry.path));
          if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) {
            throw new Error("WEB_ASSET_MANIFEST_CONTENT_MISMATCH: " + entry.path);
          }
          const target = join(stagingRoot, entry.path);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, bytes);
        }
        if (Buffer.byteLength(options.shellCss) !== manifest.shellCss.bytes
          || hash(options.shellCss) !== manifest.shellCss.sha256) {
          throw new Error("WEB_ASSET_MANIFEST_CSS_MISMATCH");
        }
      } else {
        await copyJavaScriptTree(options.sourceRoot, stagingRoot);
      }
      const cssPath = join(stagingRoot, "manager", "app-host-shell.css");
      await mkdir(dirname(cssPath), { recursive: true });
      await writeFile(cssPath, options.shellCss, "utf8");
      await writeFile(join(stagingRoot, ".ready"), JSON.stringify({
        contractVersion: "0.1.0", revision: options.currentRevision,
        archivedAt: new Date().toISOString(),
        ...(manifestDigest ? {manifestDigest} : {})
      }) + "\n", "utf8");
      try { await rename(stagingRoot, revisionRoot); }
      catch (error) {
        // Another process may have published the same complete revision.
        // Never delete a destination: an incomplete legacy directory needs explicit repair.
        if (!(await existingReady())) throw error;
      }
    } finally {
      await rm(stagingRoot, {recursive: true, force: true});
    }

    const entries = await readdir(archiveRoot, { withFileTypes: true });
    const revisions: Array<{ revision: string; mtimeMs: number }> = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !safeRevision(entry.name)) continue;
      try {
        const readyStat = await stat(join(archiveRoot, entry.name, ".ready"));
        revisions.push({ revision: entry.name, mtimeMs: readyStat.mtimeMs });
      } catch {
        // Ignore incomplete snapshots; repair requires an explicit operation.
      }
    }
    revisions.sort((a, b) => b.mtimeMs - a.mtimeMs);
    for (const stale of revisions.slice(retention)) {
      if (stale.revision === options.currentRevision) continue;
      await rm(join(archiveRoot, stale.revision), {
        recursive: true,
        force: true
      });
    }
  };

  let pending: Promise<void> | undefined;
  return {
    currentRevision: options.currentRevision,
    archiveRoot,
    ensureCurrent() {
      pending ??= ensureCurrent().finally(() => { pending = undefined; });
      return pending;
    },
    async readArchived(revision, assetPath) {
      if (!archiveRoot || !safeRevision(revision) || !safeAssetPath(assetPath)) {
        return undefined;
      }
      const root = join(archiveRoot, revision);
      const candidate = join(root, assetPath);
      const rel = relative(root, candidate);
      if (
        rel.startsWith("..")
        || rel.split(sep).includes("..")
      ) {
        return undefined;
      }
      try {
        await stat(join(root, ".ready"));
        return await readFile(candidate);
      } catch {
        return undefined;
      }
    },
    async revisions() {
      if (!archiveRoot) return [options.currentRevision];
      try {
        const entries = await readdir(archiveRoot, { withFileTypes: true });
        const readyRevisions: string[] = [];
        for (const entry of entries) {
          if (!entry.isDirectory() || !safeRevision(entry.name)) continue;
          try { await stat(join(archiveRoot, entry.name, ".ready")); readyRevisions.push(entry.name); }
          catch { /* Do not advertise incomplete revisions. */ }
        }
        return readyRevisions.sort();
      } catch {
        return [options.currentRevision];
      }
    }
  };
}
