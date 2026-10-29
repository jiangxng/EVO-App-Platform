import { createHash } from 'node:crypto';

// The manifest covers every browser module and the shell CSS. Local builds
// need a new URL when any of those bytes change because versioned assets are
// intentionally cached as immutable by the Host.
export function createLocalAssetRevisionV010(manifestBytes) {
  return 'local-' + createHash('sha256').update(manifestBytes).digest('hex').slice(0, 24);
}
