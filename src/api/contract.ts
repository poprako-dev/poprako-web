import { ApiDecodeError, invalidApiValue } from "@/api/api-error";

export type ApiDecoder<Value> = (value: unknown) => Value;

export function decodeObject(value: unknown, label = "object"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalidApiValue(label, "an object");
  }
  return value as Record<string, unknown>;
}

export function decodeArray<Value>(
  value: unknown,
  decodeItem: ApiDecoder<Value>,
  label = "array",
): Value[] {
  if (!Array.isArray(value)) {
    throw invalidApiValue(label, "an array");
  }
  return value.map((item, index) =>
    decodeItemWithLabel(item, decodeItem, `${label}[${String(index)}]`),
  );
}

export function decodeString(value: unknown, label = "string"): string {
  if (typeof value !== "string") {
    throw invalidApiValue(label, "a string");
  }
  return value;
}

export function decodeNumber(value: unknown, label = "number"): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalidApiValue(label, "a finite number");
  }
  return value;
}

export function decodeBoolean(value: unknown, label = "boolean"): boolean {
  if (typeof value !== "boolean") {
    throw invalidApiValue(label, "a boolean");
  }
  return value;
}

export function decodeNullable<Value>(
  value: unknown,
  decodeValue: ApiDecoder<Value>,
  label = "value",
): Value | null {
  return value === null ? null : decodeItemWithLabel(value, decodeValue, label);
}

export function decodeVoid(value: unknown): undefined {
  if (value !== undefined && value !== null) {
    throw invalidApiValue("empty response", "no data");
  }
  return undefined;
}

function decodeItemWithLabel<Value>(
  value: unknown,
  decoder: ApiDecoder<Value>,
  label: string,
): Value {
  try {
    return decoder(value);
  } catch (error) {
    if (error instanceof ApiDecodeError) {
      throw new ApiDecodeError(`${label}: ${error.message}`);
    }
    throw new ApiDecodeError(`${label}: response decoding failed`);
  }
}
