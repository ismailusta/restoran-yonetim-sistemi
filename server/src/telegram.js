import TelegramBot from 'node-telegram-bot-api';

let bot = null;

export function initTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN tanımlı değil — bildirimler devre dışı.');
    return null;
  }

  bot = new TelegramBot(token, { polling: false });
  console.log('[Telegram] Bot başlatıldı.');
  return bot;
}

export async function sendOrderNotification({ area, tableNumber, total }) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!bot || !chatId) return;

  const message = `🍽️ Yeni Sipariş!\n${area} — Masa ${tableNumber}\nToplam: ${total} TL`;

  try {
    await bot.sendMessage(chatId, message);
  } catch (err) {
    console.error('[Telegram] Bildirim gönderilemedi:', err.message);
  }
}
