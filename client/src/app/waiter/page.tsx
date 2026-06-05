'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import type { CartItem, MenuItem } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export default function WaiterPage() {
  const socket = useSocket();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState(1);
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/menu`)
      .then((r) => r.json())
      .then((data: MenuItem[]) => {
        setMenu(data);
        const cats = [...new Set(data.map((m) => m.category))];
        if (cats.length) setActiveCategory(cats[0]);
      });
  }, []);

  const categories = useMemo(
    () => [...new Set(menu.map((m) => m.category))],
    [menu],
  );

  const filtered = useMemo(
    () => menu.filter((m) => m.category === activeCategory),
    [menu, activeCategory],
  );

  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  );

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => {
      const item = prev.find((c) => c.id === id);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) =>
        c.id === id ? { ...c, quantity: c.quantity - 1 } : c,
      );
    });
  }, []);

  const sendOrder = useCallback(() => {
    if (!cart.length || sending) return;
    setSending(true);

    socket.emit('newOrder', {
      tableNumber,
      items: cart,
      total,
    });

    socket.once('orderConfirmed', () => {
      setCart([]);
      setSending(false);
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 2000);
    });
  }, [socket, cart, tableNumber, total, sending]);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* Kategoriler */}
      <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-3 md:w-44 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:py-6">
        <Link href="/" className="mb-4 hidden text-xs text-neutral-400 hover:text-ink md:block">
          ← Ana Sayfa
        </Link>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm transition-colors md:whitespace-normal ${
              activeCategory === cat
                ? 'bg-ink text-white'
                : 'text-neutral-500 hover:bg-stone'
            }`}
          >
            {cat}
          </button>
        ))}
      </aside>

      {/* Menü */}
      <section className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between md:mb-6">
          <h2 className="font-display text-2xl">{activeCategory}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Masa</span>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="flex flex-col items-start rounded-2xl border border-neutral-200 p-4 text-left transition-all hover:border-ink hover:shadow-sm active:scale-[0.98]"
            >
              <span className="text-sm font-medium">{item.name}</span>
              <span className="mt-1 text-xs text-neutral-400">{item.price} TL</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sepet */}
      <aside className="flex max-h-[40dvh] flex-col border-t border-neutral-200 bg-white md:max-h-none md:w-80 md:border-l md:border-t-0">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="font-display text-lg">Adisyon</h3>
          <span className="text-xs text-neutral-400">Masa {tableNumber}</span>
        </div>

        <ul className="flex-1 space-y-2 overflow-y-auto px-5 py-3">
          {cart.length === 0 ? (
            <li className="py-8 text-center text-sm text-neutral-300">Sepet boş</li>
          ) : (
            cart.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>
                  {item.quantity}× {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">{item.price * item.quantity} TL</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-neutral-300 hover:text-ink"
                  >
                    −
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="border-t border-neutral-100 px-5 py-4">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-neutral-400">Toplam</span>
            <span className="font-medium">{total} TL</span>
          </div>
          <button
            onClick={sendOrder}
            disabled={!cart.length || sending}
            className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-30"
          >
            {confirmed ? '✓ Gönderildi' : sending ? 'Gönderiliyor…' : 'Gönder'}
          </button>
        </div>
      </aside>
    </div>
  );
}
