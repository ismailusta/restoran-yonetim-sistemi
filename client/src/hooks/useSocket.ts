'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export function useSocket() {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      socket.off();
    };
  }, []);

  return socketRef.current;
}
