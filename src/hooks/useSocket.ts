import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:3000`;

/**
 * Hook for WebSocket events.
 * If userId is provided, joins the user-specific room for targeted events.
 */
export function useSocket(events: Record<string, (...args: any[]) => void>, userId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    if (userId) {
      socket.on('connect', () => {
        socket.emit('join', { userId });
      });
    }

    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}
