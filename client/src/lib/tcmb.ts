const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';
const CODES = ['EUR', 'USD', 'GBP'] as const;

function parseRate(xml: string, code: string): number | null {
  const block = xml.match(
    new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>[\\s\\S]*?</Currency>`, 'i'),
  );
  if (!block) return null;

  const banknote = block[0].match(/<BanknoteSelling>([\d,.]+)<\/BanknoteSelling>/);
  const forex = block[0].match(/<ForexSelling>([\d,.]+)<\/ForexSelling>/);
  const raw = banknote?.[1] ?? forex?.[1];
  if (!raw) return null;

  const value = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export interface TcmbRates {
  EUR: number | null;
  USD: number | null;
  GBP: number | null;
  fetchedAt: string;
}

export async function fetchTcmbRates(): Promise<TcmbRates> {
  const res = await fetch(TCMB_URL, {
    next: { revalidate: 3600 },
    headers: { Accept: 'application/xml' },
  });

  if (!res.ok) throw new Error('TCMB kurları alınamadı');

  const xml = await res.text();
  const rates: TcmbRates = {
    EUR: parseRate(xml, 'EUR'),
    USD: parseRate(xml, 'USD'),
    GBP: parseRate(xml, 'GBP'),
    fetchedAt: new Date().toISOString(),
  };

  return rates;
}

export { CODES as TCMB_CURRENCIES };
