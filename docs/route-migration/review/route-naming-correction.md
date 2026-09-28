# 页面与文件命名纠正

用户澄清：禁止复数目录不用于改写具体页面名称；所有 TSX 使用 PascalCase，普通 TS 使用 kebab-case。

## 实施

- 删除 `(setting)`、`(utility)` 人工分组，直接使用具体页面目录 `settings`、`utilities`。
- 保持 `/settings`、`/utilities` 和其他公开 URL 不变。
- TanStack 的 indexToken 与 routeToken 配置为 `Index`、`Route`，入口分别为 `Index.tsx`、`Route.tsx`。
- 所有 TSX 测试也使用 PascalCase；移除命名检查器对小写路由和 kebab-case TSX 测试的豁免。
- 固定根入口为 `__root.ts`，组件位于 `business/ApplicationRoot.tsx`；框架保留名称只做明确例外。
- 同步更新路径引用、路由归属检查、生成文件及懒加载检查。
- 保留有实际鉴权与布局职责的 `_authenticated`、`_shell`。

## 验证

生产构建、完整类型检查、路由生成一致性检查通过，8 个页面的独立加载检查通过。
单元测试 283 项、集成测试 23 项通过；命名测试覆盖页面名例外、TSX 路由/测试以及 TS 模块。
未改变 API 调用和页面行为，未进行截图验证。大小写重命名通过 Git 记录，未提交。
