import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const [areas, settings] = await Promise.all([
    prisma.area.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.setting.findMany(),
  ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return NextResponse.json({
    areas: areas.map((a) => ({
      id: a.id,
      label: a.label,
      tableCount: a.tableCount,
    })),
    restaurantName: settingsMap.restaurant_name ?? 'RESTORAN',
  });
}
