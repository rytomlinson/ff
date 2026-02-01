import pg from 'pg';
import yesql from 'yesql';

const { Pool } = pg;

const connectionConfig = {
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  database: process.env['DB_NAME'] ?? 'ff_development',
  user: process.env['DB_USER'] ?? 'postgres',
  password: process.env['DB_PASSWORD'] ?? 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const db = new Pool(connectionConfig);

db.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const sql = yesql.pg;

export async function query<T>(
  text: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const { text: queryText, values } = params
    ? sql(text)(params)
    : { text, values: [] };
  const result = await db.query(queryText, values);
  return result.rows as T[];
}

export async function queryOne<T>(
  text: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
