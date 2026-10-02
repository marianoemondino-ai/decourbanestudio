/* Decourban Estudio — chat asistente (web). Sin dependencias. Shadow DOM para aislar estilos. */
(function () {
  'use strict';
  if (window.__duChat) return;
  window.__duChat = true;

  var WA = '5493585746196';
  var API = '/api/chat';
  var LEAD_API = '/api/lead';
  var KEY = 'du_chat_v1';
  var PRODUCTS = {
    '/silhouette.html': 'la cortina Silhouette', '/duette.html': 'la cortina Duette', '/pirouette.html': 'la cortina Pirouette',
    '/luminette.html': 'la cortina Luminette', '/roller.html': 'la cortina Roller Quantum', '/shadesign.html': 'la Roller Shadesign',
    '/twinline.html': 'la Roller Twinline', '/tradicionales.html': 'las cortinas tradicionales', '/verticales.html': 'las cortinas verticales',
    '/persiana-aluminio.html': 'las persianas de aluminio', '/persiana-madera.html': 'las persianas de madera', '/persiana-vertical.html': 'las persianas verticales',
    '/paneles.html': 'los paneles orientales', '/toldo-gemini.html': 'el toldo Gemini', '/toldo-green.html': 'el toldo Green',
    '/toldo-proyectante.html': 'el toldo proyectante', '/toldos-verticales.html': 'los toldos verticales ZIP', '/isla-alumina.html': 'la pérgola Isla Alumina',
    '/isla-romana.html': 'la pérgola Isla Romana', '/folding-pergola.html': 'la Folding Pergola'
  };

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = load() || { messages: [], state: { lead: {} }, open: false, greeted: false };
  var busy = false;

  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* modo privado */ } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function fmt(text) {
    var h = esc(text);
    h = h.replace(/\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g, function (m, a, b) { return '<strong>' + (a || b) + '</strong>'; });
    h = h.replace(/https:\/\/(?:decourban\.com\.ar|wa\.me)[^\s<)]*/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + (u.indexOf('wa.me') > -1 ? 'WhatsApp' : u.replace('https://', '')) + '</a>';
    });
    return h.replace(/\n/g, '<br>');
  }

  function waLink(t) { return 'https://wa.me/' + WA + (t ? '?text=' + encodeURIComponent(t) : ''); }

  var host = document.createElement('div');
  host.id = 'du-chat-host';
  var root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>' +
    ':host{all:initial}' +
    '*{box-sizing:border-box;margin:0;padding:0;font-family:"Assistant",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif}' +
    '.fab{position:fixed;right:24px;bottom:90px;z-index:2147483000;width:54px;height:54px;border-radius:50%;border:0;background:#111;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:transform .2s}' +
    '.fab:hover{transform:scale(1.07)}.fab:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,a:focus-visible{outline:2px solid #f48534;outline-offset:2px}' +
    '.fab svg{width:24px;height:24px;fill:none;stroke:#fff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}' +
    '.fab .dot{position:absolute;top:10px;right:11px;width:9px;height:9px;border-radius:50%;background:#f48534;border:2px solid #111}' +
    '.tip{position:fixed;right:88px;bottom:98px;z-index:2147483000;background:#fff;color:#111;border:1px solid #e0e0e0;padding:9px 14px;font-size:.88rem;box-shadow:0 4px 16px rgba(0,0,0,.12);display:none;max-width:210px}' +
    '.tip.on{display:block}' +
    '.panel{position:fixed;right:24px;bottom:90px;z-index:2147483001;width:384px;max-width:calc(100vw - 32px);height:min(620px,calc(100vh - 120px));background:#fff;border:1px solid #e0e0e0;box-shadow:0 18px 50px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden}' +
    '.panel.open{display:flex;animation:in .22s ease-out}' +
    '@keyframes in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '@media(prefers-reduced-motion:reduce){.panel.open{animation:none}.typing i{animation:none!important}}' +
    '.hd{background:#111;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px}' +
    '.hd .t{flex:1;min-width:0}.hd b{font-family:"Playfair Display",Georgia,serif;font-weight:400;font-size:1.05rem;letter-spacing:.02em;display:block}' +
    '.hd span{font-size:.74rem;color:#bdbdbd}.hd button{background:none;border:0;color:#fff;cursor:pointer;font-size:1.3rem;line-height:1;padding:4px 8px}' +
    '.msgs{flex:1;overflow-y:auto;padding:16px;background:#fff;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}' +
    '.m{max-width:86%;padding:10px 13px;font-size:.93rem;line-height:1.5;color:#111;overflow-wrap:anywhere}' +
    '.m a{color:#c96c1a}.m.b{background:#f5f5f3;align-self:flex-start;border-radius:2px 12px 12px 12px}' +
    '.m.u{background:#111;color:#fff;align-self:flex-end;border-radius:12px 2px 12px 12px}' +
    '.chips{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:96%}' +
    '.chip{background:#fff;border:1px solid #f48534;color:#c96c1a;padding:7px 12px;font-size:.84rem;cursor:pointer;border-radius:18px}.chip:hover{background:#fde8cc}' +
    '.typing{align-self:flex-start;background:#f5f5f3;padding:12px 14px;border-radius:2px 12px 12px 12px;display:flex;gap:4px}' +
    '.typing i{width:6px;height:6px;border-radius:50%;background:#888;animation:b 1.1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}' +
    '@keyframes b{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}' +
    '.card{border:1px solid #e0e0e0;background:#fafaf8;padding:12px;align-self:stretch;display:flex;flex-direction:column;gap:8px;font-size:.88rem}' +
    '.card .wa{background:#25D366;color:#fff;text-decoration:none;text-align:center;padding:10px;font-weight:700;border-radius:2px}' +
    '.card .alt{background:none;border:0;color:#555;text-decoration:underline;cursor:pointer;font-size:.84rem}' +
    '.card input{border:1px solid #cfcfcf;padding:9px;font-size:.9rem;width:100%}.card .go{background:#111;color:#fff;border:0;padding:10px;cursor:pointer;font-weight:700}' +
    '.hp{position:absolute;left:-9999px;opacity:0}' +
    '.ft{border-top:1px solid #e0e0e0;padding:10px 12px 8px;background:#fff}' +
    '.row{display:flex;gap:8px;align-items:flex-end}' +
    'textarea{flex:1;resize:none;border:1px solid #cfcfcf;padding:10px;font-size:.93rem;max-height:110px;min-height:42px;line-height:1.4;border-radius:2px}' +
    '.send{background:#f48534;color:#fff;border:0;width:42px;height:42px;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:2px}.send:disabled{opacity:.45;cursor:default}' +
    '.send svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.meta{display:flex;justify-content:space-between;gap:8px;margin-top:7px;font-size:.72rem;color:#777;flex-wrap:wrap}.meta a{color:#555}' +
    '@media(max-width:520px){.panel{right:0;bottom:0;left:0;width:100%;max-width:100%;height:100%;max-height:100%;border:0}.fab{right:16px;bottom:84px}.tip{display:none!important}}' +
    '</style>' +
    '<div class="tip" id="tip" role="status"></div>' +
    '<button class="fab" id="fab" aria-label="Abrir chat con el asistente de Decourban" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span class="dot" aria-hidden="true"></span></button>' +
    '<section class="panel" id="panel" role="dialog" aria-label="Asistente virtual de Decourban Estudio">' +
    '<div class="hd"><div class="t"><b>Decourban Estudio</b><span>Asistente virtual · respuestas al instante</span></div><button id="close" aria-label="Cerrar chat">×</button></div>' +
    '<div class="msgs" id="msgs" aria-live="polite"></div>' +
    '<div class="ft"><form class="row" id="form"><textarea id="inp" rows="1" maxlength="1000" placeholder="Escribí tu consulta…" aria-label="Tu mensaje"></textarea>' +
    '<button class="send" id="send" type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>' +
    '<div class="meta"><a id="human" href="#" target="_blank" rel="noopener noreferrer">Hablar con una persona</a><span>Asistente con IA · <a href="/privacidad.html" target="_blank">Privacidad</a></span></div></div>' +
    '</section>';

  var $ = function (id) { return root.getElementById(id); };
  var fab = $('fab'), panel = $('panel'), msgs = $('msgs'), inp = $('inp'), send = $('send'), tip = $('tip');
  $('human').href = waLink('Hola, quiero hablar con un asesor de Decourban');

  function scroll() { msgs.scrollTop = msgs.scrollHeight; }
  function addMsg(role, text, persist) {
    var d = document.createElement('div');
    d.className = 'm ' + (role === 'user' ? 'u' : 'b');
    d.innerHTML = fmt(text);
    msgs.appendChild(d);
    if (persist !== false) { st.messages.push({ role: role, text: text }); save(); }
    scroll();
  }
  function clearChips() { var c = msgs.querySelectorAll('.chips,.card'); for (var i = 0; i < c.length; i++) c[i].remove(); }
  function addChips(list) {
    if (!list || !list.length) return;
    var w = document.createElement('div'); w.className = 'chips';
    list.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t;
      b.onclick = function () { ask(t); }; w.appendChild(b);
    });
    msgs.appendChild(w); scroll();
  }
  function typing(on) {
    var t = msgs.querySelector('.typing');
    if (on && !t) { t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; t.setAttribute('aria-label', 'Escribiendo'); msgs.appendChild(t); scroll(); }
    if (!on && t) t.remove();
  }

  function handoffCard(h) {
    var c = document.createElement('div'); c.className = 'card';
    c.innerHTML = '<div>Un asesor del equipo puede continuar con tu consulta:</div>' +
      '<a class="wa" target="_blank" rel="noopener noreferrer" href="' + esc(h.wa_link) + '">Continuar por WhatsApp</a>' +
      '<button class="alt" type="button">Prefiero que me contacten</button>';
    c.querySelector('.alt').onclick = function () { leadForm(c, h); };
    msgs.appendChild(c); scroll();
  }
  function leadForm(c, h) {
    c.innerHTML = '<div>Dejanos tus datos y te contactamos.</div>' +
      '<input id="ln" placeholder="Nombre" autocomplete="name" maxlength="80">' +
      '<input id="lc" placeholder="WhatsApp o email" autocomplete="tel" maxlength="120">' +
      '<input class="hp" id="lw" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="go" type="button">Enviar mis datos</button><div id="lm" role="status"></div>';
    c.querySelector('.go').onclick = function () {
      var n = c.querySelector('#ln').value, k = c.querySelector('#lc').value, m = c.querySelector('#lm');
      fetch(LEAD_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: n, contacto: k, website: c.querySelector('#lw').value, motivo: h.reason, resumen: h.summary, lead: st.state.lead, page: { path: location.pathname } })
      }).then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); }).then(function (x) {
        if (x.r.ok && x.j.ok) { c.innerHTML = '<div><strong>¡Gracias!</strong> Recibimos tus datos y el equipo te contacta en horario de atención.</div>'; }
        else m.textContent = x.j.message || 'No pudimos enviarlo. Probá por WhatsApp, por favor.';
      }).catch(function () { m.textContent = 'No pudimos enviarlo. Probá por WhatsApp, por favor.'; });
    };
  }

  function ask(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    clearChips(); addMsg('user', text);
    inp.value = ''; inp.style.height = 'auto'; busy = true; send.disabled = true; typing(true);
    var ctrl = new AbortController(); var to = setTimeout(function () { ctrl.abort(); }, 35000);
    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ messages: st.messages.slice(-14), state: st.state, page: { path: location.pathname, title: document.title.split('|')[0].split('—')[0].trim() } })
    }).then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); }).then(function (x) {
      typing(false);
      if (x.r.status === 429) { addMsg('bot', x.j.reply || 'Probá de nuevo en un momento.'); return; }
      if (!x.r.ok || !x.j.reply) throw new Error('bad');
      addMsg('bot', x.j.reply);
      st.state = x.j.state || st.state; save();
      if (x.j.handoff) handoffCard(x.j.handoff); else addChips(x.j.quick_replies);
    }).catch(function () {
      typing(false);
      addMsg('bot', 'Disculpá, no pude responder en este momento. Podés escribirnos por WhatsApp y te atendemos: ' + waLink('Hola, quiero hacer una consulta'), false);
    }).then(function () { clearTimeout(to); busy = false; send.disabled = false; inp.focus(); });
  }

  function greet() {
    var p = PRODUCTS[location.pathname.replace(/\/+$/, '') || '/'] || null;
    addMsg('bot', 'Hola, soy el asistente virtual de Decourban Estudio. ' + (p ? 'Veo que estás mirando ' + p + '. Contame para qué espacio la pensás y te oriento.' : 'Contame qué espacio querés transformar y te oriento.'));
    st.greeted = true; save();
  }
  function restore() {
    msgs.innerHTML = '';
    if (!st.messages.length) { greet(); return; }
    st.messages.forEach(function (m) { addMsg(m.role, m.text, false); });
  }

  function open() {
    panel.classList.add('open'); fab.style.display = 'none'; tip.classList.remove('on'); fab.setAttribute('aria-expanded', 'true');
    st.open = true; save(); if (!msgs.children.length) restore(); setTimeout(function () { inp.focus(); scroll(); }, 30);
  }
  function close() { panel.classList.remove('open'); fab.style.display = 'flex'; fab.setAttribute('aria-expanded', 'false'); st.open = false; save(); fab.focus(); }

  fab.onclick = open; $('close').onclick = close;
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && st.open) close(); });
  $('form').onsubmit = function (e) { e.preventDefault(); ask(inp.value); };
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inp.value); } });
  inp.addEventListener('input', function () { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 110) + 'px'; });

  function mount() {
    document.body.appendChild(host);
    if (st.open) open();
    else if (!st.messages.length && !sessionStorage.getItem('du_tip')) {
      setTimeout(function () {
        if (st.open) return; tip.textContent = '¿Te ayudo a elegir? Respondo al instante.'; tip.classList.add('on');
        try { sessionStorage.setItem('du_tip', '1'); } catch (e) { /* noop */ }
        setTimeout(function () { tip.classList.remove('on'); }, 9000);
      }, reduce ? 12000 : 7000);
    }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
