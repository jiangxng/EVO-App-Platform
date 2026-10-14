# 治理过程分支清理交接

用户已授权：验证通过后及时合入main，并删除已合并过程分支。当前连接器提供合并能力，但未提供删除分支工具；不为删除分支添加临时高权限工作流。

| 分支 | PR | 处理要求 |
| --- | --- | --- |
| `feat/governance-provider-lifecycle-ui-20261013` | 本批管理页面PR | 合并后核对分支HEAD等于对应PR最终head_sha再删除。 |
| `fix/governance-revision-resource-lifecycle-20261013` | #796 | PR合并后，核对远端分支HEAD等于该PR最终head_sha，再删除；若有新增提交则保留并核对。 |

本文件在PR中随代码保存，不能据本文件推断PR已经合并。执行删除前以GitHub的merged状态与merge_commit_sha为准；准确合并结果同时在窗口最终回复记录。该分支含订阅释放、停用状态与管理员生命周期API三批治理。

历史分支`docs/platform-governance-plan-20261013`已由用户确认其他窗口删除，不需恢复。

上一批#796已合并：`c2e8dcc08e5381c84f6dec93b861c42f2a30e559`，源HEAD为`8a4f0ef844042c7b774434b5c934b78d92a8b65e`。此记录不替代删除前核对远端分支是否新增提交。
