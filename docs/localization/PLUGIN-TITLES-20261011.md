# 插件标题四语言补全 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT
Scope: 第一步仅补全插件名称（商店、设置入口、插件设置标题和服务选择），不宣称全部页面内容已完成多语言。
Baseline: a117dbc07217ec7924b25a3a0321456ff4e9c42f
Branch: fix/plugin-title-localization-20261011

## 根因与责任

现有 Plugin Store 直接读取英文 displayName；eidos.localization-bundle 属于 Feature，仅在启用后生效。即使页面词条完整，也不能解决未安装/停用插件的名称显示。已有部分 Provider 的四语 settings.title 实际均为英语。

插件用途依据各 owner manifest 的能力、页面、服务绑定和现有责任边界审阅。应用、基础对象、Provider、参考示例及合成演示分别命名，不从英文单词机械推断权限或产品成熟度。往来对象不改成独立客户/供应商；企业上下文保持资源/定义容器定位；财务核验仍只读；六个阶段插件保持合成演示标识，不新增财务行为。42个静态manifest（含未上架/基础运行时）与6个可选合成演示均有四语元数据；普通本地启动商店实测39个可见项，不能把源码总量当上架数量。

新增可选 PackageManifestV010.displayNameTranslations；每个插件在自身manifest拥有词汇，不创建中央标题字典。它是安装前可读的catalog展示元数据，不是激活中的Feature资源。旧displayName、包ID、版本、能力、命令、权限、路由与业务数据不变。新Host接受旧manifest，缺译回退英文再回退displayName；旧严格schema不认识新增字段时需更新schema，不能声称任意旧Host完全兼容。签名包修改元数据须重新发布/签名，本批为源码内置声明，不修改持久安装状态。

Host适配器复用已固定Eidos createLocalizationRuntime.resolve，通过包命名空间解析元数据，不引入新渲染器/CSS，不为了标题整包更新vendor。也核对了Eidos上游新增PresentableText/resolveText方向，本次既有resolve足够，不强行混合不同快照。区域/脚本变体经规范化后回退：日语地区→ja，繁中地区/脚本→zh-TW，简中→zh-CN，其他缺译→en。应用正文bundle继续按原Feature生命周期生效。

## 实施与验证

- contracts/package.ts、portable package JSON Schema、plugin-protocol.ts 同步元数据声明/校验。
- manager/package-display-name.ts统一解析；商店/设置/Provider页面复用，server只增加locale传递。
- 现有OpenAI/DeepSeek等Provider的settings.title英文覆盖一并校正。
- 完整TypeScript构建通过；目标22项回归通过，包括全部manifest四语覆盖、三种生命周期、变体/回退、旧manifest、设置入口与不激活资源。
- 隔离内存Host真实HTTP /v1/experience-pages?source=app://evo-app-platform/pages/plugin-store：en/zh-CN/ja/zh-TW均返回正确往来对象标题，普通catalog含39项；无生产连接或写入。
- Eidos设计语言与Experience架构校验通过。
- 真实浏览器尝试因本地未安装Chromium可执行文件而未运行，不能称浏览器/生产验收通过。
- CI由plugin-title-localization工作流覆盖未来manifest标题回归；PR完整结果以GitHub检查为准。

复现：npm ci；npm run build；node --test tests/protocol/plugin-title-localization.test.mjs tests/protocol/plugin-protocol.test.mjs tests/settings/plugin-settings.test.mjs tests/integration/provider-manager-page.test.mjs tests/app-host/runtime-localization.test.mjs；npm run experience:validate。

## 后续边界

下一步单独盘点插件页面标题、导航、描述、按钮、状态/错误、动态数据格式和语言切换。不要自动翻译客户名/业务数据，不将fallback算作已完成翻译，不把本次标题修复称为所有插件多语言全部完成。本分支不部署、不改全局进度或其他业务/Agent/2D交接；2D仅修改包展示名称。

## 标题词汇清单

以下从改后的owner manifest导出，供产品核对。英语保持旧displayName兼容。

| 包ID | English | 简体中文 | 日本語 | 繁體中文 |
|---|---|---|---|---|
| company-notes | Company Notes | 企业笔记 | 企業ノート | 企業筆記 |
| deepseek-llm-provider | DeepSeek LLM Provider | DeepSeek 模型服务 | DeepSeek モデルサービス | DeepSeek 模型服務 |
| enterprise-agent | Personal Agent | 个人代理 | パーソナルエージェント | 個人代理 |
| eog-bottleneck-analysis-provider | EOG Bottleneck Analysis Provider | EOG 运行瓶颈分析服务 | EOG 業務ボトルネック分析サービス | EOG 運行瓶頸分析服務 |
| evo-application-runtime-binding-provider | Enterprise Application Runtime Binding Provider | 企业应用运行时绑定服务 | 企業アプリ実行環境バインドサービス | 企業應用執行環境繫結服務 |
| evo-bi-workbench | EVO BI Workbench | EVO 个人工作台 | EVO パーソナルワークスペース | EVO 個人工作台 |
| evo-counterparty | EVO Counterparty | EVO 往来对象 | EVO 取引先 | EVO 往來對象 |
| evo-data-import | EVO Data Import | EVO 数据导入 | EVO データインポート | EVO 資料匯入 |
| evo-enterprise-context-governance | Enterprise Context | 企业上下文 | 企業コンテキスト | 企業上下文 |
| evo-enterprise-observatory | Enterprise Observatory | 企业运营观测 | 企業オペレーション観測 | 企業營運觀測 |
| evo-eog-2d | EOG 2D | EOG 二维运行图 | EOG 2D 業務グラフ | EOG 二維運行圖 |
| evo-eog-3d | EOG 3D | EOG 三维运行图 | EOG 3D 業務グラフ | EOG 三維運行圖 |
| evo-item | EVO Item | EVO 物料 | EVO 品目 | EVO 物料 |
| evo-ledger-manager | EVO Ledger Manager | EVO 账本管理 | EVO 台帳管理 | EVO 帳本管理 |
| evo-ledger-runtime-configurator | EVO Ledger Runtime Compiler | EVO 账本运行时编译器 | EVO 台帳ランタイムコンパイラ | EVO 帳本執行環境編譯器 |
| evo-object-extension | EVO Object Extension | EVO 对象扩展 | EVO オブジェクト拡張 | EVO 物件擴充 |
| evo-responsibility | EVO Responsibility | EVO 职责管理 | EVO 職責管理 | EVO 職責管理 |
| evo-runtime-observatory-provider | EVO Runtime Observatory Provider | EVO 运行时事实观测服务 | EVO ランタイム事実観測サービス | EVO 執行環境事實觀測服務 |
| evo-template-store | EVO Template Store | EVO 模板商店 | EVO テンプレートストア | EVO 範本商店 |
| evo-trading-finance-owner-provider | EVO Trusted Trading Finance Owner (Read-only) | EVO 可信交易财务核验服务（只读） | EVO 信頼済み取引財務検証（読み取り専用） | EVO 可信交易財務核驗服務（唯讀） |
| evo-trading-reference | EVO Trading Reference | EVO 交易参考流程 | EVO 取引参照フロー | EVO 交易參考流程 |
| evo-trading-stage-cash | EVO Customer Receipts (Synthetic Stage Demo) | EVO 收款（合成数据演示） | EVO 入金（合成データデモ） | EVO 收款（合成資料示範） |
| evo-trading-stage-purchasing | EVO Purchase Orders (Synthetic Stage Demo) | EVO 采购订单（合成数据演示） | EVO 購買発注（合成データデモ） | EVO 採購訂單（合成資料示範） |
| evo-trading-stage-receivable | EVO Accounts Receivable (Synthetic Stage Demo) | EVO 应收（合成数据演示） | EVO 売掛金（合成データデモ） | EVO 應收款（合成資料示範） |
| evo-trading-stage-receiving | EVO Goods Receiving (Synthetic Stage Demo) | EVO 采购收货（合成数据演示） | EVO 入荷（合成データデモ） | EVO 收貨（合成資料示範） |
| evo-trading-stage-sales | EVO Sales Orders (Synthetic Stage Demo) | EVO 销售订单（合成数据演示） | EVO 受注（合成データデモ） | EVO 銷售訂單（合成資料示範） |
| evo-trading-stage-shipment | EVO Sales Shipments (Synthetic Stage Demo) | EVO 出库发货（合成数据演示） | EVO 出荷（合成データデモ） | EVO 出貨（合成資料示範） |
| evo-warehouse | EVO Warehouse | EVO 仓库与库位 | EVO 倉庫・保管場所 | EVO 倉庫與儲位 |
| evo.core | EVO Foundation | EVO 基础运行时 | EVO 基盤ランタイム | EVO 基礎執行環境 |
| evo.external-agent-governance | EVO External Agent Governance | EVO 外部代理授权管理 | EVO 外部エージェント権限管理 | EVO 外部代理授權管理 |
| experience-compiler-memory-intake-provider | Experience Compiler Memory Intake Provider | Experience Compiler 记忆接入服务 | Experience Compiler メモリ取り込みサービス | Experience Compiler 記憶匯入服務 |
| generic-oidc-identity-provider | Generic OIDC Identity Provider | OIDC 身份认证服务 | OIDC 認証サービス | OIDC 身分驗證服務 |
| host-bearer-session-provider | Host Bearer Session Provider | Bearer 令牌会话服务 | Bearer トークンセッションサービス | Bearer 權杖工作階段服務 |
| host-context-memory-provider | Host Context Memory Provider | 上下文记忆服务 | コンテキストメモリサービス | 上下文記憶服務 |
| host-encrypted-secrets-provider | Host Encrypted Secrets Provider | 加密凭据管理服务 | 暗号化認証情報管理サービス | 加密憑證管理服務 |
| host-enterprise-context-grant-provider | Host Enterprise Context Grant Provider | 企业上下文访问授权服务 | 企業コンテキストアクセス権サービス | 企業上下文存取授權服務 |
| host-enterprise-context-provider | Host Enterprise Context Provider | 企业上下文资源服务 | 企業コンテキストリソースサービス | 企業上下文資源服務 |
| host-enterprise-relationship-provider | Host Enterprise Relationship Provider | 企业成员关系服务 | 企業メンバー関係サービス | 企業成員關係服務 |
| host-identity-user-directory-provider | Host Identity User Directory Provider | 用户身份目录服务 | ユーザーIDディレクトリサービス | 使用者身分目錄服務 |
| host-managed-session-provider | Host Managed Session Provider | 托管登录会话服务 | 管理対象ログインセッションサービス | 託管登入工作階段服務 |
| host-memory-intake-provider | Host Memory Intake Provider | 记忆资料接入服务 | メモリ資料取り込みサービス | 記憶資料匯入服務 |
| host-remote-credential-provider | Host Remote Credential Provider | 远程连接凭据服务 | リモート接続認証情報サービス | 遠端連線憑證服務 |
| host-static-authorization-provider | Host Static Authorization Provider | 静态权限策略服务 | 静的認可ポリシーサービス | 靜態權限原則服務 |
| host-static-session-provider | Host Static Session Provider | 静态会话服务 | 静的セッションサービス | 靜態工作階段服務 |
| openai-llm-provider | OpenAI LLM Provider | OpenAI 模型服务 | OpenAI モデルサービス | OpenAI 模型服務 |
| remote-context-memory-dlp-provider | Remote Context Memory DLP Provider | 远程记忆数据防泄漏服务 | リモートメモリ情報漏洩防止サービス | 遠端記憶資料防外洩服務 |
| remote-context-memory-semantic-provider | Remote Context Memory Semantic Provider | 远程记忆语义检索服务 | リモートメモリ意味検索サービス | 遠端記憶語意檢索服務 |
| trading-lite | Trading Lite | 轻量交易示例 | 軽量取引サンプル | 輕量交易範例 |
