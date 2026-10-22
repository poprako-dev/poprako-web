export function decodeObject(value: unknown, label = "object"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} 必须为对象`);
  }
  return value as Record<string, unknown>;
}

export function decodeArray<Value>(
  value: unknown,
  decodeItem: (value: unknown) => Value,
  label = "array",
): Value[] {
  if (!Array.isArray(value)) throw new Error(`${label} 必须为数组`);
  return value.map((item, index) => {
    try {
      return decodeItem(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : "文件数据无法解析";
      throw new Error(`${label}[${String(index)}]: ${message}`, { cause: error });
    }
  });
}

export function decodeString(value: unknown, label = "string"): string {
  if (typeof value !== "string") throw new Error(`${label} 必须为字符串`);
  return value;
}

export function decodeNumber(value: unknown, label = "number"): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} 必须为有限数值`);
  }
  return value;
}
