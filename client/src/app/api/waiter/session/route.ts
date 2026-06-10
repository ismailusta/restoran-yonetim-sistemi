import { NextResponse } from 'next/server';
import { getAdminSession, getWaiterSession } from '@/lib/auth';

export async function GET() {
  const admin = await getAdminSession();
  if (admin) {
    return NextResponse.json({
      role: 'admin',
      name: 'Admin',
      email: admin.email as string,
    });
  }

  const waiter = await getWaiterSession();
  if (!waiter) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  return NextResponse.json({
    role: 'waiter',
    name: waiter.name as string,
    waiterId: waiter.waiterId as string,
  });
}
