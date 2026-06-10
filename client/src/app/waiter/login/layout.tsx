import { redirect } from 'next/navigation';
import { getAdminSession, getWaiterSession } from '@/lib/auth';

export default async function WaiterLoginLayout({ children }: { children: React.ReactNode }) {
  const [admin, waiter] = await Promise.all([getAdminSession(), getWaiterSession()]);
  if (admin || waiter) redirect('/waiter');
  return <>{children}</>;
}
