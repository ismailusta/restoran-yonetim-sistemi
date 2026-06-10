'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import TablesView from '@/components/TablesView';
import WaiterLogout from '@/components/WaiterLogout';
import ModifierModal from '@/components/ModifierModal';
import { buildLineKey } from '@/lib/cart-line';
import { areaLabel, tableKey, type AreaConfig } from '@/config/tables';
import type { CurrencyCode } from '@/lib/currency';
import type { CartItem, MenuItem, MenuItemModifier, TableState } from '@/types';

type Tab = 'siparis' | 'masalar';

export default function WaiterPage() {
  const socket = useSocket();
  const [waiterName, setWaiterName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('siparis');
  const [areas, setAreas] = useState<AreaConfig[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [area, setArea] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState(1);
  const [tables, setTables] = useState<TableState[]>([]);
  const [sending, setSending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [connected, setConnected] = useState(false);
  const [printingKey, setPrintingKey] = useState<string | null>(null);
  const [printedKey, setPrintedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [adisyonError, setAdisyonError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/waiter/session'),
      fetch('/api/config'),
      fetch('/api/menu'),
      fetch('/api/tables'),
    ])
      .then(async ([sessionRes, configRes, menuRes, tablesRes]) => {
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setWaiterName(session.name);
          setIsAdmin(session.role === 'admin');
        }
        const config = await configRes.json();
        const menuItems = await menuRes.json();
        setAreas(config.areas);
        setMenu(menuItems);
        if (tablesRes.ok) {
          setTables(await tablesRes.json());
        }
        if (config.areas[0]) setArea(config.areas[0].id);
        if (menuItems[0]) setActiveCategory(menuItems[0].category);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentArea = areas.find((a) => a.id === area);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit('joinRoom', { room: 'waiter_room' });
    };
    const onDisconnect = () => setConnected(false);
    const onSync = (data: TableState[]) => setTables(data);
    const onUpdate = (data: TableState[]) => setTables(data);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('syncTables', onSync);
    socket.on('tablesUpdated', onUpdate);

    const requestSync = () => {
      socket.emit('joinRoom', { room: 'waiter_room' });
    };

    if (socket.connected) {
      setConnected(true);
      requestSync();
    }

    socket.io.on('reconnect', requestSync);

    return () => {
      socket.io.off('reconnect', requestSync);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('syncTables', onSync);
      socket.off('tablesUpdated', onUpdate);
    };
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

  const addLineToCart = useCallback(
    (item: MenuItem, selected: MenuItemModifier[], unitPrice: number, lineKey: string) => {
      setCart((prev) => {
        const existing = prev.find((c) => c.lineKey === lineKey);
        if (existing) {
          return prev.map((c) =>
            c.lineKey === lineKey ? { ...c, quantity: c.quantity + 1 } : c,
          );
        }
        return [
          ...prev,
          {
            ...item,
            price: unitPrice,
            quantity: 1,
            lineKey,
            selectedModifiers: selected,
          },
        ];
      });
    },
    [],
  );

  const handleProductClick = useCallback(
    (item: MenuItem) => {
      const mods = item.modifiers ?? [];
      if (mods.length > 0) {
        setModifierItem(item);
        return;
      }
      const lineKey = buildLineKey(item.id, []);
      addLineToCart(item, [], item.price, lineKey);
    },
    [addLineToCart],
  );

  const removeFromCart = useCallback((lineKey: string) => {
    setCart((prev) => {
      const item = prev.find((c) => c.lineKey === lineKey);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((c) => c.lineKey !== lineKey);
      return prev.map((c) =>
        c.lineKey === lineKey ? { ...c, quantity: c.quantity - 1 } : c,
      );
    });
  }, []);

  const sendOrder = useCallback(() => {
    if (!cart.length || sending || !area) return;
    setSending(true);

    socket.emit('newOrder', {
      area,
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
  }, [socket, cart, area, tableNumber, total, sending]);

  const printAdisyon = useCallback(
    (targetArea: string, targetTable: number, currency: CurrencyCode) => {
      const key = tableKey(targetArea, targetTable);
      setPrintingKey(key);
      setAdisyonError('');

      socket.emit('printAdisyon', {
        area: targetArea,
        tableNumber: targetTable,
        currency,
      });

      socket.once('adisyonQueued', () => {
        setPrintingKey(null);
        setPrintedKey(key);
        setTimeout(() => setPrintedKey(null), 2000);
      });

      socket.once('adisyonError', (data: { message?: string }) => {
        setPrintingKey(null);
        setAdisyonError(data?.message || 'Adisyon yazdırılamadı');
        setTimeout(() => setAdisyonError(''), 4000);
      });
    },
    [socket],
  );

  const closeTable = useCallback(
    (targetArea: string, targetTable: number) => {
      socket.emit('closeTable', { area: targetArea, tableNumber: targetTable });
    },
    [socket],
  );

  const selectTableForOrder = useCallback((targetArea: string, num: number) => {
    setArea(targetArea);
    setTableNumber(num);
    setTab('siparis');
  }, []);

  const handleAreaChange = useCallback((newArea: string) => {
    setArea(newArea);
    setTableNumber(1);
  }, []);

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center text-neutral-400">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      {modifierItem && (
        <ModifierModal
          item={modifierItem}
          onClose={() => setModifierItem(null)}
          onConfirm={(selected, unitPrice, lineKey) => {
            addLineToCart(modifierItem, selected, unitPrice, lineKey);
            setModifierItem(null);
          }}
        />
      )}

      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <nav className="flex gap-1 rounded-xl bg-stone p-1">
            <button
              onClick={() => setTab('siparis')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'siparis' ? 'bg-white text-ink shadow-sm' : 'text-neutral-500'
              }`}
            >
              Sipariş
            </button>
            <button
              onClick={() => setTab('masalar')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'masalar' ? 'bg-white text-ink shadow-sm' : 'text-neutral-500'
              }`}
            >
              Masalar
              {occupiedCount > 0 && (
                <span className="ml-1.5 rounded-full bg-ink px-1.5 py-0.5 text-[10px] text-white">
                  {occupiedCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-accent' : 'bg-red-400'}`} />
          <span className="hidden text-xs text-neutral-400 sm:inline">
            {connected ? 'Bağlı' : 'Bağlantı yok'}
          </span>
          {waiterName && (
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              {waiterName}
              {isAdmin && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  Admin
                </span>
              )}
            </span>
          )}
          <WaiterLogout />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {tab === 'masalar' ? (
          <div className="relative flex flex-1 flex-col overflow-hidden">
            {adisyonError && (
              <div className="absolute left-4 right-4 top-4 z-10 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">
                {adisyonError}
              </div>
            )}
            <TablesView
              areas={areas}
              tables={tables}
              onPrintAdisyon={printAdisyon}
              onCloseTable={closeTable}
              onSelectForOrder={selectTableForOrder}
              printingKey={printingKey}
              printedKey={printedKey}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col md:flex-row">
            <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-3 md:w-44 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:py-6">
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

            <section className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
                <h2 className="font-display text-2xl">{activeCategory}</h2>

                <div className="flex flex-wrap items-center gap-3">
                  <nav className="flex gap-1 rounded-xl bg-stone p-1">
                    {areas.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleAreaChange(a.id)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          area === a.id ? 'bg-white text-ink shadow-sm' : 'text-neutral-500'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </nav>

                  {currentArea && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Masa</span>
                      <select
                        value={tableNumber}
                        onChange={(e) => setTableNumber(Number(e.target.value))}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm"
                      >
                        {Array.from({ length: currentArea.tableCount }, (_, i) => i + 1).map((n) => {
                          const t = tables.find((t) => t.area === area && t.tableNumber === n);
                          return (
                            <option key={n} value={n}>
                              {n}
                              {t?.status === 'occupied' ? ' ●' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleProductClick(item)}
                    className="flex flex-col items-start rounded-2xl border border-neutral-200 p-4 text-left transition-all hover:border-ink hover:shadow-sm active:scale-[0.98]"
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="mt-1 text-xs text-neutral-400">{item.price} TL</span>
                    {(item.modifiers?.length ?? 0) > 0 && (
                      <span className="mt-1 text-[10px] text-neutral-400">
                        {item.modifiers!.length} seçenek
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <aside className="flex max-h-[40dvh] flex-col border-t border-neutral-200 bg-white md:max-h-none md:w-80 md:border-l md:border-t-0">
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                <div>
                  <h3 className="font-display text-lg">Sepet</h3>
                  <p className="text-xs text-neutral-400">
                    {areaLabel(areas, area)} — Masa {tableNumber}
                  </p>
                </div>
              </div>

              <ul className="flex-1 space-y-2 overflow-y-auto px-5 py-3">
                {cart.length === 0 ? (
                  <li className="py-8 text-center text-sm text-neutral-300">Sepet boş</li>
                ) : (
                  cart.map((item) => (
                    <li key={item.lineKey} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span>
                          {item.quantity}× {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400">{item.price * item.quantity} TL</span>
                          <button
                            onClick={() => removeFromCart(item.lineKey)}
                            className="text-neutral-300 hover:text-ink"
                          >
                            −
                          </button>
                        </div>
                      </div>
                      {item.selectedModifiers.length > 0 && (
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {item.selectedModifiers.map((m) => m.label).join(', ')}
                        </p>
                      )}
                    </li>
                  ))
                )}
              </ul>

              <div className="space-y-2 border-t border-neutral-100 px-5 py-4">
                <div className="flex justify-between text-sm">
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
                <p className="text-center text-[10px] text-neutral-400">
                  Gönder → mutfak & bar · Adisyon → Masalar sekmesi
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
