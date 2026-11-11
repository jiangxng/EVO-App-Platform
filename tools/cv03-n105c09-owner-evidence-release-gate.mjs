/**
 * CV03/N1-05c-09: source + live GitHub Owner decision integrity check.
 *
 * Green = the known OFF / NOT_CERTIFIED guard remains intact; NEVER approval.
 * The issue's checked checkboxes, comments or an unrelated PR title do not
 * establish independent Owner signatures, physical PostgreSQL identity or
 * a production authority/outbox migration. Owner-approved release requires
 * a separate versioned production integration and independent review.
 *
 * Input: untrusted GitHub API JSON from GH_TOKEN read-only API into stdin.
 * Output: fixed-schema non-secret summary. Never print source or issue body.
 */
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {inspectCv03N105aAuthorityBoundary} from
  "./cv03-n105a-authority-boundary-preflight.mjs";

const rootDefault=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const issueUrl="https://github.com/jiangxng/EVO-App-Platform/issues/1212";
const parallelPrUrl="https://github.com/jiangxng/EVO-App-Platform/pull/1184";

const nonEmpty=(s)=>typeof s==="string"&&s.trim().length>0;
const read=(root,file)=>readFileSync(resolve(root,file),"utf8");

export const CV03_N105C09_OWNER_GATE_SOURCE_FILES=Object.freeze([
  "manager/server.ts",
  "manager/cv03-personal-saved-view-host-admission.ts",
  "manager/cv03-n105b-authority-t0-pg.ts",
  "manager/cv03-n105b-pa05-host-lifecycle.ts"
]);

export function inspectCv03N105c09OwnerEvidenceGate(input,{root=rootDefault}={}){
  const issue=input?.issue;
  const related=input?.managedDocsPr;
  const body=issue?.body;
  const issueIdentified=issue?.number===1212&&issue?.html_url===issueUrl;
  const issueOpen=issueIdentified&&issue?.state==="open";
  const issuePending=nonEmpty(body)&&
    /PENDING OWNER SIGNOFF/.test(body)&&
    /N1=NOT_CERTIFIED/.test(body)&&
    /APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF/.test(body);
  // Deliberately count the misleading checkmarks as diagnostics only.
  const checkedCount=nonEmpty(body)?
    (body.match(/^- \[[xX]\] /gm)||[]).length:0;
  const uncheckedCount=nonEmpty(body)?
    (body.match(/^- \[ \] /gm)||[]).length:0;
  const managedPrIdentified=related?.number===1184&&
    related?.html_url===parallelPrUrl&&
    (related?.state==="open"||related?.state==="closed");
  // The parallel Owner docs PR may legitimately merge later.
  // Neither OPEN nor MERGED constitutes actual production authorization.
  const managedPrState=managedPrIdentified?
    (related.merged_at?"MERGED":"OPEN_OR_CLOSED_NOT_AUTHORITY_SIGNOFF"):
    "UNVERIFIABLE";

  const baseline=inspectCv03N105aAuthorityBoundary(root);
  let isolatedSeamsUnmounted=false;
  let explicitAdmissionHardDeny=false;
  try{
    const server=read(root,"manager/server.ts");
    const admission=read(root,"manager/cv03-personal-saved-view-host-admission.ts");
    const t0=read(root,"manager/cv03-n105b-authority-t0-pg.ts");
    const lifecycle=read(root,"manager/cv03-n105b-pa05-host-lifecycle.ts");
    isolatedSeamsUnmounted=
      t0.includes("UNMOUNTED")&&lifecycle.includes("UNMOUNTED")&&
      !/\bcreateCv03N105b(?:DenyT0Pg|Pa05HostLifecycleBarrier)V010\b/.test(server);
    explicitAdmissionHardDeny=
      admission.includes('if(value!=="OFF")throw Error("CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED")')&&
      admission.includes('code:"CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED"')&&
      server.includes("assertCv03HumanSaveNotEnabledV010(process.env)")&&
      server.includes("cv03UnadmittedWriteDenialV010(action)");
  }catch{
    // An absent or unreadable source is UNKNOWN, never release permission.
  }

  const checks={
    ownerIssueIdentityVerified:issueIdentified,
    ownerIssueOpen:issueOpen,
    ownerIssueStillExplicitlyPending:!!issuePending,
    managedOwnerDocsPrIdentityVerified:managedPrIdentified,
    n105aSourceBoundaryStable:baseline.sourceAnchorStatus==="BASELINE_MATCH",
    optionalSqlAuthorityAndLifecycleSeamsUnmounted:isolatedSeamsUnmounted,
    humanSaveAdmissionStillHardDenied:explicitAdmissionHardDeny
  };
  const stable=Object.values(checks).every(Boolean);
  return {
    contractVersion:"0.1.0",
    milestone:"CV03_N1_05C_09",
    sourceGrade:"LIVE_GITHUB_ISSUE_AND_SOURCE_ANCHOR_WITHOUT_SIGNOFF",
    ownerIssue:issueUrl,
    managedDocsPr:parallelPrUrl,
    checkedChecklistItems:checkedCount,
    uncheckedChecklistItems:uncheckedCount,
    checkedBoxesAreApproval:false,
    managedPrState,
    certification:"NOT_CERTIFIED",
    ownerDecision:"NOT_ATTESTED_BY_THIS_GATE",
    releaseDecision:"DENY_NO_PRODUCTION_OWNER_APPROVED_INTEGRATION",
    gateStatus:stable?"EXPECTED_BLOCKED_BASELINE":"DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED",
    checks
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.includes("--certify")||args.includes("--release")){
    process.stderr.write("CV03_N105C09_RELEASE_CERTIFICATION_FORBIDDEN\n");
    process.exitCode=2;
  } else {
    try{
      const fi=args.indexOf("--input");
      if(fi<0||!nonEmpty(args[fi+1]))throw Error("CV03_N105C09_GITHUB_INPUT_REQUIRED");
      const input=JSON.parse(readFileSync(resolve(args[fi+1]),"utf8"));
      const report=inspectCv03N105c09OwnerEvidenceGate(input);
      process.stdout.write(JSON.stringify(report,null,2)+"\n");
      if(args.includes("--check")&&report.gateStatus!=="EXPECTED_BLOCKED_BASELINE"){
        process.exitCode=1;
      }
    }catch{
      // Do not print raw API JSON, file paths, issue text or credentials.
      process.stderr.write("CV03_N105C09_OWNER_EVIDENCE_UNVERIFIABLE\n");
      process.exitCode=1;
    }
  }
}
