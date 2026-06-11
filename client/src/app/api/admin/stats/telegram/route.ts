import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const secret = process.env.TELEGRAM_REPORT_SECRET;

  if (!serverUrl || !secret) {
    return NextResponse.json(
      { error: 'TELEGRAM_REPORT_SECRET veya SERVER_URL tanımlı değil' },
      { status: 500 },
    );
  }

  const res = await fetch(`${serverUrl}/api/telegram/daily-report`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error || 'Telegram gönderilemedi' },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true });
}
