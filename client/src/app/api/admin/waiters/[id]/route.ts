import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hashPin, isPinTaken, isValidPin } from '@/lib/waiter-pin';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: { name?: string; active?: boolean; pinHash?: string } = {};

  if (body.name != null) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 });
    data.name = name;
  }
  if (body.active != null) data.active = Boolean(body.active);
  if (body.pin != null && body.pin !== '') {
    if (!isValidPin(String(body.pin))) {
      return NextResponse.json({ error: 'PIN 4-6 haneli olmalı' }, { status: 400 });
    }
    if (await isPinTaken(String(body.pin), id)) {
      return NextResponse.json({ error: 'Bu PIN başka garsonda kullanılıyor' }, { status: 400 });
    }
    data.pinHash = await hashPin(String(body.pin));
  }

  const waiter = await prisma.waiterUser.update({
    where: { id },
    data,
    select: { id: true, name: true, active: true, createdAt: true },
  });

  return NextResponse.json(waiter);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  await prisma.waiterUser.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
