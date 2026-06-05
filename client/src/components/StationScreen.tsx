'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import type { Ticket } from '@/types';
import OrderTicket from './OrderTicket';
import Toast from './Toast';

interface StationScreenProps {
  station: 'kitchen' | 'bar';
  room: 'kitchen_room' | 'bar_room';
  title: string;
  subtitle: string;
  ticketEvent: 'kitchenTicket' | 'barTicket';
  toastMessage: string;
}

export default function StationScreen({
  station,
  room,
  title,
  subtitle,
  ticketEvent,
  toastMessage,
}: StationScreenProps) {
  const socket = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    socket.emit('joinRoom', { room });

    const onSync = (data: Ticket[]) => setTickets(data);
    const onNew = (ticket: Ticket) =>
      setTickets((prev) => [...prev, ticket]);
    const onRemoved = ({ ticketId }: { ticketId: string }) =>
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));

    socket.on('syncTickets', onSync);
    socket.on(ticketEvent, onNew);
    socket.on('ticketRemoved', onRemoved);

    return () => {
      socket.off('syncTickets', onSync);
      socket.off(ticketEvent, onNew);
      socket.off('ticketRemoved', onRemoved);
    };
  }, [socket, room, ticketEvent]);

  const handleReady = useCallback(
    (ticketId: string) => {
      socket.emit('orderReady', { ticketId, station });
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setToast(true);
    },
    [socket, station],
  );

  return (
    <div className="flex h-dvh flex-col bg-stone">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-5">
        <div>
          <h1 className="font-display text-2xl tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-neutral-400">Canlı</span>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-8">
        {tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-display text-3xl text-neutral-300">Bekleyen sipariş yok</p>
          </div>
        ) : (
          <div className="flex gap-6">
            {tickets.map((ticket) => (
              <OrderTicket
                key={ticket.id}
                ticket={ticket}
                stationLabel={title}
                onReady={handleReady}
              />
            ))}
          </div>
        )}
      </main>

      <Toast
        message={toastMessage}
        visible={toast}
        onClose={() => setToast(false)}
      />
    </div>
  );
}
