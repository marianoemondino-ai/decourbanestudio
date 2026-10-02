// Formulario de derivación del chat web: el visitante deja nombre + contacto y el equipo recibe el resumen.
import { notifyTeam } from './_lib/notify.js';
import { originOk, rateLimited } from './_lib/guard.js';

const str = (v, n) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, n) : '');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!originOk(req)) return res.status(403).json({ error: 'origin' });
  if (await rateLimited(req, 'lead', 3, 10)) return res.status(429).json({ error: 'rate' });

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  if (str(b.website, 50)) return res.status(200).json({ ok: true }); // honeypot anti-spam

  const nombre = str(b.nombre, 80);
  const contacto = str(b.contacto, 120);
  const valido = /^\+?[\d\s().-]{7,20}$/.test(contacto) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto);
  if (!nombre || !valido) return res.status(400).json({ error: 'datos', message: 'Revisá tu nombre y un WhatsApp o email válido.' });

  const ok = await notifyTeam({
    tipo: 'derivacion_web',
    canal: 'web',
    nombre,
    contacto,
    motivo: str(b.motivo, 40),
    resumen: str(b.resumen, 800),
    lead: Object.fromEntries(Object.entries(b.lead && typeof b.lead === 'object' ? b.lead : {}).slice(0, 12).map(([k, v]) => [str(k, 30), str(v, 300)])),
    pagina: str(b.page?.path, 120),
  });
  res.status(ok ? 200 : 502).json({ ok });
}
