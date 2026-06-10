'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  name: string;
  active: boolean;
  _count?: { items: number };
}

interface ItemModifier {
  id: number;
  label: string;
  priceDelta: number;
  active: boolean;
}

interface MenuRow {
  id: number;
  name: string;
  price: number;
  type: string;
  active: boolean;
  categoryId: number;
  category: { id: number; name: string };
  modifiers?: ItemModifier[];
}

const emptyProductForm = {
  name: '',
  price: '',
  type: 'kitchen',
  categoryId: '',
};

export default function AdminMenuPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expandedModifiers, setExpandedModifiers] = useState<number | null>(null);
  const [modForm, setModForm] = useState({ label: '', priceDelta: '0' });
  const [modEdits, setModEdits] = useState<Record<number, { label: string; priceDelta: string }>>(
    {},
  );

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2500);
  };

  const load = useCallback(async () => {
    const [menuRes, catRes] = await Promise.all([
      fetch('/api/admin/menu'),
      fetch('/api/admin/categories'),
    ]);
    if (menuRes.status === 401 || catRes.status === 401) {
      router.push('/admin/login');
      return;
    }
    const cats: Category[] = await catRes.json();
    const menu: MenuRow[] = await menuRes.json();
    setCategories(cats);
    const rows = menu.map((item) => ({
      ...item,
      categoryId: item.category?.id ?? item.categoryId,
      modifiers: item.modifiers ?? [],
    }));
    setItems(rows);
    setModEdits(
      Object.fromEntries(
        rows.flatMap((item) =>
          (item.modifiers ?? []).map((m) => [
            m.id,
            { label: m.label, priceDelta: String(m.priceDelta) },
          ]),
        ),
      ),
    );
    setProductForm((f) => ({
      ...f,
      categoryId: f.categoryId || (cats[0] ? String(cats[0].id) : ''),
    }));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Kategori eklenemedi');
      return;
    }
    setCategoryName('');
    flash('Kategori eklendi');
    load();
  }

  async function saveCategory(cat: Category) {
    setError('');
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cat.name }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Kategori kaydedilemedi');
      return;
    }
    flash('Kategori kaydedildi');
    load();
  }

  async function deleteCategory(cat: Category) {
    if (!confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    setError('');
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Kategori silinemedi');
      return;
    }
    flash('Kategori silindi');
    load();
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: productForm.name.trim(),
        price: Number(productForm.price),
        type: productForm.type,
        categoryId: Number(productForm.categoryId),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ürün eklenemedi');
      return;
    }
    setProductForm({
      ...emptyProductForm,
      categoryId: productForm.categoryId,
    });
    flash('Ürün eklendi');
    load();
  }

  function updateItem(id: number, patch: Partial<MenuRow>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function saveProduct(item: MenuRow) {
    setError('');
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: item.name.trim(),
        price: Number(item.price),
        type: item.type,
        categoryId: Number(item.categoryId),
        active: item.active,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Ürün kaydedilemedi');
      return;
    }
    flash('Ürün kaydedildi');
    load();
  }

  async function toggleActive(item: MenuRow) {
    setError('');
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !item.active }),
    });
    if (!res.ok) {
      setError('Durum güncellenemedi');
      return;
    }
    load();
  }

  async function addModifier(itemId: number, e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/admin/menu/${itemId}/modifiers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: modForm.label.trim(),
        priceDelta: Number(modForm.priceDelta) || 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Seçenek eklenemedi');
      return;
    }
    setModForm({ label: '', priceDelta: '0' });
    flash('Seçenek eklendi');
    load();
  }

  async function saveModifier(itemId: number, modId: number) {
    setError('');
    const edit = modEdits[modId];
    const res = await fetch(`/api/admin/menu/${itemId}/modifiers/${modId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: edit.label.trim(),
        priceDelta: Number(edit.priceDelta) || 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Seçenek kaydedilemedi');
      return;
    }
    flash('Seçenek kaydedildi');
    load();
  }

  async function deleteModifier(itemId: number, mod: ItemModifier) {
    if (!confirm(`"${mod.label}" seçeneğini silmek istediğinize emin misiniz?`)) return;
    setError('');
    const res = await fetch(`/api/admin/menu/${itemId}/modifiers/${mod.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      setError('Seçenek silinemedi');
      return;
    }
    flash('Seçenek silindi');
    load();
  }

  async function deleteProduct(item: MenuRow) {
    if (!confirm(`"${item.name}" ürününü kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    setError('');
    const res = await fetch(`/api/admin/menu/${item.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Ürün silinemedi');
      return;
    }
    flash('Ürün silindi');
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Menü & Kategoriler</h1>
      <p className="mt-1 text-sm text-neutral-400">Kategori ekle, ürün fiyatını güncelle veya sil</p>

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

      <section className="mt-8">
        <h2 className="text-lg font-medium">Kategoriler</h2>

        <form
          onSubmit={addCategory}
          className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
        >
          <input
            placeholder="Yeni kategori adı"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm text-white">
            Kategori Ekle
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
            >
              <input
                value={cat.name}
                onChange={(e) =>
                  setCategories((prev) =>
                    prev.map((c) => (c.id === cat.id ? { ...c, name: e.target.value } : c)),
                  )
                }
                className="min-w-[160px] flex-1 rounded-lg border border-neutral-200 px-3 py-2"
              />
              <span className="text-xs text-neutral-400">
                {cat._count?.items ?? 0} ürün
              </span>
              <button
                onClick={() => saveCategory(cat)}
                className="rounded-lg bg-ink px-3 py-1.5 text-xs text-white"
              >
                Kaydet
              </button>
              <button
                onClick={() => deleteCategory(cat)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Sil
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-neutral-400">Henüz kategori yok. Yukarıdan ekleyin.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Ürünler</h2>

        <form
          onSubmit={addProduct}
          className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
        >
          <input
            placeholder="Ürün adı"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Fiyat"
            type="number"
            min={0}
            value={productForm.price}
            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            required
          />
          <select
            value={productForm.type}
            onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="kitchen">Mutfak</option>
            <option value="bar">Bar</option>
          </select>
          <select
            value={productForm.categoryId}
            onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={categories.length === 0}
            className="rounded-lg bg-ink px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Ürün Ekle
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border border-neutral-200 bg-white p-4 text-sm ${
                !item.active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[140px] flex-1">
                  <label className="text-xs text-neutral-400">Ürün adı</label>
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Fiyat (TL)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) => updateItem(item.id, { price: Number(e.target.value) })}
                    className="mt-1 w-24 rounded-lg border border-neutral-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Yazıcı</label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(item.id, { type: e.target.value })}
                    className="mt-1 block rounded-lg border border-neutral-200 px-3 py-2"
                  >
                    <option value="kitchen">Mutfak</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Kategori</label>
                  <select
                    value={item.categoryId}
                    onChange={(e) => updateItem(item.id, { categoryId: Number(e.target.value) })}
                    className="mt-1 block rounded-lg border border-neutral-200 px-3 py-2"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => saveProduct(item)}
                  className="rounded-lg bg-ink px-3 py-1.5 text-xs text-white"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => toggleActive(item)}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"
                >
                  {item.active ? 'Pasif yap' : 'Aktif yap'}
                </button>
                <button
                  onClick={() => deleteProduct(item)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Sil
                </button>
                <button
                  onClick={() =>
                    setExpandedModifiers((prev) => (prev === item.id ? null : item.id))
                  }
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"
                >
                  Seçenekler ({item.modifiers?.length ?? 0})
                </button>
              </div>

              {expandedModifiers === item.id && (
                <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-stone/50 p-4">
                  <p className="text-xs font-medium text-neutral-500">
                    Siparişte checkbox olarak sorulacak seçenekler
                  </p>

                  <form
                    onSubmit={(e) => addModifier(item.id, e)}
                    className="mt-3 flex flex-wrap gap-2"
                  >
                    <input
                      placeholder="Seçenek adı (ör. Soğansız)"
                      value={modForm.label}
                      onChange={(e) => setModForm({ ...modForm, label: e.target.value })}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      required
                    />
                    <input
                      placeholder="Fiyat farkı"
                      type="number"
                      value={modForm.priceDelta}
                      onChange={(e) => setModForm({ ...modForm, priceDelta: e.target.value })}
                      className="w-28 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-ink px-3 py-2 text-xs text-white"
                    >
                      Seçenek Ekle
                    </button>
                  </form>

                  <div className="mt-3 space-y-2">
                    {(item.modifiers ?? []).map((mod) => (
                      <div
                        key={mod.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2"
                      >
                        <input
                          value={modEdits[mod.id]?.label ?? mod.label}
                          onChange={(e) =>
                            setModEdits((prev) => ({
                              ...prev,
                              [mod.id]: {
                                ...prev[mod.id],
                                label: e.target.value,
                                priceDelta:
                                  prev[mod.id]?.priceDelta ?? String(mod.priceDelta),
                              },
                            }))
                          }
                          className="min-w-[120px] flex-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
                        />
                        <input
                          type="number"
                          value={modEdits[mod.id]?.priceDelta ?? String(mod.priceDelta)}
                          onChange={(e) =>
                            setModEdits((prev) => ({
                              ...prev,
                              [mod.id]: {
                                label: prev[mod.id]?.label ?? mod.label,
                                priceDelta: e.target.value,
                              },
                            }))
                          }
                          className="w-24 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
                          placeholder="Fiyat +"
                        />
                        <span className="text-[10px] text-neutral-400">TL fark</span>
                        <button
                          onClick={() => saveModifier(item.id, mod.id)}
                          className="rounded-lg bg-ink px-2 py-1 text-xs text-white"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => deleteModifier(item.id, mod)}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                    {(item.modifiers ?? []).length === 0 && (
                      <p className="text-xs text-neutral-400">Henüz seçenek yok.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-neutral-400">Henüz ürün yok. Yukarıdan ekleyin.</p>
          )}
        </div>
      </section>
    </div>
  );
}
