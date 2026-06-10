'use client';

import { useMemo, useState } from 'react';
import type { MenuItem, MenuItemModifier } from '@/types';
import { buildLineKey, calcUnitPrice } from '@/lib/cart-line';

interface ModifierModalProps {
  item: MenuItem;
  onConfirm: (selected: MenuItemModifier[], unitPrice: number, lineKey: string) => void;
  onClose: () => void;
}

export default function ModifierModal({ item, onConfirm, onClose }: ModifierModalProps) {
  const modifiers = item.modifiers ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const selected = useMemo(
    () => modifiers.filter((m) => selectedIds.has(m.id)),
    [modifiers, selectedIds],
  );

  const unitPrice = calcUnitPrice(item.price, selected);

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const lineKey = buildLineKey(item.id, selected);
    onConfirm(selected, unitPrice, lineKey);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-display text-xl">{item.name}</h3>
        <p className="mt-1 text-sm text-neutral-400">Temel fiyat: {item.price} TL</p>

        <div className="mt-5 space-y-2">
          {modifiers.map((mod) => (
            <label
              key={mod.id}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 hover:bg-stone"
            >
              <span className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedIds.has(mod.id)}
                  onChange={() => toggle(mod.id)}
                  className="h-4 w-4 rounded"
                />
                {mod.label}
              </span>
              {mod.priceDelta !== 0 && (
                <span className="text-xs text-neutral-400">
                  {mod.priceDelta > 0 ? '+' : ''}
                  {mod.priceDelta} TL
                </span>
              )}
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
          <span className="text-sm text-neutral-400">Toplam</span>
          <span className="font-medium">{unitPrice} TL</span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-ink py-3 text-sm font-medium text-white"
          >
            Sepete Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
