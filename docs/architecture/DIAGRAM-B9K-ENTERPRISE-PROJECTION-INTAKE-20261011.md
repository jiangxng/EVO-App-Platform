# B9k｜真实 S2C/P2P 企业投影脱敏验收入口：离线预检（2026-10-11）

本增量只新增 **离线、无网络、默认拒绝** 的企业投影预检工具、独立 Node CI 和专项测试。基线为 [B9j Draft #622](https://github.com/jiangxng/EVO-App-Platform/pull/622) 已验证的 `6740000086577a15c257e813ca6340ab2027410c`。不改变 Eidos Surface、App 保存授权、File Store、业务定义、TR-01、main，**不合并、不部署**。

## 目标与已经确认的边界

B9j 已用合成的、符合业务模型的 25 节点图通过 Chrome 真鼠标 → local hide → UI Save → App CAS File Store → 新 Designer / readonly Viewer 的机器闭环；不能将其称为真实客户 S2C/P2P 验收。下一步必须由明确获授权的持有人提供 **脱敏、只含展示几何与拓扑信息** 的企业图。这里没有真实客户数据，工具不会假装有。

B9k 建立入口：`tools/diagram-enterprise-fixture-intake-b9k.mjs`。接受外部本地 JSON，要求 `process=S2C|P2P`、`deidentified=true` 与 `ownerApprovedForLocalQa=true`、`purpose=diagram-commercial-local-qa`；强制节点/关系 ID 唯一、两端存在、坐标有限、关系/节点数量有上限（1500 / 5000）；只允许展示层的窄字段。拒绝无关业务原文、额外字段、明显的邮箱等；自称已脱敏 **不等于经独立审核完全脱敏**。这个工具绝不代替企业数据持有者的授权审查。

## 本地执行，不把客户原图写入 GitHub

将获授权、人工脱敏的 JSON **存放在 Git checkout 外部**，不要复制到项目、PR 描述、CI artifact 或共享日志。

JSON 外层必须如下，`preview2d` 是合法业务预览结构，包含 contractVersion、节点和现有关系；实体名称应改为无意义代号，但保持必要的真实拓扑与节点坐标：

```json
{
  "contractVersion": "0.1.0",
  "purpose": "diagram-commercial-local-qa",
  "process": "S2C",
  "deidentified": true,
  "ownerApprovedForLocalQa": true,
  "preview2d": {
    "contractVersion": "0.1.0",
    "nodes": [
      {"id":"node-a","kind":"subject","label":"masked-a","x":0,"y":0,"width":120,"height":60},
      {"id":"node-b","kind":"subject","label":"masked-b","x":250,"y":0,"width":120,"height":60}
    ],
    "edges": [
      {"id":"edge-a","kind":"process","source":"node-a","target":"node-b","label":"masked-edge"}
    ]
  }
}
```

```bash
EVO_B9K_AUTHORIZED_QA=1 node tools/diagram-enterprise-fixture-intake-b9k.mjs /private/outside-repo/s2c-deidentified.json
```

仅输出 `B9K_ENTERPRISE_INTAKE_RESULT`：流程名、计数、绘图范围、图内容 SHA-256 指纹和固定的证据限制声明。CLI 对拒绝统一返回没有路径、客户 ID、文字或异常片段的错误消息，退出码非零；不上传数据，不保存新文件。指纹可用于检验下次送测图是否变化，不能公开原数据。

## 当前证据级别与下一步

- B9k CI 只使用代码内部生成的 **合成脱敏** 图，验证合法 S2C/P2P、缺失授权/脱敏声明、重复 ID、悬空关系、邮箱、非法坐标、输入上限和 checkout 外位置保护。成功也**只证明预检工具功能**。
- B9k 尚没有真实企业投影输入，**未进行**真实 S2C/P2P 的浏览器按钮保存/CAS/Viewer 复测，更没有生产 DB、生产身份、设备/辅助技术验证。
- 下一增量应在现有 B9j Chrome harness 上新增经预检的外部 fixture 注入和通用节点选择，先在纯合成图中核验适配，再在合法获授权真实样本上执行；保存仅进入隔离临时 File Store；日志不得输出节点/关系原文。
- 除非逐项有实机、真实数据、人审证据，原 v1.0 **§14 的 39 项正式商业化验收全部继续 NOT TESTED**。

## 来源和决策溯源

本窗口实际读取 GitHub [B9j 交接入口](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-decision-handoff-b9j-20261011/docs/architecture/DIAGRAM-COMMERCIAL-RESEARCH-HANDOFF-B9J-20261011.md)、[详细索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-decision-handoff-b9j-20261011/docs/architecture/DIAGRAM-COMMERCIAL-RESEARCH-REFERENCE-INDEX-B9J-20261011.md)、[原要求 v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) 和 [B9j Chrome 专项证据](https://github.com/jiangxng/EVO-App-Platform/blob/6740000086577a15c257e813ca6340ab2027410c/docs/architecture/DIAGRAM-B9J-NATIVE-SAVE-POSITIVE-VIEWER-20261011.md)。本增量未重访 S1–S7 外部官网、未新增外部来源；承袭决策和原索引的历史证据等级，不补造原文已阅记录。与 B9j 设计无冲突，仅增加可控真实数据接入前置条件。
