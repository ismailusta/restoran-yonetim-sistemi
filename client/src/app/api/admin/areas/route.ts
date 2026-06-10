import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const areas = await prisma.area.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json(areas);
}

export async function PUT(req: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id, label, tableCount, active } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

  const area = await prisma.area.update({
    where: { id },
    data: {
      ...(label != null && { label }),
      ...(tableCount != null && { tableCount: Number(tableCount) }),
      ...(active != null && { active: Boolean(active) }),
    },
  });

  return NextResponse.json(area);
}
