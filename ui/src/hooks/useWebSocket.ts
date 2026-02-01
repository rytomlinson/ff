import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch.js';
import { projectActions } from '../slices/projectSlice.js';
import type { Project } from '@ff/common/schemas/projectSchema.js';

interface WsMessage {
  type: string;
  data: unknown;
}

export function useWebSocket() {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WsMessage;

        switch (message.type) {
          case 'project.created':
          case 'project.updated':
            dispatch(projectActions.upsertItem(message.data as Project));
            break;
          case 'project.deleted':
            dispatch(projectActions.deleteItem((message.data as { id: string }).id));
            break;
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [dispatch]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef.current;
}
