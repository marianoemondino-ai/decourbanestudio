// Cliente mínimo de WhatsApp Cloud API (Meta). Plan gratuito: las conversaciones iniciadas por el cliente
// (ventana de 24 h) no tienen costo; el bot solo responde dentro de esa ventana.
import crypto from 'node:crypto';

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;
const token = () => process.env.WA_ACCESS_TOKEN;
const phoneId = () => process.env.WA_PHONE_NUMBER_ID;

export function verifySignature(rawBody, header) {
  const secret = process.env.WA_APP_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(header));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function graph(path, body, method = 'POST') {
  const r = await fetch(`${GRAPH}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`graph ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

export async function markReadTyping(messageId) {
  try {
    await graph(`${phoneId()}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: { type: 'text' },
    });
  } catch (e) {
    console.warn('markReadTyping', e.message);
  }
}

export async function sendText(to, text) {
  const j = await graph(`${phoneId()}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text.slice(0, 4000), preview_url: true },
  });
  return j?.messages?.[0]?.id;
}

export async function sendButtons(to, body, options) {
  const j = await graph(`${phoneId()}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1000) },
      action: {
        buttons: options.slice(0, 3).map((t, i) => ({ type: 'reply', reply: { id: `qr_${i}`, title: t.slice(0, 20) } })),
      },
    },
  });
  return j?.messages?.[0]?.id;
}

/** Descarga un medio (imagen/audio) y lo devuelve en base64 para Gemini. Límite 4 MB. */
export async function downloadMedia(mediaId) {
  const meta = await graph(mediaId, null, 'GET');
  if (meta.file_size && meta.file_size > 4 * 1024 * 1024) throw new Error('archivo demasiado grande');
  const r = await fetch(meta.url, { headers: { Authorization: `Bearer ${token()}` }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`media ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 4 * 1024 * 1024) throw new Error('archivo demasiado grande');
  return { mimeType: (meta.mime_type || 'application/octet-stream').split(';')[0], data: buf.toString('base64') };
}
