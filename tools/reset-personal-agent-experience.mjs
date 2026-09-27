import { rmSync } from "node:fs";
import { dirname } from "node:path";
import {
  PERSONAL_AGENT_EXPERIENCE_STATE_FILE
} from "../dist/manager/local-experience-profile.js";

const configured = process.env.APP_PLATFORM_STATE_FILE?.trim();
const stateFile = configured || PERSONAL_AGENT_EXPERIENCE_STATE_FILE;
const directory = dirname(stateFile);

rmSync(directory, { recursive: true, force: true });
console.log("Reset local Personal Agent experience state: " + directory);
