type Characters<Text extends string> = Text extends `${infer First}${infer Rest}`
  ? First | Characters<Rest>
  : never;
type LowerLetter = Characters<"abcdefghijklmnopqrstuvwxyz">;
type UpperLetter = Uppercase<LowerLetter>;
type Digit = Characters<"0123456789">;

type CamelKey<Key extends string, Pending extends string = ""> = string extends Key
  ? string
  : Key extends `${infer First}${infer Rest}`
    ? First extends "_"
      ? CamelKey<Rest, `${Pending}_`>
      : Pending extends ""
        ? `${First}${CamelKey<Rest>}`
        : First extends LowerLetter | UpperLetter | Digit
          ? `${Uppercase<First>}${CamelKey<Rest>}`
          : `${Pending}${First}${CamelKey<Rest>}`
    : Pending;

type SnakePrefix<Previous extends string, Rest extends string> = Previous extends
  | LowerLetter
  | Digit
  ? "_"
  : Previous extends UpperLetter
    ? Rest extends `${LowerLetter}${string}`
      ? "_"
      : ""
    : "";

type SnakeKey<Key extends string, Previous extends string = ""> = string extends Key
  ? string
  : Key extends `${infer First}${infer Rest}`
    ? `${First extends UpperLetter ? SnakePrefix<Previous, Rest> : ""}${Lowercase<First>}${SnakeKey<Rest, First>}`
    : "";

type UnchangedObject =
  | Date
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>
  | RegExp
  | Blob
  | ArrayBuffer
  | ArrayBufferView
  | ((...args: never[]) => unknown);

export type CamelCase<Value, Preserved extends string = never> = Value extends UnchangedObject
  ? Value
  : Value extends readonly unknown[]
    ? { [Index in keyof Value]: CamelCase<Value[Index], Preserved> }
    : Value extends object
      ? {
          [Key in keyof Value as Key extends string ? CamelKey<Key> : Key]: Key extends Preserved
            ? Value[Key]
            : CamelCase<Value[Key], Preserved>;
        }
      : Value;

export type SnakeCase<Value, Preserved extends string = never> = Value extends UnchangedObject
  ? Value
  : Value extends readonly unknown[]
    ? { [Index in keyof Value]: SnakeCase<Value[Index], Preserved> }
    : Value extends object
      ? {
          [Key in keyof Value as Key extends string ? SnakeKey<Key> : Key]: Key extends Preserved
            ? Value[Key]
            : SnakeCase<Value[Key], Preserved>;
        }
      : Value;
