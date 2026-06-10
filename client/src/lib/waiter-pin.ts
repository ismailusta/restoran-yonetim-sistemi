import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export function isValidPin(pin: string) {
  return /^\d{4,6}$/.test(pin);
}

export async function isPinTaken(pin: string, excludeId?: string) {
  const waiters = await prisma.waiterUser.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
  });
  for (const waiter of waiters) {
    if (await bcrypt.compare(pin, waiter.pinHash)) return true;
  }
  return false;
}

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}
