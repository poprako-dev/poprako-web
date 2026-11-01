/** 上传签名绑定的请求头。 */
export type UploadHeader = {
  name: string;
  value: string;
};

/** 服务端下发的命名上传头列表。 */
export type UploadHeaders = readonly UploadHeader[];

/** 把命名上传头或原生 `HeadersInit` 统一转换为 `Headers`。 */
export function toHeadersInit(headers: HeadersInit | UploadHeaders | undefined): Headers {
  if (headers === undefined) return new Headers();
  if (!Array.isArray(headers)) return new Headers(headers as HeadersInit);
  return new Headers(headers.map(toHeaderEntry));
}

function toHeaderEntry(entry: string[] | UploadHeader): [string, string] {
  if (!Array.isArray(entry)) return [entry.name, entry.value];
  const [name = "", value = ""] = entry;
  return [name, value];
}
