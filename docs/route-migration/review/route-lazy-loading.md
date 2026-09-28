# 关键页面懒加载修复

## 问题与修复

autoCodeSplitting 已开启，但漫画广场、成员、信箱、设置、工具的 route 文件额外导出了页面组件。TanStack 因需保持这些导出而不拆分组件；工具页压缩等依赖随之进入初始包。工作区、登录、翻校的私有组件原本已能拆分。

已移除五处无消费者的页面函数 export，保留 Route 导出、原 URL、search 和认证行为。遵循 [TanStack 自动拆分规则](https://tanstack.com/router/latest/docs/guide/automatic-code-splitting)。

## 生产构建对比

单位为构建日志中的十进制 KB；主入口不是首屏所有静态依赖之和。

| 产物 | 修复前 | 修复后 |
|---|---:|---:|
| 主入口 JS | 905.90 | 303.18 |
| 主入口 gzip | 300.02 | 99.03 |
| 工具页独立 chunk | 未拆出 | 228.07 |
| 漫画广场独立 chunk | 未拆出 | 36.46 |
| 成员页独立 chunk | 未拆出 | 25.45 |
| 设置页独立 chunk | 未拆出 | 13.22 |
| 信箱页独立 chunk | 未拆出 | 5.86 |

主入口减少 66.5%，gzip 减少 67.0%。工作区和翻校继续按需加载；详情共用模块是路由懒加载图中的共享依赖，不在初始静态图。当前构建无超过 500 KB 的 chunk 提示，未调整告警阈值。

## 防回归与验证

- `project:check` 对路由额外 runtime export 报错；包含直接导出、export 列表及合法私有组件的 fixture。
- `script/check-route-bundle.ts` 接入正式 Vite 构建，遍历初始包的传递静态依赖；八个页面实现任一个进入初始静态图就失败。不是只检查 autoCodeSplitting 配置值。
- `deno task build`（含全部类型工程）、lint、project:check、generate:check 通过；30 项工程脚本与 22 项集成测试通过。
- 生产 Chromium 网络验证与日志：`/tmp/lazy-browser.log`；构建：`/tmp/lazy-verified-build.log`。

生产预览还发现并修复传输层把原生 fetch 作为 RequestConfig 方法调用的问题。现以独立函数调用，避免浏览器 Web IDL 的 this 校验导致请求在发送前失败；增加对应回归测试。修复后 277 项单元测试通过。

最终 Chromium 实测通过：冷登录未请求大页面；工作区未请求工具/翻校/其他兄弟页面；关闭首次登录引导并点击「实用工具」后才请求 utilities chunk，页面成功渲染「实用工具」「文件压缩」。
