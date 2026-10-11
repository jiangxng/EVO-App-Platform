# B9e｜两个真实进程对文件型投影 Store 的 CAS 竞争与锁失败保护

日期：2026-10-11。独立 [Draft #617](https://github.com/jiangxng/EVO-App-Platform/pull/617)，接续 [B9d 文件持久化重开 Draft #615](https://github.com/jiangxng/EVO-App-Platform/pull/615)。只增加测试/CI/证据，不修改运行时、业务源图、Host/Agent/CAS 契约、Eidos 22/2600 路由上限、TR-01 或主线，不合并不部署。

## 为什么单独增加

- B9d 用真实 App Handler 和正式文件型 Projection Store Save，再新建 Store、Editor/Viewer GET，验证真实文件上的版本与视图完整性；同一 Node 进程下重新创建 Store，**不等于跨进程同时保存**。
- 2D Designer 若未来存在多人或多个服务实例编辑投影，文件 Store 的真实锁处理必须保持 **fail-closed**，不能让过期提交覆盖已保存的投影，亦不能由于瞬间锁冲突错误自作主张跳过校验。

## 自动化方案

1. 用正式 FileDefinitionProjectionStore 在独立临时文件上初次 CAS putIfVersion(expected=0)，产生合法企业投影 Gallery 和版本 **1**。
2. 通过 Node child_process.spawn 启动**两个独立 Node 进程**，均持正式文件型 Store，独立读取同一文件，修改各自独立投影标题，并同时尝试 CAS putIfVersion(expected=1)。验证**恰好一个**成功，版本到 **2**；另一进程必须明确返回 WRITE_CONFLICT 或 STORE_LOCKED，绝不静默覆盖。
3. 在第三个新建 Store 实例重新读取，必须仅有一个 row，最终标题等于**唯一获胜进程**提交的值。
4. 明确创建一个残留锁目录来模拟崩溃遗留锁，测试下一写入**必须拒绝并保留版本 2**，不能盗取锁或破坏文件。
5. 两子进程输出 JSON 原始结果供测试断言；所有测试写入仅限 CI 临时目录，结束删除。

## 证据等级

这使用 **真正的 OS 子进程、真实本地文件和生产 FileProjectionStore 代码**；与 B9d 的 App Handler 文件保存是互补的两段证据，但**此轮两子进程测试调用的是底层 Store API，不是两个浏览器用户同时通过 Host 授权保存**。

未完成真实多 Pod/网络共享文件系统、真实客户数据库服务重启、企业数据或 39 项完整商用验收。保留 §14 **39 项 NOT TESTED**。

- 新测试：tests/integration/definition-projection-b9e-crossprocess-cas.test.mjs
- 原 CI：.github/workflows/diagram-designer-integration.yml 增量纳入
- 最新提交验证以 [Draft #617 Checks](https://github.com/jiangxng/EVO-App-Platform/pull/617) 实际 Actions 为准。
