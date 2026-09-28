type HashResult = {
  imageHash: string;
};

type HashResponse = { id: number; imageHash: string } | { id: number; error: string };

interface PendingHash {
  resolve: (result: HashResult) => void;
  reject: (error: Error) => void;
}

const hashRuntime = {
  worker: null as Worker | null,
  nextRequestId: 1,
  pending: new Map<number, PendingHash>(),
};

function rejectPendingHashes(error: Error): void {
  for (const pendingHash of hashRuntime.pending.values()) {
    pendingHash.reject(error);
  }
  hashRuntime.pending.clear();
}

function isHashResponse(value: unknown): value is HashResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const response = value as { id?: unknown; imageHash?: unknown; error?: unknown };
  return (
    Number.isSafeInteger(response.id) &&
    (typeof response.imageHash === "string" || typeof response.error === "string")
  );
}

function getHashWorker(): Worker {
  if (hashRuntime.worker) {
    return hashRuntime.worker;
  }

  const worker = new Worker(new URL("./image-hash-worker.ts", import.meta.url), {
    type: "module",
  });

  worker.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (!isHashResponse(event.data)) {
      stopWorker(worker, new Error("图片哈希 Worker 协议错误"));
      return;
    }
    const pendingHash = hashRuntime.pending.get(event.data.id);
    if (!pendingHash) {
      return;
    }

    hashRuntime.pending.delete(event.data.id);

    if ("imageHash" in event.data) {
      pendingHash.resolve({ imageHash: event.data.imageHash });
    } else {
      pendingHash.reject(new Error(event.data.error));
    }
  });

  worker.addEventListener("error", () => {
    stopWorker(worker, new Error("计算图片哈希失败"));
  });

  worker.addEventListener("messageerror", () => {
    stopWorker(worker, new Error("图片哈希 Worker 响应无法读取"));
  });

  hashRuntime.worker = worker;
  return worker;
}

function stopWorker(worker: Worker, error: Error): void {
  if (hashRuntime.worker !== worker) {
    return;
  }
  rejectPendingHashes(error);
  worker.terminate();
  hashRuntime.worker = null;
}

/**
Calculates one file's SHA-256 in a dedicated worker.
*/
export function hashPageFile(file: File): Promise<HashResult> {
  return new Promise((resolve, reject) => {
    const id = hashRuntime.nextRequestId++;

    hashRuntime.pending.set(id, { resolve, reject });
    try {
      getHashWorker().postMessage({ id, file });
    } catch (error) {
      hashRuntime.pending.delete(id);
      reject(error instanceof Error ? error : new Error("无法启动图片哈希计算"));
    }
  });
}
