'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WaiterLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function appendDigit(digit: string) {
    if (pin.length >= 6) return;
    setPin((p) => p + digit);
    setError('');
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (pin.length < 4) {
      setError('PIN en az 4 hane');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/waiter/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push('/waiter');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Giriş başarısız');
      setPin('');
    }
    setLoading(false);
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <Link href="/" className="text-xs text-neutral-400 hover:text-ink">
          ← Ana sayfa
        </Link>
        <h1 className="mt-4 font-display text-3xl">Garson Girişi</h1>
        <p className="mt-2 text-sm text-neutral-400">PIN kodunuzu girin</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <div className="mb-6 flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full ${
                i < pin.length ? 'bg-ink' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}

        <div className="grid grid-cols-3 gap-3">
          {digits.map((d, i) => {
            if (d === '') return <div key={i} />;
            if (d === '⌫') {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={backspace}
                  className="rounded-2xl border border-neutral-200 py-4 text-lg hover:bg-stone"
                >
                  {d}
                </button>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => appendDigit(d)}
                className="rounded-2xl border border-neutral-200 py-4 text-xl font-medium hover:bg-stone active:scale-95"
              >
                {d}
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          {loading ? 'Giriş…' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}
