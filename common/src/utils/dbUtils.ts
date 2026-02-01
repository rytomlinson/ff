import { ZodError } from 'zod';

export class DbError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'DbError';
  }
}

export function throwDbError(e: unknown): never {
  if (e instanceof ZodError) {
    throw new DbError(`Validation error: ${e.message}`, 'VALIDATION_ERROR');
  }
  if (e instanceof Error) {
    const pgError = e as Error & { code?: string; detail?: string };
    throw new DbError(e.message, pgError.code, pgError.detail);
  }
  throw new DbError('Unknown database error');
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function mapRowToCamelCase<T extends Record<string, unknown>>(
  row: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }
  return result as T;
}
