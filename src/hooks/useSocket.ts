'use client';

import { useEffect } from 'react';
import { socketClient } from '@/lib/socket';
import { authStorage } from '@/lib/auth';

/**
 * Connect socket on mount. We DO NOT disconnect on unmount —
 * the socket is a singleton that should stay alive for the whole
 * session so that real-time chat + call signaling keep working
 * as the user navigates between pages.
 */
export function useSocket() {
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      socketClient.connect(token);
    }
    // No cleanup — socket persists across page navigation
  }, []);

  return socketClient;
}

/**
 * Subscribe to a socket event. The handler is removed on unmount.
 *
 * NOTE: We pass the specific handler to `off()` so that we don't
 * accidentally remove other listeners for the same event (e.g. chat's
 * 'message:new' handler vs another component listening to the same event).
 */
export function useSocketEvent<T = unknown>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const wrappedHandler = (data: unknown) => handler(data as T);
    socketClient.on(event, wrappedHandler);
    return () => {
      socketClient.off(event, wrappedHandler);
    };
  }, [event, handler]);
}
