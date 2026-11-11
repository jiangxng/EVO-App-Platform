/**
 * CV-03 N1-05a read-only, source-anchored production-authority topology preflight.
 * Not a production DB inspection, Owner signoff, or authorization certificate.
 * A green preflight means the known NOT_CERTIFIED boundaries remain visible.
 */
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const CV03_N105A_SOURCE_FILES = Object.freeze([
  "manager/store.ts",
  "manager/service.ts",
  "manager/server.ts",
  "manager/cv03-personal-saved-view-host-admission.ts",
  "contracts/platform-services.ts",
  "providers/authorization/runtime.ts",
  "providers/enterprise-context/resources-postgres.ts",
  "providers/enterprise-context/package.ts",
  "tools/cv03-n1-postgres-role-audit.mjs"
]);

const evidence = Object.freeze([
  {
    id:"HOST_RESOURCE_DEFAULT_IS_FILE_OR_MEMORY",
    file:"manager/server.ts",
    matches:s=>s.includes("const enterpriseResourceRepository =")
      &&s.includes("createFileEnterpriseResourceRepositoryV010(")
      &&s.includes(": createMemoryEnterpriseResourceRepositoryV010()")
  },
  {
    id:"HOST_AUTHORIZATION_HAS_STATIC_OVERLAY",
    file:"manager/server.ts",
    matches:s=>s.includes("APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON")
      &&s.includes("createHostStaticAuthorizationProviderV010(authorizationPolicy)")
  },
  {
    id:"AUTHORIZATION_PROVIDER_V010_CHECK_ONLY_CONTRACT",
    file:"contracts/platform-services.ts",
    matches:s=>s.includes("export interface AuthorizationProviderV010")
      &&s.includes("input: AuthorizationCheckV010")
      &&s.includes("Promise<AuthorizationDecisionV010> | AuthorizationDecisionV010")
  },
  {
    id:"PA05_FILE_MEMORY_STORE",
    file:"manager/server.ts",
    matches:s=>s.includes("createFileLifecycleStore(lifecycleStateFile) : createMemoryLifecycleStore()")
  },
  {
    id:"PA05_DISABLE_EVENT_POST_MUTATION",
    file:"manager/service.ts",
    matches:s=>{
      const a=s.indexOf("function disable(packageId:");
      const b=s.indexOf("function planUninstall(",a);
      const segment=a>=0&&b>a?s.slice(a,b):"";
      const mutation=segment.indexOf("store.deleteActiveFeature(featureId)");
      const callback=segment.indexOf("onLifecycleEvent(",mutation);
      return mutation>=0&&callback>mutation;
    }
  },
  {
    id:"HOST_EVENTS_ARE_IN_PROCESS",
    file:"manager/server.ts",
    matches:s=>s.includes('pluginEvents.publish("evo.app-platform", "evo.app-platform.lifecycle", event)')
      &&s.includes("if (lifecycleEventLog.length > 100) lifecycleEventLog.shift()")
  },
  {
    id:"AUTHORIZATION_PROVIDER_RUNTIME_RESOLVED",
    file:"manager/server.ts",
    matches:s=>s.includes("function resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined")
      &&s.includes("resolveProviderRuntimeV010<AuthorizationProviderV010>(")
  },
  {
    id:"AUTHORIZATION_POLICY_IS_NOT_PG_AUTHORITY",
    file:"providers/authorization/runtime.ts",
    matches:s=>s.includes("createHostStaticAuthorizationProviderV010")
      &&s.includes("HostStaticAuthorizationPolicyV010")
  },
  {
    id:"RESOURCE_PG_EXPLICIT_OPT_IN",
    file:"providers/enterprise-context/resources-postgres.ts",
    matches:s=>s.includes("Never registered as the default Host repository")
      &&s.includes('receiptWriteMode?: "LEGACY_DIRECT_ISOLATED_V010" | "SQL_GATEWAY_ISOLATED_V010"')
      &&s.includes('readMode?: "SQL_ROLE_SCOPED_ISOLATED_V010"')
  },
  {
    id:"SAVED_VIEW_FEATURE_NOT_IN_DEFAULT_PACKAGE",
    file:"providers/enterprise-context/package.ts",
    matches:s=>!s.includes("host-enterprise-context-provider.personal-saved-views")
  },
  {
    id:"HOST_STARTUP_WRITE_AND_RESTORE_GATES",
    file:"manager/server.ts",
    matches:s=>s.includes("assertCv03HumanSaveNotEnabledV010(process.env)")
      &&s.includes("assertCv03UnadmittedPersistedFeatureAbsentV010(restored)")
  },
  {
    id:"HOST_SAVE_DENIAL_STILL_WIRED",
    file:"manager/server.ts",
    matches:s=>s.includes("cv03UnadmittedWriteDenialV010(action)")
  },
  {
    id:"SAVE_MODE_IS_OFF_ONLY",
    file:"manager/cv03-personal-saved-view-host-admission.ts",
    matches:s=>s.includes('if(value!=="OFF")throw Error("CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED")')
      &&s.includes('code:"CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED"')
  },
  {
    id:"SQL_RUNTIME_AUDIT_CANNOT_CERTIFY",
    file:"tools/cv03-n1-postgres-role-audit.mjs",
    matches:s=>s.includes('blockers.push("CV03_N1_DB_ENFORCED_SIGNED_WRITE_GATEWAY_NOT_PROVEN")')
      &&s.includes('state:"NOT_CERTIFIED"')
  }
]);

export function inspectCv03N105aAuthorityBoundary(root=resolve(dirname(fileURLToPath(import.meta.url)),"..")){
  const sources=new Map();
  for(const file of CV03_N105A_SOURCE_FILES){
    try{
      const bytes=readFileSync(resolve(root,file));
      sources.set(file,{text:bytes.toString("utf8"),sha256:createHash("sha256").update(bytes).digest("hex")});
    }catch{
      sources.set(file,{text:null,sha256:null});
    }
  }
  const findings=evidence.map(({id,file,matches})=>{
    const source=sources.get(file);
    const matched=source?.text!==null && matches(source.text);
    return {id,file,sourceGrade:"G_SOURCE_ANCHOR",matched:!!matched,sha256:source?.sha256??null};
  });
  return {
    contractVersion:"0.1.0",
    milestone:"CV03_N1_05A",
    certification:"NOT_CERTIFIED",
    ownerSignoff:"PENDING_EXTERNAL_OWNER_DECISION",
    sourceAnchorStatus:findings.every(f=>f.matched)?"BASELINE_MATCH":"DRIFT_REQUIRES_MANUAL_REVIEW",
    scope:"READ_ONLY_SOURCE_BOUNDARY_PREFLIGHT_NOT_RUNTIME_ATTESTATION",
    findings,
    blockers:[
      "PRODUCTION_PA05_AUTHORIZATION_POSTGRES_ATOMIC_T0_NOT_SIGNED",
      "PRODUCTION_HOST_PRODUCER_IDENTITY_KMS_SQL_ACL_NOT_SIGNED",
      "COMPLETE_SCOPE_RECOVERY_ROLLBACK_NOT_SIGNED",
      "HUMAN_AGENT_RELEASE_GATES_NOT_MET"
    ]
  };
}

if(process.argv[1] && import.meta.url===new URL("file://"+resolve(process.argv[1])).href){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
  const report=inspectCv03N105aAuthorityBoundary(root);
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
  // --check verifies non-certification guard stability; it NEVER certifies.
  if(process.argv.includes("--check")&&report.sourceAnchorStatus!=="BASELINE_MATCH")
    process.exitCode=1;
}
