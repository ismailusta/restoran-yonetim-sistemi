import { areaLabel } from './tables.js';

function mapItems(items) {
  return items.map((item) => ({
    isim: item.name,
    adet: item.quantity,
    fiyat: item.price,
    secenekler: (item.selectedModifiers ?? []).map((m) => m.label),
  }));
}

export async function emitPrintJob(io, job) {
  const alan = job.area ? await areaLabel(job.area) : job.alan;
  io.to('printer_room').emit('printJob', {
    ...job,
    alan,
    createdAt: job.createdAt || new Date().toISOString(),
  });
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
