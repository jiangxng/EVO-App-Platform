import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_PACKAGE_ID
} from "./package.js";
import type {
  ActiveContextRefV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  EogAnalysisSnapshotV020,
  EogObservationSnapshotV020,
  EogRuntimeFactV020,
  EogTimeLensV020
} from "../../contracts/enterprise-operating-graph-observatory.js";
import {
  PRIMARY_EOG_SPATIAL_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewStateV010
} from "../../contracts/enterprise-operating-graph-view.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
  type EnterpriseOperatingGraphV010
} from "../../contracts/enterprise-operating-graph.js";
import type {
  SpatialObservatoryPageV010,
  SpatialObservatoryStateV010,
  SpatialObservationBadgeV010
} from "../../vendor/eidos/src/3d/index.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../../contracts/enterprise-operating-graph-read.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";
import type {
  EnterpriseOperatingGraphObservatoryProviderResolverV020
} from "../../contracts/enterprise-operating-graph-observatory-runtime.js";
import {
  parseEogMetricCodesV020,
  parseEogTimeLensInputV020
} from "../../eog/observatory-input.js";
import {
  projectEnterpriseOperatingGraphSpatialBaseV010
} from "../../eog/spatial-projection.js";

export const EOG_SPATIAL_OBSERVATORY_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory-spatial";
export const EOG_SPATIAL_OBSERVATORY_ROUTE =
  "/operating-graph/observe/3d";
export const EOG_SPATIAL_OBSERVATORY_GET_ACTION =
  "enterprise-operating-graph.observatory.spatial.get";

export function createEnterpriseOperatingGraphSpatialObservatoryExperienceManifestV020() {
  return {
    contractVersion: "0.1.0" as const,
    experienceId: "evo-enterprise-operating-graph-observatory-spatial",
    packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
    featureId: ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
    defaultRoute: EOG_SPATIAL_OBSERVATORY_ROUTE,
    pages: [{
      id: "evo-enterprise-operating-graph.observatory-spatial",
      title: "Enterprise Observatory 3D",
      source: EOG_SPATIAL_OBSERVATORY_PAGE_SOURCE
    }],
    routes: [{
      id: "evo-enterprise-operating-graph.observatory-spatial",
      path: EOG_SPATIAL_OBSERVATORY_ROUTE,
      pageId: "evo-enterprise-operating-graph.observatory-spatial"
    }],
    navigation: [{
      id: "evo-enterprise-operating-graph.observatory-spatial.nav",
      label: "Observe 3D",
      route: EOG_SPATIAL_OBSERVATORY_ROUTE,
      order: 17
    }]
  };
}

function preset(id:string,label:string,hours:number,now:Date) {
  const end=now.getTime();
  const start=end-hours*3_600_000;
  return {
    id,label,
    values:{
      timeLens:{
        contractVersion:"0.2.0",
        primary:{startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString()},
        comparison:{kind:"PREVIOUS_PERIOD"}
      },
      metricCodes:[
        "event.count","event.frequency","flow.throughput","flow.wip","flow.backlog",
        "balance.quantity","business.quantity","sop.transition.count","sop.trace.transition","sop.trace.coverage"
      ]
    } as Record<string,JsonValue>
  };
}

export function createEnterpriseOperatingGraphSpatialObservatoryPageV020(input:{
  activeContext:ActiveContextRefV010;
  locale?:string;
  now?:Date;
}):SpatialObservatoryPageV010 {
  const now=input.now??new Date();
  return {
    contractVersion:"0.1.0",
    kind:"spatial-observatory",
    id:"evo-enterprise-operating-graph.observatory-spatial",
    title:input.locale?.toLowerCase().startsWith("zh")?"企业运行观测 3D":"Enterprise Observatory 3D",
    resourceId:PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
    readCommand:{code:EOG_SPATIAL_OBSERVATORY_GET_ACTION,inputVersion:"0.2.0"},
    requestValues:{activeContext:structuredClone(input.activeContext) as unknown as JsonValue},
    readPresets:[
      preset("4h","4h",4,now),preset("24h","24h",24,now),preset("7d","7d",168,now),preset("1h","1h",1,now)
    ],
    emptyMessage:input.locale?.toLowerCase().startsWith("zh")
      ?"选择一个对象或关系查看运行事实与分析证据。"
      :"Select an object or relation to inspect runtime facts and analysis evidence."
  };
}

function factTargetKey(f:EogRuntimeFactV020):string {
  return f.target.kind==="NODE"
    ?"NODE:"+f.target.nodeId
    :"RELATION:"+f.target.authority+":"+f.target.relationId;
}
function num(v:number):string{return Math.abs(v)>=100?String(Math.round(v)):v.toFixed(2).replace(/\.00$/u,"");}
function factBadges(target:string,snapshot:EogObservationSnapshotV020):SpatialObservationBadgeV010[]{
  const order=["event.frequency","event.count","flow.throughput","flow.wip","flow.backlog","balance.quantity","business.quantity"];
  const result:SpatialObservationBadgeV010[]=[];
  for(const code of order){
    const fact=snapshot.primaryFacts.find(f=>factTargetKey(f)===target&&f.metric.code===code);
    if(!fact) continue;
    result.push({id:fact.factId,label:code,value:num(fact.value)+" "+fact.metric.unit,detail:fact.source.sourceRef});
  }
  if("overlays" in snapshot){
    for(const o of (snapshot as EogAnalysisSnapshotV020).overlays.filter(o=>{
      const k=o.target.kind==="NODE"?"NODE:"+o.target.nodeId:"RELATION:"+o.target.authority+":"+o.target.relationId;
      return k===target;
    })){
      const label=o.analysisKind==="BOTTLENECK"
        ?"Bottleneck"
        :o.analysisKind==="SOP_CONFORMANCE"
          ?"SOP"
          :o.analysisKind==="SOP_EXCEPTION"
            ?"SOP exception"
            :o.analysisKind==="SOP_DEVIATION"
              ?"SOP deviation"
              :o.analysisKind;
      const value=o.analysisKind==="SOP_CONFORMANCE"&&typeof o.score==="number"
        ?num(o.score*100)+"%"
        :o.status==="OBSERVED"?o.severity:o.status;
      result.push({
        id:o.overlayId,
        label,
        value,
        detail:[
          o.score===undefined?undefined:"score "+num(o.score),
          o.confidence===undefined?undefined:"confidence "+num(o.confidence*100)+"%",
          o.source.analyzerRef
        ].filter(Boolean).join(" · ")
      });
    }
  }
  return result;
}

export function projectEnterpriseOperatingGraphSpatialObservatoryStateV020(input:{
  graph:EnterpriseOperatingGraphV010;
  view:EnterpriseOperatingGraphViewStateV010;
  snapshot?:EogObservationSnapshotV020|EogAnalysisSnapshotV020;
}):SpatialObservatoryStateV010 {
  const base = projectEnterpriseOperatingGraphSpatialBaseV010({
    graph: input.graph,
    view: input.view
  });
  if (!input.snapshot) {
    return {
      ...base,
      notice: "Enterprise Observatory 3D. No Runtime Fact Provider is currently contributing overlays."
    };
  }

  const objects = base.objects.map(object => ({
    ...object,
    observations: factBadges("NODE:" + object.id, input.snapshot!)
  }));
  const links = base.links.map(link => {
    const target = link.id.startsWith("guidance-edge:")
      ? "RELATION:GUIDANCE:" + link.id.slice("guidance-edge:".length)
      : link.id.startsWith("enterprise-edge:")
        ? "RELATION:ENTERPRISE:" + link.id.slice("enterprise-edge:".length)
        : undefined;
    return {
      ...link,
      ...(target
        ? { observations: factBadges(target, input.snapshot!) }
        : {})
    };
  });

  return {
    ...base,
    objects,
    links,
    notice: "Enterprise Observatory 3D overlays Runtime Facts and analysis on the shared EOG spatial projection."
  };
}

function enterpriseId(context:PlatformRequestContextV010):string {
  const a=context.context?.activeContext;
  if(a?.kind!=="ENTERPRISE"||!a.enterpriseId?.trim()) throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  return a.enterpriseId.trim();
}
function success(request:AppActionRequestV010,value:unknown):AppActionExecutionResultV010 {
  return {ok:true,correlationId:request.sourceInteractionId,result:JSON.parse(JSON.stringify(value))};
}
function failure(request:AppActionRequestV010,error:unknown):AppActionExecutionResultV010 {
  const message=error instanceof Error?error.message:String(error); const [code]=message.split(":");
  return {ok:false,correlationId:request.sourceInteractionId,error:{code:/^[A-Z0-9_]+$/u.test(code) ? code:"EOG_SPATIAL_OBSERVATORY_FAILED",message}};
}

export function createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020(input:{
  graphService:EnterpriseOperatingGraphReadProviderV010;
  viewService:EnterpriseOperatingGraphViewStateProviderV010;
  providers:EnterpriseOperatingGraphObservatoryProviderResolverV020;
}):AppActionHandler {
  return {
    packageId:ENTERPRISE_OBSERVATORY_PACKAGE_ID,
    featureId:ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
    commandCode:EOG_SPATIAL_OBSERVATORY_GET_ACTION,
    async execute(request,context){
      if(!context) return failure(request,new Error("REQUEST_CONTEXT_REQUIRED"));
      try{
        const eid=enterpriseId(context);
        const graphId=typeof request.values.resourceId==="string"?request.values.resourceId.trim():"";
        const graph=input.graphService.get({enterpriseId:eid,graphId});
        const view=input.viewService.ensure({enterpriseId:eid,graphId,viewId:PRIMARY_EOG_SPATIAL_VIEW_ID_V010,kind:"SPATIAL_3D"});
        if(!input.providers.hasRuntimeCandidate()) return success(request,projectEnterpriseOperatingGraphSpatialObservatoryStateV020({graph,view}));
        const timeLens=parseEogTimeLensInputV020(request.values.timeLens) as EogTimeLensV020;
        const metricCodes=parseEogMetricCodesV020(request.values.metricCodes);
        const service=input.providers.createService({graphService:input.graphService,enterpriseId:eid,requireAnalysis:input.providers.hasAnalysisCandidate()});
        const snapshot=input.providers.hasAnalysisCandidate()
          ?await service.analyze({enterpriseId:eid,graphId,timeLens,...(metricCodes?.length?{metricCodes}:{})})
          :await service.observe({enterpriseId:eid,graphId,timeLens,...(metricCodes?.length?{metricCodes}:{})});
        return success(request,projectEnterpriseOperatingGraphSpatialObservatoryStateV020({graph,view,snapshot}));
      }catch(error){return failure(request,error);}
    }
  };
}
