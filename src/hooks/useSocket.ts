'use client';

import { useEffect } from 'react';
import { socketClient } from '@/lib/socket';
import { authStorage } from '@/lib/auth';

export function useSocket() {
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      socketClient.connect(token);
    }
    return () => {
      socketClient.disconnect();
    };
  }, []);

  return socketClient;
}

export function useSocketEvent<T = unknown>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    socketClient.on(event, handler);
    return () => {
      socketClient.off(event);
    };
  }, [event, handler]);
}
