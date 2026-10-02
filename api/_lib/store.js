// Almacenamiento clave-valor.
// Con UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (plan gratuito de Upstash o KV de Vercel Marketplace)
// la memoria es persistente y compartida. Sin ellas cae a memoria local del proceso (solo sirve para pruebas:
// en serverless se pierde entre invocaciones).

const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const mem = new Map();
const now = () => Date.now();

export const persistent = Boolean(URL_ && TOKEN);

async function cmd(args) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error(`store ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function memGet(k) {
  const e = mem.get(k);
  if (!e) return null;
  if (e.exp && e.exp < now()) {
    mem.delete(k);
    return null;
  }
  return e.v;
}

export async function get(key) {
  try {
    return persistent ? await cmd(['GET', key]) : memGet(key);
  } catch (e) {
    console.error('store.get', e.message);
    return null;
  }
}

/** SET con TTL (s). nx=true → solo si no existe (devuelve true si lo creó). */
export async function set(key, value, { ex, nx } = {}) {
  try {
    if (persistent) {
      const args = ['SET', key, String(value)];
      if (ex) args.push('EX', ex);
      if (nx) args.push('NX');
      return (await cmd(args)) === 'OK';
    }
    if (nx && memGet(key) !== null) return false;
    mem.set(key, { v: String(value), exp: ex ? now() + ex * 1000 : 0 });
    return true;
  } catch (e) {
    console.error('store.set', e.message);
    return nx ? true : false; // ante falla, no bloquear el flujo
  }
}

export async function del(key) {
  try {
    if (persistent) await cmd(['DEL', key]);
    else mem.delete(key);
  } catch (e) {
    console.error('store.del', e.message);
  }
}

export async function incr(key, ex) {
  try {
    if (persistent) {
      const n = await cmd(['INCR', key]);
      if (n === 1 && ex) await cmd(['EXPIRE', key, ex]);
      return Number(n);
    }
    const cur = Number(memGet(key) || 0) + 1;
    const prev = mem.get(key);
    mem.set(key, { v: String(cur), exp: prev?.exp || (ex ? now() + ex * 1000 : 0) });
    return cur;
  } catch (e) {
    console.error('store.incr', e.message);
    return 0;
  }
}

export async function getJson(key) {
  const v = await get(key);
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export const setJson = (key, obj, opts) => set(key, JSON.stringify(obj), opts);
