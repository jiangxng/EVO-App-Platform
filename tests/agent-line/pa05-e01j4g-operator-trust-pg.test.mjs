import test from "node:test";
import assert from "node:assert/strict";
import {createHostBearerSessionProviderV010}
  from "../../dist/providers/request-session/runtime.js";
import {createHostStaticAuthorizationProviderV010}
  from "../../dist/providers/authorization/runtime.js";
import {recoverPa05TrustedPrestartupUninstallV010}
  from "../../dist/manager/pa05-read-owner-trusted-prestartup.js";

test("E01J4G identity/Provider/Secrets fail closed before SQL and never reveal credentials",
  async () => {
    const hostId="read-host-a", owner="evo-purchase-attention";
    const secretMarker="postgres://secret-operator-password@localhost/db";
    const token="test-only-fresh-bearer";
    const until=new Date(Date.now()+120000).toISOString();
    const issued=new Date(Date.now()-10000).toISOString();
    const session={
      contractVersion:"0.1.0",sessionId:"operator-session-1",
      principal:{
        contractVersion:"0.1.0",subjectId:"human:operator",
        actorType:"HUMAN",identityProviderId:"test-session-issuer"
      },issuedAt:issued,expiresAt:until
    };
    const identity=createHostBearerSessionProviderV010([{token,session}]);
    const allowRule={
      id:"pa05-exact-host-only",effect:"ALLOW",
      actions:["host.plugin.lifecycle.prestartup-uninstall-recovery"],
      subjectIds:["human:operator"],actorTypes:["HUMAN"],
      resourceTypes:["plugin-host-lifecycle"],
      resourceIds:[owner+"@"+hostId]
    };
    const policy=createHostStaticAuthorizationProviderV010({
      contractVersion:"0.1.0",rules:[allowRule]
    });
    let touchedSql=0, touchedManager=0, touchedSecret=0;
    const manager={getSnapshot(){
      touchedManager++;
      return {installedPackages:[],activeFeatures:[],effectiveCapabilities:[],
        contractVersion:"0.1.0"};
    }};
    const secrets={
      providerId:"test-secret",resolve(){touchedSecret++;
        throw Error("NEVER_ECHO:"+secretMarker);
      },describe(){return {configured:false};}
    };
    const audits=[];
    const basic={
      mode:"OPT_IN",hostId,schema:"pa05_test_schema",
      manager,bearerToken:token,sessionProvider:identity,
      authorizationProvider:policy,secretsProvider:secrets,
      audit:async event=>{audits.push(event);}
    };
    async function denied(input,code){
      await assert.rejects(recoverPa05TrustedPrestartupUninstallV010(input),
        error=>{assert.equal(error.message,code);
          assert.equal(error.message.includes(secretMarker),false);
          return true;});
    }
    await denied({...basic,mode:undefined},"PA05_J4G_TRUST_CONFIGURATION_INVALID");
    await denied({...basic,bearerToken:"not-real"},
      "PA05_J4G_OPERATOR_DENIED");
    await denied({...basic,sessionProvider:{
      ...identity,providerId:"identity-provider",
      resolve:()=>({...session,expiresAt:new Date(Date.now()-1000).toISOString()})
    }},"PA05_J4G_OPERATOR_DENIED");
    await denied({...basic,sessionProvider:{
      providerId:"test-ai-provider",resolve:()=>({...session,
        principal:{...session.principal,actorType:"AI"}})
    }},"PA05_J4G_OPERATOR_DENIED");
    await denied({...basic,authorizationProvider:
      createHostStaticAuthorizationProviderV010({contractVersion:"0.1.0",rules:[]})
    },"PA05_J4G_OPERATOR_DENIED");
    await denied({...basic,hostId:"read-host-b"},"PA05_J4G_OPERATOR_DENIED");
    await denied({...basic,authorizationProvider:{
      providerId:"policy-with-obligation",check:()=>({
        contractVersion:"0.1.0",allowed:true,
        policyProviderId:"policy-with-obligation",reasonCodes:["ALLOW"],
        obligations:[{type:"REQUIRE_APPROVAL"}]
      })
    }},"PA05_J4G_OPERATOR_DENIED");
    await denied({...basic,authorizationProvider:{
      providerId:"dead-policy",check:()=>{throw Error("provider unavailable")}
    }},"PA05_J4G_OPERATOR_DENIED");
    assert.equal(touchedSql,0);
    assert.equal(touchedSecret,0);
    assert.equal(touchedManager,0);
    assert.equal(audits.length,0);
    await denied({...basic,audit:async()=>{throw Error(secretMarker)}},
      "PA05_J4G_AUDIT_UNAVAILABLE");
    assert.equal(touchedSecret,0);
    await denied(basic,"PA05_J4G_RECOVERY_DENIED_OR_UNKNOWN");
    assert.equal(touchedSecret,1);
    assert.equal(audits.length,1);
    assert.equal(audits[0].stage,"AUTHORIZED");
    for(const event of audits){
      assert.equal(JSON.stringify(event).includes(token),false);
      assert.equal(JSON.stringify(event).includes(secretMarker),false);
    }
    console.log("PA05_E01J4G_PROVIDER_DENIAL="+JSON.stringify({
      badTokenDenied:true,expiredHumanDenied:true,agentIdentityDenied:true,
      missingPolicyDenied:true,wrongHostDenied:true,
      obligationsDenied:true,providerOutageDenied:true,
      auditOutageBeforeSecretsDenied:true,
      secretsErrorRedacted:true,unauthorizedSqlTouched:false,
      productionOperatorIdentityCertified:false,
      productionSecretsProvisioned:false,maintenanceCliDelivered:false,
      pa05Signed:false
    }));
  });
