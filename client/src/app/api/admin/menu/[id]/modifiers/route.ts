import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const modifiers = await prisma.menuItemModifier.findMany({
    where: { menuItemId: Number(id) },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(modifiers);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const { label, priceDelta } = await req.json();
  if (!label?.trim()) {
    return NextResponse.json({ error: 'Seçenek adı gerekli' }, { status: 400 });
  }

  const max = await prisma.menuItemModifier.aggregate({
    where: { menuItemId: Number(id) },
    _max: { sortOrder: true },
  });

  const modifier = await prisma.menuItemModifier.create({
    data: {
      menuItemId: Number(id),
      label: String(label).trim(),
      priceDelta: Number(priceDelta) || 0,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(modifier, { status: 201 });
}
