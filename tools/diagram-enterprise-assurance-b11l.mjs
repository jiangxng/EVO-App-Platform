/** B11l local evidence-policy regression. NOT independent customer consent verification. */
export function createEvidencePacketV010(input){if(!input||!/^B(?:10[k-z]|11[a-p])$/.test(input.stage)||!["SYNTHETIC_NODE","SYNTHETIC_CHROME"].includes(input.method)||typeof input.sha!=="string"||!/^[a-f0-9]{40}$/.test(input.sha)||input.formalStatus!=="NOT TESTED")throw Error("invalid evidence metadata");
 if(Object.keys(input).some(k=>!["stage","method","sha","formalStatus","checksPassed"].includes(k)))throw Error("unexpected evidence field");
 if(!Number.isInteger(input.checksPassed)||input.checksPassed<0)throw Error("invalid check count");
 return{contractVersion:"0.1.0",stage:input.stage,method:input.method,sha:input.sha,checksPassed:input.checksPassed,formalStatus:"NOT TESTED",note:"machine proof only; no customer records or screenshots"};
}
