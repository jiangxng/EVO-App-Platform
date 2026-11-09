import {
  createPostgresConditionalResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";

const databaseURL = process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const schema = process.env.CV03_RESOURCE_PROOF_SCHEMA;
const [mode, encoded] = process.argv.slice(2);
const request = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
const repo = createPostgresConditionalResourceRepositoryV010({
  connectionString: databaseURL,
  schema
});
try {
  if (mode === "barrier-write") {
    process.send?.({type: "ready"});
    await new Promise(resolve => process.once("message", resolve));
  }
  if (mode === "lost-ack") {
    await repo.putIfRevision(request);
    process.exitCode = 19;
  } else {
    const saved = mode === "archive"
      ? await repo.archiveIfRevision(request)
      : await repo.putIfRevision(request);
    process.send?.({type: "result", revision: saved.revision, payload: saved.payload});
  }
} catch (error) {
  process.send?.({type: "rejected", code: String(error.message)});
  process.exitCode = 2;
} finally {
  await repo.close();
}
