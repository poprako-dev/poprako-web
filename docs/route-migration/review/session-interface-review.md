# 身份与会话接口复核

父认证 route 建立唯一 ready-session；shell 与 translator 共同消费，页面不再重复请求身份。有效身份含必需 userInfo 和带 team 的成员集合。无成员是真实空列表，团队选择是 none/ready 判别状态。清除身份后立即返回登录页，不继续渲染依赖 ready-session 的 Outlet。

独立 API 接收 token getter 和 auth revision getter。401 只清除请求所属的同一身份版本；公共登录失败不清理已有会话。同 token 的新登录仍有新 generation。API 不读取 Zustand。

在线租约响应团队/可见性变化，取消旧请求、计时器和订阅。session-operation 在重新开始、登出、身份替换和卸载时终止头像上传；每个异步阶段验证会话是否仍有效。页面上传队列保留跨页面存续语义，在身份失效时取消。

持久化键仍是 app-store，仅保存 accessToken 与 selectedTeamId，身份和 generation 不持久化。真实 rehydrate、写入格式、登出、旧请求隔离及 StrictMode 生命周期已有测试。

当前代码：src/route/business/session、src/application/api.ts、src/api/client.ts。逐组件清单见 component-contract-review.md；最终类型、22 项集成和完整测试均通过。
