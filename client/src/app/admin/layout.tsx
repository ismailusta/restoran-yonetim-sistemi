import Link from 'next/link';
import AdminLogout from '@/components/AdminLogout';
import { getAdminSession } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return (
    <div className="min-h-dvh bg-stone">
      {session && (
        <header className="border-b border-neutral-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <nav className="flex gap-6 text-sm">
              <Link href="/admin" className="font-medium hover:text-ink">
                Panel
              </Link>
              <Link href="/admin/menu" className="text-neutral-500 hover:text-ink">
                Menü
              </Link>
              <Link href="/admin/waiters" className="text-neutral-500 hover:text-ink">
                Garsonlar
              </Link>
              <Link href="/admin/stats" className="text-neutral-500 hover:text-ink">
                İstatistikler
              </Link>
              <Link href="/admin/areas" className="text-neutral-500 hover:text-ink">
                Alanlar
              </Link>
              <Link href="/admin/settings" className="text-neutral-500 hover:text-ink">
                Ayarlar
              </Link>
            </nav>
            <AdminLogout />
          </div>
        </header>
      )}
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
