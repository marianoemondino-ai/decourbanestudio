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
const DAY_NAMES = { dom: 'domingo', lun: 'lunes', mar: 'martes', mie: 'miércoles', jue: 'jueves', vie: 'viernes', sab: 'sábado' };

// Horario de atención del equipo (confirmado por la dueña): L–V 9 a 18, sábados 9 a 13, domingos cerrado.
// Se usa SOLO dentro del bot; no se muestra en el sitio. Se puede reemplazar con la variable BUSINESS_HOURS (JSON).
export const DEFAULT_HOURS = {
  lun: ['09:00-18:00'],
  mar: ['09:00-18:00'],
  mie: ['09:00-18:00'],
  jue: ['09:00-18:00'],
  vie: ['09:00-18:00'],
  sab: ['09:00-13:00'],
  dom: [],
};

export function parseHours() {
  const raw = process.env.BUSINESS_HOURS;
  if (!raw) return DEFAULT_HOURS;
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : DEFAULT_HOURS;
  } catch {
    return DEFAULT_HOURS;
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

const inRange = (hhmm, r) => {
  const [a, b] = String(r).split('-');
  return Boolean(a && b) && hhmm >= a.trim() && hhmm < b.trim();
};

/** Texto legible del horario para que el bot lo informe sin errores. */
export function scheduleText(hours = parseHours()) {
  const lines = [];
  const order = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
  let i = 0;
  while (i < order.length) {
    const key = JSON.stringify(hours[order[i]] || []);
    let j = i;
    while (j + 1 < order.length && JSON.stringify(hours[order[j + 1]] || []) === key) j++;
    const ranges = hours[order[i]] || [];
    const label = i === j ? DAY_NAMES[order[i]] : `${DAY_NAMES[order[i]]} a ${DAY_NAMES[order[j]]}`;
    lines.push(`${label}: ${ranges.length ? ranges.map((r) => r.replace('-', ' a ') + ' h').join(' y ') : 'cerrado'}`);
    i = j + 1;
  }
  return lines.join('; ');
}

/** Próxima apertura (para decir "te responden apenas abrimos: lunes a las 9") */
export function nextOpening(now = new Date(), hours = parseHours()) {
  for (let add = 0; add <= 7; add++) {
    const d = new Date(now.getTime() + add * 86400000);
    const { day, hhmm } = localParts(d);
    const starts = (hours[day] || []).map((r) => String(r).split('-')[0].trim()).sort();
    for (const s of starts) {
      if (add > 0 || s > hhmm) return { day: DAY_NAMES[day], at: s, sameDay: add === 0, tomorrow: add === 1 };
    }
  }
  return null;
}

export function openStatus(now = new Date()) {
  const hours = parseHours();
  const { day, hhmm, pretty } = localParts(now);
  const open = (hours[day] || []).some((r) => inRange(hhmm, r));
  const next = open ? null : nextOpening(now, hours);
  return { known: true, open, pretty, schedule: hours, text: scheduleText(hours), next };
}

export function waLink(text = '') {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${BUSINESS.waNumber}${q}`;
}
