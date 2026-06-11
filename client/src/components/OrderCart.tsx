'use client';

import { areaLabel, type AreaConfig } from '@/config/tables';
import type { CartItem } from '@/types';

interface OrderCartProps {
  cart: CartItem[];
  total: number;
  areas: AreaConfig[];
  area: string;
  tableNumber: number;
  sending: boolean;
  confirmed: boolean;
  onSend: () => void;
  onRemove: (lineKey: string) => void;
  layout: 'sidebar' | 'mobile';
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

function CartLines({
  cart,
  onRemove,
  compact,
}: {
  cart: CartItem[];
  onRemove: (lineKey: string) => void;
  compact?: boolean;
}) {
  if (cart.length === 0) {
    return (
      <p className={`text-center text-neutral-400 ${compact ? 'py-4 text-sm' : 'py-8 text-sm'}`}>
        Sepet boş
      </p>
    );
  }

  return (
    <ul className={`space-y-2 ${compact ? 'py-1' : ''}`}>
      {cart.map((item) => (
        <li key={item.lineKey} className="text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 flex-1">
              {item.quantity}× {item.name}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-neutral-500">{item.price * item.quantity} TL</span>
              <button
                type="button"
                onClick={() => onRemove(item.lineKey)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 active:bg-stone"
                aria-label="Sepetten çıkar"
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
      ))}
    </ul>
  );
}

export default function OrderCart({
  cart,
  total,
  areas,
  area,
  tableNumber,
  sending,
  confirmed,
  onSend,
  onRemove,
  layout,
  mobileOpen,
  onMobileToggle,
}: OrderCartProps) {
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const location = `${areaLabel(areas, area)} — Masa ${tableNumber}`;

  const sendLabel = confirmed ? '✓ Gönderildi' : sending ? 'Gönderiliyor…' : 'Gönder';

  if (layout === 'mobile') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] md:hidden">
        {mobileOpen && cart.length > 0 && (
          <div className="max-h-[40dvh] overflow-y-auto border-b border-neutral-100 px-4 py-3">
            <p className="mb-2 text-xs text-neutral-400">{location}</p>
            <CartLines cart={cart} onRemove={onRemove} compact />
          </div>
        )}

        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onMobileToggle}
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-stone px-3 py-3 text-left active:bg-neutral-200"
          >
            <p className="text-xs font-medium text-ink">
              Sepet {itemCount > 0 ? `(${itemCount})` : ''}
              {mobileOpen ? ' ▼' : ' ▲'}
            </p>
            <p className="truncate text-[11px] text-neutral-500">{location}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{total.toLocaleString('tr-TR')} TL</p>
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={!cart.length || sending}
            className="shrink-0 rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white active:bg-neutral-800 disabled:opacity-40"
          >
            {sendLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden min-h-0 w-80 shrink-0 flex-col border-l border-neutral-200 bg-white md:flex">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h3 className="font-display text-lg">Sepet</h3>
        <p className="text-xs text-neutral-400">{location}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <CartLines cart={cart} onRemove={onRemove} />
      </div>

      <div className="shrink-0 space-y-2 border-t border-neutral-100 px-5 py-4">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Toplam</span>
          <span className="font-medium">{total.toLocaleString('tr-TR')} TL</span>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!cart.length || sending}
          className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-30"
        >
          {sendLabel}
        </button>
        <p className="text-center text-[10px] text-neutral-400">
          Gönder → mutfak & bar · Adisyon → Masalar sekmesi
        </p>
      </div>
    </aside>
  );
}
