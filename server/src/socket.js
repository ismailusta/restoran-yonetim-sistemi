import { v4 as uuidv4 } from 'uuid';
import { addTicket, removeTicket, getTickets } from './store.js';
import { sendOrderNotification } from './telegram.js';

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Bağlantı: ${socket.id}`);

    socket.on('joinRoom', ({ room }) => {
      if (room === 'kitchen_room' || room === 'bar_room') {
        socket.join(room);
        const station = room === 'kitchen_room' ? 'kitchen' : 'bar';
        const tickets = getTickets(station);
        socket.emit('syncTickets', tickets);
        console.log(`[Socket] ${socket.id} → ${room}`);
      }
    });

    socket.on('newOrder', async (order) => {
      const { tableNumber, items, total } = order;

      if (!tableNumber || !items?.length) return;

      const orderId = uuidv4();
      const createdAt = new Date().toISOString();

      const kitchenItems = items.filter((i) => i.type === 'kitchen');
      const barItems = items.filter((i) => i.type === 'bar');

      if (kitchenItems.length > 0) {
        const ticket = addTicket('kitchen', {
          id: uuidv4(),
          orderId,
          tableNumber,
          items: kitchenItems,
          createdAt,
        });
        io.to('kitchen_room').emit('kitchenTicket', ticket);
      }

      if (barItems.length > 0) {
        const ticket = addTicket('bar', {
          id: uuidv4(),
          orderId,
          tableNumber,
          items: barItems,
          createdAt,
        });
        io.to('bar_room').emit('barTicket', ticket);
      }

      await sendOrderNotification({ tableNumber, total });

      socket.emit('orderConfirmed', { orderId, tableNumber });
      console.log(`[Socket] Yeni sipariş — Masa ${tableNumber}, Toplam ${total} TL`);
    });

    socket.on('orderReady', ({ ticketId, station }) => {
      if (!ticketId || !['kitchen', 'bar'].includes(station)) return;

      const removed = removeTicket(station, ticketId);
      if (!removed) return;

      const room = station === 'kitchen' ? 'kitchen_room' : 'bar_room';
      io.to(room).emit('ticketRemoved', { ticketId, station });
      console.log(`[Socket] Ticket hazır — ${station} / ${ticketId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Ayrıldı: ${socket.id}`);
    });
  });
}
