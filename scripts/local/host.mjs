import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { createPersonalAgentExperienceProfileV010 } from '../../dist/manager/local-experience-profile.js';
import { createLocalAssetRevisionV010 } from './asset-revision.mjs';

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port');
const profile = createPersonalAgentExperienceProfileV010({
  ...process.env,
  PORT: String(port),
  APP_PLATFORM_STATE_FILE: resolve('.local/personal-agent-experience/app-platform-state.json')
});
Object.assign(process.env, profile.environment);
process.env.APP_PLATFORM_ASSET_REVISION = createLocalAssetRevisionV010(
  readFileSync(new URL('../../dist/web-asset-manifest.json', import.meta.url))
);
await import('../../dist/manager/server.js');
