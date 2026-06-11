import { prisma } from '@restoran/db';
import { periodStart } from './istanbul-date.js';

async function sumRevenueSince(since) {
  const result = await prisma.sale.aggregate({
    where: since ? { createdAt: { gte: since } } : undefined,
    _sum: { total: true },
    _count: true,
  });
  return {
    total: result._sum.total ?? 0,
    count: result._count,
  };
}

export async function getRevenueSummary() {
  const [daily, weekly, monthly] = await Promise.all([
    sumRevenueSince(periodStart('day')),
    sumRevenueSince(periodStart('week')),
    sumRevenueSince(periodStart('month')),
  ]);
  return { daily, weekly, monthly };
}

export async function getProductStats(period = 'day') {
  const since = periodStart(period);
  const sales = await prisma.sale.findMany({
    where: since ? { createdAt: { gte: since } } : undefined,
    select: { items: true },
  });

  const map = new Map();

  for (const sale of sales) {
    const items = sale.items;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const name = item.name ?? 'Bilinmeyen';
      const qty = item.quantity ?? 1;
      const lineRevenue = (item.price ?? 0) * qty;
      const prev = map.get(name) ?? { name, quantity: 0, revenue: 0 };
      map.set(name, {
        name,
        quantity: prev.quantity + qty,
        revenue: prev.revenue + lineRevenue,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.quantity - a.quantity);
}

export async function getDailyReportData() {
  const [revenue, topProducts] = await Promise.all([
    getRevenueSummary(),
    getProductStats('day'),
  ]);
  return { revenue, topProducts };
}
