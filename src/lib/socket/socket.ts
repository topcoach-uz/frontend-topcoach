import { io, Socket } from 'socket.io-client';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { hostName } from 'src/app/services/api/const';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Get or create socket connection
   */
  getSocket(): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      console.warn('No access token found, cannot connect to socket');
      return null;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    // Create new socket connection
    // hostName is already the base URL (e.g., http://localhost:3000)
    // Socket.io connects to the /chat namespace.
    //
    // WebSocket-only — DO NOT add 'polling' to transports. Production
    // runs multiple backend replicas behind the Swarm VIP. Polling does
    // a multi-request handshake (`?sid=xxx` follow-ups) and each request
    // gets round-robin'd to a different replica. The replica that didn't
    // issue the SID returns 400 → transport error → reconnect loop. The
    // Redis adapter only shares broadcast events, NOT engine.io session
    // state, so it doesn't fix this. Skipping polling makes the very
    // first WS upgrade the only request — once established, that single
    // long-lived connection naturally sticks to one backend.
    this.socket = io(`${hostName}/chat`, {
      auth: {
        token,
      },
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();

    return this.socket;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnect attempt', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance
   */
  getSocketInstance(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const socketManager = new SocketManager();

