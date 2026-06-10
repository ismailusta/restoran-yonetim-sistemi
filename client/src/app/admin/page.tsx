import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { getRevenueSummary } from '@/lib/stats';

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const revenue = await getRevenueSummary();

  const links = [
    { href: '/admin/menu', label: 'Menü Yönetimi', desc: 'Ürün ekle, fiyat güncelle' },
    { href: '/admin/waiters', label: 'Garsonlar', desc: 'PIN ile giriş, ekle / güncelle / sil' },
    { href: '/admin/areas', label: 'Alanlar & Masalar', desc: 'Teras, bahçe, masa sayısı' },
    { href: '/admin/settings', label: 'Ayarlar', desc: 'Restoran adı, fiş başlığı' },
    { href: '/admin/stats', label: 'İstatistikler', desc: 'Ürün satışları ve ciro detayı' },
    { href: '/waiter', label: 'Garson Ekranı', desc: 'Sipariş ekranını aç' },
  ];

  const cards = [
    { label: 'Günlük', total: revenue.daily.total, count: revenue.daily.count, sub: 'Bugün' },
    { label: 'Haftalık', total: revenue.weekly.total, count: revenue.weekly.count, sub: 'Bu hafta' },
    { label: 'Aylık', total: revenue.monthly.total, count: revenue.monthly.count, sub: 'Bu ay' },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Yönetim Paneli</h1>
      <p className="mt-2 text-neutral-400">Hoş geldin, {session.email as string}</p>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Toplam Bakiye</h2>
          <Link href="/admin/stats" className="text-xs text-neutral-400 hover:text-ink">
            İstatistikler →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-neutral-200 bg-white p-5"
            >
              <p className="text-xs text-neutral-400">{c.sub}</p>
              <p className="mt-1 font-display text-2xl">
                {c.total.toLocaleString('tr-TR')} TL
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                {c.count} masa kapatıldı
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-neutral-400">
          Ödeme alındığında (masa kapat) satışlar kaydedilir · Saat dilimi: İstanbul
        </p>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-ink hover:shadow-sm"
          >
            <p className="font-medium">{l.label}</p>
            <p className="mt-1 text-sm text-neutral-400">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
