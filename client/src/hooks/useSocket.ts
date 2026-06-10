'use client';

import { useRef } from 'react';
import { getSocket } from '@/lib/socket';

export function useSocket() {
  const socketRef = useRef(getSocket());
  return socketRef.current;
}
