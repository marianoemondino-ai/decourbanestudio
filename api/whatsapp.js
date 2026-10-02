import { verifySignature } from './_lib/whatsapp.js';
import { processMessage, processEcho } from './_lib/wa-flow.js';

// Necesitamos el cuerpo crudo para validar la firma de Meta (X-Hub-Signature-256).
export const config = { api: { bodyParser: false } };

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Verificación del webhook (Meta llama una vez al configurarlo)
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query || {};
    if (mode === 'subscribe' && token && token === process.env.WA_VERIFY_TOKEN) {
      res.status(200).setHeader('Content-Type', 'text/plain').send(String(challenge));
      return;
    }
    res.status(403).send('Forbidden');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const raw = await readRaw(req);
  if (!verifySignature(raw, req.headers['x-hub-signature-256'])) {
    console.warn('whatsapp: firma inválida o WA_APP_SECRET ausente');
    res.status(401).send('Invalid signature');
    return;
  }

  let body;
  try {
    body = JSON.parse(raw.toString('utf8'));
  } catch {
    res.status(400).send('Bad JSON');
    return;
  }

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const v = change.value || {};
        if (change.field === 'messages') {
          const names = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile?.name || '']));
          for (const msg of v.messages || []) {
            try {
              await processMessage(msg, names[msg.from] || '');
            } catch (e) {
              console.error('processMessage', e);
            }
          }
        } else if (change.field === 'smb_message_echoes') {
          for (const echo of v.message_echoes || []) {
            try {
              await processEcho(echo);
            } catch (e) {
              console.error('processEcho', e);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('whatsapp handler', e);
  }
  // Siempre 200 para que Meta no reintente en bucle (hay deduplicación por id de mensaje).
  res.status(200).json({ ok: true });
}
