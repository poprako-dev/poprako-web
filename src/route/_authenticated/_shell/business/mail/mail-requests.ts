import type { Result, ResultFailure } from "@/shared/utility/result";

type PendingRequest = {
  controller: AbortController;
  promise: Promise<Result<unknown>>;
};

export function canceledMailRequest(): ResultFailure {
  return { success: false, error: "请求已取消", failureKind: "aborted" };
}

export class MailRequests {
  private readonly pending = new Map<string, PendingRequest>();

  get<Value>(key: string): Promise<Result<Value>> | undefined {
    return this.pending.get(key)?.promise as Promise<Result<Value>> | undefined;
  }

  run<Value>(
    key: string,
    request: (signal: AbortSignal) => Promise<Result<Value>>,
  ): Promise<Result<Value>> {
    const pending = this.get<Value>(key);
    if (pending) return pending;
    const controller = new AbortController();
    const promise = request(controller.signal).finally(() => {
      if (this.pending.get(key)?.controller === controller) this.pending.delete(key);
    });
    this.pending.set(key, { controller, promise });
    return promise;
  }

  cancel(key: string): void {
    this.pending.get(key)?.controller.abort();
    this.pending.delete(key);
  }

  reset(): void {
    for (const request of this.pending.values()) request.controller.abort();
    this.pending.clear();
  }
}
