import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initTelegram } from './telegram.js';
import { setupSocket } from './socket.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(readFileSync(join(__dirname, 'data', 'menu.json'), 'utf-8'));

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/menu', (_req, res) => {
  res.json(menu);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

initTelegram();
setupSocket(io);

httpServer.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
