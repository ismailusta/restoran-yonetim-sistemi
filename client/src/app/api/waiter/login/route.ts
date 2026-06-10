import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { WAITER_COOKIE, signWaiterToken } from '@/lib/auth';
import { isValidPin } from '@/lib/waiter-pin';

export async function POST(req: Request) {
  const { pin } = await req.json();

  if (!isValidPin(String(pin ?? ''))) {
    return NextResponse.json({ error: 'PIN 4-6 haneli olmalı' }, { status: 400 });
  }

  const waiters = await prisma.waiterUser.findMany({ where: { active: true } });
  let matched: (typeof waiters)[0] | null = null;

  for (const waiter of waiters) {
    if (await bcrypt.compare(String(pin), waiter.pinHash)) {
      matched = waiter;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Geçersiz PIN' }, { status: 401 });
  }

  const token = await signWaiterToken(matched.id, matched.name);
  const res = NextResponse.json({ ok: true, name: matched.name });
  res.cookies.set(WAITER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(WAITER_COOKIE);
  return res;
}
