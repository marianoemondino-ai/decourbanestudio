import * as store from './store.js';
import { createHash } from 'node:crypto';

const ALLOWED = [/^https:\/\/(www\.)?decourban\.com\.ar$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/];

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim();
}

export function originOk(req) {
  const o = req.headers.origin;
  if (!o) return true; // llamadas same-origin sin cabecera
  return ALLOWED.some((re) => re.test(o));
}

export async function rateLimited(req, bucket, perMin, perDay) {
  const id = createHash('sha256').update(clientIp(req)).digest('hex').slice(0, 16);
  const m = await store.incr(`rl:${bucket}:m:${id}`, 60);
  if (m && m > perMin) return true;
  const d = await store.incr(`rl:${bucket}:d:${id}`, 86400);
  return Boolean(d && d > perDay);
}
