import { io, Socket } from 'socket.io-client';
import { devLog } from './devLog';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      // Use both transports — websocket preferred, polling fallback for proxies
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      devLog('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      devLog('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    this.socket.on('reconnect', (attempt) => {
      devLog('[Socket] Reconnected after', attempt, 'attempts');
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on<T = unknown>(event: string, handler: (data: T) => void) {
    this.socket?.on(event, handler as (...args: unknown[]) => void);
  }

  off(event: string, handler?: (...args: unknown[]) => void) {
    this.socket?.off(event, handler);
  }

  emit<T = unknown>(event: string, data?: T) {
    this.socket?.emit(event, data);
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();
