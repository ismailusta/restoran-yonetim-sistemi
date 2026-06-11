import { areaLabel } from './tables.js';

const pendingJobs = [];
const MAX_PENDING = 50;

function mapItems(items) {
  return items.map((item) => ({
    isim: item.name,
    adet: item.quantity,
    fiyat: item.price,
    secenekler: (item.selectedModifiers ?? []).map((m) => m.label),
  }));
}

function hasPrinterConnected(io) {
  const room = io.sockets.adapter.rooms.get('printer_room');
  return Boolean(room?.size);
}

function deliverJob(io, job) {
  io.to('printer_room').emit('printJob', job);
}

export function flushPendingPrintJobs(io) {
  if (!hasPrinterConnected(io) || pendingJobs.length === 0) return;

  const jobs = pendingJobs.splice(0, pendingJobs.length);
  for (const job of jobs) {
    deliverJob(io, job);
    console.log(`[Print] Kuyruktan gönderildi — ${job.target}, Masa ${job.masaNo}`);
  }
}

export async function emitPrintJob(io, job) {
  const alan = job.area ? await areaLabel(job.area) : job.alan;
  const payload = {
    ...job,
    alan,
    createdAt: job.createdAt || new Date().toISOString(),
  };

  if (hasPrinterConnected(io)) {
    deliverJob(io, payload);
    return;
  }

  if (pendingJobs.length >= MAX_PENDING) {
    const dropped = pendingJobs.shift();
    console.warn(
      `[Print] Kuyruk dolu — atıldı: ${dropped?.target}, Masa ${dropped?.masaNo}`,
    );
  }

  pendingJobs.push(payload);
  console.log(
    `[Print] Yazıcı henüz bağlı değil — kuyruğa alındı (${pendingJobs.length})`,
  );
}

export async function printKitchenAndBar(io, { area, tableNumber, items }) {
  const kitchenItems = items.filter((i) => i.type === 'kitchen');
  const barItems = items.filter((i) => i.type === 'bar');

  if (kitchenItems.length > 0) {
    await emitPrintJob(io, {
      target: 'kitchen',
      area,
      masaNo: tableNumber,
      siparisler: mapItems(kitchenItems),
    });
  }

  if (barItems.length > 0) {
    await emitPrintJob(io, {
      target: 'bar',
      area,
      masaNo: tableNumber,
      siparisler: mapItems(barItems),
    });
  }
}

export async function printCashierReceipt(io, {
  area,
  tableNumber,
  siparisler,
  total,
  paraBirimi,
  birim,
}) {
  await emitPrintJob(io, {
    target: 'cashier',
    area,
    masaNo: tableNumber,
    siparisler,
    toplamTutar: total,
    paraBirimi: paraBirimi || 'TRY',
    birim: birim || 'TL',
  });
}
