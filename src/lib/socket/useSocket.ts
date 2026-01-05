import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socketManager } from './socket';
import { useTypedSelector } from 'src/app/store';

export interface UseSocketOptions {
  /**
   * Auto-connect when authenticated (default: true)
   */
  autoConnect?: boolean;
  /**
   * Event handlers for socket events
   */
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  /**
   * Emit an event to the server
   */
  emit: (event: string, data?: any) => void;
  /**
   * Listen to an event from the server
   */
  on: (event: string, callback: (...args: any[]) => void) => void;
  /**
   * Remove event listener
   */
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

/**
 * React hook for Socket.io connection
 */
export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventHandlersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());
  const callbacksRef = useRef({ onConnect, onDisconnect, onError });
  const connectionHandlersRef = useRef<{
    handleConnect?: () => void;
    handleDisconnect?: (reason: string) => void;
    handleError?: (error: Error) => void;
  }>({});

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onConnect, onDisconnect, onError };
  }, [onConnect, onDisconnect, onError]);

  // Connect socket
  const connect = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    const socketInstance = socketManager.getSocket();
    if (!socketInstance) {
      console.warn('Failed to get socket instance');
      return;
    }

    // Only set socket if it's different
    setSocket((prevSocket) => {
      if (prevSocket === socketInstance) {
        return prevSocket;
      }
      return socketInstance;
    });
    
    setIsConnected(socketInstance.connected);

    // Setup connection handlers (only once per socket instance)
    if (!connectionHandlersRef.current.handleConnect) {
      connectionHandlersRef.current.handleConnect = () => {
        setIsConnected(true);
        callbacksRef.current.onConnect?.();
      };

      connectionHandlersRef.current.handleDisconnect = (reason: string) => {
        setIsConnected(false);
        callbacksRef.current.onDisconnect?.(reason);
      };

      connectionHandlersRef.current.handleError = (error: Error) => {
        setIsConnected(false);
        callbacksRef.current.onError?.(error);
      };

      socketInstance.on('connect', connectionHandlersRef.current.handleConnect);
      socketInstance.on('disconnect', connectionHandlersRef.current.handleDisconnect);
      socketInstance.on('connect_error', connectionHandlersRef.current.handleError);
    }

    // Reattach existing event handlers
    eventHandlersRef.current.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        socketInstance.on(event, handler);
      });
    });
  }, [isAuthenticated]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    const currentSocket = socket || socketManager.getSocketInstance();
    if (currentSocket) {
      // Remove connection handlers
      if (connectionHandlersRef.current.handleConnect) {
        currentSocket.off('connect', connectionHandlersRef.current.handleConnect);
      }
      if (connectionHandlersRef.current.handleDisconnect) {
        currentSocket.off('disconnect', connectionHandlersRef.current.handleDisconnect);
      }
      if (connectionHandlersRef.current.handleError) {
        currentSocket.off('connect_error', connectionHandlersRef.current.handleError);
      }
      connectionHandlersRef.current = {};

      // Remove all event listeners
      eventHandlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          currentSocket.off(event, handler);
        });
      });
      eventHandlersRef.current.clear();
    }

    socketManager.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, [socket]);

  // Emit event
  const emit = useCallback(
    (event: string, data?: any) => {
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        console.warn(`Cannot emit event "${event}": socket not connected`);
      }
    },
    [socket]
  );

  // Listen to event
  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (!eventHandlersRef.current.has(event)) {
        eventHandlersRef.current.set(event, new Set());
      }
      eventHandlersRef.current.get(event)!.add(callback);

      if (socket) {
        socket.on(event, callback);
      }
    },
    [socket]
  );

  // Remove event listener
  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void) => {
      if (socket) {
        if (callback) {
          socket.off(event, callback);
          eventHandlersRef.current.get(event)?.delete(callback);
        } else {
          socket.off(event);
          eventHandlersRef.current.delete(event);
        }
      }
    },
    [socket]
  );

  // Auto-connect on mount and when authentication changes
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    } else if (!isAuthenticated && socket) {
      disconnect();
    }

    return () => {
      // Cleanup is handled by disconnect
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, isAuthenticated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup all event handlers
      if (socket) {
        eventHandlersRef.current.forEach((handlers, event) => {
          handlers.forEach((handler) => {
            socket.off(event, handler);
          });
        });
        eventHandlersRef.current.clear();
      }
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};

