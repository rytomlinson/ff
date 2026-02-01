import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { subscribeToFishingTripEvents } from './rabbit/rabbitClient.js';

let wss: WebSocketServer | null = null;

interface WsMessage {
  type: string;
  data: unknown;
}

export function setupWebSocket(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString()) as WsMessage;
        console.log('Received:', parsed);
      } catch (e) {
        console.error('Invalid WebSocket message:', e);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Subscribe to RabbitMQ events and broadcast to WebSocket clients
  subscribeToFishingTripEvents('fishingTrip.*', (routingKey: string, data: unknown) => {
    broadcast({
      type: routingKey,
      data,
    });
  });

  return wss;
}

export function broadcast(message: WsMessage): void {
  if (!wss) return;

  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
