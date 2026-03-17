# API 文件创建规范 Skill

目的

- 在本项目中为 `src/features/**/api` 下的函数提供统一、可复用的实现规范，确保后端蛇形命名、前端驼峰/类型转换、错误与返回值处理一致。

适用范围

- 工作区范围（repository-scoped）。放置于 `skills/api-file-spec/SKILL.md`，供所有协作者和自动化 agent 使用。

概述（高层流程）

1. 使用后端原始结构体（位于 `src/types/raw`）做为输入/参考。
2. 将前端/TS 端的字段转换为后端期望的蛇形字段（snake_case）。
3. 根据接口类型，把参数注入到 `body`（POST/PUT/PATCH）或 `query`（GET）中。
4. 在 `try/catch` 内执行请求；在 `catch` 中读取 `error.message` 并将其以字符串形式返回给业务层。
5. API 函数始终返回 `data || message`（若正常返回 data，直接返回；若发生错误，返回错误消息字符串）。

质量标准 / 校验点

- 使用 `src/types/raw` 下的类型作为转换参照（若存在对应类型）。
- 不在 API 层吞掉错误：必须把错误的 `message` 字段上报给业务层（返回字符串或封装为一致的错误结构），以便 UI 显示。
- 参数注入必须区分 `body` 与 `query`，并保持类型安全。
- 返回值签名尽量写明 `Promise<T | string>`，T 为成功时的 `data` 类型。
- 保持行长度 <= 100 字符（若样式行过长，使用 `clsx` 或分组样式）。

模板（TypeScript）

示例模板（可复制粘贴并按需调整）:

```ts
export async function listMyAssignments(offset: number, limit: number) {
  const assignmets = await api.get<RawAssignmentInfo[]>(
    `/assignments/mine`,
    {
      offset,
      limit,
    },
    true,
  );

  return assignmets;
}
```

常见决策点

- 参数位置：GET -> `query`，其他（POST/PUT/PATCH）-> `body`。
- 类型来源优先级：如果 `src/types/raw` 有对应类型，优先用它；否则使用局部定义的接口类型并标注 TODO 来补充 raw 类型。
- 错误信息：必须返回 `message` 字符串而不是抛出，除非调用方明确要求 propagate（在这种情况下需加注释说明）。

示例（基于现有的 `listMyAssignments`）

- 先查找 `src/types/raw` 中是否存在对应请求/响应类型，例如 `src/types/raw/assignmentListResp.ts`。
- 使用一个共享的 `toSnakeCase()` util（建议放在 `src/lib` 或 `src/api/util.ts`）完成键名转换。
- 将转换后的对象放入 `query`（GET）或 `body`（POST），调用 `request`。
- 返回 `result.data || message`。

建议的公共 util（放置位置：`src/api/util.ts` 或 `src/lib/utils.ts`）

- `toSnakeCase(obj): any`：将对象键名递归转换为 snake_case。
- `fromSnakeCase<T>(obj): T`：可选，从后端 response 转回驼峰（若需要）。

示例提示（给 agent / 同事）

- "请按 `skills/api-file-spec/SKILL.md` 的模板创建 `src/features/FOO/api/bar.ts`，并使用 `src/types/raw` 中的类型。"
- "如果错误发生，请确保返回 `message` 字符串，同时在控制台打印完整错误对象。"

开放问题（需要你确认）

- 我们希望 API 层统一返回 `Promise<T | string>`，还是统一返回 `{ data?: T; message?: string }`？（当前需求是 `data || message`，请确认是否接受可变返回类型）

版本与维护

- 本文档放置于 `skills/api-file-spec/SKILL.md`，如需调整规范，直接编辑此文件并在 PR 中标注变更理由。
