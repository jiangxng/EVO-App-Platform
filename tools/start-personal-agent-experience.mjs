import { spawn } from "node:child_process";
import {
  createPersonalAgentExperienceProfileV010
} from "../dist/manager/local-experience-profile.js";

const profile = createPersonalAgentExperienceProfileV010();

console.log("");
console.log("EVO Personal Agent vertical experience");
console.log("--------------------------------------");
console.log("URL: http://localhost:4100");
console.log("Local subject: " + profile.subjectId);
console.log("State: " + profile.stateFile);
console.log("Administrator authorization: " + profile.bootstrapAdminToken);
console.log("");
console.log("This local profile uses the real Static Session and Static Authorization Provider contracts.");
console.log("Personal Agent, LLM Provider, API Key and Memory are NOT pre-seeded.");
console.log("Use the Administrator authorization value above only when the UI asks to change a Host Secret.");
console.log("");

const child = spawn(
  process.execPath,
  ["dist/manager/server.js"],
  {
    stdio: "inherit",
    env: profile.environment
  }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on("exit", code => {
  process.exitCode = code ?? 0;
});
