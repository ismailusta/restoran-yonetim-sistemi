'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Area {
  id: string;
  label: string;
  tableCount: number;
  active: boolean;
}

export default function AdminAreasPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/areas');
    if (res.status === 401) {
      router.push('/admin/login');
      return;
    }
    setAreas(await res.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(area: Area) {
    await fetch('/api/admin/areas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(area),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Alanlar & Masalar</h1>
      <p className="mt-1 text-sm text-neutral-400">Teras, bahçe ve masa sayılarını düzenle</p>

      <div className="mt-6 space-y-4">
        {areas.map((area) => (
          <div
            key={area.id}
            className="flex flex-wrap items-end gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div>
              <label className="text-xs text-neutral-400">Alan adı</label>
              <input
                value={area.label}
                onChange={(e) =>
                  setAreas((prev) =>
                    prev.map((a) => (a.id === area.id ? { ...a, label: e.target.value } : a)),
                  )
                }
                className="mt-1 block rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Masa sayısı</label>
              <input
                type="number"
                min={1}
                max={50}
                value={area.tableCount}
                onChange={(e) =>
                  setAreas((prev) =>
                    prev.map((a) =>
                      a.id === area.id ? { ...a, tableCount: Number(e.target.value) } : a,
                    ),
                  )
                }
                className="mt-1 block w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => save(area)}
              className="rounded-lg bg-ink px-4 py-2 text-sm text-white"
            >
              Kaydet
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
