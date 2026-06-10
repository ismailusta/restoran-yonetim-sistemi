'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WaiterRow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

interface EditState {
  name: string;
  pin: string;
  active: boolean;
}

export default function AdminWaitersPage() {
  const router = useRouter();
  const [waiters, setWaiters] = useState<WaiterRow[]>([]);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [form, setForm] = useState({ name: '', pin: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2500);
  };

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/waiters');
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    const data: WaiterRow[] = await res.json();
    setWaiters(data);
    setEdits(
      Object.fromEntries(
        data.map((w) => [w.id, { name: w.name, pin: '', active: w.active }]),
      ),
    );
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function addWaiter(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/waiters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Garson eklenemedi');
      return;
    }
    setForm({ name: '', pin: '' });
    flash('Garson eklendi');
    load();
  }

  function updateEdit(id: string, patch: Partial<EditState>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveWaiter(id: string) {
    setError('');
    const edit = edits[id];
    const body: Record<string, unknown> = {
      name: edit.name,
      active: edit.active,
    };
    if (edit.pin) body.pin = edit.pin;

    const res = await fetch(`/api/admin/waiters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Kaydedilemedi');
      return;
    }
    flash('Garson güncellendi');
    load();
  }

  async function deleteWaiter(waiter: WaiterRow) {
    if (!confirm(`"${waiter.name}" garsonunu silmek istediğinize emin misiniz?`)) return;
    setError('');
    const res = await fetch(`/api/admin/waiters/${waiter.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Silinemedi');
      return;
    }
    flash('Garson silindi');
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Garsonlar</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Garson ekle, PIN güncelle veya hesabı pasif yap
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      <form
        onSubmit={addWaiter}
        className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
      >
        <input
          placeholder="Garson adı"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          required
        />
        <input
          placeholder="PIN (4-6 hane)"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          value={form.pin}
          onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
          className="w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          required
        />
        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm text-white">
          Garson Ekle
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {waiters.map((waiter) => {
          const edit = edits[waiter.id];
          if (!edit) return null;
          return (
            <div
              key={waiter.id}
              className={`rounded-xl border border-neutral-200 bg-white p-4 ${
                !edit.active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[140px] flex-1">
                  <label className="text-xs text-neutral-400">Ad</label>
                  <input
                    value={edit.name}
                    onChange={(e) => updateEdit(waiter.id, { name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Yeni PIN (opsiyonel)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    value={edit.pin}
                    onChange={(e) =>
                      updateEdit(waiter.id, {
                        pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                      })
                    }
                    className="mt-1 w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={edit.active}
                    onChange={(e) => updateEdit(waiter.id, { active: e.target.checked })}
                  />
                  Aktif
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => saveWaiter(waiter.id)}
                  className="rounded-lg bg-ink px-3 py-1.5 text-xs text-white"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => deleteWaiter(waiter)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Sil
                </button>
              </div>
            </div>
          );
        })}
        {waiters.length === 0 && (
          <p className="text-sm text-neutral-400">Henüz garson yok. Yukarıdan ekleyin.</p>
        )}
      </div>
    </div>
  );
}
