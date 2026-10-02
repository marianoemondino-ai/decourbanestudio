// Endpoint del chat web. Sin estado en el servidor: el widget envía el historial y el "state" en cada turno.
import { respond } from './_lib/brain.js';
import { waLink } from './_lib/config.js';
import { originOk, rateLimited } from './_lib/guard.js';

const str = (v, n) => (typeof v === 'string' ? v.replace(/\u0000/g, '').slice(0, n) : '');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!originOk(req)) return res.status(403).json({ error: 'origin' });
  if (await rateLimited(req, 'chat', 14, 200)) {
    return res.status(429).json({ error: 'rate', reply: 'Estás escribiendo muy rápido. Esperá un momento y probá de nuevo.' });
  }

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const msgs = (Array.isArray(b.messages) ? b.messages : [])
    .slice(-14)
    .map((m) => ({ role: m?.role === 'user' ? 'user' : 'bot', text: str(m?.text, 1000) }))
    .filter((m) => m.text.trim());
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: 'messages' });

  const last = msgs.pop();
  const lead = {};
  for (const k of Object.keys(b.state?.lead || {})) lead[str(k, 30)] = str(b.state.lead[k], 300);

  const result = await respond({
    history: msgs,
    userParts: [{ text: last.text }],
    channel: 'web',
    page: { path: str(b.page?.path, 120), title: str(b.page?.title, 120) },
    lead,
    firstMessage: msgs.length === 0,
  });

  const summary = result.resumen_para_asesor || '';
  res.status(200).json({
    reply: result.reply,
    quick_replies: result.quick_replies,
    handoff: result.handoff_needed
      ? {
          reason: result.handoff_reason,
          wa_link: waLink(`Hola, vengo del chat del sitio web. ${summary}`.trim().slice(0, 700)),
          summary,
        }
      : null,
    state: { lead: result.lead },
  });
}
