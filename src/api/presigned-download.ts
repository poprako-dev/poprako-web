export type DownloadProgress = { receivedBytes: number; totalBytes: number | null };

export async function downloadPresignedStream(
  url: string,
  signal: AbortSignal,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(url, { signal, credentials: "omit" });
  if (!response.ok || !response.body)
    throw new Error(`下载失败（HTTP ${String(response.status)}）`);
  const length = Number(response.headers.get("content-length"));
  const totalBytes = Number.isSafeInteger(length) && length > 0 ? length : null;
  let receivedBytes = 0;
  onProgress?.({ receivedBytes, totalBytes });
  return response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        receivedBytes += chunk.byteLength;
        onProgress?.({ receivedBytes, totalBytes });
        controller.enqueue(chunk);
      },
    }),
    { signal },
  );
}
