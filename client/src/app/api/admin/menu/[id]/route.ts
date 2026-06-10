import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const item = await prisma.menuItem.update({
    where: { id: Number(id) },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.price != null && { price: Number(body.price) }),
      ...(body.type != null && { type: body.type }),
      ...(body.categoryId != null && { categoryId: Number(body.categoryId) }),
      ...(body.active != null && { active: Boolean(body.active) }),
    },
    include: { category: true },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  await prisma.menuItem.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
