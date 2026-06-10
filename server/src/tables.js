import { prisma } from '@restoran/db';
import { itemLineKey } from './cart-line.js';

function calcTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function formatSession(session) {
  const items = Array.isArray(session.items) ? session.items : [];
  return {
    area: session.areaId,
    tableNumber: session.tableNumber,
    items,
    status: items.length > 0 ? 'occupied' : 'empty',
    total: calcTotal(items),
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
          status: 'empty',
          total: 0,
          updatedAt: null,
        });
      }
    }
  }
  return result;
}

export async function getTable(area, tableNumber) {
  const session = await prisma.tableSession.findUnique({
    where: { areaId_tableNumber: { areaId: area, tableNumber: Number(tableNumber) } },
  });

  if (session) return formatSession(session);

  const areaRow = await prisma.area.findUnique({ where: { id: area } });
  if (!areaRow) return null;

  return {
    area,
    tableNumber: Number(tableNumber),
    items: [],
    status: 'empty',
    total: 0,
    updatedAt: null,
  };
}

function mergeItems(existing, incoming) {
  const map = new Map();
  for (const item of [...existing, ...incoming]) {
    const key = itemLineKey(item);
    const prev = map.get(key);
    if (prev) {
      map.set(key, { ...prev, quantity: prev.quantity + item.quantity });
    } else {
      map.set(key, { ...item, lineKey: key });
    }
  }
  return Array.from(map.values());
}

export async function addToTable(area, tableNumber, items) {
  const num = Number(tableNumber);
  const existing = await prisma.tableSession.findUnique({
    where: { areaId_tableNumber: { areaId: area, tableNumber: num } },
  });

  const merged = mergeItems(
    existing && Array.isArray(existing.items) ? existing.items : [],
    items,
  );

  const session = await prisma.tableSession.upsert({
    where: { areaId_tableNumber: { areaId: area, tableNumber: num } },
    update: { items: merged },
    create: { areaId: area, tableNumber: num, items: merged },
  });

  return formatSession(session);
}

export async function clearTable(area, tableNumber) {
  const num = Number(tableNumber);
  await prisma.tableSession.deleteMany({
    where: { areaId: area, tableNumber: num },
  });

  return {
    area,
    tableNumber: num,
    items: [],
    status: 'empty',
    total: 0,
    updatedAt: null,
  };
}

export async function isValidArea(area) {
  const row = await prisma.area.findFirst({ where: { id: area, active: true } });
  return !!row;
}

export async function areaLabel(area) {
  const row = await prisma.area.findUnique({ where: { id: area } });
  return row?.label ?? area;
}
