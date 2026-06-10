import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getRevenueSummary } from '@/lib/stats';

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }
  return NextResponse.json(await getRevenueSummary());
}
