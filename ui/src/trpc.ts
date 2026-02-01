import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from '@ff/data-service/src/index.js';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/trpc',
        headers() {
          const token = localStorage.getItem('auth_token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
