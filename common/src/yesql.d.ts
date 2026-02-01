declare module 'yesql' {
  export interface QueryResult {
    text: string;
    values: unknown[];
  }

  export type YesqlPg = (sql: string) => (params: Record<string, unknown>) => QueryResult;

  const yesql: {
    pg: YesqlPg;
  };

  export default yesql;
}
