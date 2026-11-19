import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAiResponsesLlmProvider } from "../../dist/providers/openai/runtime.js";
import { createDeepSeekResponsesLlmProvider } from "../../dist/providers/deepseek/runtime.js";
import { createProviderBackedAgentModel } from "../../dist/agents/enterprise-agent/provider-model.js";
import { createEnterpriseAgentRuntime } from "../../dist/agents/enterprise-agent/runtime.js";

/**
 * Zero-network security regression from official Responses API documentation:
 * HTTP 200 is not equivalent to a completed response, and model-generated
 * function arguments may be malformed. Missing filters must NEVER become
 * an empty, broader Host business READ. Provider errors use fixed codes:
 * response/argument text must never appear in CI logs.
 *
 * This fixture does not claim remote model quality or bill for tokens.
 */
const readTool={
  id:"evo.collection.read.preview",
  modelName:"evo_collection_read_preview",
  title:"Authorized Collection Preview",
  description:"Only preview current authorized domain records",
  ownerPackageId:"counterparty",
  effect:"READ",
  inputSchema:{
    type:"object",
    properties:{search:{type:"string"}},
    additionalProperties:false
  }
};
const functionCall={
  type:"function_call",
  status:"completed",
  name:"evo_collection_read_preview",
  arguments:JSON.stringify({search:"Supplier"})
};

const suite=[
  ["openai","OPENAI",createOpenAiResponsesLlmProvider,
    "https://api.openai.com/v1/responses"],
  ["deepseek","DEEPSEEK",createDeepSeekResponsesLlmProvider,
    "https://api.deepseek.com/responses"]
];

for(const [name,prefix,createProvider,urlExpected] of suite){
  const invalidCases=[
    ["HTTP 200 incomplete response with partial function call",{
      status:"incomplete",incomplete_details:{reason:"max_output_tokens"},
      output:[functionCall]
    },"RESPONSE_NOT_COMPLETED"],
    ["HTTP 200 failed response with a function call",{
      status:"failed",error:{message:"do-not-print-provider-payload"},
      output:[functionCall]
    },"RESPONSE_NOT_COMPLETED"],
    ["HTTP 200 still running response with function call",{
      status:"in_progress",output:[functionCall]
    },"RESPONSE_NOT_COMPLETED"],
    ["HTTP 200 legacy body with incomplete_details",{
      incomplete_details:{reason:"content_filter"},output:[functionCall]
    },"RESPONSE_NOT_COMPLETED"],
    ["completed response with incomplete function-call item",{
      status:"completed",
      output:[{...functionCall,status:"incomplete"}]
    },"TOOL_CALL_NOT_COMPLETED"],
    ["completed response with malformed JSON",{
      status:"completed",
      output:[{...functionCall,arguments:'{"search":"Supplier"'}]
    },"TOOL_ARGUMENTS_INVALID"],
    ["completed response with JSON null",{
      status:"completed",
      output:[{...functionCall,arguments:"null"}]
    },"TOOL_ARGUMENTS_INVALID"],
    ["completed response with JSON array",{
      status:"completed",
      output:[{...functionCall,arguments:'["Supplier"]'}]
    },"TOOL_ARGUMENTS_INVALID"],
    ["completed response with missing function name",{
      status:"completed",
      output:[{...functionCall,name:undefined}]
    },"TOOL_CALL_INVALID"]
  ];

  test("CV05 "+name+" Responses fail closed on partial turn and invalid tool JSON",async(t)=>{
    for(const [label,fragment,errorCode] of invalidCases){
      await t.test(label,async()=>{
        let fetchCount=0,ownerReadCount=0;
        const provider=createProvider({
          apiKey:"synthetic-non-network-credential",
          model:"cv05-failclosed-fixture",
          fetchImpl:async(url,options)=>{
            fetchCount++;
            assert.equal(String(url),urlExpected);
            assert.equal(options.method,"POST");
            const request=JSON.parse(options.body);
            assert.equal(request.model,"cv05-failclosed-fixture");
            assert.ok(request.tools.some(x=>
              x.name==="evo_collection_read_preview"));
            return Response.json({
              model:"cv05-failclosed-fixture",
              usage:{input_tokens:8,output_tokens:4},
              ...fragment
            });
          }
        });
        const catalog={
          async list(){return [readTool];},
          async invoke(){
            ownerReadCount++;
            return {tool:readTool.id,ok:true,result:{rows:[]}};
          }
        };
        const agent=createEnterpriseAgentRuntime(
          createProviderBackedAgentModel(provider),catalog,2
        );
        await assert.rejects(
          ()=>agent.chat("请查询 Supplier，不能更改筛选条件。"),
          {message:prefix+"_PROVIDER_"+errorCode}
        );
        assert.equal(fetchCount,1);
        assert.equal(ownerReadCount,0,
          "CV05_FAILCLOSED_MUST_NOT_INVOKE_REAL_HOST");
      });
    }
  });

  test("CV05 "+name+" completed response retains legitimate empty object arguments",async()=>{
    const provider=createProvider({
      apiKey:"synthetic-non-network-credential",
      model:"cv05-failclosed-fixture",
      fetchImpl:async()=>Response.json({
        status:"completed",
        model:"cv05-failclosed-fixture",
        output:[{...functionCall,arguments:"{}"}],
        usage:{input_tokens:1,output_tokens:2}
      })
    });
    const response=await provider.infer({
      contractVersion:"0.1.0",
      messages:[{role:"user",content:"Inspect available capabilities"}],
      tools:[{name:readTool.modelName,description:readTool.description,
        inputSchema:readTool.inputSchema}]
    });
    assert.deepEqual(response.toolCalls,[{
      name:"evo_collection_read_preview",arguments:{}
    }]);
    assert.equal(response.usage.inputTokens,1);
  });
}
