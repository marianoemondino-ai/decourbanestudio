# Asistente virtual de Decourban Estudio — puesta en marcha

Un solo "cerebro" (`api/_lib/brain.js` + base de conocimiento en `knowledge/`) atiende dos canales:

| Canal | Archivos | Estado |
|---|---|---|
| Chat en la web (todas las páginas) | `chat/widget.js`, `api/chat.js`, `api/lead.js` | Listo. Costo $0. |
| WhatsApp | `api/whatsapp.js`, `api/_lib/wa-flow.js` | Código listo y probado. Ver "Decisión sobre el número" antes de activar. |

Derivación a un asesor: último recurso. El bot responde con la base de conocimiento, califica la consulta (producto, ambiente, zona, medidas) y solo deriva si piden una persona, quieren presupuesto/visita, o es postventa. **Nunca da precios** (el sitio no los publica).

## 1. Servicios gratuitos que se usan
- **Vercel** (ya lo usás): aloja el sitio y las funciones `/api`.
- **Google AI Studio (Gemini)**: la IA. Clave gratuita en https://aistudio.google.com/apikey. Los límites del plan gratuito los muestra tu proyecto; si se agotan, el bot deriva a WhatsApp y avisa al equipo (tope diario configurable con `DAILY_AI_CAP`).
- **Upstash Redis** (plan gratuito, desde Vercel → Storage / Marketplace): memoria de conversaciones de WhatsApp. El chat web no la necesita.
- **Google Apps Script + Hoja de Google**: registro de leads y mail al equipo (paso 4).

## 2. Variables de entorno (Vercel → Settings → Environment Variables)
| Variable | Valor |
|---|---|
| `GEMINI_API_KEY` | clave de AI Studio |
| `GEMINI_MODEL` | opcional; por defecto `gemini-flash-latest` |
| `LEAD_WEBHOOK_URL` / `LEAD_WEBHOOK_SECRET` | URL del Apps Script / un texto secreto largo (paso 4) |
| `BUSINESS_HOURS` | **opcional**. Ya viene cargado: lunes a viernes 9–18, sábados 9–13, domingos cerrado (hora de Córdoba). Solo se usa dentro del bot; el sitio no lo muestra. Para cambiarlo: JSON, ej. `{"lun":["09:00-18:00"],"sab":["09:00-13:00"]}` (días: dom lun mar mie jue vie sab). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | las da Upstash (solo WhatsApp) |
| `WA_ACCESS_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN` | de Meta (solo WhatsApp, paso 5) |

**Nunca** pegues estas claves en el repo ni en el chat.

## 3. Publicar
1. El cambio está en la rama `bot-asistente`. Vercel genera una **vista previa**: probá el chat ahí.
2. Cargá las variables y volvé a desplegar.
3. Si todo está bien, hacé merge a `main` para publicarlo.

## 4. Avisos al equipo (Apps Script)
1. Creá una Hoja de Google nueva → Extensiones → Apps Script → pegá `apps-script/Code.gs`.
2. Configuración del proyecto → Propiedades del script: `SECRET` (el mismo de Vercel) y `NOTIFY_EMAIL` (ej. `ventas@decourban.com.ar`).
3. Implementar → Nueva implementación → Aplicación web → Ejecutar como: tú · Acceso: cualquiera. Copiá la URL a `LEAD_WEBHOOK_URL`.

## 5. WhatsApp — decisión sobre el número (importante)
Datos verificados:
- **Convivencia** (seguir usando la app WhatsApp Business *y* el bot en el mismo número): según la documentación de Meta, solo la habilitan **Solution Partners / Tech Providers**; un negocio no puede hacerlo directo. Sin proveedor, no es gratis.
- **Sin convivencia**: al conectar tu número a la API, deja de funcionar en la app; el equipo necesitaría una bandeja para responder.
- **Costos**: la página oficial de precios de Meta indica que los mensajes dentro de la ventana de 24 h iniciados por el cliente son gratis. Un blog de terceros afirma que desde el 1/10/2026 pasan a cobrarse por mensaje. **No pude confirmarlo en Meta**: verificá en https://developers.facebook.com/docs/whatsapp/pricing antes de activar.

Opciones: (A) dejar WhatsApp como está y usar solo el chat web; (B) un número nuevo solo para el bot; (C) migrar el número actual y resolver cómo responde el equipo. Una vez elegida, los pasos técnicos son: crear app en developers.facebook.com → producto WhatsApp → webhook `https://decourban.com.ar/api/whatsapp` con `WA_VERIFY_TOKEN` → suscribirse al campo `messages`.

## 6. Mantener el conocimiento al día
Editá los `.md` de `knowledge/` y corré `npm run build:knowledge` (regenera `api/_lib/knowledge.generated.js`). Pruebas: `npm test`.

## 7. Privacidad
El plan gratuito de Gemini puede usar el contenido para mejorar productos de Google. Actualizá `privacidad.html` para mencionar el asistente con IA y no pidas datos sensibles por el chat (el bot ya lo evita).
