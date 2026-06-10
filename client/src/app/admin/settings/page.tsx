'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CurrencyCode } from '@/lib/currency';

interface TcmbRates {
  EUR: number | null;
  USD: number | null;
  GBP: number | null;
  fetchedAt: string;
}

const FOREX_ROWS: { code: Exclude<CurrencyCode, 'TRY'>; label: string }[] = [
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'Dolar (USD)' },
  { code: 'GBP', label: 'Sterlin (GBP)' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');
  const [rates, setRates] = useState({ EUR: '', USD: '', GBP: '' });
  const [tcmb, setTcmb] = useState<TcmbRates | null>(null);
  const [tcmbError, setTcmbError] = useState('');
  const [tcmbLoading, setTcmbLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadTcmb = useCallback(async () => {
    setTcmbLoading(true);
    setTcmbError('');
    const res = await fetch('/api/admin/rates/live');
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      setTcmbError(data.error || 'TCMB kurları alınamadı');
      setTcmbLoading(false);
      return;
    }
    setTcmb(await res.json());
    setTcmbLoading(false);
  }, [router]);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/settings');
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    const data = await res.json();
    setRestaurantName(data.restaurant_name ?? '');
    setRates({
      EUR: data.rate_eur ?? '',
      USD: data.rate_usd ?? '',
      GBP: data.rate_gbp ?? '',
    });
  }, [router]);

  useEffect(() => {
    load();
    loadTcmb();
  }, [load, loadTcmb]);

  function copyFromTcmb(code: Exclude<CurrencyCode, 'TRY'>) {
    const value = tcmb?.[code];
    if (value == null) return;
    setRates((prev) => ({ ...prev, [code]: String(value) }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_name: restaurantName,
        rate_eur: rates.EUR,
        rate_usd: rates.USD,
        rate_gbp: rates.GBP,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tcmbTime = tcmb?.fetchedAt
    ? new Date(tcmb.fetchedAt).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div>
      <h1 className="font-display text-2xl">Ayarlar</h1>

      <form onSubmit={save} className="mt-6 max-w-lg space-y-8">
        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
          <div>
            <label className="text-xs text-neutral-400">Restoran adı (fiş başlığı)</label>
            <input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Döviz kurları (adisyon)</h2>
              <p className="mt-1 text-xs text-neutral-400">
                Fişte kullanılacak kurlar — siz belirlersiniz. TCMB sadece referans.
              </p>
            </div>
            <button
              type="button"
              onClick={loadTcmb}
              disabled={tcmbLoading}
              className="text-xs text-neutral-400 hover:text-ink disabled:opacity-40"
            >
              {tcmbLoading ? 'Yükleniyor…' : 'TCMB yenile'}
            </button>
          </div>

          {tcmbError && (
            <p className="text-sm text-red-600">{tcmbError}</p>
          )}
          {tcmbTime && !tcmbError && (
            <p className="text-[11px] text-neutral-400">
              TCMB efektif satış · {tcmbTime}
            </p>
          )}

          <div className="space-y-4">
            {FOREX_ROWS.map(({ code, label }) => {
              const market = tcmb?.[code];
              const manual = rates[code];
              const diff =
                market && manual && Number(manual) > 0
                  ? Number(manual) - market
                  : null;

              return (
                <div key={code} className="rounded-xl border border-neutral-100 bg-stone/30 p-4">
                  <p className="text-sm font-medium">{label}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-neutral-400">TCMB (referans)</label>
                      <p className="mt-1 text-sm text-neutral-500">
                        {market != null ? `${market.toFixed(4)} ₺` : '—'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400">Sizin kurunuz (fişte)</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          min={0}
                          value={manual}
                          onChange={(e) =>
                            setRates((prev) => ({ ...prev, [code]: e.target.value }))
                          }
                          placeholder="0.00"
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                        />
                        {market != null && (
                          <button
                            type="button"
                            onClick={() => copyFromTcmb(code)}
                            className="shrink-0 rounded-lg border border-neutral-200 px-2 text-xs hover:bg-white"
                            title="TCMB kurunu kopyala"
                          >
                            Kopyala
                          </button>
                        )}
                      </div>
                      {diff != null && (
                        <p className="mt-1 text-[10px] text-neutral-400">
                          TCMB&apos;den {diff >= 0 ? '+' : ''}
                          {diff.toFixed(2)} ₺
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm text-white">
          {saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>
      </form>
    </div>
  );
}
