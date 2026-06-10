import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const items = await prisma.menuItem.findMany({
    include: {
      category: true,
      modifiers: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: [{ category: { sortOrder: 'asc' } }, { id: 'asc' }],
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { name, price, type, categoryId } = await req.json();
  if (!name?.trim() || price == null || price === '' || !type || !categoryId) {
    return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: { name, price: Number(price), type, categoryId: Number(categoryId) },
    include: { category: true },
  });

  return NextResponse.json(item, { status: 201 });
}
