import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const items = await prisma.menuItem.findMany({
    where: { active: true },
    include: {
      category: true,
      modifiers: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ category: { sortOrder: 'asc' } }, { id: 'asc' }],
  });

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      type: i.type,
      category: i.category.name,
      modifiers: i.modifiers.map((m) => ({
        id: m.id,
        label: m.label,
        priceDelta: m.priceDelta,
      })),
    })),
  );
}
