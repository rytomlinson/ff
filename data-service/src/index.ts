import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import * as trpcExpress from '@trpc/server/adapters/express';
import { router, createContext } from './trpc.js';
import { projectRouter } from './trpcRouters/projectRouter.js';
import { connectRabbitMQ, closeRabbitMQ } from './rabbit/rabbitClient.js';
import { setupWebSocket } from './websocket.js';

const app = express();
const PORT = process.env['PORT'] ?? 4001;

// Create the appRouter by merging all routers
export const appRouter = router({
  project: projectRouter,
});

export type AppRouter = typeof appRouter;

// Middleware
app.use(cors({
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tRPC adapter
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Create HTTP server
const server = createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  await closeRabbitMQ();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  await connectRabbitMQ();

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`tRPC endpoint: http://localhost:${PORT}/trpc`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  });
}

start().catch(console.error);
