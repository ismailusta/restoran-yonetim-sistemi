import { prisma } from '@/lib/db';

function calcTotal(items: { price: number; quantity: number }[]) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function formatSession(session: {
  areaId: string;
  tableNumber: number;
  items: unknown;
  updatedAt: Date;
}) {
  const items = Array.isArray(session.items) ? session.items : [];
  return {
    area: session.areaId,
    tableNumber: session.tableNumber,
    items,
    status: items.length > 0 ? ('occupied' as const) : ('empty' as const),
    total: calcTotal(items as { price: number; quantity: number }[]),
    updatedAt: session.updatedAt?.toISOString() ?? null,
  };
}

export async function getAllTables() {
  const areas = await prisma.area.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  const sessions = await prisma.tableSession.findMany();
  const sessionMap = new Map(
    sessions.map((s) => [`${s.areaId}:${s.tableNumber}`, s]),
  );

  const result = [];
  for (const area of areas) {
    for (let n = 1; n <= area.tableCount; n++) {
      const session = sessionMap.get(`${area.id}:${n}`);
      if (session) {
        result.push(formatSession(session));
      } else {
        result.push({
          area: area.id,
          tableNumber: n,
          items: [],
          status: 'empty' as const,
          total: 0,
          updatedAt: null,
        });
      }
    }
  }
  return result;
}
