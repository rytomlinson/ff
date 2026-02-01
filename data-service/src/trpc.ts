import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export interface User {
  id: string;
  email: string;
}

export interface Context {
  user: User | null;
  requestId: string;
}

export async function createContext({
  req,
}: CreateExpressContextOptions): Promise<Context> {
  const authHeader = req.headers.authorization;
  let user: User | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // In a real app, validate the token and fetch user
    // For now, we'll use a simple mock
    if (token === 'dev-token') {
      user = { id: 'user-1', email: 'dev@example.com' };
    }
  }

  return {
    user,
    requestId: crypto.randomUUID(),
  };
}

interface Meta {
  log?: boolean;
}

const t = initTRPC.context<Context>().meta<Meta>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const loggerMiddleware = middleware(async ({ path, type, next, meta }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (meta?.log) {
    console.log(`[${type.toUpperCase()}] ${path} - ${durationMs}ms`);
  }

  return result;
});

export const authedProcedure = t.procedure.use(isAuthed).use(loggerMiddleware);
