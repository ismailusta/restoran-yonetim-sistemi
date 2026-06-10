import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-16 text-center">
        <h1 className="font-display text-5xl tracking-tight">Restoran POS</h1>
        <p className="mt-3 text-neutral-400">Sipariş & termal yazıcı sistemi</p>
      </div>

      <div className="grid w-full max-w-lg gap-4">
        <Link
          href="/waiter/login"
          className="group flex items-center justify-between rounded-2xl border border-neutral-200 px-8 py-6 transition-all hover:border-ink hover:shadow-sm"
        >
          <div>
            <p className="text-lg font-medium">Garson Ekranı</p>
            <p className="text-sm text-neutral-400">Sipariş al, gönder, adisyon yazdır</p>
          </div>
          <span className="text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-ink">
            →
          </span>
        </Link>
        <Link
          href="/admin"
          className="group flex items-center justify-between rounded-2xl border border-neutral-200 px-8 py-6 transition-all hover:border-ink hover:shadow-sm"
        >
          <div>
            <p className="text-lg font-medium">Admin Panel</p>
            <p className="text-sm text-neutral-400">Menü, alanlar ve ayarlar</p>
          </div>
          <span className="text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-ink">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
