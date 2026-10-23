type Deferred<Value> = {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
};

export function deferred<Value>(): Deferred<Value> {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}
