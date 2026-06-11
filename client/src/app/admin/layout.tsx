import AdminLogout from '@/components/AdminLogout';
import AdminNav from '@/components/AdminNav';
import { getAdminSession } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-stone">
      {session && (
        <header className="border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto flex max-w-5xl min-w-0 items-center gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <AdminNav />
            </div>
            <div className="shrink-0">
              <AdminLogout />
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
