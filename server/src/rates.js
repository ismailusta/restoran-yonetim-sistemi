import { prisma } from '@restoran/db';

const RATE_KEYS = {
  EUR: 'rate_eur',
  USD: 'rate_usd',
  GBP: 'rate_gbp',
};

const SYMBOLS = {
  TRY: 'TL',
  EUR: 'EUR',
  USD: '$',
  GBP: '£',
};

export async function getManualRates() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(RATE_KEYS) } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, parseFloat(r.value)]));
  return {
    EUR: map.rate_eur || null,
    USD: map.rate_usd || null,
    GBP: map.rate_gbp || null,
  };
}

export function convertAmount(amountTl, code, rate) {
  if (code === 'TRY') return amountTl;
  if (!rate || rate <= 0) throw new Error('Geçersiz kur');
  return Math.round((amountTl / rate) * 100) / 100;
}

function mapCashierItems(items, code, rate) {
  return items.map((item) => ({
    isim: item.name,
    adet: item.quantity,
    fiyat: convertAmount(item.price, code, rate),
    secenekler: (item.selectedModifiers ?? []).map((m) => m.label),
  }));
}

export async function buildCashierReceipt(items, totalTl, currency = 'TRY') {
  const code = (currency || 'TRY').toUpperCase();

  if (code === 'TRY') {
    return {
      paraBirimi: 'TRY',
      toplamTutar: totalTl,
      birim: SYMBOLS.TRY,
      siparisler: mapCashierItems(items, 'TRY', null),
    };
  }

  const key = RATE_KEYS[code];
  if (!key) throw new Error('Geçersiz para birimi');

  const rates = await getManualRates();
  const rate = rates[code];

  if (!rate || rate <= 0) {
    throw new Error(`${code} kuru tanımlı değil — Admin ayarlarından girin`);
  }

  return {
    paraBirimi: code,
    toplamTutar: convertAmount(totalTl, code, rate),
    birim: SYMBOLS[code],
    kur: rate,
    siparisler: mapCashierItems(items, code, rate),
  };
}
