// Pruebas del bot con Gemini y WhatsApp simulados (sin red, sin claves reales). Ejecutar: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.GEMINI_API_KEY = 'test-key';
process.env.WA_APP_SECRET = 'secret123';
process.env.WA_VERIFY_TOKEN = 'verify-me';
process.env.WA_ACCESS_TOKEN = 'tok';
process.env.WA_PHONE_NUMBER_ID = '555';
process.env.LEAD_WEBHOOK_URL = 'https://script.example/exec';
process.env.LEAD_WEBHOOK_SECRET = 'hook';

const calls = { gemini: [], wa: [], hook: [] };
let geminiScript = []; // respuestas JSON que devolverá Gemini, en orden

globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  const body = opts.body ? JSON.parse(opts.body) : null;
  if (url.includes('generativelanguage.googleapis.com')) {
    calls.gemini.push(body);
    const next = geminiScript.shift();
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(next) }] } }] }), { status: 200 });
  }
  if (url.includes('graph.facebook.com')) {
    calls.wa.push({ url, body });
    return new Response(JSON.stringify({ messages: [{ id: 'wamid.OUT' + calls.wa.length }] }), { status: 200 });
  }
  if (url.startsWith('https://script.example')) {
    calls.hook.push(body);
    return new Response('{"ok":true}', { status: 200 });
  }
  throw new Error('fetch inesperado: ' + url);
};

const { respond } = await import('../api/_lib/brain.js');
const { processMessage, processEcho } = await import('../api/_lib/wa-flow.js');
const { verifySignature } = await import('../api/_lib/whatsapp.js');
const { KNOWLEDGE } = await import('../api/_lib/knowledge.generated.js');
const whatsappHandler = (await import('../api/whatsapp.js')).default;
const chatHandler = (await import('../api/chat.js')).default;
const leadHandler = (await import('../api/lead.js')).default;

const ok = (over = {}) => ({ reply: 'Hola, ¿en qué te ayudo?', quick_replies: [], handoff_needed: false, handoff_reason: 'ninguno', resumen_para_asesor: '', lead: {}, ...over });
const reset = () => { calls.gemini.length = calls.wa.length = calls.hook.length = 0; geminiScript = []; };
const mkRes = () => {
  const r = { code: 0, headers: {}, body: undefined };
  r.status = (c) => ((r.code = c), r);
  r.setHeader = (k, v) => ((r.headers[k] = v), r);
  r.json = (b) => ((r.body = b), r);
  r.send = (b) => ((r.body = b), r);
  return r;
};

test('la base de conocimiento incluye negocio, productos y catálogo; no contiene precios', () => {
  assert.match(KNOWLEDGE, /Juan de Garay 1550/);
  assert.match(KNOWLEDGE, /Silhouette/);
  assert.match(KNOWLEDGE, /Isla Romana/);
  assert.match(KNOWLEDGE, /DU Concept/);
  assert.doesNotMatch(KNOWLEDGE, /\$\s?\d/);
});

test('brain: arma prompt con reglas anti-invención, contexto de página y pasa la clave por header', async () => {
  reset();
  geminiScript.push(ok({ lead: { interes: 'Silhouette' } }));
  const r = await respond({ history: [{ role: 'bot', text: 'Hola' }, { role: 'user', text: 'a' }], userParts: [{ text: 'cuánto sale?' }], channel: 'web', page: { path: '/silhouette.html', title: 'Cortina Silhouette' }, lead: {} });
  assert.equal(r.lead.interes, 'Silhouette');
  const g = calls.gemini[0];
  const sys = g.systemInstruction.parts[0].text;
  assert.match(sys, /NUNCA des precios/);
  assert.match(sys, /\/silhouette\.html/);
  assert.equal(g.contents[0].role, 'user'); // el primer turno del modelo se descarta
  assert.equal(g.generationConfig.responseMimeType, 'application/json');
});

test('brain: si Gemini falla devuelve fallback con derivación a WhatsApp', async () => {
  reset();
  geminiScript.push(new Error('boom'), new Error('boom'));
  const r = await respond({ history: [], userParts: [{ text: 'hola' }], channel: 'web', lead: {} });
  assert.equal(r.handoff_needed, true);
  assert.ok(r.error);
  assert.match(r.reply, /wa\.me\/5493585746196/);
});

test('whatsapp: firma HMAC válida / inválida y verificación del webhook', async () => {
  const raw = Buffer.from('{"a":1}');
  const sig = 'sha256=' + crypto.createHmac('sha256', 'secret123').update(raw).digest('hex');
  assert.equal(verifySignature(raw, sig), true);
  assert.equal(verifySignature(raw, 'sha256=00'), false);
  assert.equal(verifySignature(raw, undefined), false);

  let res = mkRes();
  await whatsappHandler({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '777' } }, res);
  assert.equal(res.code, 200); assert.equal(res.body, '777');
  res = mkRes();
  await whatsappHandler({ method: 'GET', query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'mal', 'hub.challenge': '1' } }, res);
  assert.equal(res.code, 403);
});

test('whatsapp POST sin firma válida → 401 y no procesa nada', async () => {
  reset();
  const body = Buffer.from(JSON.stringify({ entry: [] }));
  const req = Object.assign((async function* () { yield body; })(), { method: 'POST', headers: { 'x-hub-signature-256': 'sha256=bad' } });
  const res = mkRes();
  await whatsappHandler(req, res);
  assert.equal(res.code, 401);
  assert.equal(calls.gemini.length, 0);
});

test('whatsapp: mensaje de texto → responde, guarda memoria, deduplica reintentos de Meta', async () => {
  reset();
  geminiScript.push(ok({ reply: 'Silhouette filtra la luz.', quick_replies: ['Ver modelos', 'Cotizar'] }));
  const msg = { from: '5493585000001', id: 'wamid.A1', type: 'text', text: { body: 'Hola, info de Silhouette' } };
  assert.equal(await processMessage(msg, 'Ana'), 'replied');
  const sent = calls.wa.find((c) => c.body.type === 'interactive');
  assert.ok(sent, 'usa botones de respuesta rápida');
  assert.equal(sent.body.interactive.action.buttons.length, 2);
  assert.equal(await processMessage(msg, 'Ana'), 'duplicate');
  assert.equal(calls.gemini.length, 1);

  geminiScript.push(ok({ reply: 'Claro.' }));
  await processMessage({ from: '5493585000001', id: 'wamid.A2', type: 'text', text: { body: 'y la Duette?' } }, 'Ana');
  const contents = calls.gemini[1].contents;
  assert.ok(contents.length >= 3, 'el segundo turno incluye el historial');
});

test('whatsapp: handoff → avisa al equipo, el bot se calla y respeta a la persona; /bot lo reactiva', async () => {
  reset();
  const from = '5493585000002';
  geminiScript.push(ok({ reply: 'Te paso con un asesor.', handoff_needed: true, handoff_reason: 'presupuesto', resumen_para_asesor: 'Quiere cotizar Silhouette para living en Río Cuarto', lead: { nombre: 'Luis', interes: 'Silhouette' } }));
  assert.equal(await processMessage({ from, id: 'wamid.B1', type: 'text', text: { body: 'quiero presupuesto' } }, 'Luis'), 'handoff');
  const h = calls.hook.find((x) => x.tipo === 'derivacion');
  assert.ok(h);
  assert.equal(h.secret, 'hook');
  assert.equal(h.chat_link, `https://wa.me/${from}`);
  assert.match(h.resumen, /Silhouette/);

  const before = calls.gemini.length;
  assert.equal(await processMessage({ from, id: 'wamid.B2', type: 'text', text: { body: 'hola??' } }, 'Luis'), 'handoff-active');
  assert.equal(calls.gemini.length, before);

  geminiScript.push(ok({ reply: 'Acá estoy de nuevo.' }));
  assert.equal(await processMessage({ from, id: 'wamid.B3', type: 'text', text: { body: '/bot' } }, 'Luis'), 'replied');
});

test('whatsapp coexistence: si responde una persona desde la app, el bot se pausa; ignora eco propio', async () => {
  reset();
  const from = '5493585000003';
  geminiScript.push(ok({ reply: 'Hola!' }));
  await processMessage({ from, id: 'wamid.C1', type: 'text', text: { body: 'hola' } }, '');
  const botId = calls.wa.at(-1) && 'wamid.OUT' + calls.wa.length;
  assert.equal(await processEcho({ to: from, id: botId, type: 'text', text: { body: 'Hola!' } }), 'own-echo');
  assert.equal(await processEcho({ to: from, id: 'wamid.HUMAN', type: 'text', text: { body: 'Hola, soy Marcela' } }), 'human-took-over');
  assert.equal(await processMessage({ from, id: 'wamid.C2', type: 'text', text: { body: 'gracias' } }, ''), 'handoff-active');
});

test('whatsapp: documentos → respuesta fija sin gastar IA; lead calificado se registra una sola vez', async () => {
  reset();
  assert.equal(await processMessage({ from: '5493585000004', id: 'wamid.D1', type: 'document', document: { id: 'x' } }, ''), 'unsupported-media');
  assert.equal(calls.gemini.length, 0);

  const from = '5493585000005';
  geminiScript.push(ok({ lead: { nombre: 'Sol', interes: 'Toldo Gemini' } }), ok({ lead: { nombre: 'Sol', interes: 'Toldo Gemini' } }));
  await processMessage({ from, id: 'wamid.D2', type: 'text', text: { body: 'soy Sol, toldo gemini' } }, '');
  await processMessage({ from, id: 'wamid.D3', type: 'text', text: { body: 'para mi terraza' } }, '');
  assert.equal(calls.hook.filter((x) => x.tipo === 'lead_calificado').length, 1);
});

test('chat web: valida origen, devuelve handoff con link de WhatsApp y resumen', async () => {
  reset();
  geminiScript.push(ok({ reply: 'Te derivo.', handoff_needed: true, handoff_reason: 'agendar_visita', resumen_para_asesor: 'Quiere visita de medición' }));
  const res = mkRes();
  await chatHandler({ method: 'POST', headers: { origin: 'https://decourban.com.ar', 'x-forwarded-for': '1.2.3.4' }, socket: {}, body: { messages: [{ role: 'bot', text: 'Hola' }, { role: 'user', text: 'quiero que me visiten' }], page: { path: '/contacto.html', title: 'Contacto' }, state: { lead: {} } } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.handoff.reason, 'agendar_visita');
  assert.match(res.body.handoff.wa_link, /^https:\/\/wa\.me\/5493585746196\?text=/);

  const bad = mkRes();
  await chatHandler({ method: 'POST', headers: { origin: 'https://evil.example', 'x-forwarded-for': '1.2.3.5' }, socket: {}, body: { messages: [{ role: 'user', text: 'x' }] } }, bad);
  assert.equal(bad.code, 403);
});

test('lead web: valida datos, honeypot y envía al equipo', async () => {
  reset();
  const h = { origin: 'https://decourban.com.ar', 'x-forwarded-for': '9.9.9.9' };
  let res = mkRes();
  await leadHandler({ method: 'POST', headers: h, socket: {}, body: { nombre: 'Ana', contacto: 'no-valido' } }, res);
  assert.equal(res.code, 400);
  res = mkRes();
  await leadHandler({ method: 'POST', headers: h, socket: {}, body: { nombre: 'Bot', contacto: '3585746196', website: 'spam' } }, res);
  assert.equal(calls.hook.length, 0);
  res = mkRes();
  await leadHandler({ method: 'POST', headers: h, socket: {}, body: { nombre: 'Ana', contacto: '+54 9 358 5000000', resumen: 'Quiere toldo', lead: { interes: 'toldo' } } }, res);
  assert.equal(res.code, 200);
  assert.equal(calls.hook[0].tipo, 'derivacion_web');
});

// ───────── Horarios de atención (L–V 9–18, sáb 9–13, dom cerrado; hora de Córdoba, UTC−3) ─────────
const { openStatus, scheduleText } = await import('../api/_lib/config.js');
const at = (iso) => new Date(iso); // ISO en UTC

test('horarios: abierto / cerrado en los bordes y próxima apertura', () => {
  assert.equal(openStatus(at('2026-10-02T13:00:00Z')).open, true); // vie 10:00
  assert.equal(openStatus(at('2026-10-02T20:59:00Z')).open, true); // vie 17:59
  const vie18 = openStatus(at('2026-10-02T21:00:00Z')); // vie 18:00 → cerrado
  assert.equal(vie18.open, false);
  assert.deepEqual([vie18.next.day, vie18.next.at, vie18.next.tomorrow], ['sábado', '09:00', true]);

  assert.equal(openStatus(at('2026-10-03T15:59:00Z')).open, true); // sáb 12:59
  const sab13 = openStatus(at('2026-10-03T16:00:00Z')); // sáb 13:00 → cerrado
  assert.equal(sab13.open, false);
  assert.deepEqual([sab13.next.day, sab13.next.at], ['lunes', '09:00']);

  const dom = openStatus(at('2026-10-04T14:00:00Z')); // dom 11:00
  assert.equal(dom.open, false);
  assert.equal(dom.next.day, 'lunes');

  const lunTemprano = openStatus(at('2026-10-05T11:30:00Z')); // lun 08:30
  assert.equal(lunTemprano.open, false);
  assert.equal(lunTemprano.next.sameDay, true);
  assert.equal(lunTemprano.next.at, '09:00');
});

test('horarios: texto legible y presente solo en el bot (no en el widget)', async () => {
  assert.equal(scheduleText(), 'lunes a viernes: 09:00 a 18:00 h; sábado: 09:00 a 13:00 h; domingo: cerrado');
  assert.match(KNOWLEDGE, /lunes a viernes de 9 a 18 h/);
  const { readFileSync } = await import('node:fs');
  const widget = readFileSync(new URL('../chat/widget.js', import.meta.url), 'utf8');
  assert.doesNotMatch(widget, /18 ?h|09:00|9 a 18/);
});

test('brain: el contexto trae horario y próxima apertura, y va DESPUÉS del conocimiento (caché de prefijo)', async () => {
  reset();
  geminiScript.push(ok());
  await respond({ history: [], userParts: [{ text: 'hola' }], channel: 'whatsapp', lead: {}, firstMessage: true });
  const sys = calls.gemini[0].systemInstruction.parts[0].text;
  assert.match(sys, /Horario de atención del equipo: lunes a viernes/);
  assert.match(sys, /ABIERTO|FUERA DE HORARIO \(próxima apertura:/);
  assert.ok(sys.indexOf('BASE DE CONOCIMIENTO') < sys.indexOf('CONTEXTO DE ESTA CONVERSACIÓN'));
});
