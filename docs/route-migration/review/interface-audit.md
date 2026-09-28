# 组件接口与空值语义审查

R007 已实施，最终本机检查通过。全量范围：172 个生产组件。

- [逐组件契约复核](component-contract-review.md)：每个组件的定义、调用点数量和保留可选/空值理由。
- [TypeScript 发现清单](component-inventory.json)：完整 Props（含继承）及 JSX 调用点。工具固定输出 needs-manual-review，不自动把扫描等同语义审查。
- [共享组件](shared-interface-review.md)、[详情](detail-interface-review.md)、[会话](session-interface-review.md)、[翻校](translator-interface-review.md)、[叶子页面](leaf-interface-review.md)。分组旧记录与最终实现不一致时，以全量索引及源码为准。

主要修正：受控输入必须有 value/onChange；确认框与分页使用模式契约；认证后身份必需；详情公开 Props 减为六项且内部核心动作必需；成员选择器只接收有效章节与加载器；可点击漫画列表必须提供导航；翻校列表显式提供 editing 能力，不能缺少动作却提示成功。章节 stages、成员 roles 使用真实必需数据，删除虚构时间戳兼容层。

合法空值继续保留：用户没有团队成员身份、漫画没有章节、未选中单元、未解析贡献者、图像尚未加载、上传尚无进度、弹窗关闭和 DOM 尚未挂载。合法默认值留在组件或 domain 适配边界，避免调用方反复传空字符串/undefined。原生 HTML 属性保持原生约定。

最终验证：全部类型及 lint、276 单测、22 集成、183 Storybook 交互、29 工程脚本测试通过。详见 implementation-results.md；不把本机夹具测试称作线上 backend 验证。
