import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { fetchTcmbRates } from '@/lib/tcmb';

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const rates = await fetchTcmbRates();
    return NextResponse.json(rates);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TCMB hatası';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
