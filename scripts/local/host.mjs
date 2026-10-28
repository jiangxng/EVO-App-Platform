import { resolve } from 'node:path';
import { createPersonalAgentExperienceProfileV010 } from '../../dist/manager/local-experience-profile.js';

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port');
const profile = createPersonalAgentExperienceProfileV010({
  ...process.env,
  PORT: String(port),
  APP_PLATFORM_STATE_FILE: resolve('.local/personal-agent-experience/app-platform-state.json')
});
Object.assign(process.env, profile.environment);
await import('../../dist/manager/server.js');
