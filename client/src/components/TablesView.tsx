'use client';

import { useCallback, useMemo, useState } from 'react';
import { areaLabel, tableKey, type AreaConfig } from '@/config/tables';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import type { TableState } from '@/types';

interface TablesViewProps {
  areas: AreaConfig[];
  tables: TableState[];
  onPrintAdisyon: (area: string, tableNumber: number, currency: CurrencyCode) => void;
  onCloseTable: (area: string, tableNumber: number) => void;
  onSelectForOrder: (area: string, tableNumber: number) => void;
  printingKey: string | null;
  printedKey: string | null;
}

export default function TablesView({
  areas,
  tables,
  onPrintAdisyon,
  onCloseTable,
  onSelectForOrder,
  printingKey,
  printedKey,
}: TablesViewProps) {
  const [activeArea, setActiveArea] = useState(areas[0]?.id ?? 'teras');
  const [selected, setSelected] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('TRY');

  const areaTables = useMemo(
    () => tables.filter((t) => t.area === activeArea),
    [tables, activeArea],
  );

  const selectedTable = tables.find((t) => tableKey(t.area, t.tableNumber) === selected);

  const handleSelect = useCallback((area: string, tableNumber: number) => {
    setSelected(tableKey(area, tableNumber));
  }, []);

  if (!areas.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        Alan tanımlı değil — Admin panelden ekleyin
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl">Masalar</h2>
            <p className="text-sm text-neutral-400">
              {areaTables.filter((t) => t.status === 'occupied').length} dolu ·{' '}
              {areaTables.filter((t) => t.status === 'empty').length} boş
            </p>
          </div>

          <nav className="flex gap-1 rounded-xl bg-stone p-1">
            {areas.map((a) => {
              const count = tables.filter((t) => t.area === a.id && t.status === 'occupied').length;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setActiveArea(a.id);
                    setSelected(null);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeArea === a.id ? 'bg-white text-ink shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  {a.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-[10px] text-neutral-400">({count})</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {areaTables.map((table) => {
            const key = tableKey(table.area, table.tableNumber);
            const isOccupied = table.status === 'occupied';
            const isSelected = selected === key;

            return (
              <button
                key={key}
                onClick={() => handleSelect(table.area, table.tableNumber)}
                className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-2 transition-all ${
                  isSelected
                    ? 'border-ink bg-ink text-white'
                    : isOccupied
                      ? 'border-ink bg-stone hover:shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <span className="font-display text-2xl">{table.tableNumber}</span>
                {isOccupied ? (
                  <>
                    <span className={`mt-1 text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {table.items.reduce((s, i) => s + i.quantity, 0)} ürün
                    </span>
                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-ink'}`}>
                      {table.total} TL
                    </span>
                  </>
                ) : (
                  <span className={`mt-1 text-[10px] ${isSelected ? 'text-neutral-400' : 'text-neutral-300'}`}>
                    Boş
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="flex w-full flex-col border-t border-neutral-200 bg-white md:w-96 md:border-l md:border-t-0">
        {!selectedTable ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-neutral-300">
            {areaLabel(areas, activeArea)} bölümünden bir masa seçin
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400">
                  {areaLabel(areas, selectedTable.area)}
                </p>
                <h3 className="font-display text-xl">Masa {selectedTable.tableNumber}</h3>
                <p className="text-xs text-neutral-400">
                  {selectedTable.status === 'occupied' ? 'Dolu' : 'Boş'}
                </p>
              </div>
              <button
                onClick={() => onSelectForOrder(selectedTable.area, selectedTable.tableNumber)}
                className="text-xs text-neutral-400 underline hover:text-ink"
              >
                Sipariş ekle
              </button>
            </div>

            <ul className="flex-1 space-y-2 overflow-y-auto px-5 py-3">
              {selectedTable.items.length === 0 ? (
                <li className="py-8 text-center text-sm text-neutral-300">Henüz sipariş yok</li>
              ) : (
                selectedTable.items.map((item) => (
                  <li key={item.lineKey ?? item.id} className="text-sm">
                    <div className="flex justify-between">
                      <span>
                        {item.quantity}× {item.name}
                      </span>
                      <span className="text-neutral-400">{item.price * item.quantity} TL</span>
                    </div>
                    {item.selectedModifiers?.length > 0 && (
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
                <span className="font-medium">{selectedTable.total} TL</span>
              </div>
              <div>
                <label className="text-xs text-neutral-400">Adisyon para birimi</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() =>
                  onPrintAdisyon(selectedTable.area, selectedTable.tableNumber, currency)
                }
                disabled={
                  selectedTable.items.length === 0 ||
                  printingKey === tableKey(selectedTable.area, selectedTable.tableNumber)
                }
                className="w-full rounded-xl border border-neutral-200 py-3 text-sm font-medium transition-colors hover:border-ink disabled:opacity-30"
              >
                {printedKey === tableKey(selectedTable.area, selectedTable.tableNumber)
                  ? '✓ Adisyon yazdırıldı'
                  : printingKey === tableKey(selectedTable.area, selectedTable.tableNumber)
                    ? 'Yazdırılıyor…'
                    : 'Adisyon Yazdır'}
              </button>
              {selectedTable.status === 'occupied' && (
                <button
                  onClick={() => onCloseTable(selectedTable.area, selectedTable.tableNumber)}
                  className="w-full rounded-xl py-3 text-sm text-neutral-400 transition-colors hover:bg-stone hover:text-ink"
                >
                  Masayı Kapat (Ödeme alındı)
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
