import type { PackageManifestV010 } from "../../contracts/package.js";
import type { CatalogBrowserV010 } from "../../vendor/eidos/src/catalog-browser/contracts.js";

/**
 * Non-production, read-only presentation adapter, NOT the business domain model.
 * Each stage independently owns its Package, Capability, page and test fixture.
 * App Platform/Eidos keep the real catalog, lifecycle, navigation and rendering.
 */
export const stagePreviewEnabledV010 = () =>
  process.env.APP_PLATFORM_STAGE_MODE === "isolated-preview" &&
  process.env.APP_PLATFORM_TR01B_STAGE_DEMO === "enabled";

export interface TradingStageDemoSpecV010 {
  domain: "purchasing" | "receiving" | "sales" | "shipment" | "receivable" | "cash";
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  recordId: string;
  referenceOrderNo: string;
  statusZh: string;
  fields: Readonly<Record<string, string | number | boolean>>;
  nextDomain?: TradingStageDemoSpecV010["domain"];
}

export const stageRouteV010 = (domain: TradingStageDemoSpecV010["domain"]) =>
  "/trading-stage/" + domain;
export const stagePackageIdV010 = (domain: TradingStageDemoSpecV010["domain"]) =>
  "evo-trading-stage-" + domain;
export const stageFeatureIdV010 = (domain: TradingStageDemoSpecV010["domain"]) =>
  stagePackageIdV010(domain) + ".default";
export const stagePageSourceV010 = (domain: TradingStageDemoSpecV010["domain"]) =>
  "app://" + stagePackageIdV010(domain) + "/pages/overview";

/** One reusable contribution pattern, FOUR distinct installable Packages. */
export function stagePackageV010(s: TradingStageDemoSpecV010): PackageManifestV010 {
  const packageId=stagePackageIdV010(s.domain);
  const featureId=stageFeatureIdV010(s.domain);
  const route=stageRouteV010(s.domain);
  const pageId=packageId + ".overview";
  const navId=packageId + ".navigation";
  return {
    contractVersion:"0.1.0",
    packageId,
    displayName:"EVO " + s.titleEn + " (Synthetic Stage Demo)",
    version:"0.1.0",
    type:"APPLICATION",
    publisher:{id:"evo",displayName:"EVO",trust:"FIRST_PARTY",source:"built-in"},
    compatibility:{
      appPlatform:">=0.1.0 <0.2.0",eidos:"^1.3.0",pluginProtocol:"0.1.0"
    },
    features:[{
      contractVersion:"0.1.0",featureId,packageId,version:"0.1.0",
      activationScope:"INSTALLATION",defaultActivation:true,
      providesCapabilities:["demo.tr01b."+s.domain+".read"],
      contributions:[{
        kind:"eidos.experience",
        manifest:{
          contractVersion:"0.1.0",experienceId:packageId,
          packageId,featureId,defaultRoute:route,
          pages:[{id:pageId,title:s.titleEn,source:stagePageSourceV010(s.domain)}],
          routes:[{id:pageId,path:route,pageId}],
          navigation:[{id:navId,label:s.titleEn,route,order:60}]
        }
      },{
        kind:"eidos.localization-bundle",
        bundle:{
          contractVersion:"0.1.0",namespace:packageId,locale:"zh-CN",
          messages:{["navigation."+navId+".label"]:s.titleZh}
        }
      },{
        kind:"eidos.localization-bundle",
        bundle:{
          contractVersion:"0.1.0",namespace:packageId,locale:"en",
          messages:{["navigation."+navId+".label"]:s.titleEn}
        }
      }]
    }]
  };
}

/** Uses Eidos CatalogBrowser contract, no HTML/CSS/private UI control. */
export function stagePageV010(s: TradingStageDemoSpecV010): CatalogBrowserV010 {
  return {
    contractVersion:"0.1.0",kind:"catalog-browser",
    id:stagePackageIdV010(s.domain)+".overview",
    layout:"list",density:"comfortable",
    title:s.titleZh + " · 阶段演示",
    description:s.descriptionZh+
      "。合成测试数据；不是 EVO 账本事实，不提供业务创建或财务执行。",
    contextNavigation:{items:[
      {id:"store",label:"插件平台",route:"/store"},
      {id:s.domain,label:s.titleZh}
    ]},
    actions:[
      {id:"open-store",label:"管理独立插件",type:"navigate",route:"/store",
        requiresConfirmation:false},
      ...(s.nextDomain?[{
        id:"continue",label:"下一环节（需先安装相应插件）",
        type:"navigate" as const,route:stageRouteV010(s.nextDomain),
        requiresConfirmation:false,primary:true
      }]:[])
    ],
    items:[{
      id:s.recordId,title:s.recordId,
      category:s.titleZh,
      summary:"业务引用："+s.referenceOrderNo+" · 合成样例",
      badges:["SYNTHETIC","READ-ONLY"],
      status:{label:s.statusZh+"（模拟）",tone:"neutral"},
      metadata:{
        "来源":"TR-01 阶段合成样例",
        "业务链订单":s.referenceOrderNo,
        ...s.fields,
        "财务写入":"禁止",
        "生产认证":"NOT_CERTIFIED"
      }
    }]
  };
}
