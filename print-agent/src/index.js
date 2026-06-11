import 'dotenv/config';
import { io } from 'socket.io-client';
import { printReceipt } from './printer.js';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

console.log('[Print Agent] Başlatılıyor...');
console.log(`[Print Agent] Server: ${SERVER_URL}`);
const cashier = process.env.PRINTER_CASHIER || 'POS-80';
const kitchen = process.env.PRINTER_KITCHEN || cashier;
const bar = process.env.PRINTER_BAR || cashier;
console.log(`[Print Agent] Mod: ${process.env.SIMULATE_PRINT === 'true' ? 'SİMÜLE' : 'GERÇEK YAZICI'}`);
console.log(`[Print Agent] Yazıcılar — Kasa: ${cashier}, Mutfak: ${kitchen}, Bar: ${bar}`);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('printJob', async (job) => {
  const { target } = job;
  console.log(`[Print Agent] Fiş kuyruğu — ${target}, Masa ${job.masaNo}`);

  try {
    await printReceipt(target, job);
    console.log(`[Print Agent] ✓ Basıldı — ${target}`);
  } catch (err) {
    console.error(`[Print Agent] ✗ Hata (${target}):`, err.message);
  }
});

socket.on('connect', () => {
  console.log(`[Print Agent] ✓ Sunucuya bağlandı → ${SERVER_URL}`);
  socket.emit('joinRoom', { room: 'printer_room' });
});

socket.on('disconnect', () => {
  console.log('[Print Agent] Bağlantı kesildi — yeniden deneniyor...');
});

socket.on('connect_error', (err) => {
  console.log(`[Print Agent] Bağlantı bekleniyor: ${err.message}`);
});
