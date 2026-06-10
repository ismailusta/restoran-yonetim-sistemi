import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Burgerler', items: [{ name: 'Cheeseburger', price: 250, type: 'kitchen' }] },
  {
    name: 'Kahveler',
    items: [
      { name: 'Buzlu Latte', price: 120, type: 'bar' },
      { name: 'Espresso', price: 80, type: 'bar' },
    ],
  },
  { name: 'Pizzalar', items: [{ name: 'Margherita Pizza', price: 320, type: 'kitchen' }] },
  { name: 'Izgaralar', items: [{ name: 'Tavuk Şiş', price: 280, type: 'kitchen' }] },
  { name: 'Kokteyller', items: [{ name: 'Mojito', price: 180, type: 'bar' }] },
  { name: 'Salatalar', items: [{ name: 'Sezar Salata', price: 220, type: 'kitchen' }] },
  {
    name: 'Soğuk İçecekler',
    items: [
      { name: 'Limonata', price: 90, type: 'bar' },
      { name: 'Ayran', price: 50, type: 'bar' },
    ],
  },
  {
    name: 'Yan Ürünler',
    items: [{ name: 'Patates Kızartması', price: 110, type: 'kitchen' }],
  },
];

const areas = [
  { id: 'teras', label: 'Teras', tableCount: 10, sortOrder: 0 },
  { id: 'bahce', label: 'Bahçe', tableCount: 10, sortOrder: 1 },
];

async function main() {
  await prisma.setting.upsert({
    where: { key: 'restaurant_name' },
    update: {},
    create: { key: 'restaurant_name', value: 'PANORAMA RESTORAN' },
  });

  for (const area of areas) {
    await prisma.area.upsert({
      where: { id: area.id },
      update: { label: area.label, tableCount: area.tableCount, sortOrder: area.sortOrder },
      create: area,
    });
  }

  let sortOrder = 0;
  for (const cat of categories) {
    let category = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!category) {
      category = await prisma.category.create({ data: { name: cat.name, sortOrder } });
    } else {
      category = await prisma.category.update({
        where: { id: category.id },
        data: { sortOrder },
      });
    }

    for (const item of cat.items) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      });
      if (!menuItem) {
        menuItem = await prisma.menuItem.create({
          data: { ...item, categoryId: category.id },
        });
      }

      if (item.name === 'Cheeseburger') {
        const burgerMods = [
          { label: 'Soğansız', priceDelta: 0, sortOrder: 0 },
          { label: 'Ekstra peynir', priceDelta: 20, sortOrder: 1 },
          { label: 'Az pişmiş', priceDelta: 0, sortOrder: 2 },
        ];
        for (const mod of burgerMods) {
          const exists = await prisma.menuItemModifier.findFirst({
            where: { menuItemId: menuItem.id, label: mod.label },
          });
          if (!exists) {
            await prisma.menuItemModifier.create({
              data: { menuItemId: menuItem.id, ...mod },
            });
          }
        }
      }
    }
    sortOrder += 1;
  }

  const email = process.env.ADMIN_EMAIL || 'admin@restoran.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const demoPin = process.env.WAITER_DEMO_PIN || '1234';
  const demoPinHash = await bcrypt.hash(demoPin, 10);
  const demoWaiter = await prisma.waiterUser.findFirst({ where: { name: 'Demo Garson' } });
  if (demoWaiter) {
    await prisma.waiterUser.update({
      where: { id: demoWaiter.id },
      data: { pinHash: demoPinHash, active: true },
    });
  } else {
    await prisma.waiterUser.create({
      data: { name: 'Demo Garson', pinHash: demoPinHash },
    });
  }

  console.log('[Seed] Tamamlandı');
  console.log(`[Seed] Admin: ${email}`);
  console.log(`[Seed] Demo garson PIN: ${demoPin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
