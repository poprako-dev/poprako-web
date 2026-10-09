export async function downloadPresignedStream(
  url: string,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(url, { signal, credentials: "omit" });
  if (!response.ok || !response.body)
    throw new Error(`下载失败（HTTP ${String(response.status)}）`);
  return response.body;
}
