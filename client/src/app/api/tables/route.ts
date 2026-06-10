import { NextResponse } from 'next/server';
import { getAdminSession, getWaiterSession } from '@/lib/auth';
import { getAllTables } from '@/lib/tables';

export async function GET() {
  const [waiter, admin] = await Promise.all([getWaiterSession(), getAdminSession()]);
  if (!waiter && !admin) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  return NextResponse.json(await getAllTables());
}
