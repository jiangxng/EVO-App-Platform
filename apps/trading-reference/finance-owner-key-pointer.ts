import {
  closeSync, constants, fstatSync, lstatSync, openSync, readFileSync
} from 'node:fs';

/** Operator-owned, nonsecret pointer to a preprovisioned Host signing key.
 * A single verified file descriptor is used for reading. Never reopen by
 * pathname after permissions checks: that permits replacement/symlink races.
 * Atomically renamed owner-controlled files remain supported per request.
 */
export function readFinanceOwnerActiveKeyIdV010(file: string): string {
  if (!file.trim()) throw new Error('TR01B2D3_SIGNING_POINTER_PATH_REQUIRED');
  let fd: number | undefined;
  let raw: string;
  try {
    // Preflight keeps a stable symlink error classification, but is NOT
    // the security authority: O_NOFOLLOW + descriptor fstat below are.
    const pathStat = lstatSync(file);
    if (pathStat.isSymbolicLink()) {
      throw new Error('TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID');
    }
    fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const stat = fstatSync(fd);
    if (!stat.isFile() ||
      // Do not permit substitutions between the preflight and open.
      stat.dev !== pathStat.dev || stat.ino !== pathStat.ino ||
      (process.platform !== 'win32' && (
        (stat.mode & 0o077) !== 0 ||
        (typeof process.getuid === 'function' &&
          stat.uid !== process.getuid() && stat.uid !== 0)
      ))) {
      throw new Error('TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID');
    }
    raw = readFileSync(fd, 'utf8');
  } catch (e) {
    if (e instanceof Error &&
      e.message === 'TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID') throw e;
    if (e && typeof e === 'object' && 'code' in e &&
      e.code === 'ELOOP') {
      throw new Error('TR01B2D3_SIGNING_POINTER_PERMISSIONS_INVALID');
    }
    throw new Error('TR01B2D3_SIGNING_POINTER_UNAVAILABLE');
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
  const normalized = raw.endsWith('\n') ? raw.slice(0,-1) : raw;
  if (!/^[A-Za-z0-9_.:-]{1,128}$/u.test(normalized)) {
    throw new Error('TR01B2D3_SIGNING_POINTER_INVALID');
  }
  return normalized;
}
