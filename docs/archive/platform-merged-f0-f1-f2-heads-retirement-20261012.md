# 2026-10-12 Platform 三个已合并 PR 源分支的定点清理（不是插件研发）

**用户约束：** 只收敛现存分支。六个 TR-01 APPLICATION 和 Finance Owner PROVIDER 保持 **PRODUCT_UNFINISHED**；旧 14 条 TR-01 未完成来源及 Agent/Diagram/Designer 都 **不删除**。没有新增功能、测试、部署、业务任务。

- 起始 main：`1d9b301f418ef17b0d15aa8df982bab17810e9ca`，开始时 33 branches / 9 open PR。
- 采用原有 `.github/workflows/platform-one-time-squash-pr-ref-retirement-20261011.yml` workflow，**仅切换到 2026-10-12 新一份清单**，不覆盖原 `repository-hygiene/platform-merged-squash-heads-20261011.json` 历史证据。
- PR workflow 为审计模式，**绝不在 PR 阶段删 ref**；只在审计通过且该 manifest 合并推送到 main 时 `contents:write` 执行。
- 每个 ref 都要求：closed+merged 同仓库原 PR，PR exact head/base/merge SHA；其 merge commit 在 main 祖先；branch HEAD 精确 SHA；非保护分支；不为任何 open PR head/base；在删除前再次校验最新开放 PR 与 HEAD。任一检查失败则 fail-closed。
- 当前 GitHub 不提供直接 branch delete 操作，因此严格复用已有主线批准的 GitHub Actions 删除授权路径；结果以实际执行日志 + 刷新 branch 枚举为准。清理本身不改六个 plugin Manifest/Host/EVO/eidos/Agent/2D/project.status.json。

| Merged PR | Retire branch | Fixed head | Main merge commit |
| --- | --- | --- | --- |
| [#775](https://github.com/jiangxng/EVO-App-Platform/pull/775) | `test/platform-f0-four-peer-lifecycle-convergence-20261011` | `d2f560074b4a46290cec6e6e784e7deb6b8a94d3` | `014196f7a52f7051ef9a0fa8ea524e14b23169de` |
| [#777](https://github.com/jiangxng/EVO-App-Platform/pull/777) | `test/platform-f2-disposable-postgres-logins-20261012` | `78a9d299aabf0aaf6d276196645549e7d8f8d945` | `aa6432f0d525b2ef3ad02c358c9ab83e093238f3` |
| [#779](https://github.com/jiangxng/EVO-App-Platform/pull/779) | `test/platform-f1-host-signed-loopback-proof-20261012` | `c65447b2478c56ca8a808ce560f2b1fdabcdf2f7` | `09fee6f8f327871b71e0b37a9e19a7f16161db57` |

**执行前状态：** 待 CI 审计 + 该 cleanup-only PR 被合并；不能提前记为删除成功。未完成插件继续未完成，不将这三个已合并的验证 PR 误认为业务完成。
