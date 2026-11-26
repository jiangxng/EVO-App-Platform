# CV07 · Owner 表头别名与通用空白模板一致性（2026-11-26）

## 问题与范围
在 #1384 后复查 #1382 的通用模板发现：suggestDataImportMappingV010 已考虑 importHeaderAliases，dataImportBlankCsvTemplateV010 的别名索引却仍只有 ID/本地化标签。若另一个 Owner 字段声明同名别名，模板可能输出一个预检无法自动匹配的列；若别名与稳定 ID 冲突，Mapper 本身仍允许唯一显式 ID。当前字典实际字段没有证明存在这种碰撞，本次是防止通用能力复用的确定性反例，不是对用户 193 行数据的诊断。

## 决策与验证
复用现有 IMPORT schema 及 Mapper 的归一化规则和唯一显式 ID 优先级，模板生成阶段纳入 Owner aliases，歧义时回退稳定字段 ID；无法确定目标仍拒绝。无新增权限、数据写入、UI 或路由；不修改 Owner 字段与用户 CSV。排除仅按显示标签生成模板、随意改名或放宽实际匹配校验。

- 实现：apps/data-import/template.ts
- 回归：tests/protocol/cv07-data-import-blank-template.test.mjs，增加本地化标签与 Owner 别名碰撞、显式 ID 与别名碰撞组合反例；要求生成列一一回映射到预期字段。原有 Dictionary/Customer/Supplier 模板与权限测试继续保持。
- 基线：受保护 main@44da0a35ccf3191d90b9817fc21ffa667628a3b7。#1385 独立文档 PR 不受影响。
- 证据：本轮直接读 #1382、#1384 后的模板、Mapper、合同及回归测试源码。新测试尚须准确 HEAD CI 执行，不预写通过、合并或部署。用户真实导入、PC 与 Human 仍 NOT SIGNED。
