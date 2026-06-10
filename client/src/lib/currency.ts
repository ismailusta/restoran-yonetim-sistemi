export type CurrencyCode = 'TRY' | 'EUR' | 'USD' | 'GBP';

export const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'TRY', label: 'TL' },
  { code: 'EUR', label: 'EUR' },
  { code: 'USD', label: 'USD' },
  { code: 'GBP', label: 'GBP' },
];

export const RATE_SETTING_KEYS: Record<Exclude<CurrencyCode, 'TRY'>, string> = {
  EUR: 'rate_eur',
  USD: 'rate_usd',
  GBP: 'rate_gbp',
};

export function currencySymbol(code: CurrencyCode): string {
  if (code === 'TRY') return 'TL';
  return code;
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  if (code === 'TRY') return `${amount.toLocaleString('tr-TR')} TL`;
  return `${amount.toFixed(2)} ${code}`;
}

export function convertFromTry(totalTl: number, code: CurrencyCode, rate: number): number {
  if (code === 'TRY') return totalTl;
  if (!rate || rate <= 0) throw new Error('Geçersiz kur');
  return Math.round((totalTl / rate) * 100) / 100;
}
