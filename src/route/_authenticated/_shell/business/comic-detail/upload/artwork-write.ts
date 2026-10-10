import type { Result } from "@/shared/utility/result";

const tails = new Map<string, Promise<void>>();

function wait(signal: AbortSignal, milliseconds: number): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    function abort(): void {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new DOMException("已取消", "AbortError"));
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function writeArtwork<T>(
  chapterId: string,
  signal: AbortSignal,
  request: () => Promise<Result<T>>,
): Promise<Result<T>> {
  const previous = tails.get(chapterId) ?? Promise.resolve();
  let release: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  tails.set(chapterId, current);
  await previous;
  try {
    for (let attempt = 0; ; attempt++) {
      signal.throwIfAborted();
      const result = await request();
      signal.throwIfAborted();
      if (result.success || result.httpStatus !== 409 || result.code !== 8 || attempt === 4)
        return result;
      await wait(signal, 75 * 2 ** attempt);
    }
  } finally {
    release?.();
    if (tails.get(chapterId) === current) tails.delete(chapterId);
  }
}
