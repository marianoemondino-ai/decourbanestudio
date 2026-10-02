// Avisos al equipo y registro de leads → Google Apps Script (gratis): escribe en una Hoja y manda mail a ventas@.
// Ver apps-script/Code.gs y SETUP.md.
export async function notifyTeam(payload) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    console.warn('LEAD_WEBHOOK_URL no configurada: aviso al equipo no enviado', payload.tipo);
    return false;
  }
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS en Apps Script
      body: JSON.stringify({ secret: process.env.LEAD_WEBHOOK_SECRET || '', ...payload }),
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    return r.ok;
  } catch (e) {
    console.error('notifyTeam', e.message);
    return false;
  }
}
