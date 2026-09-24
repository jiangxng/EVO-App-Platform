import type { PackageManifestV010, PlatformSnapshotV010 } from "../contracts/package.js";
import { renderCatalogBrowserToHtml } from "../vendor/eidos/src/catalog-browser/render.js";

function firstExperienceRoute(pkg: PackageManifestV010): string | undefined {
  for (const feature of pkg.features) {
    for (const contribution of feature.contributions ?? []) {
      if (contribution.kind === "eidos.experience" && contribution.manifest.defaultRoute) {
        return contribution.manifest.defaultRoute;
      }
    }
  }
  return undefined;
}

function summary(pkg: PackageManifestV010): string {
  const provides = pkg.features.flatMap(feature => feature.providesCapabilities ?? []);
  const requires = pkg.features.flatMap(feature => feature.requiresCapabilities ?? []);
  const pieces = [
    `${pkg.features.length} Feature${pkg.features.length === 1 ? "" : "s"}`,
    provides.length > 0 ? `提供 ${provides.length} 个 Capability` : "",
    requires.length > 0 ? `依赖 ${requires.length} 个 Capability` : ""
  ].filter(Boolean);
  return pieces.join(" · ");
}

export function pluginStoreHtml(
  packages: PackageManifestV010[],
  snapshot: PlatformSnapshotV010
): string {
  const installed = new Set(snapshot.installedPackages.map(item => item.packageId));

  const catalog = renderCatalogBrowserToHtml({
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.plugin-store",
    title: "EVO Plugin Store",
    description: "发现、检查依赖、安装和打开 EVO 插件。安装验证必须从这里开始。",
    items: packages.map(pkg => {
      const isInstalled = installed.has(pkg.packageId);
      const route = firstExperienceRoute(pkg);
      return {
        id: pkg.packageId,
        title: pkg.displayName,
        version: pkg.version,
        category: pkg.type,
        summary: summary(pkg),
        badges: [
          pkg.type,
          ...pkg.features.map(feature => feature.activationScope)
        ],
        status: {
          label: isInstalled ? "已安装" : "未安装",
          tone: isInstalled ? "positive" : "neutral"
        },
        ...(isInstalled
          ? (route ? {
              primaryAction: { id: "open", label: "打开" },
              metadata: { route }
            } : {})
          : {
              primaryAction: { id: "plan", label: "查看安装计划" },
              secondaryActions: [
                { id: "install", label: "确认安装", requiresConfirmation: true }
              ]
            })
      };
    })
  });

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EVO Plugin Store</title>
<style>
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f5f6f8;color:#15171a}
main{max-width:1180px;margin:0 auto;padding:28px}
.hero{margin-bottom:20px}.hero h1{margin:0 0 8px}.sub{color:#60646c}
.badge{display:inline-block;border:1px solid #c9ccd2;border-radius:999px;padding:4px 9px;font-size:12px;margin:8px 6px 8px 0;background:#fff}
[data-eidos-capability="catalog-browser"]>header{margin-bottom:16px}
[data-eidos-capability="catalog-browser"]>header h1{display:none}
[data-eidos-catalog-items]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
[data-eidos-catalog-item]{background:white;border:1px solid #d8dbe0;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px}
[data-eidos-catalog-item] header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
[data-eidos-catalog-item] h2{margin:0;font-size:19px}
[data-eidos-catalog-version],[data-eidos-catalog-category],[data-eidos-catalog-meta]{color:#656a73;font-size:12px;margin-right:10px}
[data-eidos-catalog-status]{font-size:12px;border-radius:999px;padding:4px 8px;border:1px solid #c9ccd2;white-space:nowrap}
[data-eidos-catalog-status][data-tone="positive"]{border-color:#86c79f;color:#08783b;background:#f0fbf4}
[data-eidos-catalog-badge]{font-size:11px;background:#f1f2f4;border-radius:999px;padding:3px 7px;margin-right:5px}
[data-eidos-catalog-item] footer{margin-top:auto;padding-top:6px}
[data-eidos-catalog-item] button{font:inherit;padding:9px 12px;border:1px solid #aab0ba;border-radius:8px;background:#fff;cursor:pointer;margin-right:8px}
[data-eidos-catalog-item] button[data-eidos-primary="true"]{background:#15171a;color:#fff;border-color:#15171a}
.evidence{margin-top:18px;background:#fff;border:1px solid #d8dbe0;border-radius:14px;padding:16px}
pre{white-space:pre-wrap;word-break:break-word;background:#15171a;color:#f5f6f8;padding:12px;border-radius:8px;max-height:360px;overflow:auto}
@media(max-width:800px){[data-eidos-catalog-items]{grid-template-columns:1fr}}
</style>
</head>
<body>
<main data-ui-runtime="eidos" data-eidos-source-commit="83e72ca1521ce756dfd969063149267f3bd90f40">
  <div class="hero">
    <h1>EVO Plugin Store</h1>
    <div class="sub">完整验证路径：商店发现 → 安装计划 → 依赖解析 → Package 安装 → Feature 激活 → Eidos Experience → 业务验证。</div>
    <span class="badge">Eidos Catalog Browser 0.1.0</span>
    <span class="badge">Installation-first</span>
    <span class="badge">No lifecycle bypass</span>
  </div>
  ${catalog}
  <section class="evidence">
    <h2>安装生命周期证据</h2>
    <pre id="evidence">请选择一个未安装插件，先查看安装计划。</pre>
  </section>
</main>
<script>
const planned=new Map();
const evidence=document.getElementById('evidence');
function out(value){evidence.textContent=typeof value==='string'?value:JSON.stringify(value,null,2)}
async function j(url,opt){const r=await fetch(url,opt);const t=await r.text();let b;try{b=JSON.parse(t)}catch{b=t}if(!r.ok)throw new Error(typeof b==='string'?b:JSON.stringify(b,null,2));return b}
async function openPackage(packageId){
  const experiences=await j('/v1/experiences/effective');
  const experience=experiences.find(x=>x.packageId===packageId);
  if(!experience?.defaultRoute) throw new Error('该 Package 当前没有可打开的 Eidos Experience。');
  location.href=experience.defaultRoute;
}
document.querySelectorAll('[data-eidos-catalog-action]').forEach(button=>{
  button.addEventListener('click',async()=>{
    const action=button.getAttribute('data-eidos-catalog-action');
    const packageId=button.getAttribute('data-eidos-item-id');
    try{
      if(action==='plan'){
        const plan=await j('/v1/install/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({packageId})});
        planned.set(packageId,plan.planDigest);
        out({stage:'INSTALL_PLAN',packageId,plan});
        return;
      }
      if(action==='install'){
        const planDigest=planned.get(packageId);
        if(!planDigest) throw new Error('必须先点击“查看安装计划”，安装不能跳过计划阶段。');
        if(button.getAttribute('data-eidos-confirm')==='true'&&!confirm('确认按刚才的安装计划安装 '+packageId+'？')) return;
        const result=await j('/v1/install',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({packageId,planDigest})});
        out({stage:'INSTALLED_AND_ACTIVATED',packageId,...result});
        setTimeout(()=>location.reload(),250);
        return;
      }
      if(action==='open') return openPackage(packageId);
    }catch(error){out({ok:false,error:String(error)})}
  });
});
</script>
</body>
</html>`;
}
