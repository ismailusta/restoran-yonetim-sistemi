import { v4 as uuidv4 } from 'uuid';
import { sendAdisyonNotification } from './telegram.js';
import { printKitchenAndBar, printCashierReceipt, flushPendingPrintJobs } from './print.js';
import {
  getAllTables,
  getTable,
  addToTable,
  removeFromTable,
  clearTable,
  isValidArea,
  areaLabel,
} from './tables.js';
import { recordSale } from './sales.js';
import { buildCashierReceipt } from './rates.js';

async function broadcastTables(io) {
  const tables = await getAllTables();
  io.emit('tablesUpdated', tables);
}

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Bağlantı: ${socket.id}`);

    socket.on('joinRoom', async ({ room }) => {
      if (room === 'printer_room') {
        socket.join(room);
        console.log(`[Socket] ✓ Print agent bağlandı: ${socket.id}`);
        flushPendingPrintJobs(io);
      }
      if (room === 'waiter_room') {
        socket.join(room);
        const tables = await getAllTables();
        socket.emit('syncTables', tables);
        console.log(`[Socket] Garson ekranı bağlandı: ${socket.id}`);
      }
    });

    socket.on('newOrder', async (order) => {
      const { area, tableNumber, items } = order;

      if (!(await isValidArea(area)) || !tableNumber || !items?.length) return;

      const orderId = uuidv4();
      await addToTable(area, tableNumber, items);
      await printKitchenAndBar(io, { area, tableNumber, items });

      await broadcastTables(io);
      socket.emit('orderConfirmed', { orderId, area, tableNumber });
      console.log(`[Socket] Sipariş — ${await areaLabel(area)} Masa ${tableNumber}`);
    });

    socket.on('removeTableItem', async ({ area, tableNumber, lineKey, removeAll }) => {
      if (!(await isValidArea(area)) || !tableNumber || !lineKey) return;

      await removeFromTable(area, tableNumber, lineKey, { removeAll: !!removeAll });
      await broadcastTables(io);
      console.log(
        `[Socket] Kalem silindi — ${await areaLabel(area)} Masa ${tableNumber}${removeAll ? ' (tümü)' : ''}`,
      );
    });

    socket.on('printAdisyon', async ({ area, tableNumber, currency }) => {
      if (!(await isValidArea(area))) return;

      const table = await getTable(area, tableNumber);

      if (!table || table.items.length === 0) {
        socket.emit('adisyonError', { message: 'Bu masada sipariş yok' });
        return;
      }

      try {
        const receipt = await buildCashierReceipt(table.items, table.total, currency);
        await printCashierReceipt(io, {
          area,
          tableNumber: table.tableNumber,
          siparisler: receipt.siparisler,
          total: receipt.toplamTutar,
          paraBirimi: receipt.paraBirimi,
          birim: receipt.birim,
        });
        await sendAdisyonNotification({
          area: await areaLabel(area),
          tableNumber: table.tableNumber,
          total: receipt.toplamTutar,
          birim: receipt.birim,
        });
        socket.emit('adisyonQueued', { area, tableNumber: table.tableNumber });
        console.log(
          `[Socket] Adisyon — ${await areaLabel(area)} Masa ${tableNumber}, ${receipt.toplamTutar} ${receipt.birim}`,
        );
      } catch (err) {
        socket.emit('adisyonError', {
          message: err.message || 'Adisyon yazdırılamadı',
        });
      }
    });

    socket.on('closeTable', async ({ area, tableNumber }) => {
      if (!(await isValidArea(area))) return;

      const table = await getTable(area, tableNumber);
      if (table?.items?.length > 0) {
        await recordSale({
          area,
          tableNumber: table.tableNumber,
          items: table.items,
          total: table.total,
        });
      }

      await clearTable(area, tableNumber);
      await broadcastTables(io);
      socket.emit('tableClosed', { area, tableNumber });
      console.log(`[Socket] Masa kapatıldı — ${await areaLabel(area)} ${tableNumber}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Ayrıldı: ${socket.id}`);
    });
  });
}
