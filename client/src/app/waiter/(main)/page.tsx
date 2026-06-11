'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import TablesView from '@/components/TablesView';
import CategoryTabs from '@/components/CategoryTabs';
import OrderCart from '@/components/OrderCart';
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
  const [cartOpen, setCartOpen] = useState(false);
  const prevCartCount = useRef(0);

  useEffect(() => {
    const count = cart.reduce((sum, i) => sum + i.quantity, 0);
    if (count > prevCartCount.current) setCartOpen(true);
    prevCartCount.current = count;
  }, [cart]);

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
      setCartOpen(false);
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

  const removeTableItem = useCallback(
    (targetArea: string, targetTable: number, lineKey: string, removeAll: boolean) => {
      socket.emit('removeTableItem', {
        area: targetArea,
        tableNumber: targetTable,
        lineKey,
        removeAll,
      });
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
    <div className="flex h-dvh min-h-0 flex-col overflow-x-hidden">
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

      <header className="shrink-0 border-b border-neutral-200 bg-white px-3 py-2 sm:px-4 sm:py-3 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <nav className="flex shrink-0 gap-1 rounded-xl bg-stone p-1">
            <button
              onClick={() => setTab('siparis')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                tab === 'siparis' ? 'bg-white text-ink shadow-sm' : 'text-neutral-500'
              }`}
            >
              Sipariş
            </button>
            <button
              onClick={() => setTab('masalar')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
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

          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${connected ? 'bg-accent' : 'bg-red-400'}`}
              title={connected ? 'Bağlı' : 'Bağlantı yok'}
            />
            {waiterName && (
              <span className="hidden max-w-[5rem] truncate text-xs text-neutral-500 sm:inline sm:max-w-none">
                {waiterName}
              </span>
            )}
            <WaiterLogout />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-y-hidden">
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
              onRemoveItem={removeTableItem}
              onSelectForOrder={selectTableForOrder}
              printingKey={printingKey}
              printedKey={printedKey}
            />
          </div>
        ) : (
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col md:flex-row">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />

            <section className="min-h-0 flex-1 overflow-y-auto p-3 pb-28 sm:p-4 sm:pb-32 md:pb-6 md:p-6">
              <div className="mb-3 flex flex-col gap-2 sm:mb-4 md:mb-6 md:flex-row md:items-center md:justify-between">
                <h2 className="hidden font-display text-2xl md:block">{activeCategory}</h2>

                <div className="touch-scroll-x scrollbar-hide -mx-3 flex flex-nowrap items-center gap-2 px-3 sm:mx-0 sm:flex-wrap sm:px-0 md:gap-3">
                  <nav className="flex shrink-0 gap-1 rounded-xl bg-stone p-1">
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
                    <div className="flex shrink-0 items-center gap-2">
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

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleProductClick(item)}
                    className="flex min-h-[4.5rem] flex-col items-start rounded-xl border border-neutral-200 p-3 text-left transition-all active:scale-[0.98] active:border-ink sm:rounded-2xl sm:p-4 sm:hover:border-ink sm:hover:shadow-sm"
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

            <OrderCart
              layout="sidebar"
              cart={cart}
              total={total}
              areas={areas}
              area={area}
              tableNumber={tableNumber}
              sending={sending}
              confirmed={confirmed}
              onSend={sendOrder}
              onRemove={removeFromCart}
            />

            <OrderCart
              layout="mobile"
              cart={cart}
              total={total}
              areas={areas}
              area={area}
              tableNumber={tableNumber}
              sending={sending}
              confirmed={confirmed}
              onSend={sendOrder}
              onRemove={removeFromCart}
              mobileOpen={cartOpen}
              onMobileToggle={() => setCartOpen((o) => !o)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
