import {
  createPostgresConditionalResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";
import {hmacCv03HostResourceReceiptV010}
  from "../../dist/providers/enterprise-context/resource-receipt-digest.js";

const databaseURL = process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const schema = process.env.CV03_RESOURCE_PROOF_SCHEMA;
const [mode, encoded] = process.argv.slice(2);
const request = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
// Synthetic key is only for isolated GitHub Actions fixture; never production.
const TEST_SIGNER={keyId:"cv03-test-v1",
  secret:"CV03-ISOLATED-TEST-KEY-NOT-A-PRODUCTION-SECRET-01"};
const repo = createPostgresConditionalResourceRepositoryV010({
  connectionString: databaseURL,
  schema,
  trustedHostReceiptKeys:[TEST_SIGNER]
});
const signed = receipt => ({receipt,proof:{
  contractVersion:"0.1.0",purpose:"cv03.enterprise-resource.host-write",
  keyId:TEST_SIGNER.keyId,algorithm:"HMAC-SHA256",
  signature:hmacCv03HostResourceReceiptV010(receipt,TEST_SIGNER.keyId,TEST_SIGNER.secret)
}});
try {
  if (mode === "barrier-write" || mode === "receipt-barrier-write") {
    process.send?.({type: "ready"});
    await new Promise(resolve => process.once("message", resolve));
  }
  if (mode === "receipt-barrier-write") {
    const saved = await repo.putIfRevisionWithReceipt(request.input, signed(request.receipt));
    process.send?.({type:"result", revision:saved.resource.revision,
      replayed:saved.replayed, receiptId:saved.receipt.receiptId});
  } else if (mode === "receipt-lost-ack") {
    await repo.putIfRevisionWithReceipt(request.input, signed(request.receipt));
    process.exitCode = 19;
  } else if (mode === "lost-ack") {
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
