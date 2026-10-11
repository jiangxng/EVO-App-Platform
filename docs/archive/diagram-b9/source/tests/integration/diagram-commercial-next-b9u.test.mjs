import test from "node:test";import assert from "node:assert/strict";
import {validateAuthorizedEnterpriseFixtureV010 as check} from "../../tools/diagram-enterprise-fixture-intake-b9k.mjs";
const sample=()=>({contractVersion:"0.1.0",purpose:"diagram-commercial-local-qa",process:"S2C",deidentified:true,ownerApprovedForLocalQa:true,preview2d:{contractVersion:"0.1.0",nodes:[{id:"一",kind:"subject",label:"客户 مرحبا नमस्ते 👩‍💻",x:0,y:0,width:120,height:55},{id:"二",kind:"subject",label:"行\nname",x:250,y:0,width:120,height:55}],edges:[{id:"关系",kind:"REL",source:"一",target:"二",label:"正常"}]}}); 
test("B9u complex Unicode is retained",()=>assert.equal(check(sample()).nodes,2));
test("B9u C0/DEL identifiers and labels are rejected",()=>{for(const c of ["\u0000","\u0007","\u001f","\u007f"]){for(const change of [x=>x.preview2d.nodes[0].id+=c,x=>x.preview2d.nodes[0].label+=c,x=>x.preview2d.edges[0].id+=c,x=>x.preview2d.edges[0].source+=c]){const x=sample();change(x);assert.throws(()=>check(x));}}});
