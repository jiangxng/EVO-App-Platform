/**
 * CV04 NEXT-05a: read-only live-Owner + source release-barrier.
 *
 * GREEN means the official cross-page EXPORT capability remains OFF because
 * genuine PA05/T0 production authority, Owner reviews, signing workload/KMS
 * and physical SQL DB Owner have NOT been proven. GREEN is NEVER certification
 * or permission to register a new Host/Agent action.
 *
 * The upstream CV03 Owner issue is a shared AUTHORITY dependency, not an
 * EXPORT Owner approval. Changes to issue or source must trigger independent
 * review. No secrets, SQL connections, DDL, DML, KMS or test-key installation.
 */
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {inspectCv03N105c09OwnerEvidenceGate} from
  "./cv03-n105c09-owner-evidence-release-gate.mjs";

const rootDefault=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const issueUrl="https://github.com/jiangxng/EVO-App-Platform/issues/1212";
const managedUrl="https://github.com/jiangxng/EVO-App-Platform/pull/1184";
const nonEmpty=s=>typeof s==="string"&&s.trim().length>0;

export const CV04_NEXT05_RELEASE_SOURCE_FILES=Object.freeze([
  "manager/server.ts",
  "catalog/seed.ts",
  "apps/business-dictionary/export-jobs.ts",
  "apps/business-dictionary/export-job-pg-store.ts",
  "apps/business-dictionary/export-job-pg-sql-lease.ts",
  "apps/business-dictionary/export-job-pg-dispatch.ts",
  "tools/cv04-isolated-signed-export-gateway.mjs"
]);

const source=(root,path)=>readFileSync(resolve(root,path),"utf8");

/**
 * A protected main source check + real GitHub Issue metadata check, not an
 * attestation-verification implementation. Intentionally NO "approved" state.
 */
export function inspectCv04Next05ReleaseGate(input,{root=rootDefault}={}){
  const upstream=inspectCv03N105c09OwnerEvidenceGate(input,{root});
  const issue=input?.issue,related=input?.managedDocsPr;
  const issueIdentity=issue?.number===1212&&issue?.html_url===issueUrl;
  const issuePending=issueIdentity&&issue.state==="open"&&
    typeof issue.body==="string"&&
    issue.body.includes("PENDING OWNER SIGNOFF")&&
    issue.body.includes("N1=NOT_CERTIFIED");
  const parallelIdentity=related?.number===1184&&
    related?.html_url===managedUrl&&
    (related?.state==="open"||related?.state==="closed");
  const checked=typeof issue?.body==="string"?
    (issue.body.match(/^- \[[xX]\] /gm)||[]).length:0;
  const checks={
    upstreamOwnerIssueStillPending:!!issuePending,
    upstreamOwnerDocumentIdentityVerifiable:!!parallelIdentity,
    upstreamCv03OwnerBarrierUnchanged:
      upstream.gateStatus==="EXPECTED_BLOCKED_BASELINE",
    formalExportOperationStillUnregistered:false,
    stagedDomainOwnerStillProductionDisabled:false,
    stagedEncryptedPgStoreStillProductionDisabled:false,
    physicalSqlLeaseStillProductionDisabled:false,
    pollingAndDispatcherStillProductionDisabled:false,
    isolatedSignedSqlGatewayNotProductMounted:false
  };
  try{
    const server=source(root,"manager/server.ts");
    const catalog=source(root,"catalog/seed.ts");
    const owner=source(root,"apps/business-dictionary/export-jobs.ts");
    const encrypted=source(root,"apps/business-dictionary/export-job-pg-store.ts");
    const lease=source(root,"apps/business-dictionary/export-job-pg-sql-lease.ts");
    const dispatch=source(root,"apps/business-dictionary/export-job-pg-dispatch.ts");
    const gateway=source(root,"tools/cv04-isolated-signed-export-gateway.mjs");
    checks.formalExportOperationStillUnregistered=
      !server.includes("dictionary.collection.export.job.request")&&
      !catalog.includes("dictionary.collection.export.job.request")&&
      !server.includes("dictionary.collection.export.job.worker")&&
      !catalog.includes("dictionary.collection.export.job.worker");
    checks.stagedDomainOwnerStillProductionDisabled=
      owner.includes('const testScope=input.isolatedTestOnly===true && process.env.NODE_ENV==="test"')&&
      owner.includes('throw new Error("COLLECTION_EXPORT_SHARED_AUTHORITY_REQUIRED")');
    checks.stagedEncryptedPgStoreStillProductionDisabled=
      encrypted.includes('process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true')&&
      encrypted.includes("COLLECTION_EXPORT_PG_PRODUCTION_ADMISSION_NOT_CERTIFIED");
    // The installer and the independent Host/Worker client each require
    // their OWN test-only guard. A single surviving string is insufficient:
    // weakening either branch must independently fail the release gate.
    const leaseGuards=lease.split(
      'process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true'
    ).length-1;
    checks.physicalSqlLeaseStillProductionDisabled=
      leaseGuards>=2&&
      lease.includes("CV04_EXPORT_LEASE_PRODUCTION_INSTALL_DENIED")&&
      lease.includes("CV04_EXPORT_LEASE_PRODUCTION_USE_DENIED");
    checks.pollingAndDispatcherStillProductionDisabled=
      dispatch.includes('process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true')&&
      dispatch.includes("CV04_EXPORT_DISPATCH_PRODUCTION_DISABLED")&&
      dispatch.includes("CV04_EXPORT_POLL_PRODUCTION_DISABLED");
    checks.isolatedSignedSqlGatewayNotProductMounted=
      gateway.includes("CV04_EXPORT_GATEWAY_ISOLATED_SCHEMA_REQUIRED")&&
      gateway.includes("cv04.dictionary-export.host-write/0.1.0")&&
      !server.includes("cv04IsolatedSignedExportGatewaySqlV010")&&
      !server.includes("createIsolatedDictionaryExportPgPollingV010")&&
      !server.includes("createDictionaryExportJobOwnerV010")&&
      !catalog.includes("createDictionaryExportJobOwnerV010");
  }catch{
    // Missing/unknown sources produce DRIFT, never release approval.
  }
  const stable=Object.values(checks).every(Boolean);
  return {
    contractVersion:"0.1.0",
    milestone:"CV04_NEXT05A",
    evidenceKind:"REAL_GITHUB_DEPENDENCY_AND_SOURCE_GUARD_ONLY",
    ownerIssue:issueUrl,parallelOwnerDocsPr:managedUrl,
    issueCheckedBoxes:checked,checkedBoxesConstituteApproval:false,
    actualProductionAuthorityVerified:false,
    actualWorkloadSignerAndKmsVerified:false,
    actualPhysicalSqlOwnerAndTwoHostVerified:false,
    productionExportEnabled:false,
    releaseDecision:"DENY_UNTIL_INDEPENDENT_OWNERS_AND_CANONICAL_PA05_T0_KMS",
    gateStatus:stable?"EXPECTED_BLOCKED_BASELINE":
      "DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED",
    checks
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.includes("--certify")||args.includes("--enable")||
     args.includes("--release")){
    process.stderr.write("CV04_NEXT05_PRODUCTION_CERTIFICATION_FORBIDDEN\n");
    process.exitCode=2;
  }else{
    try{
      const n=args.indexOf("--input");
      if(n<0||!nonEmpty(args[n+1]))throw Error("CV04_NEXT05_LIVE_GITHUB_INPUT_REQUIRED");
      const input=JSON.parse(readFileSync(resolve(args[n+1]),"utf8"));
      const report=inspectCv04Next05ReleaseGate(input);
      process.stdout.write(JSON.stringify(report,null,2)+"\n");
      if(args.includes("--check")&&
         report.gateStatus!=="EXPECTED_BLOCKED_BASELINE")
        process.exitCode=1;
    }catch{
      // No API bodies, actor or strategy fragments in CI log.
      process.stderr.write("CV04_NEXT05_RELEASE_EVIDENCE_UNVERIFIABLE\n");
      process.exitCode=1;
    }
  }
}
