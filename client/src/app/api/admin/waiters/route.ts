import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hashPin, isPinTaken, isValidPin } from '@/lib/waiter-pin';

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const waiters = await prisma.waiterUser.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, active: true, createdAt: true },
  });

  return NextResponse.json(waiters);
}

export async function POST(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { name, pin } = await req.json();
  if (!name?.trim() || !pin) {
    return NextResponse.json({ error: 'İsim ve PIN gerekli' }, { status: 400 });
  }
  if (!isValidPin(String(pin))) {
    return NextResponse.json({ error: 'PIN 4-6 haneli olmalı' }, { status: 400 });
  }
  if (await isPinTaken(String(pin))) {
    return NextResponse.json({ error: 'Bu PIN başka garsonda kullanılıyor' }, { status: 400 });
  }

  const waiter = await prisma.waiterUser.create({
    data: {
      name: String(name).trim(),
      pinHash: await hashPin(String(pin)),
    },
    select: { id: true, name: true, active: true, createdAt: true },
  });

  return NextResponse.json(waiter, { status: 201 });
}
