import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const category = await prisma.category.update({
    where: { id: Number(id) },
    data: {
      ...(body.name != null && { name: String(body.name).trim() }),
      ...(body.active != null && { active: Boolean(body.active) }),
      ...(body.sortOrder != null && { sortOrder: Number(body.sortOrder) }),
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = Number(id);

  const count = await prisma.menuItem.count({ where: { categoryId } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Bu kategoride ${count} ürün var. Önce ürünleri silin veya taşıyın.` },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true });
}
