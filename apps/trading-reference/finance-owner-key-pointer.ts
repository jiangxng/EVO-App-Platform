import { lstatSync, readFileSync } from 'node:fs';

/** Operator-managed nonsecret pointer to a PREPROVISIONED Host Secrets key.
 * This file is not an API/Agent input. Replace atomically through an
 * authenticated operating-system deployment/change process. Never fallback
 * to a formerly trusted key if the pointer becomes invalid or disappears.
 */
export function readFinanceOwnerActiveKeyIdV010(file: string): string {
  if (!file.trim()) throw new Error('TR01B2D3_SIGNING_POINTER_PATH_REQUIRED');
  let stat;
  let raw: string;
  try {
    stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() ||
      (process.platform !== 'win32' && (
        (stat.mode & 0o077) !== 0 ||
        (typeof process.getuid === 'function' &&
          stat.uid !== process.getuid() && stat.uid !== 0)
      ))) {
      throw new Error('TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID');
    }
    raw = readFileSync(file,'utf8');
  } catch (e) {
    if (e instanceof Error && e.message ===
      'TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID') throw e;
    throw new Error('TR01B2D3_SIGNING_POINTER_UNAVAILABLE');
  }
  const normalized = raw.endsWith('\n') ? raw.slice(0,-1) : raw;
  if (!/^[A-Za-z0-9_.:-]{1,128}$/u.test(normalized)) {
    throw new Error('TR01B2D3_SIGNING_POINTER_INVALID');
  }
  return normalized;
}
