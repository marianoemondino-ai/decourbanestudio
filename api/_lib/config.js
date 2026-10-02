// Configuración central del bot de Decourban Estudio.
// Todo lo sensible viene de variables de entorno (Vercel → Settings → Environment Variables). Nunca hardcodear claves.

export const BUSINESS = {
  name: 'Decourban Estudio',
  site: 'https://decourban.com.ar',
  waNumber: (process.env.BUSINESS_WA_NUMBER || '5493585746196').replace(/\D/g, ''),
  email: 'ventas@decourban.com.ar',
  tz: 'America/Argentina/Cordoba',
};

export const AI = {
  model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  dailyCap: Number(process.env.DAILY_AI_CAP || 1500),
};

export const HANDOFF_TTL_SECONDS = Number(process.env.HANDOFF_TTL_HOURS || 12) * 3600;

const DAYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

/**
 * Horarios: variable BUSINESS_HOURS con JSON, por ejemplo:
 * {"lun":["09:00-13:00","16:30-20:00"],"mar":["09:00-13:00","16:30-20:00"],"sab":["09:00-13:00"]}
 * Si no está definida, el bot NO afirma si están abiertos o cerrados (no inventa horarios).
 */
export function parseHours() {
  const raw = process.env.BUSINESS_HOURS;
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : null;
  } catch {
    return null;
  }
}

export function localParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('es-AR', {
    timeZone: BUSINESS.tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  const wk = p.weekday.toLowerCase().replace('.', '').replace('é', 'e').replace('á', 'a');
  const day = DAYS.find((d) => wk.startsWith(d)) || DAYS[now.getUTCDay()];
  return {
    day,
    hhmm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}`,
    pretty: `${p.weekday} ${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`,
  };
}

export function openStatus(now = new Date()) {
  const hours = parseHours();
  const { day, hhmm, pretty } = localParts(now);
  if (!hours) return { known: false, open: null, pretty };
  const ranges = hours[day] || [];
  const open = ranges.some((r) => {
    const [a, b] = String(r).split('-');
    return a && b && hhmm >= a.trim() && hhmm < b.trim();
  });
  return { known: true, open, pretty, schedule: hours };
}

export function waLink(text = '') {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${BUSINESS.waNumber}${q}`;
}
