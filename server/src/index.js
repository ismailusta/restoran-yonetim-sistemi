import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '@restoran/db';
import { initTelegram } from './telegram.js';
import { setupSocket } from './socket.js';

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === CLIENT_URL) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.startsWith('http://localhost')) return true;
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

httpServer.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
