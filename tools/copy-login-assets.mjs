import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../manager/assets/", import.meta.url));
const target = fileURLToPath(new URL("../dist/manager/assets/", import.meta.url));

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
