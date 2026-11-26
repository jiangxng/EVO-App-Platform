# CV07 · 字典批次名称一致性预检查与193行合成回归（2026-11-26）

## 发现的实际缺口
#1384 已增加 Owner validateBatch，但仅校验父关系。原 tests/protocol/cv07-business-dictionary-import-eidos.test.mjs 明确断言同一字典编码、两个不同名称时 DRY_RUN_READY，直到 commitPreparedRows 才报 BUSINESS_DICTIONARY_IMPORT_NAME_CONFLICT；这会向 Human 发出错误的“可确认导入”信号。原子提交拒绝本身正确，仍需保留。

## 采用方案与边界
Owner validateBatch 按当前字典编码分组，收集非空的规范化（textValue trim）名称；同组多个不同名称时，为所有冲突行标记 displayName / BUSINESS_DICTIONARY_IMPORT_NAME_CONFLICT。与父关系错误合并为同一行结果，保留 shared service 的每行唯一批次结果合同。空名称/非法值仍由既有逐行验证处理，提交阶段原子校验及并发拒绝不变。未改变任何字典编码身份、权限、正式发布或其他 Owner 的导入行为。

## 自动化验收
- 更新原冲突回归：预检查失败、两行具名问题、禁止调用 COMMIT、零字典写入。现有 stale dry-run 原子回滚用例不变。
- 新增纯合成193行/7列表头回归，使用和用户问题描述相同的七个列名但完全虚构的行值：六列自动映射、选项主键不猜测、显式排除该列后预检查193行有效且业务库未写；确认提交后193项、10个合成字典DRAFT、每个1个版本、无发布、无跨企业写入。**这是独立工程样本，不是用户的真实193行，也不能证明其选项主键可丢弃或状态值一定合法。** 实际源数据仍须合法 Human 核对。
- 本轮基于 protected main@ca3fa85995c4f5145ab8287eb03751b9be99bc99，直接读取 import-target、repository、shared service 和回归原文。#1386 独立模板 PR 不重叠；本PR准确 HEAD CI 未跑完前不声称合并、部署或测试通过。真实 Human NOT SIGNED。

## 后续
真实批次确认之前核对字段、实际错误行、父子关系；单独发布有效版本。PC 1096/1280/1440 和390px合法会话视觉验收保持独立。
