import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { tmpdir } from 'os';
import { join } from 'path';
import { isPrinterAvailable, sendToWindowsPrinter } from './win-print.js';

const RESTAURANT_NAME = process.env.RESTAURANT_NAME || 'PANORAMA RESTORAN';
const SIMULATE = process.env.SIMULATE_PRINT === 'true';

const PRINTER_MAP = {
  cashier: process.env.PRINTER_CASHIER || 'POS-80',
  kitchen: process.env.PRINTER_KITCHEN || 'POS-80',
  bar: process.env.PRINTER_BAR || 'POS-80',
};

const STATION_TITLE = {
  kitchen: 'MUTFAK',
  bar: 'BAR',
  cashier: RESTAURANT_NAME,
};

const BUILD_INTERFACE = join(tmpdir(), 'escpos-build.tmp');

// 80mm termal yazıcı (~48 karakter/satır, font A)
const PAPER_WIDTH = 48;
const COL_NAME = 26;
const COL_QTY = 8;
const COL_AMT = 14;

function padLeft(text, width) {
  const t = String(text);
  if (t.length >= width) return t.slice(0, width);
  return t + ' '.repeat(width - t.length);
}

function padCenter(text, width) {
  const t = String(text);
  if (t.length >= width) return t.slice(0, width);
  const pad = width - t.length;
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + t + ' '.repeat(pad - left);
}

function padRight(text, width) {
  const t = String(text);
  if (t.length >= width) return t.slice(-width);
  return ' '.repeat(width - t.length) + t;
}

function formatTableHeader(withAmount) {
  if (withAmount) {
    return (
      padLeft('Ürün Adı', COL_NAME) +
      padCenter('Adet', COL_QTY) +
      padRight('Tutar', COL_AMT)
    );
  }
  const nameW = PAPER_WIDTH - COL_QTY;
  return padLeft('Ürün Adı', nameW) + padCenter('Adet', COL_QTY);
}

function printItemRow(printer, name, qty, amountText, withAmount) {
  const qtyStr = `${qty}x`;
  const nameW = withAmount ? COL_NAME : PAPER_WIDTH - COL_QTY;
  let rest = name;
  const chunks = [];

  while (rest.length > nameW) {
    chunks.push(rest.slice(0, nameW));
    rest = rest.slice(nameW);
  }
  chunks.push(rest);

  chunks.forEach((chunk, i) => {
    const isLast = i === chunks.length - 1;
    if (withAmount) {
      printer.println(
        padLeft(chunk, COL_NAME) +
          padCenter(isLast ? qtyStr : '', COL_QTY) +
          padRight(isLast ? amountText : '', COL_AMT),
      );
    } else {
      printer.println(
        padLeft(chunk, nameW) + padCenter(isLast ? qtyStr : '', COL_QTY),
      );
    }
  });
}

function formatPrice(amount, paraBirimi) {
  const n = Number(amount);
  switch (paraBirimi) {
    case 'USD':
      return `$${n.toFixed(2)}`;
    case 'EUR':
      return `${n.toFixed(2)} EUR`;
    case 'GBP':
      return `£${n.toFixed(2)}`;
    default:
      return `${n} TL`;
  }
}

function formatTotal(amount, paraBirimi, birim) {
  const n = Number(amount);
  switch (paraBirimi) {
    case 'USD':
      return `TOPLAM: $${n.toFixed(2)}`;
    case 'EUR':
      return `TOPLAM: ${n.toFixed(2)} EUR`;
    case 'GBP':
      return `TOPLAM: £${n.toFixed(2)}`;
    default:
      return `TOPLAM: ${n} TL`;
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createBuilder() {
  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: BUILD_INTERFACE,
    characterSet: CharacterSet.PC857_TURKISH,
    removeSpecialCharacters: false,
    lineCharacter: '=',
    options: { timeout: 5000 },
  });
}

function buildReceiptBuffer(target, job) {
  const printer = createBuilder();
  const title = STATION_TITLE[target];
  const masa = String(job.masaNo).padStart(2, '0');
  const alan = job.alan ? `${job.alan.toUpperCase()}` : '';

  if (target === 'cashier') {
    printer.alignCenter();
    printer.bold(true);
    printer.println(title);
    printer.bold(false);
    printer.drawLine();
  } else {
    printer.alignCenter();
    printer.bold(true);
    printer.println(`══ ${title} ══`);
    printer.bold(false);
    printer.drawLine();
  }

  printer.alignLeft();
  if (alan) printer.println(`Alan: ${alan}`);
  printer.println(`Masa: ${masa}`);
  printer.println(`Tarih: ${formatDate(job.createdAt)}`);
  printer.drawLine();

  const isCashier = target === 'cashier';
  const paraBirimi = job.paraBirimi || 'TRY';

  printer.bold(true);
  printer.println(formatTableHeader(isCashier));
  printer.bold(false);

  for (const item of job.siparisler) {
    const lineTotal = item.adet * item.fiyat;
    printItemRow(
      printer,
      item.isim,
      item.adet,
      isCashier ? formatPrice(lineTotal, paraBirimi) : '',
      isCashier,
    );
    for (const opt of item.secenekler ?? []) {
      printer.println(`  > ${opt}`);
    }
  }

  printer.drawLine();

  if (isCashier && job.toplamTutar != null) {
    printer.alignRight();
    printer.bold(true);
    printer.println(formatTotal(job.toplamTutar, paraBirimi, job.birim));
    printer.bold(false);
    printer.drawLine();
    printer.alignCenter();
    printer.println('Afiyet olsun!');
    printer.println('Enjoy your meal!');
  }

  printer.cut();
  return printer.getBuffer();
}

function simulatePrint(target, job) {
  const title = STATION_TITLE[target];
  console.log('\n' + '='.repeat(32));
  console.log(`[SİMÜLE] ${title}`);
  console.log(`${job.alan ? job.alan + ' — ' : ''}Masa ${job.masaNo} — ${formatDate(job.createdAt)}`);
  console.log('-'.repeat(32));
  const isCashier = target === 'cashier';
  const paraBirimi = job.paraBirimi || 'TRY';
  console.log(formatTableHeader(isCashier));
  for (const item of job.siparisler) {
    const line = item.adet * item.fiyat;
    const row = isCashier
      ? padLeft(item.isim, COL_NAME) +
        padCenter(`${item.adet}x`, COL_QTY) +
        padRight(formatPrice(line, paraBirimi), COL_AMT)
      : padLeft(item.isim, PAPER_WIDTH - COL_QTY) +
        padCenter(`${item.adet}x`, COL_QTY);
    console.log(row);
    for (const opt of item.secenekler ?? []) {
      console.log(`  > ${opt}`);
    }
  }
  if (isCashier && job.toplamTutar != null) {
    console.log('-'.repeat(32));
    console.log(formatTotal(job.toplamTutar, paraBirimi, job.birim));
    console.log('Afiyet olsun!');
    console.log('Enjoy your meal!');
  }
  console.log('='.repeat(32) + '\n');
}

export async function printReceipt(target, job) {
  if (SIMULATE) {
    simulatePrint(target, job);
    return;
  }

  const printerName = PRINTER_MAP[target];
  if (!printerName) {
    throw new Error(`Bilinmeyen yazıcı hedefi: ${target}`);
  }

  const available = await isPrinterAvailable(printerName);
  if (!available) {
    throw new Error(`Yazıcı bulunamadı: "${printerName}" — Ayarlar > Yazıcılar'dan adı kontrol et`);
  }

  const buffer = buildReceiptBuffer(target, job);
  await sendToWindowsPrinter(printerName, buffer);
}
