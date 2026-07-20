type HashResult = {
  imageHash: string;
};

/** Calculates one file's SHA-256 in a dedicated worker. */
export function hashPageFile(file: File): Promise<HashResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./pageHash.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<HashResult & { error?: string }>) => {
      worker.terminate();

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      resolve({ imageHash: event.data.imageHash });
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error("计算图片哈希失败"));
    };

    worker.postMessage({ id: 0, file });
  });
}
