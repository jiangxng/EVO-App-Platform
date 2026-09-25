import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validatePluginManifestV010 } from "../dist/contracts/plugin-protocol.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run plugin:validate -- <manifest.json>");
  process.exit(2);
}

let manifest;
try {
  manifest = JSON.parse(await readFile(resolve(file), "utf8"));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    code: "PLUGIN_MANIFEST_READ_FAILED",
    message: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(2);
}

const result = validatePluginManifestV010(manifest);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
