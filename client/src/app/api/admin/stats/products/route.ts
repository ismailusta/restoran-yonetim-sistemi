import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getProductStats } from '@/lib/stats';
import type { StatsPeriod } from '@/lib/istanbul-date';

const PERIODS: StatsPeriod[] = ['day', 'week', 'month', 'all'];

export async function GET(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const period = new URL(req.url).searchParams.get('period') as StatsPeriod;
  const safe = PERIODS.includes(period) ? period : 'month';

  return NextResponse.json(await getProductStats(safe));
}
