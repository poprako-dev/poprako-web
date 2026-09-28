export class ApiDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiDecodeError";
  }
}

export function invalidApiValue(label: string, expected: string): ApiDecodeError {
  return new ApiDecodeError(`Invalid API ${label}: expected ${expected}`);
}
