import { redirect } from 'next/navigation';
import { getAdminSession, getWaiterSession } from '@/lib/auth';

export default async function WaiterMainLayout({ children }: { children: React.ReactNode }) {
  const [admin, waiter] = await Promise.all([getAdminSession(), getWaiterSession()]);
  if (!admin && !waiter) redirect('/waiter/login');
  return <>{children}</>;
}
