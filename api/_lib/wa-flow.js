// Lógica de conversación de WhatsApp (separada del endpoint para poder probarla).
import * as store from './store.js';
import * as wa from './whatsapp.js';
import { respond, mergeLead } from './brain.js';
import { notifyTeam } from './notify.js';
import { HANDOFF_TTL_SECONDS } from './config.js';

const HIST_MAX = 24;
const HIST_TTL = 60 * 60 * 24 * 14;
const REMIND_AFTER_MS = 20 * 60 * 1000;

const NO_DOC =
  'Por este medio no puedo abrir documentos. Si querés, contame por mensaje de qué se trata o enviá una foto, y si hace falta lo ve alguien del equipo.';

function textOf(msg) {
  switch (msg.type) {
    case 'text':
      return msg.text?.body || '';
    case 'button':
      return msg.button?.text || '';
    case 'interactive':
      return msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
    case 'image':
      return msg.image?.caption || '';
    case 'location':
      return `(Ubicación compartida: ${msg.location?.name || ''} ${msg.location?.address || ''} ${msg.location?.latitude},${msg.location?.longitude})`;
    default:
      return '';
  }
}

async function buildUserParts(msg) {
  const text = textOf(msg).slice(0, 2000);
  if (msg.type === 'image') {
    const m = await wa.downloadMedia(msg.image.id);
    return {
      parts: [{ inlineData: m }, { text: text || '(El cliente envió esta foto sin texto.)' }],
      historyText: `[Foto enviada]${text ? ' ' + text : ''}`,
    };
  }
  if (msg.type === 'audio') {
    const m = await wa.downloadMedia(msg.audio.id);
    return {
      parts: [{ inlineData: m }, { text: '(El cliente envió un mensaje de voz. Escuchalo y respondé a su contenido.)' }],
      historyText: '[Mensaje de voz]',
    };
  }
  return { parts: [{ text }], historyText: text };
}

export async function processMessage(msg, profileName = '') {
  const from = msg.from;
  if (!from || !msg.id) return 'ignored';
  if (!(await store.set(`seen:${msg.id}`, '1', { ex: 3600, nx: true }))) return 'duplicate';
  if (['reaction', 'sticker', 'unsupported', 'system'].includes(msg.type)) return 'ignored';

  if (msg.type === 'document' || msg.type === 'video') {
    await wa.sendText(from, NO_DOC);
    return 'unsupported-media';
  }

  const incoming = textOf(msg).trim();

  // ¿Conversación derivada a una persona? El bot se calla para no pisar al asesor.
  const ho = await store.getJson(`ho:${from}`);
  if (ho) {
    if (/^\/?(bot|asistente|volver al asistente)$/i.test(incoming)) {
      await store.del(`ho:${from}`);
    } else {
      if (!ho.humanReplied && !ho.reminded && Date.now() - ho.at > REMIND_AFTER_MS) {
        ho.reminded = true;
        await store.setJson(`ho:${from}`, ho, { ex: HANDOFF_TTL_SECONDS });
        await notifyTeam({
          tipo: 'recordatorio',
          canal: 'whatsapp',
          telefono: from,
          nombre_perfil: profileName,
          resumen: `El cliente sigue esperando atención (derivado hace más de 20 min). Último mensaje: ${incoming || '[' + msg.type + ']'}`,
          chat_link: `https://wa.me/${from}`,
        });
      }
      return 'handoff-active';
    }
  }

  await wa.markReadTyping(msg.id);

  let built;
  try {
    built = await buildUserParts(msg);
  } catch (e) {
    console.warn('media', e.message);
    await wa.sendText(from, 'No pude abrir ese archivo. ¿Podés enviarlo de nuevo o contarme por escrito qué necesitás?');
    return 'media-error';
  }
  if (!built.historyText && !built.parts.some((p) => p.inlineData)) return 'empty';

  const history = (await store.getJson(`h:${from}`)) || [];
  const state = (await store.getJson(`s:${from}`)) || { lead: {}, leadLogged: false };

  const result = await respond({
    history,
    userParts: built.parts,
    channel: 'whatsapp',
    lead: state.lead,
    firstMessage: history.length === 0,
  });

  // Envío
  const useButtons = result.quick_replies.length > 0 && result.reply.length <= 1000 && !result.handoff_needed;
  let sentId;
  try {
    sentId = useButtons ? await wa.sendButtons(from, result.reply, result.quick_replies) : await wa.sendText(from, result.reply);
  } catch (e) {
    console.error('send', e.message);
    return 'send-error';
  }
  if (sentId) await store.set(`botmsg:${sentId}`, '1', { ex: 900 });

  // Memoria
  history.push({ role: 'user', text: built.historyText }, { role: 'bot', text: result.reply });
  await store.setJson(`h:${from}`, history.slice(-HIST_MAX), { ex: HIST_TTL });
  state.lead = result.lead || state.lead;
  state.profileName = profileName || state.profileName || '';

  const base = {
    canal: 'whatsapp',
    telefono: from,
    nombre_perfil: state.profileName,
    lead: state.lead,
    chat_link: `https://wa.me/${from}`,
  };

  if (result.error) {
    await notifyTeam({ ...base, tipo: 'error_bot', resumen: result.resumen_para_asesor });
  } else if (result.handoff_needed) {
    await store.setJson(`ho:${from}`, { at: Date.now(), humanReplied: false, reason: result.handoff_reason }, { ex: HANDOFF_TTL_SECONDS });
    await notifyTeam({
      ...base,
      tipo: 'derivacion',
      motivo: result.handoff_reason,
      resumen: result.resumen_para_asesor || history.slice(-4).map((m) => `${m.role}: ${m.text}`).join('\n'),
    });
    state.leadLogged = true;
  } else if (state.lead.nombre && state.lead.interes && !state.leadLogged) {
    await notifyTeam({ ...base, tipo: 'lead_calificado', resumen: 'Lead calificado por el asistente (sin derivación todavía).' });
    state.leadLogged = true;
  }
  await store.setJson(`s:${from}`, state, { ex: HIST_TTL });
  return result.handoff_needed ? 'handoff' : 'replied';
}

/** Coexistence: mensajes que el equipo escribe desde la app WhatsApp Business → el bot se pausa en ese chat. */
export async function processEcho(echo) {
  const customer = echo.to;
  if (!customer || !echo.id) return 'ignored';
  if (await store.get(`botmsg:${echo.id}`)) return 'own-echo';
  const prev = (await store.getJson(`ho:${customer}`)) || { at: Date.now(), reason: 'asesor_en_la_conversacion' };
  await store.setJson(`ho:${customer}`, { ...prev, humanReplied: true }, { ex: HANDOFF_TTL_SECONDS });
  const history = (await store.getJson(`h:${customer}`)) || [];
  const t = echo.text?.body || (echo.type ? `[${echo.type}]` : '');
  if (t) {
    history.push({ role: 'bot', text: `[Asesor de Decourban] ${t}` });
    await store.setJson(`h:${customer}`, history.slice(-HIST_MAX), { ex: HIST_TTL });
  }
  return 'human-took-over';
}
