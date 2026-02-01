export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message ?? 'Assertion failed');
  }
}

export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AssertionError(message ?? 'Value is null or undefined');
  }
}

export function assertNever(value: never, message?: string): never {
  throw new AssertionError(message ?? `Unexpected value: ${JSON.stringify(value)}`);
}
