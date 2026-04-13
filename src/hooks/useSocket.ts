import { useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * Hook for subscribing to WebSocket events using the global socket connection.
 * No new connections are created — uses the shared authenticated socket.
 */
export function useSocket(events: Record<string, (...args: any[]) => void>) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler);
    }

    return () => {
      for (const [event, handler] of Object.entries(events)) {
        socket.off(event, handler);
      }
    };
  }, [socket]);
}