'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HorizontalScrollTabs from '@/components/HorizontalScrollTabs';
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
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState('');

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

  async function sendTelegramReport() {
    setTelegramSending(true);
    setTelegramMsg('');
    const res = await fetch('/api/admin/stats/telegram', { method: 'POST' });
    if (res.ok) {
      setTelegramMsg('Günlük rapor Telegram\'a gönderildi');
    } else {
      const data = await res.json();
      setTelegramMsg(data.error || 'Gönderilemedi');
    }
    setTelegramSending(false);
    setTimeout(() => setTelegramMsg(''), 3000);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">İstatistikler</h1>
          <p className="mt-1 text-sm text-neutral-400">Ürün bazlı satış adetleri ve ciro</p>
        </div>
        <button
          type="button"
          onClick={sendTelegramReport}
          disabled={telegramSending}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm hover:border-ink disabled:opacity-50"
        >
          {telegramSending ? 'Gönderiliyor…' : 'Telegram\'a günlük rapor gönder'}
        </button>
      </div>
      {telegramMsg && (
        <p className="mt-3 text-sm text-neutral-600">{telegramMsg}</p>
      )}

      <HorizontalScrollTabs
        className="mt-6 rounded-xl bg-stone p-1"
        innerClassName="gap-1"
        fade="stone"
      >
        {(Object.keys(PERIOD_LABELS) as StatsPeriod[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`flex-none whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p ? 'bg-white text-ink shadow-sm' : 'text-neutral-500 active:bg-white/60'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </HorizontalScrollTabs>

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
