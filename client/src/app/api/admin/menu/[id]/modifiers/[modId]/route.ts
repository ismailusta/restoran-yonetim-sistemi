import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; modId: string }> },
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { modId } = await params;
  const body = await req.json();

  const modifier = await prisma.menuItemModifier.update({
    where: { id: Number(modId) },
    data: {
      ...(body.label != null && { label: String(body.label).trim() }),
      ...(body.priceDelta != null && { priceDelta: Number(body.priceDelta) }),
      ...(body.active != null && { active: Boolean(body.active) }),
    },
  });

  return NextResponse.json(modifier);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; modId: string }> },
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { modId } = await params;
  await prisma.menuItemModifier.delete({ where: { id: Number(modId) } });

  return NextResponse.json({ ok: true });
}
