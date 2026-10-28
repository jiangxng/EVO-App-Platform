# Windows 本地启动与免费检查

适用：EVO-App-Platform（项目），以及同级目录的 eidos、EVO、Experience-Compiler。脚本只启动项目平台；另外三个仓库更新源码，不自动启动或重建服务。平台使用仓库内锁定的 `vendor/eidos`，拉取同级 Eidos 不会替换该快照。

## 一键更新并启动

双击项目根目录的 **start-local.cmd**。电脑需有 Git，以及符合 `package.json` 要求的 Node.js/npm。

脚本会：

1. 检查四个仓库的当前分支、上游和未提交的已跟踪修改。
2. 对每个仓库执行 `git pull --ff-only`，跟随各自当前分支的上游；不擅自切换分支。无上游、分叉、冲突或网络错误会停止并报告。
3. 停止这个脚本之前启动的本地平台。
4. 仅在依赖清单、锁文件或 Node 环境改变时执行 `npm ci`；仅在编译输入或输出改变时重新编译。首次执行会建立缓存。
5. 启动后台平台，等待 `/health` 成功，打开 `http://localhost:4100/#/store`。

四个仓库的更新不是原子事务：中途失败时，前面的仓库可能已经更新；解决错误后重新运行即可。脚本不自动 stash、reset、rebase、清空数据或终止不认识的进程。

本地数据继续保存在 `.local/personal-agent-experience/`。个人代理、API Key 和企业配置通过正式界面设置。Docker 中已有的 EVO 容器不受此脚本管理。

在项目目录的终端里也可以执行：

```powershell
# 日常：更新四仓并启动
.\start-local.cmd

# 正在改代码时：保留本地修改，跳过联网拉取，按需编译并重启
.\start-local.cmd -SkipPull

# 不自动打开浏览器
.\start-local.cmd -NoBrowser

# 停止本脚本管理的服务
.\start-local.cmd -Stop

# 4100 被其他程序占用时改用 4101
.\start-local.cmd -Port 4101
```

修改过的已跟踪文件会阻止默认拉取。这是保护措施；开发期间用 `-SkipPull`，完成提交或处理改动后再恢复默认更新。脚本失败会返回非零退出码。双击运行后窗口会停留，便于阅读结果。

## 本地检查

**check-local.cmd** 默认运行快速检查。它不拉代码、不推送、不调用 GitHub Actions。

| 命令 | 做什么 | 适合什么时候 |
| --- | --- | --- |
| `.\check-local.cmd` | 按需安装/编译，加 10 项生命周期、动作路由、启动默认值测试 | 日常改动后的快速反馈 |
| `.\check-local.cmd -Mode Quick -TestFile tests/actions/router.test.mjs` | 按需编译，运行指定现有测试 | 已知修改模块时 |
| `.\check-local.cmd -Mode Platform` | Docker Linux 内执行仓库原有 `npm run test:platform` | 准备推送、修改公共契约或 Host 时 |
| `.\check-local.cmd -Mode Platform -WithDatabase` | 同上，并使用临时 PostgreSQL 18 执行其中依赖数据库的测试 | 需要验证 Platform 内的数据库用例时 |

多个测试文件可从 PowerShell 直接调用：

```powershell
.\scripts\local\Check-Local.ps1 -TestFile @(
  'tests/actions/router.test.mjs',
  'tests/manager/core-manager.test.mjs'
)
```

Platform 模式要求 Docker Desktop 正在运行。它使用 `node:22.22.2-bookworm-slim`，与 `.github/workflows/ci.yml` 的 Node 版本一致。首次下载镜像并安装工具/依赖较慢；后续复用 Docker 缓存。源码会以当前工作区内容复制到临时目录，包含尚未提交的新文件和修改；排除 `.git`、`.local`、`dist`、`node_modules`、`artifacts` 和 `.env*`。Git 判断为 CRLF 文本的文件在副本中转换为 LF，不改动 Windows 原文件。

检查容器不会挂载 Docker socket，也不会接收宿主机的 API Key 或数据库环境变量。测试失败会如实返回失败；执行后删除临时源码副本与测试容器，保留可复用镜像及日志。检查和启动使用同一把锁，防止重复运行破坏安装/编译。

`-WithDatabase` 创建本次独有的内部 Docker 网络和 PostgreSQL 18 容器，不发布宿主机端口、不挂载业务数据目录。运行结束会清理临时数据库容器、其临时卷和网络；数据库用例必须输出成功标记才认可。普通 Platform 模式会如实显示因缺少数据库而跳过的用例。中途强制终止整个终端或 Docker 时，可能需要根据容器名称清理遗留的 `evo-local-ci-*` 临时资源。

快速模式会更新本地 `dist/`；开发改动后，用 `start-local.cmd -SkipPull` 重启平台。Docker Platform 模式不会改动正在运行的平台编译结果。

## 范围与 GitHub CI

本地可以运行与 CI 相同的编译、契约、单元和集成测试，没有 GitHub 排队时间。现有电脑和 Docker 即可执行，不需要另购 CI 服务；仍消耗本机算力、存储和下载流量。

**Quick 通过不是全部验证通过；Platform 通过也只对应 Platform CI。** 项目另外还有独立 PostgreSQL 18、Chromium/Playwright、跨仓兼容、安全以及具体业务验收工作流。它们需要各自的测试服务、夹具和配置，不能因为 Platform 通过就标记全部完成，也不能把缺少数据库导致的 skipped 当作通过。数据库测试应使用独立测试容器/数据库，不能借用正在使用的业务数据。

本脚本不改变 GitHub 工作流或分支保护。按当前项目交付规则，合并仍需最终提交对应的 required checks；本地结果不能自动替代 GitHub 上的检查状态。可以在本地集中完成一批修改并验证，再推送一次进行正式检查。

若以后希望把 GitHub 工作流的计算也移到本机，可单独配置 self-hosted runner；它仍由 GitHub 调度，并非完全离线。当前先采用本地脚本，避免增加常驻 runner 的维护。

## 减少等待

- 日常修改用 `-SkipPull`，避免每次都访问四个远端。
- 复用 `node_modules` 和编译结果，不重复运行 `npm ci` 和完整构建。
- 优先指定受影响的测试；公共契约或跨模块改动再跑 Platform 和对应专项。
- 同一批同根因修改在本地集中验证后推送，减少“改一点、推一次、等全套 CI”。
- Docker 使用先装依赖、再复制源码的镜像分层，普通源码修改不会重新安装依赖。
- 现有 CI 已有部分路径过滤、npm 缓存和取消旧运行配置。未来优化应针对实测慢任务，避免新增重复检查；任何必需门禁调整另行评估。

## 日志与排错

所有日志在 `.local/local-tools/`：

- `start-last.log`：最近一次启动/更新结果。
- `host.stdout.log`、`host.stderr.log`：平台运行日志。
- `check-quick-last.log`、`check-platform-last.log`：最近一次本地检查。
- `platform-output-last.log`：平台测试的完整原始输出。
- `host.json`：脚本管理的进程及端口；停止时同时核对进程创建时间和命令，避免误杀复用 PID 的其他程序。

编译或测试失败时按日志处理，不要删除个人体验数据。若要强制重新安装和编译，可删除可再生的 `node_modules/` 和 `dist/` 后重新启动；它们不包含 `.local/personal-agent-experience/` 的业务状态。

## 本轮验证记录（2026-10-28）

基线为远端 main `4fd0748d`，脚本在 `codex/local-start-and-checks` 工作分支开发。记录为本机测量，后续版本、网络与硬件变化会影响耗时。

- 四仓快进更新、依赖安装、编译、后台启动和健康检查：通过，首次约 28.4 秒。
- 无变更的 `-SkipPull -NoBrowser` 重启：通过，约 1.9 秒；依赖和构建均命中缓存。
- Quick：10/10 通过，约 1 秒。
- 首次 Docker Platform：1241 通过、0 失败、1 个 PostgreSQL 用例跳过；含镜像首次准备约 127.5 秒。
- Docker Platform 加 `-WithDatabase`：1242/1242 通过、0 跳过；缓存依赖层，含数据库准备和清理约 56.2 秒。
- `tests/local/launcher-safety.ps1`：5 项失败路径保护通过。测试使用临时本地 Git 仓库及本地监听端口，不操作真实远端。
- 已处理的验证问题：PowerShell 5 会将重定向的原生 Git stderr 转为 ErrorRecord，最初导致测试脚本提前中断；只在捕获预期失败时调整测试脚本的错误处理，生产脚本仍检查退出码并停止。

复验启动保护：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/local/launcher-safety.ps1
```

相关官方说明：[Docker 构建缓存优化](https://docs.docker.com/build/cache/optimize/)、[GitHub self-hosted runner](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners)。
