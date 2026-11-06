/* FamProfiles — child profiles + progress storage for the family dashboards.
 *
 * This file is PUBLIC code only. All data (profile names, progress) lives in the
 * private GitHub repo the user connects to (default rfleiro/FamilyOps) and in this
 * browser's localStorage. Nothing is ever written to the public dashboards repo.
 *
 * Layout in the private repo:
 *   tablas/profiles.json        list of profiles (legacy location, shared by all apps)
 *   <app>/p-<id>.json           one progress file per profile per app
 *
 * Usage:
 *   FamProfiles.init({app, lang:()=>'es', defaults, normalize, merge, onLoad, onData});
 *   FamProfiles.save(data); FamProfiles.flush(); FamProfiles.openPicker();
 *   FamProfiles.chip() / FamProfiles.syncEl()  -> elements to place in the page
 */
(function (global) {
  'use strict';

  var KEYS = { conn: 'tablas:conn', last: 'tablas:last' };   // shared with the tablas page
  var PROFILES_PATH = 'tablas/profiles.json';                 // legacy location, kept on purpose
  var COLORS = ['#d6403b', '#1f4fd1', '#1f8a4c', '#c27a0e', '#7a4fd1', '#0e8fa8'];

  var T = {
    es: {
      connectTitle: 'Conecta tu repositorio privado',
      connectInfo: 'El progreso de cada niño se guarda en tu repositorio privado, nunca en la web pública. El token se queda solo en este navegador.',
      repo: 'Repositorio', token: 'Token de GitHub', connect: 'Conectar', guest: 'Jugar sin guardar',
      checking: 'Comprobando…', errFields: 'Escribe el repositorio (usuario/nombre) y el token.',
      err401: 'El token no es válido.', err404: 'No encuentro ese repositorio con ese token.',
      errHttp: 'GitHub respondió ', errPublic: 'Ese repositorio es público. Usa uno privado: aquí se guardan datos de los niños.',
      errPush: 'El token no puede escribir (necesita Contents: lectura y escritura).', errNet: 'No se pudo conectar. ¿Hay internet?',
      whoTitle: '¿Quién juega?', loading: 'Cargando…', none: 'Aún no hay nadie. Añade a la primera persona.',
      add: '+ Añadir niño/a', name: 'Nombre', addOk: 'Añadir', cancel: 'Cancelar', saving: 'Guardando…',
      errAdd: 'No se pudo guardar el perfil. Revisa la conexión.', errLoad: 'No se pudo cargar el perfil. Revisa la conexión.',
      errList: 'No se pudo leer tu repositorio. Revisa la conexión o el token.', retry: 'Reintentar',
      disconnect: 'Desconectar este navegador', disconnectAsk: '¿Desconectar este navegador? Los datos siguen guardados en tu repositorio.',
      s_ok: '☁ guardado en tu repositorio privado', s_saving: '☁ guardando…', s_dirty: '☁ cambios pendientes de guardar',
      s_error: '⚠ no se pudo guardar; se reintentará', s_guest: 'Solo en este navegador (invitado)', guestName: 'Invitado',
      importAsk: function (n) { return '¿Importar a ' + n + ' el progreso guardado en este navegador?'; }
    },
    en: {
      connectTitle: 'Connect your private repository',
      connectInfo: "Each child's progress is saved in your private repository, never on the public site. The token stays in this browser only.",
      repo: 'Repository', token: 'GitHub token', connect: 'Connect', guest: 'Play without saving',
      checking: 'Checking…', errFields: 'Enter the repository (user/name) and the token.',
      err401: 'The token is not valid.', err404: "Can't find that repository with that token.",
      errHttp: 'GitHub answered ', errPublic: 'That repository is public. Use a private one: children’s data is stored here.',
      errPush: "The token can't write (it needs Contents: read and write).", errNet: "Couldn't connect. Is there internet?",
      whoTitle: "Who's playing?", loading: 'Loading…', none: 'Nobody yet. Add the first person.',
      add: '+ Add child', name: 'Name', addOk: 'Add', cancel: 'Cancel', saving: 'Saving…',
      errAdd: "Couldn't save the profile. Check the connection.", errLoad: "Couldn't load the profile. Check the connection.",
      errList: "Couldn't read your repository. Check the connection or the token.", retry: 'Retry',
      disconnect: 'Disconnect this browser', disconnectAsk: 'Disconnect this browser? The data stays in your repository.',
      s_ok: '☁ saved in your private repository', s_saving: '☁ saving…', s_dirty: '☁ changes waiting to be saved',
      s_error: "⚠ couldn't save; will retry", s_guest: 'This browser only (guest)', guestName: 'Guest',
      importAsk: function (n) { return 'Import the progress saved in this browser into ' + n + "'s profile?"; }
    },
    gl: {
      connectTitle: 'Conecta o teu repositorio privado',
      connectInfo: 'O progreso de cada neno gárdase no teu repositorio privado, nunca na web pública. O token queda só neste navegador.',
      repo: 'Repositorio', token: 'Token de GitHub', connect: 'Conectar', guest: 'Xogar sen gardar',
      checking: 'Comprobando…', errFields: 'Escribe o repositorio (usuario/nome) e o token.',
      err401: 'O token non é válido.', err404: 'Non atopo ese repositorio con ese token.',
      errHttp: 'GitHub respondeu ', errPublic: 'Ese repositorio é público. Usa un privado: aquí gárdanse datos dos nenos.',
      errPush: 'O token non pode escribir (precisa Contents: lectura e escritura).', errNet: 'Non se puido conectar. Hai internet?',
      whoTitle: 'Quen xoga?', loading: 'Cargando…', none: 'Aínda non hai ninguén. Engade a primeira persoa.',
      add: '+ Engadir neno/a', name: 'Nome', addOk: 'Engadir', cancel: 'Cancelar', saving: 'Gardando…',
      errAdd: 'Non se puido gardar o perfil. Revisa a conexión.', errLoad: 'Non se puido cargar o perfil. Revisa a conexión.',
      errList: 'Non se puido ler o teu repositorio. Revisa a conexión ou o token.', retry: 'Reintentar',
      disconnect: 'Desconectar este navegador', disconnectAsk: 'Desconectar este navegador? Os datos seguen gardados no teu repositorio.',
      s_ok: '☁ gardado no teu repositorio privado', s_saving: '☁ gardando…', s_dirty: '☁ cambios pendentes de gardar',
      s_error: '⚠ non se puido gardar; reintentarase', s_guest: 'Só neste navegador (convidado)', guestName: 'Convidado',
      importAsk: function (n) { return 'Importar a ' + n + ' o progreso gardado neste navegador?'; }
    }
  };

  var opts = null, conn = null, profiles = [], active = null, data = null, remoteSha = null;
  var dirty = false, ver = 0, saving = false, flushT = null, pendingImport = null;
  var ui = {}, syncState = 'off';

  function tr(k) { var l = (opts && opts.lang && opts.lang()) || 'es'; var d = T[l] || T.es; return d[k] !== undefined ? d[k] : T.es[k]; }
  function rj(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function cacheKey(id) { return opts.app + ':cache:' + id; }
  function pfile(id) { return opts.app + '/p-' + id + '.json'; }

  /* ── GitHub contents API (private repo only) ── */
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s) { return decodeURIComponent(escape(atob(s.replace(/\n/g, '')))); }
  function api(method, path, body) {
    var o = { method: method, cache: 'no-store', headers: { 'Authorization': 'Bearer ' + conn.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' } };
    if (body) { o.body = JSON.stringify(body); if (o.body.length < 60000) o.keepalive = true; }
    return fetch('https://api.github.com/repos/' + conn.repo + '/contents/' + path, o).then(function (r) {
      return r.text().then(function (tx) { var j = {}; try { j = JSON.parse(tx); } catch (e) { } return { status: r.status, json: j }; });
    });
  }
  function getJSON(path) {
    return api('GET', path).then(function (r) {
      if (r.status === 404) return null;
      if (r.status !== 200) throw new Error('GitHub ' + r.status);
      return { data: JSON.parse(b64d(r.json.content)), sha: r.json.sha };
    });
  }
  function putJSON(path, obj, sha, msg) {
    var b = { message: msg, content: b64e(JSON.stringify(obj, null, 1)) }; if (sha) b.sha = sha;
    return api('PUT', path, b);
  }
  function loadProfiles() {
    return getJSON(PROFILES_PATH).then(function (r) { profiles = (r && r.data.profiles) || []; return profiles; });
  }
  function updateProfiles(mut, msg, n) {
    n = n || 0;
    return getJSON(PROFILES_PATH).then(function (r) {
      var list = mut(r && r.data.profiles ? r.data.profiles.slice() : []);
      return putJSON(PROFILES_PATH, { profiles: list }, r ? r.sha : null, msg).then(function (w) {
        if (w.status === 200 || w.status === 201) { profiles = list; return list; }
        if ((w.status === 409 || w.status === 422) && n < 2) return updateProfiles(mut, msg, n + 1);
        throw new Error('GitHub ' + w.status);
      });
    });
  }
  function slug(n) {
    var s = String(n).toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { }
    s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'p';
  }

  /* ── saving: local cache now, grouped push to the private repo ── */
  function setSync(s) {
    syncState = s;
    if (ui.sync) { ui.sync.textContent = s === 'off' ? '' : tr('s_' + s); ui.sync.classList.toggle('err', s === 'error'); }
  }
  function save(d) {
    if (d) data = d;
    if (!active) return;
    if (active === 'guest') { wj(opts.app + ':guest', data); return; }
    ver++; dirty = true;
    wj(cacheKey(active.id), { data: data, dirty: true });
    setSync('dirty');
    if (!flushT) flushT = setTimeout(flush, 15000);
  }
  function flush() {
    clearTimeout(flushT); flushT = null;
    if (!active || active === 'guest' || !conn || !dirty || saving) return Promise.resolve();
    saving = true; setSync('saving');
    var me = active, path = pfile(me.id);
    function attempt(n) {
      var v = ver;
      return putJSON(path, data, remoteSha, opts.app + ': ' + me.name).then(function (r) {
        if (r.status === 200 || r.status === 201) {
          remoteSha = r.json.content.sha;
          if (ver === v) { dirty = false; wj(cacheKey(me.id), { data: data, dirty: false }); setSync('ok'); }
          else { setSync('dirty'); flushT = setTimeout(flush, 3000); }
          return;
        }
        if ((r.status === 409 || r.status === 422) && n < 2) {
          return getJSON(path).then(function (rem) {
            if (rem) { data = opts.merge(rem.data, data); remoteSha = rem.sha; if (opts.onData) opts.onData(data); } else remoteSha = null;
            ver++; return attempt(n + 1);
          });
        }
        throw new Error('HTTP ' + r.status);
      });
    }
    return attempt(0).then(function () { saving = false; }, function () { saving = false; setSync('error'); if (!flushT) flushT = setTimeout(flush, 30000); });
  }

  /* ── UI (overlay for connect / who + chip) ── */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function avatar(name, color) {
    var a = h('span', { 'class': 'fam-av', text: (name || '?').trim().charAt(0).toUpperCase() });
    a.style.background = color; return a;
  }
  function injectCSS() {
    if (document.getElementById('fam-css')) return;
    var st = document.createElement('style'); st.id = 'fam-css';
    st.textContent = [
      '.fam-ov{position:fixed;inset:0;z-index:50;background:var(--paper,var(--bg,#f5f4ef));display:grid;place-items:center;padding:16px;overflow:auto;color:var(--ink,#1c2230);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
      '.fam-ov[hidden]{display:none}',
      '.fam-card{width:min(460px,100%);background:var(--card,var(--panel,#fff));border:1px solid var(--line,#dedbd1);border-radius:16px;padding:18px}',
      '.fam-card h2{margin:0 0 8px;font-size:19px}',
      '.fam-hint{color:var(--muted,#697181);font-size:13px;margin:0 0 12px}',
      '.fam-card label{display:block;font-size:13px;color:var(--muted,#697181);margin-bottom:10px}',
      '.fam-card input{display:block;width:100%;margin-top:4px;font:inherit;color:var(--ink,#1c2230);background:var(--bg,var(--paper,#f5f4ef));border:1px solid var(--line,#dedbd1);border-radius:10px;padding:9px 11px}',
      '.fam-err{min-height:20px;font-size:13.5px;color:var(--bad,var(--cap,#c0262d));margin-bottom:6px}',
      '.fam-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}',
      '.fam-btn{font:inherit;font-weight:600;border:1px solid var(--line,#dedbd1);background:var(--chip,#eceae2);color:var(--ink,#1c2230);padding:9px 14px;border-radius:10px;cursor:pointer}',
      '.fam-btn.p{background:var(--blue,var(--accent,#1f4fd1));border-color:var(--blue,var(--accent,#1f4fd1));color:#fff}',
      '.fam-btn.g{background:transparent}',
      '.fam-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:6px}',
      '.fam-prof{display:flex;align-items:center;gap:10px;font:inherit;font-weight:700;font-size:16px;border:1.5px solid var(--line,#dedbd1);background:var(--card,var(--panel,#fff));color:inherit;border-radius:12px;padding:10px;cursor:pointer;text-align:left}',
      '.fam-prof:hover{border-color:var(--blue,var(--accent,#1f4fd1))}',
      '.fam-av{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;flex:none}',
      '.fam-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line,#dedbd1);background:var(--card,var(--panel,#fff));color:var(--ink,#1c2230);border-radius:999px;padding:2px 11px 2px 3px;cursor:pointer;font:600 13px system-ui,sans-serif}',
      '.fam-chip .fam-av{width:24px;height:24px;font-size:12px}',
      '.fam-sync{font-size:12px;color:var(--muted,#697181)}.fam-sync.err{color:var(--bad,var(--cap,#c0262d))}',
      '.fam-foot{margin-top:14px;display:flex;gap:12px;flex-wrap:wrap}',
      '.fam-foot button{background:none;border:0;color:var(--muted,#697181);text-decoration:underline;cursor:pointer;font:inherit;font-size:12.5px;padding:0}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function buildUI() {
    ui.ov = h('div', { 'class': 'fam-ov', hidden: '' });
    ui.card = h('div', { 'class': 'fam-card' });
    ui.ov.appendChild(ui.card);
    document.body.appendChild(ui.ov);
    ui.chip = h('button', { 'class': 'fam-chip', type: 'button', hidden: '' });
    ui.chip.onclick = function () { openPicker(); };
    ui.sync = h('span', { 'class': 'fam-sync' });
  }
  function updateChip() {
    var c = ui.chip; if (!c) return;
    if (!active) { c.hidden = true; return; }
    c.hidden = false; c.innerHTML = '';
    c.appendChild(avatar(active === 'guest' ? tr('guestName') : active.name, active === 'guest' ? '#69738a' : active.color));
    c.appendChild(document.createTextNode(active === 'guest' ? tr('guestName') : active.name));
  }
  function showOv(on) { ui.ov.hidden = !on; }
  function card(title) { ui.card.innerHTML = ''; ui.card.appendChild(h('h2', { text: title })); return ui.card; }

  function openConnect() {
    var c = card(tr('connectTitle')), repo, tok, err;
    c.appendChild(h('p', { 'class': 'fam-hint', text: tr('connectInfo') }));
    repo = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: 'rfleiro/FamilyOps' });
    tok = h('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'github_pat_…' });
    c.appendChild(h('label', { text: tr('repo') }, [repo]));
    c.appendChild(h('label', { text: tr('token') }, [tok]));
    err = h('div', { 'class': 'fam-err', role: 'status' }); c.appendChild(err);
    function fail(m) { conn = rj(KEYS.conn); err.textContent = m; }
    var go = h('button', { 'class': 'fam-btn p', type: 'button', text: tr('connect') });
    go.onclick = function () {
      var r = repo.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, ''), tk = tok.value.trim();
      if (!/^[\w.-]+\/[\w.-]+$/.test(r) || !tk) { err.textContent = tr('errFields'); return; }
      err.textContent = tr('checking');
      fetch('https://api.github.com/repos/' + r, { cache: 'no-store', headers: { 'Authorization': 'Bearer ' + tk, 'Accept': 'application/vnd.github+json' } })
        .then(function (res) { return res.json().then(function (j) { return { s: res.status, j: j }; }); })
        .then(function (x) {
          if (x.s === 401) return fail(tr('err401'));
          if (x.s === 404) return fail(tr('err404'));
          if (x.s !== 200) return fail(tr('errHttp') + x.s + '.');
          if (x.j.private !== true) return fail(tr('errPublic'));
          if (x.j.permissions && x.j.permissions.push === false) return fail(tr('errPush'));
          conn = { repo: r, token: tk }; wj(KEYS.conn, conn); tok.value = '';
          openWho(true);
        })
        .catch(function () { fail(tr('errNet')); });
    };
    var gb = h('button', { 'class': 'fam-btn g', type: 'button', text: tr('guest') });
    gb.onclick = guest;
    c.appendChild(h('div', { 'class': 'fam-row' }, [go, gb]));
    showOv(true);
  }
  function guest() {
    active = 'guest'; data = opts.normalize(rj(opts.app + ':guest') || (opts.legacy && opts.legacy()));
    setSync('guest'); updateChip(); showOv(false); opts.onLoad(data, 'guest');
  }
  function openWho(auto) {
    var c = card(tr('whoTitle')), msg = h('div', { 'class': 'fam-hint', text: tr('loading') }), list = h('div', { 'class': 'fam-list' });
    c.appendChild(msg); c.appendChild(list);
    showOv(true);
    function render() {
      list.innerHTML = '';
      profiles.forEach(function (p) {
        var b = h('button', { 'class': 'fam-prof', type: 'button' }, [avatar(p.name, p.color), h('span', { text: p.name })]);
        b.onclick = function () { select(p); };
        list.appendChild(b);
      });
      msg.textContent = profiles.length ? '' : tr('none');
      var addRow = h('div', { 'class': 'fam-row', hidden: '' }), nm = h('input', { type: 'text', maxlength: '24', placeholder: tr('name'), autocomplete: 'off' });
      var ok = h('button', { 'class': 'fam-btn p', type: 'button', text: tr('addOk') });
      var cn = h('button', { 'class': 'fam-btn g', type: 'button', text: tr('cancel') });
      addRow.appendChild(nm); addRow.appendChild(ok); addRow.appendChild(cn);
      var add = h('button', { 'class': 'fam-btn', type: 'button', text: tr('add') });
      add.onclick = function () { addRow.hidden = false; nm.value = ''; nm.focus(); };
      cn.onclick = function () { addRow.hidden = true; };
      function doAdd() {
        var name = nm.value.trim(); if (!name) return;
        var p = { id: slug(name) + '-' + Math.random().toString(36).slice(2, 6), name: name, color: COLORS[profiles.length % COLORS.length] };
        msg.textContent = tr('saving');
        updateProfiles(function (l) { l.push(p); return l; }, 'profiles: add').then(function () {
          var lg = opts.legacy && opts.legacy();
          if (profiles.length === 1 && lg && opts.hasLegacy && opts.hasLegacy(lg) && confirm(tr('importAsk')(name))) pendingImport = opts.normalize(lg);
          select(p);
        }).catch(function () { msg.textContent = tr('errAdd'); });
      }
      ok.onclick = doAdd;
      nm.addEventListener('keydown', function (e) { if (e.key === 'Enter') doAdd(); });
      var row = h('div', { 'class': 'fam-row' }, [add]);
      if (active) { var back = h('button', { 'class': 'fam-btn g', type: 'button', text: tr('cancel') }); back.onclick = function () { showOv(false); }; row.appendChild(back); }
      c.appendChild(addRow); c.appendChild(row);
      var gb = h('button', { type: 'button', text: tr('guest') }); gb.onclick = guest;
      var db = h('button', { type: 'button', text: tr('disconnect') });
      db.onclick = function () {
        if (!confirm(tr('disconnectAsk'))) return;
        try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(':cache:') > 0) localStorage.removeItem(k); }); localStorage.removeItem(KEYS.conn); localStorage.removeItem(KEYS.last); } catch (e) { }
        conn = null; active = null; profiles = []; dirty = false; updateChip(); setSync('off'); openConnect();
      };
      c.appendChild(h('div', { 'class': 'fam-foot' }, [gb, db]));
    }
    loadProfiles().then(function () {
      var last = null; try { last = localStorage.getItem(KEYS.last); } catch (e) { }
      var p = auto && profiles.filter(function (x) { return x.id === last; })[0];
      if (p) { select(p); return; }
      render();
    }).catch(function () {
      msg.textContent = tr('errList');
      var rb = h('button', { 'class': 'fam-btn', type: 'button', text: tr('retry') }); rb.onclick = function () { openWho(auto); };
      list.appendChild(rb);
    });
  }
  function select(p) {
    var c = card(tr('whoTitle')); c.appendChild(h('div', { 'class': 'fam-hint', text: tr('loading') })); showOv(true);
    var cache = rj(cacheKey(p.id));
    getJSON(pfile(p.id)).then(function (r) {
      var s = r ? opts.normalize(r.data) : null; remoteSha = r ? r.sha : null; dirty = false;
      if (cache && cache.dirty && cache.data) { s = s ? opts.merge(s, cache.data) : opts.normalize(cache.data); dirty = true; }
      if (!s && pendingImport) { s = pendingImport; dirty = true; }
      pendingImport = null;
      begin(p, s || opts.defaults());
    }).catch(function () {
      if (cache && cache.data) { remoteSha = null; dirty = !!cache.dirty; begin(p, opts.normalize(cache.data)); setSync('error'); }
      else { card(tr('whoTitle')).appendChild(h('div', { 'class': 'fam-err', text: tr('errLoad') })); setTimeout(function () { openWho(false); }, 2500); }
    });
  }
  function begin(p, d) {
    active = p; data = d; ver++;
    try { localStorage.setItem(KEYS.last, p.id); } catch (e) { }
    setSync(dirty ? 'dirty' : 'ok'); updateChip(); showOv(false);
    if (dirty) { wj(cacheKey(p.id), { data: data, dirty: true }); clearTimeout(flushT); flushT = setTimeout(flush, 1500); }
    opts.onLoad(data, p);
  }
  function openPicker() { flush().then(function () { if (!conn) openConnect(); else openWho(false); }); }

  function init(o) {
    opts = o; conn = rj(KEYS.conn);
    injectCSS(); buildUI();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
    window.addEventListener('pagehide', function () { flush(); });
    if (!conn) openConnect(); else openWho(true);
  }
  function relang() { updateChip(); setSync(syncState); }

  global.FamProfiles = {
    init: init, save: save, flush: flush, openPicker: openPicker, relang: relang,
    current: function () { return active; }, chip: function () { return ui.chip; }, syncEl: function () { return ui.sync; }
  };
})(window);
