'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StatsPeriod } from '@/lib/istanbul-date';

interface ProductStat {
  name: string;
  quantity: number;
  revenue: number;
}

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  day: 'Bugün',
  week: 'Bu Hafta',
  month: 'Bu Ay',
  all: 'Tüm Zamanlar',
};

export default function AdminStatsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [stats, setStats] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/stats/products?period=${period}`);
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    setStats(await res.json());
    setLoading(false);
  }, [period, router]);

  useEffect(() => {
    load();
  }, [load]);

  const totalQty = stats.reduce((s, r) => s + r.quantity, 0);
  const totalRev = stats.reduce((s, r) => s + r.revenue, 0);

  return (
    <div>
      <h1 className="font-display text-2xl">İstatistikler</h1>
      <p className="mt-1 text-sm text-neutral-400">Ürün bazlı satış adetleri ve ciro</p>

      <nav className="mt-6 flex flex-wrap gap-1 rounded-xl bg-stone p-1">
        {(Object.keys(PERIOD_LABELS) as StatsPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p ? 'bg-white text-ink shadow-sm' : 'text-neutral-500'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="mt-8 text-neutral-400">Yükleniyor…</p>
      ) : stats.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-400">
          Bu dönemde satış kaydı yok. Masa kapatıldığında (ödeme alındığında) satışlar kaydedilir.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-400">Toplam satış adedi</p>
              <p className="mt-1 font-display text-2xl">{totalQty}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-400">Toplam ciro</p>
              <p className="mt-1 font-display text-2xl">{totalRev.toLocaleString('tr-TR')} TL</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-stone/50 text-left text-xs text-neutral-400">
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3 text-right">Adet</th>
                  <th className="px-4 py-3 text-right">Ciro</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => (
                  <tr key={row.name} className="border-b border-neutral-50 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-right">{row.quantity}</td>
                    <td className="px-4 py-3 text-right text-neutral-500">
                      {row.revenue.toLocaleString('tr-TR')} TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
