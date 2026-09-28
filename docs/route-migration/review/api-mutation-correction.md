# API 写入成功被前端误判失败：修复记录

## 已确认的原因

用户自助加入章节分工时，后端返回 HTTP 201，响应为
`{ code: 0, data: AssignmentInfoView }`。前端错误使用 `decodeVoid`，
因此产生 `Invalid API empty response: expected no data`，并提前退出，
未刷新分工和权限。重新打开弹窗后读取到已成功写入的数据。

## 修复范围

- `POST /assignments/join`：解码并返回 AssignmentResponse。
- `POST /assignment-invitations/join`：解码并返回 AssignmentResponse。
- `POST /members/join`：解码并返回 ApiMember。
- `PUT /chapters/{chapter_id}/assignments/{user_id}/roles`：接受 204，取消错误的返回 ID 要求。
- `PUT /members/{member_id}/roles`：补齐请求体必填的 id，与路径保持一致。
- 路由适配层在成功解码后转换为既有命令结果；不放宽全局响应校验。
- 修正旧测试错误的 204 邀请加入 fixture，以及仅检查请求而忽略结果的团队加入测试。

契约依据为运行中服务对应的 `../poprako-server` HTTP handler、view DTO、
OpenAPI。额外核对了 84 个 JSON 调用的空/有值响应类别和写入请求必填字段；
此检查不代表所有业务行为均已经实测。

## 回归验证

- 修复前，四个响应契约测试失败；补充的成员角色请求体测试也先失败再修复。
- 集成测试贯穿实际 API client、端点解码器、路由适配器和分工 hook，模拟服务器
  写入后返回 201，断言无需重开弹窗即可更新分工、翻译权限和成功提示。
- 同一测试断言初始加载、加入、刷新共三次请求，普通重渲染不增加请求。
- 单元测试 283 项、集成测试 23 项、脚本测试 31 项通过。
- 完整类型检查和生产构建通过；结构和测试发现检查通过。

没有使用真实账号执行写入，没有截图或读取图片。请求数量较高的健康指标本身
不足以证明无限请求循环；本次未据此修改 effect。
