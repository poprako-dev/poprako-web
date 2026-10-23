import type { ApiClient } from "@/api/client";
import { appendTermbase as appendTermbaseApi } from "@/api/terminology/append";
import type { AppendTermbaseResult } from "@/api/terminology/append";
import type { Result } from "@/shared/utility/result";
import { parseTermbaseAppend } from "./termbase-append-document";

export type { AppendTermbaseResult } from "@/api/terminology/append";

export function appendTermbase(
  client: ApiClient,
  id: string,
  content: string,
): Promise<Result<AppendTermbaseResult>> {
  let document;
  try {
    document = parseTermbaseAppend(content);
  } catch (error) {
    console.error("[Terminology] 解析追加术语 JSON 失败", { id, error });
    return Promise.resolve({
      success: false,
      error:
        error instanceof SyntaxError
          ? "术语文件不是有效的 JSON"
          : error instanceof Error
            ? error.message
            : "无法解析术语文件",
    });
  }
  return appendTermbaseApi(client, id, document);
}
