import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

export interface WebAssetArchiveV010 {
  currentRevision: string;
  archiveRoot?: string;
  ensureCurrent(): Promise<void>;
  readArchived(revision: string, assetPath: string): Promise<Buffer | undefined>;
  revisions(): Promise<string[]>;
}

function safeRevision(value: string): boolean {
  return /^[a-zA-Z0-9._-]{1,128}$/u.test(value);
}

function safeAssetPath(value: string): boolean {
  return Boolean(value)
    && !value.includes("..")
    && !value.startsWith("/")
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
}): WebAssetArchiveV010 {
  const retention = Math.max(2, Math.min(20, Math.trunc(options.retention ?? 5)));
  const archiveRoot = options.archiveRoot?.trim() || undefined;

  const ensureCurrent = async (): Promise<void> => {
    if (!archiveRoot) return;
    if (!safeRevision(options.currentRevision)) {
      throw new Error("WEB_ASSET_ARCHIVE_REVISION_INVALID");
    }

    const revisionRoot = join(archiveRoot, options.currentRevision);
    const ready = join(revisionRoot, ".ready");
    try {
      await stat(ready);
      return;
    } catch {
      // Snapshot has not been materialized yet.
    }

    await mkdir(revisionRoot, { recursive: true });
    await copyJavaScriptTree(options.sourceRoot, revisionRoot);
    const cssPath = join(revisionRoot, "manager", "app-host-shell.css");
    await mkdir(dirname(cssPath), { recursive: true });
    await writeFile(cssPath, options.shellCss, "utf8");
    await writeFile(
      ready,
      JSON.stringify({
        contractVersion: "0.1.0",
        revision: options.currentRevision,
        archivedAt: new Date().toISOString()
      }) + "\n",
      "utf8"
    );

    const entries = await readdir(archiveRoot, { withFileTypes: true });
    const revisions: Array<{ revision: string; mtimeMs: number }> = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !safeRevision(entry.name)) continue;
      try {
        const readyStat = await stat(join(archiveRoot, entry.name, ".ready"));
        revisions.push({ revision: entry.name, mtimeMs: readyStat.mtimeMs });
      } catch {
        // Ignore incomplete snapshots. They may be cleaned on a later start.
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

  return {
    currentRevision: options.currentRevision,
    archiveRoot,
    ensureCurrent,
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
        return await readFile(candidate);
      } catch {
        return undefined;
      }
    },
    async revisions() {
      if (!archiveRoot) return [options.currentRevision];
      try {
        const entries = await readdir(archiveRoot, { withFileTypes: true });
        return entries
          .filter(entry => entry.isDirectory() && safeRevision(entry.name))
          .map(entry => entry.name)
          .sort();
      } catch {
        return [options.currentRevision];
      }
    }
  };
}
