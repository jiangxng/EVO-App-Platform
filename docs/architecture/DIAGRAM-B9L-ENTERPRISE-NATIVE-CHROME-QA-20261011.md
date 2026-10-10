# B9l｜通用 S2C/P2P 脱敏企业投影的真实 Chrome Save→CAS→Viewer 复测通道（2026-10-11）

**基于 B9k Draft #625** 的严格离线数据接入，单独 stacked Draft 实现。现有 B9j [PR #622](https://github.com/jiangxng/EVO-App-Platform/pull/622) 正数拥塞原版不会修改；B9l 新建 `tools/diagram-enterprise-browser-proof-b9l.mjs`，参考 B9j 已通过的真实 Chrome 测试，将固定的 25 节点 `block-22` 测试输入改成**经 B9k 预检的本地 S2C/P2P preview2d**，并通过环境变量指定一个非遮挡的可点击节点。所有实测保存操作依然进入 **隔离测试企业、受控测试授权、临时 File Store**，从不连接真实生产数据库。

## B9l 执行步骤和判定

1. 强制读取 B9k 安全预检入口，并再次核对图 SHA-256 指纹，禁止测试进程在预检后读到另一份替换的图；必须明确提供 `EVO_B9L_REMOVE_NODE_ID`。
2. 只在隔离业务定义副本的合法 `payload.preview2d` 注入该拓扑图；首次通过真实 App Handler + FileStore 以投影 CAS 0→1 保存。企业业务定义 history 应仍为 1。
3. 真正打开全新的 Chrome Designer 和只读 Viewer。校验两页面拥塞数相同、实际路径 DOM 数与汇总一致、单条拥塞 aria、非阻挡 role=note，Viewer 绝不有 Save 按钮。**不要求真实图恰好出现 1 条拥塞，也不能凭零拥塞宣称绕障全面通过。**
4. 在第二个真正的 Chrome Designer 由 Playwright 调用浏览器真实鼠标，在明确指定节点的已计算位置点击“Remove from view”。DOM 中该节点必须消失，但底层 CAS 仍须为 1。
5. 实际点击工具栏 **Save projection**；等待界面 Saved.，App FileStore CAS 必须 **1→2**。独立重开两个 Chrome 页面，需读到一致的拥塞计数，并由新的正式 App GET 确认**指定节点进入 `hiddenNodeIds`**，而 `nodes` 中真实业务节点仍保留、原始业务 `preview2d` 和定义 revision/history 未变化。测试不能仅仅任意删掉另一节点就假报成功。
6. 日志只输出 `process`、图指纹、节点和关系测试汇总、CAS 版本及无敏感 ID 的 DOM 计数/异常状态。失败时不自动把原始客户样本或屏幕截图上传 CI。

## 运行入口

仅在样本持有人已经明确允许本地 QA、完成脱敏并确认图里没有隐含个人/客户机密后，在本地 checkout 外位置准备符合 [B9k 格式](./DIAGRAM-B9K-ENTERPRISE-PROJECTION-INTAKE-20261011.md)的 JSON。为鼠标验证，`EVO_B9L_REMOVE_NODE_ID` 必须是图内**实际可见、右侧没有其它图形遮住点击区**且允许从投影隐藏的节点；选择目标的依据必须写入人工 QA 记录，但不要在公开 PR 讨论记录真实客户节点身份。

```bash
npm ci && npm run build
npm install --no-save --package-lock=false playwright@1.56.1
EVO_B9K_AUTHORIZED_QA=1 \
EVO_B9L_FIXTURE_PATH=/private/outside-checkout/s2c-qa.json \
EVO_B9L_REMOVE_NODE_ID=masked-node-17 \
CHROME=/path/to/installed/chrome \
node tools/diagram-enterprise-browser-proof-b9l.mjs
```

若原始真实图存在互相遮挡、坐标未落在画布范围、Web 字体未准备好，Browser 原生鼠标子场景**应当失败并保留明确证据**，不能为“通过”而偷偷换成直接 Handler 操作。这一工具**不**负责真实企业权限认证、真实生产数据库的持久化部署，也不涵盖大型图视觉审美与实体移动设备可访问性签收。

## 已保留的失败证据与修正（不掩盖）

- [B9l 首次 Chrome CI #38094461294](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38094461294)：真实 Chrome S2C 原生鼠标和 Save CAS **1→2** 实际通过、原浏览器无 JS 错误；但随后测试代码误认为 GET 返回的 `nodes` 应物理删除隐藏节点，因此错误地判定失败。实际产品的 Designer GET 必须保留业务图节点供可恢复的隐藏态编辑，独立存放 `hiddenNodeIds`。这是**测试断言读错契约**，不能为了让测试通过而改变业务语义。
- 修复改为检查 GET `hiddenNodeIds` 包含所选节点、GET `nodes` 原有业务对象仍存在、原输入和业务定义历史不变。保留 DOM 中不可见、Viewer 新开正确读取等原门槛，继续以本 PR 最终 head 的 CI 结果为证。

- [B9l 修订后 Chrome CI #38094521068](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38094521068) **PASS**（该阶段代码/文档 head `751136602706728bc76a0d953aa318fe0ab98850`）：系统 Chrome 154 原生鼠标 S2C、P2P **两组纯合成图**分别 Save CAS **1→2**；存盘前 Designer 与 readonly Viewer 拥塞 **1/1**，存盘后新 Designer/Viewer **0/0**；指定节点的 `hiddenNodeIds` 正确、业务历史=1、JS 错误=[]、Viewer 不可保存。**这仍不是客户实际企业图通过。**
- 对外部 JSON 进入 Chrome 页面增加 `safeInlineJson` 小补强：把用于内联 `<script>` 引导的数据中的字面 `<` 编码为 `\\u003c`，避免获准脱敏数据仍带特殊字符时打断测试引导脚本。这项改动以**最后提交的 CI**为准，不拿早前绿色 run 冒充最终结果。

## 持续集成与证据等级

`tools/diagram-enterprise-synthetic-fixture-b9l.mjs` 只为 CI 生成两份**合法但纯合成的** 25 节点 / 23 障碍图，S2C 与 P2P 各 1 份，放在 runner 临时目录之外于 Git checkout。专用 `.github/workflows/diagram-enterprise-native-browser-b9l.yml` 使用 Node 22、Chrome 系统二进制与 pinned Playwright 1.56.1，检查 `B9L_NATIVE_SAVE_RESULT` 和 `B9L_ENTERPRISE_CHROME_RESULT` 各 2 次；上传的日志**只能来自合成图**。CI 不能从该模拟验证推断用户提供的任何真实企业 S2C/P2P 图已实际运行。

B9l 的外部官网设计依据没有重读：沿用 [2026-10-11 研究索引与历史读原文等级](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-decision-handoff-b9j-20261011/docs/architecture/DIAGRAM-COMMERCIAL-RESEARCH-REFERENCE-INDEX-B9J-20261011.md)；无新的官网证据，无需改变此前方案。与本轮相关的具体代码和机器证据只按新 PR HEAD/Actions 判定成功或失败，不能以早期 B9j CI 替代本次 CI。

**验收状态：** 真正顾客业务图、生产身份和数据库、Windows/macOS/iOS/Android 物理设备、辅助技术、§14 原正式 39 项均 **NOT TESTED**。严禁因合成 Chrome CI 通过将任一项标为客户签收。PR 保持 Draft，绝不合并 main、不部署、不改 TR-01。
