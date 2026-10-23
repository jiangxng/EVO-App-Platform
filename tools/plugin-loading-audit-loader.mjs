// Audit-only asynchronous observer; do not transform source or opt CommonJS
// dependencies into the ESM loader. Only dist ESM loads are in this inventory.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
let port;
export function initialize(data) { port = data.port; port.unref(); }
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (url.startsWith('file:')) {
    const relative = path.relative(root, fileURLToPath(url)).split(path.sep).join('/');
    if (relative.startsWith('dist/') && result.format === 'module') port.postMessage(relative);
  }
  return result;
}
