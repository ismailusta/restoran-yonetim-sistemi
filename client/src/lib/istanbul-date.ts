const TZ = 'Europe/Istanbul';
const OFFSET = '+03:00';

export function istanbulToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function startOfDayIstanbul(): Date {
  return new Date(`${istanbulToday()}T00:00:00${OFFSET}`);
}

export function startOfWeekIstanbul(): Date {
  const today = istanbulToday();
  const [y, m, d] = today.split('-').map(Number);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(new Date(`${today}T12:00:00${OFFSET}`));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = map[weekday] ?? 1;
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(y, m - 1, d - daysFromMonday)).toISOString().slice(0, 10);
  return new Date(`${monday}T00:00:00${OFFSET}`);
}

export function startOfMonthIstanbul(): Date {
  const today = istanbulToday();
  const [y, m] = today.split('-');
  return new Date(`${y}-${m}-01T00:00:00${OFFSET}`);
}

export type StatsPeriod = 'day' | 'week' | 'month' | 'all';

export function periodStart(period: StatsPeriod): Date | null {
  if (period === 'day') return startOfDayIstanbul();
  if (period === 'week') return startOfWeekIstanbul();
  if (period === 'month') return startOfMonthIstanbul();
  return null;
}
