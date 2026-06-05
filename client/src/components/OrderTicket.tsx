'use client';

import type { Ticket } from '@/types';

interface OrderTicketProps {
  ticket: Ticket;
  stationLabel: string;
  onReady: (ticketId: string) => void;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff} sn önce`;
  return `${Math.floor(diff / 60)} dk önce`;
}

export default function OrderTicket({ ticket, stationLabel, onReady }: OrderTicketProps) {
  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-3xl tracking-tight">Masa {ticket.tableNumber}</h3>
        <span className="text-xs text-neutral-400">{timeAgo(ticket.createdAt)}</span>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {ticket.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span>
              <span className="mr-2 font-medium text-neutral-400">{item.quantity}×</span>
              {item.name}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onReady(ticket.id)}
        className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 active:scale-[0.98]"
      >
        Hazır — Yazdır
      </button>
    </div>
  );
}
