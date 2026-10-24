export interface CategoryPresets {
  read: () => string[];
  write: (names: string[]) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createCategoryPresets(accountId?: string): CategoryPresets {
  const key = accountId ? `poprako-review-categories-v1:${accountId}` : null;
  let memory: string[] = [];
  const listeners = new Set<() => void>();
  function read(): string[] {
    if (!key) return memory;
    const raw = localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value) || value.some((name) => typeof name !== "string"))
      throw new Error("本地分类读取失败");
    return [...new Set(value as string[])];
  }
  function write(names: string[]): void {
    const unique = [...new Set(names)];
    if (key) localStorage.setItem(key, JSON.stringify(unique));
    memory = unique;
    for (const listener of listeners) listener();
  }
  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    function changed(event: StorageEvent): void {
      if (key && (event.key === key || event.key === null)) listener();
    }
    window.addEventListener("storage", changed);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", changed);
    };
  }
  return { read, write, subscribe };
}
