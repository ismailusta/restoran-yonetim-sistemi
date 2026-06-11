import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '@restoran/db';
import cron from 'node-cron';
import { initTelegram, sendDailyStatsReport } from './telegram.js';
import { setupSocket } from './socket.js';

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const LAN_ORIGIN =
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === CLIENT_URL) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.startsWith('http://localhost')) return true;
  if (LAN_ORIGIN.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/telegram/daily-report', async (req, res) => {
  const secret = process.env.TELEGRAM_REPORT_SECRET;
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (!secret || auth !== secret) {
    return res.status(401).json({ error: 'Yetkisiz' });
  }

  const ok = await sendDailyStatsReport();
  if (!ok) {
    return res.status(503).json({ error: 'Telegram gönderilemedi — token/chat id kontrol et' });
  }
  return res.json({ ok: true });
});

app.get('/api/menu', async (_req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { active: true },
      include: {
        category: true,
        modifiers: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { id: 'asc' }],
    });
    res.json(
      items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        type: i.type,
        category: i.category.name,
        modifiers: i.modifiers.map((m) => ({
          id: m.id,
          label: m.label,
          priceDelta: m.priceDelta,
        })),
      })),
    );
  } catch (err) {
    res.status(500).json({ error: 'Menü yüklenemedi' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST'],
  },
});

initTelegram();
setupSocket(io);

const dailyCron = process.env.TELEGRAM_DAILY_CRON || '0 23 * * *';
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  cron.schedule(
    dailyCron,
    () => {
      sendDailyStatsReport().catch((err) =>
        console.error('[Telegram] Günlük rapor hatası:', err.message),
      );
    },
    { timezone: 'Europe/Istanbul' },
  );
  console.log(`[Telegram] Günlük rapor zamanlandı: ${dailyCron} (İstanbul)`);
}

httpServer.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
