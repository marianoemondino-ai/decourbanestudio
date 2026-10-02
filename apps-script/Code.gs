/**
 * Decourban — receptor de leads y derivaciones del bot (Google Apps Script, gratis).
 *
 * Qué hace: recibe avisos del bot (POST JSON), los guarda en una Hoja de Google y manda un mail al equipo
 * cuando hay una derivación a un asesor. Guía de instalación: ver SETUP.md, paso 4.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   SECRET        → el mismo valor que LEAD_WEBHOOK_SECRET en Vercel
 *   NOTIFY_EMAIL  → destinatarios separados por coma (ej: ventas@decourban.com.ar)
 */
var HEADERS = ['Fecha', 'Tipo', 'Canal', 'Nombre', 'Nombre perfil WA', 'Teléfono / contacto', 'Interés', 'Ambiente', 'Ciudad', 'Medidas', 'Motorización', 'Tipo de obra', 'Urgencia', 'Motivo', 'Resumen para el asesor', 'Link al chat', 'Página'];
var MAIL_TYPES = { derivacion: 1, derivacion_web: 1, recordatorio: 1, error_bot: 1 };

function doPost(e) {
  var out = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  try {
    var d = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    if (!props.getProperty('SECRET') || d.secret !== props.getProperty('SECRET')) return out({ ok: false, error: 'unauthorized' });

    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold'); }

    var l = d.lead || {};
    var row = [new Date(), d.tipo || '', d.canal || '', d.nombre || l.nombre || '', d.nombre_perfil || '', d.telefono || d.contacto || l.contacto || '',
      l.interes || '', l.ambiente || '', l.ciudad || '', l.medidas || '', l.motorizacion || '', l.tipo_obra || '', l.urgencia || '',
      d.motivo || '', d.resumen || '', d.chat_link || '', d.pagina || ''];
    // Evita formulas inyectadas desde el chat
    row = row.map(function (c) { return (typeof c === 'string' && /^[=+\-@]/.test(c)) ? "'" + c : c; });
    sh.appendRow(row);

    if (MAIL_TYPES[d.tipo]) {
      var to = props.getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail();
      var asunto = { derivacion: 'Cliente derivado a asesor', derivacion_web: 'Contacto desde el chat web', recordatorio: 'Cliente esperando atención', error_bot: 'El bot no pudo responder' }[d.tipo];
      var cuerpo = [
        'Canal: ' + (d.canal || ''), 'Nombre: ' + (row[3] || row[4] || '(sin nombre)'), 'Contacto: ' + row[5],
        'Interés: ' + row[6], 'Ambiente: ' + row[7], 'Ciudad: ' + row[8], 'Medidas: ' + row[9], 'Motivo: ' + row[13], '',
        'Resumen:', row[14], '', d.chat_link ? 'Abrir chat: ' + d.chat_link : ''
      ].join('\n');
      MailApp.sendEmail(to, '[Decourban bot] ' + asunto + (row[3] ? ' — ' + row[3] : ''), cuerpo);
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}
