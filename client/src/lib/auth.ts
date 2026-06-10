import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_token';
const WAITER_COOKIE = 'waiter_token';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET tanımlı değil');
  return new TextEncoder().encode(s);
}

export async function signAdminToken(email: string) {
  return new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  if (payload.role !== 'admin') throw new Error('Yetkisiz');
  return payload;
}

export async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function signWaiterToken(waiterId: string, name: string) {
  return new SignJWT({ waiterId, name, role: 'waiter' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(secret());
}

export async function verifyWaiterToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  if (payload.role !== 'waiter') throw new Error('Yetkisiz');
  return payload;
}

export async function getWaiterSession() {
  const token = (await cookies()).get(WAITER_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyWaiterToken(token);
  } catch {
    return null;
  }
}

export const COOKIE = ADMIN_COOKIE;
export { ADMIN_COOKIE, WAITER_COOKIE };
