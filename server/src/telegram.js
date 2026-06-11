import TelegramBot from 'node-telegram-bot-api';
import { formatIstanbulDate, istanbulToday } from './istanbul-date.js';
import { getDailyReportData } from './stats.js';

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

async function sendMessage(text) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!bot || !chatId) return false;

  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
    return true;
  } catch (err) {
    console.error('[Telegram] Mesaj gönderilemedi:', err.message);
    return false;
  }
}

export async function sendAdisyonNotification({ area, tableNumber, total, birim }) {
  const unit = birim || 'TL';
  const message = `🧾 <b>Adisyon</b>\n${area} — Masa ${tableNumber}\nToplam: ${formatMoney(total)} ${unit}`;
  await sendMessage(message);
}

function formatMoney(n) {
  return Number(n).toLocaleString('tr-TR');
}

export async function buildDailyReportMessage() {
  const { revenue, topProducts } = await getDailyReportData();
  const dateLabel = formatIstanbulDate(new Date(`${istanbulToday()}T12:00:00+03:00`));

  const lines = [
    `📊 <b>Günlük Özet</b> — ${dateLabel}`,
    '',
    `💰 <b>Bugün:</b> ${formatMoney(revenue.daily.total)} TL`,
    `🪑 <b>Kapanan masa:</b> ${revenue.daily.count}`,
    '',
    `📅 Bu hafta: ${formatMoney(revenue.weekly.total)} TL (${revenue.weekly.count} masa)`,
    `📅 Bu ay: ${formatMoney(revenue.monthly.total)} TL (${revenue.monthly.count} masa)`,
  ];

  if (topProducts.length > 0) {
    lines.push('', '🏆 <b>En çok satan (bugün)</b>');
    topProducts.slice(0, 8).forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name} — ${p.quantity} adet`);
    });
  } else {
    lines.push('', '<i>Bugün henüz satış kaydı yok.</i>');
  }

  return lines.join('\n');
}

export async function sendDailyStatsReport() {
  const message = await buildDailyReportMessage();
  const ok = await sendMessage(message);
  if (ok) console.log('[Telegram] Günlük rapor gönderildi.');
  return ok;
}
