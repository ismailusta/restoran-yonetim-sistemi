import { prisma } from '@restoran/db';

export async function recordSale({ area, tableNumber, items, total }) {
  if (!items?.length || total <= 0) return null;

  return prisma.sale.create({
    data: {
      areaId: area,
      tableNumber: Number(tableNumber),
      total: Number(total),
      items,
    },
  });
}
