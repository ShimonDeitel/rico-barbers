import { createClient } from './vendor/supabase.js';
import { STRINGS } from './i18n.js';

const SUPABASE_URL = 'https://vbhjrcakyhpexmntjgxd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Uxqwb3XTyEamTMOO9nE4Qw_RgI0vrxX';
const TZ = 'Asia/Jerusalem';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

const view = document.getElementById('view');
const whoami = document.getElementById('whoami');
const outBtn = document.getElementById('outBtn');
const homeBtn = document.getElementById('homeBtn');
const langBtn = document.getElementById('langBtn');
const brandEl = document.getElementById('brand');

/* ---------------- state ---------------- */
let state = { portal: null, session: null, role: 'customer', profile: null, lang: 'he' };
const PORTAL_KEY = 'bs.portal';
const LANG_KEY = 'bs.lang';
try {
  state.portal = localStorage.getItem(PORTAL_KEY) || null;
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'he' || saved === 'en') state.lang = saved;
} catch (e) { /* private mode */ }

function setPortal(p) {
  state.portal = p;
  try { p ? localStorage.setItem(PORTAL_KEY, p) : localStorage.removeItem(PORTAL_KEY); } catch (e) { /* ignore */ }
}

/** The active dictionary. */
let T = STRINGS[state.lang];

async function setLang(l) {
  if (l !== 'he' && l !== 'en') return;
  state.lang = l;
  T = STRINGS[l];
  try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignore */ }
  // remember it on the account too, so emails arrive in the same language
  if (state.session) {
    await sb.from('profiles').update({ lang: l }).eq('id', state.session.user.id);
  }
  await route();
}

/* ---------------- helpers ---------------- */
const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = view) => root.querySelector(sel);
const $$ = (sel, root = view) => [...root.querySelectorAll(sel)];

function render(html) {
  document.documentElement.dir = T.dir;
  document.documentElement.lang = state.lang;
  view.innerHTML = html;
  window.scrollTo(0, 0);
}

/** Server errors come back in English; show them in the reader's language. */
function humanError(msg) {
  const raw = String(msg || '');
  return T.errors?.[raw] || raw;
}
function note(msg, isErr = false) {
  const old = $('#msg'); if (old) old.remove();
  view.prepend(el(`<div class="note ${isErr ? 'err' : ''}" id="msg">${esc(isErr ? humanError(msg) : msg)}</div>`));
  window.scrollTo(0, 0);
}

function photoUrl(path) {
  if (!path) return null;
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
function avatar(name, path, cls = '') {
  const u = photoUrl(path);
  const initials = esc((name || '?').trim().charAt(0).toUpperCase());
  return u ? `<img class="avatar ${cls}" src="${esc(u)}" alt="${esc(name)}">`
           : `<div class="avatar ${cls}">${initials}</div>`;
}
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const fmtDate = (iso) => new Date(iso).toLocaleDateString(T.locale, { weekday: 'short', day: '2-digit', month: 'short', timeZone: TZ });
const todayISO = () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ })).toISOString().slice(0, 10);
const statusLabel = (s) => T[s] || s;

async function loadMe() {
  const { data: { session } } = await sb.auth.getSession();
  state.session = session;
  if (!session) { state.role = 'customer'; state.profile = null; return; }
  // a token can outlive the account it belongs to; drop it rather than render a dead screen
  const { error: userErr } = await sb.auth.getUser();
  if (userErr) {
    await sb.auth.signOut();
    state.session = null; state.role = 'customer'; state.profile = null;
    return;
  }
  const [{ data: r }, { data: p }] = await Promise.all([
    sb.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
    sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
  ]);
  state.role = r?.role || 'customer';
  state.profile = p || null;
}

function chrome() {
  const on = !!state.session;
  brandEl.textContent = T.brand;
  langBtn.textContent = T.otherShort;
  langBtn.setAttribute('aria-label', T.other);
  langBtn.title = T.other;
  homeBtn.textContent = T.home;
  outBtn.textContent = T.signOut;
  outBtn.classList.toggle('hidden', !on);
  homeBtn.classList.toggle('hidden', !state.portal);
  whoami.textContent = on ? `${state.session.user.email} · ${T[roleKey(state.role)]}` : '';
}
const roleKey = (r) => r === 'manager' ? 'roleManagerOpt' : r === 'barber' ? 'roleBarberOpt' : 'roleCustomerOpt';

langBtn.onclick = () => setLang(state.lang === 'he' ? 'en' : 'he');
outBtn.onclick = async () => { await sb.auth.signOut(); setPortal(null); await route(); };
homeBtn.onclick = async () => { setPortal(null); await route(); };

/* ---------------- router ---------------- */
async function route() {
  await loadMe();
  // an account's saved language wins the first time we see it in this browser
  if (state.profile?.lang && state.profile.lang !== state.lang) {
    let hadChoice = false;
    try { hadChoice = !!localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    if (!hadChoice) { state.lang = state.profile.lang; T = STRINGS[state.lang]; }
  }
  chrome();
  if (!state.portal) return landing();
  if (!state.session) return authScreen();
  if (state.portal === 'customer') return customerPortal();
  if (state.portal === 'barber') return state.role === 'barber' || state.role === 'manager' ? barberPortal() : codeGate('barber');
  if (state.portal === 'manager') return state.role === 'manager' ? managerPortal() : codeGate('manager');
}

/* ---------------- landing ---------------- */
function landing() {
  render(`
    <h1>${T.landingTitle}</h1>
    <p class="sub">${esc(T.landingSub)}</p>
    <div class="roles">
      <button class="role-card" data-p="barber"><span class="k">${esc(T.roleBarber)}</span><span class="d">${esc(T.roleBarberD)}</span></button>
      <button class="role-card" data-p="manager"><span class="k">${esc(T.roleManager)}</span><span class="d">${esc(T.roleManagerD)}</span></button>
      <button class="role-card" data-p="customer"><span class="k">${esc(T.roleCustomer)}</span><span class="d">${esc(T.roleCustomerD)}</span></button>
    </div>
    <hr>
    <p class="small muted">${esc(T.landingFoot)}</p>
  `);
  $$('.role-card').forEach(b => b.onclick = async () => { setPortal(b.dataset.p); await route(); });
}

/* ---------------- auth ---------------- */
function authScreen() {
  const sub = state.portal === 'customer' ? T.authSubCustomer
            : state.portal === 'barber' ? T.authSubBarber : T.authSubManager;

  render(`
    <h1>${esc(T.signIn)}</h1>
    <p class="sub">${esc(sub)}</p>
    <div class="card">
      <div id="upOnly" class="hidden">
        <label>${esc(T.fullName)}</label><input id="fname" autocomplete="name">
        <label>${esc(T.phone)}</label><input id="fphone" inputmode="tel" autocomplete="tel">
      </div>
      <label>${esc(T.email)}</label><input id="femail" type="email" inputmode="email" autocomplete="email">
      <label>${esc(T.password)}</label><input id="fpass" type="password" autocomplete="current-password">
      <div style="height:16px"></div>
      <button id="go">${esc(T.signIn)}</button>
      <div class="center"><button class="link" id="toggle">${esc(T.toSignUp)}</button></div>
    </div>
  `);

  let mode = 'in';
  $('#toggle').onclick = () => {
    mode = mode === 'in' ? 'up' : 'in';
    $('#upOnly').classList.toggle('hidden', mode === 'in');
    $('#go').textContent = mode === 'in' ? T.signIn : T.signUp;
    $('#toggle').textContent = mode === 'in' ? T.toSignUp : T.toSignIn;
  };
  $('#go').onclick = async () => {
    const email = $('#femail').value.trim(), password = $('#fpass').value;
    if (!email || password.length < 8) return note(T.needEmailPass, true);
    $('#go').disabled = true;
    try {
      if (mode === 'up') {
        const meta = { full_name: $('#fname').value.trim(), phone: $('#fphone').value.trim() };
        const { error } = await sb.auth.signUp({ email, password, options: { data: meta } });
        if (error) throw error;
      }
      const { error: e2 } = await sb.auth.signInWithPassword({ email, password });
      if (e2) throw e2;
      // the account inherits the language the person is reading right now
      const { data: { session } } = await sb.auth.getSession();
      if (session) await sb.from('profiles').update({ lang: state.lang }).eq('id', session.user.id);
      await route();
    } catch (e) {
      $('#go').disabled = false;
      note(e.message || String(e), true);
    }
  };
}

/* ---------------- access code gate ---------------- */
function codeGate(want) {
  render(`
    <h1>${esc(want === 'manager' ? T.managerAccess : T.barberAccess)}</h1>
    <p class="sub">${esc(want === 'manager' ? T.codeSubManager : T.codeSubBarber)}</p>
    <div class="card">
      <label>${esc(T.accessCode)}</label>
      <input id="code" class="mono" inputmode="numeric" maxlength="10" placeholder="0000000000">
      <div style="height:16px"></div>
      <button id="go">${esc(T.unlock)}</button>
      <p class="small muted center" style="margin:12px 0 0">${esc(T.codeFoot)}</p>
    </div>
  `);
  $('#go').onclick = async () => {
    const code = $('#code').value.trim();
    $('#go').disabled = true;
    const { data, error } = await sb.rpc('redeem_access_code', { p_code: code });
    $('#go').disabled = false;
    if (error) return note(error.message, true);
    if (want === 'manager' && data !== 'manager') return note(T.notMaster, true);
    await route();
  };
}

/* ================= BARBER ================= */
async function barberPortal() {
  const uid = state.session.user.id;
  render(`<h1>${esc(T.yourChair)}</h1><p class="sub">${esc(T.loading)}</p>`);
  const [appts, avail, off, notifs] = await Promise.all([
    sb.from('appointments').select('*').eq('barber_id', uid).gte('starts_at', new Date(Date.now() - 864e5).toISOString()).order('starts_at'),
    sb.from('availability').select('*').eq('barber_id', uid).order('weekday').order('start_time'),
    sb.from('time_off').select('*').eq('barber_id', uid).gte('day', todayISO()).order('day'),
    sb.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)
  ]);
  const p = state.profile || {};
  const unread = (notifs.data || []).filter(n => !n.read).length;
  const open = (appts.data || []).filter(a => a.status === 'booked');

  render(`
    <h1>${esc(T.yourChair)}</h1>
    <p class="sub">${esc(p.full_name || state.session.user.email)}${unread ? ` · <span class="pill fill">${unread} ${esc(T.newBadge)}</span>` : ''}</p>

    <h2>${esc(T.upcoming)}</h2>
    <div class="list" id="appts">
      ${open.length === 0 ? `<p class="muted">${esc(T.nothingBooked)}</p>` : open.map(a => `
        <div class="card tight between">
          <div>
            <h3>${fmtDate(a.starts_at)} · ${fmtTime(a.starts_at)}</h3>
            <div class="small muted">${esc(a.customer_name)} · ${esc(a.customer_phone)}${a.notes ? ' · ' + esc(a.notes) : ''}</div>
          </div>
          <button class="tiny ghost" data-cancel="${a.id}">${esc(T.cancel)}</button>
        </div>`).join('')}
    </div>

    <h2>${esc(T.notifications)}</h2>
    <div class="list">
      ${(notifs.data || []).length === 0 ? `<p class="muted">${esc(T.noNotifications)}</p>` : (notifs.data || []).map(n => `
        <div class="card tight">
          <h3>${n.read ? '' : `<span class="pill fill">${esc(T.newBadge)}</span> `}${esc(n.title)}</h3>
          <div class="small muted">${esc(n.body)} — ${fmtDate(n.created_at)} ${fmtTime(n.created_at)}</div>
        </div>`).join('')}
    </div>
    ${unread ? `<button class="ghost" id="markRead">${esc(T.markRead)}</button>` : ''}

    <h2>${esc(T.yourProfile)}</h2>
    <div class="card">
      <div class="between" style="margin-bottom:12px">
        ${avatar(p.full_name, p.photo_path, 'lg')}
        <div style="flex:1">
          <label>${esc(T.photoLabel)}</label>
          <input type="file" id="photo" accept="image/jpeg,image/png,image/webp">
        </div>
      </div>
      <div class="grid2">
        <div><label>${esc(T.fullName)}</label><input id="pname" value="${esc(p.full_name || '')}"></div>
        <div><label>${esc(T.phone)}</label><input id="pphone" value="${esc(p.phone || '')}"></div>
      </div>
      <label>${esc(T.aboutYou)}</label>
      <textarea id="pbio">${esc(p.bio || '')}</textarea>
      <div class="grid2">
        <div><label>${esc(T.apptLength)}</label><input id="pslot" type="number" min="10" max="180" step="5" value="${p.slot_minutes || 30}"></div>
        <div><label>${esc(T.visibleToCustomers)}</label>
          <select id="pactive"><option value="1"${p.active ? ' selected' : ''}>${esc(T.yes)}</option><option value="0"${p.active ? '' : ' selected'}>${esc(T.no)}</option></select>
        </div>
      </div>
      <div style="height:16px"></div>
      <button id="saveProfile">${esc(T.saveProfile)}</button>
    </div>

    <h2>${esc(T.weeklyHours)}</h2>
    <div class="card">
      <div class="list" id="availList">
        ${(avail.data || []).length === 0 ? `<p class="muted">${esc(T.noHours)}</p>` :
          (avail.data || []).map(a => `<div class="card tight between"><div><h3>${esc(T.days[a.weekday])}</h3><div class="small muted mono">${a.start_time.slice(0, 5)} – ${a.end_time.slice(0, 5)}</div></div><button class="tiny ghost" data-delav="${a.id}">${esc(T.remove)}</button></div>`).join('')}
      </div>
      <hr>
      <div class="sched-row">
        <div><label>${esc(T.day)}</label><select id="avDay">${T.days.map((d, i) => `<option value="${i}">${esc(d)}</option>`).join('')}</select></div>
        <div><label>${esc(T.from)}</label><input id="avFrom" type="time" value="09:00"></div>
        <div><label>${esc(T.to)}</label><input id="avTo" type="time" value="18:00"></div>
        <div><button class="tiny" id="addAv">${esc(T.add)}</button></div>
      </div>
    </div>

    <h2>${esc(T.daysOff)}</h2>
    <div class="card">
      <div class="list">
        ${(off.data || []).length === 0 ? `<p class="muted">${esc(T.none)}</p>` : (off.data || []).map(o => `<div class="card tight between"><div>${o.day}${o.note ? ' · ' + esc(o.note) : ''}</div><button class="tiny ghost" data-deloff="${o.id}">${esc(T.remove)}</button></div>`).join('')}
      </div>
      <hr>
      <div class="row">
        <div><label>${esc(T.date)}</label><input id="offDay" type="date" min="${todayISO()}"></div>
        <div><label>${esc(T.reasonOpt)}</label><input id="offNote"></div>
        <div style="display:flex;align-items:end"><button class="tiny" id="addOff">${esc(T.add)}</button></div>
      </div>
    </div>
  `);

  $('#saveProfile').onclick = async () => {
    const f = $('#photo').files[0];
    let photo_path = p.photo_path || null;
    if (f) {
      if (f.size > 3 * 1024 * 1024) return note(T.photoTooBig, true);
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${uid}/avatar.${ext}`;
      const { error } = await sb.storage.from('photos').upload(path, f, { upsert: true, contentType: f.type });
      if (error) return note(error.message, true);
      photo_path = path;
    }
    const { error } = await sb.from('profiles').update({
      full_name: $('#pname').value.trim(),
      phone: $('#pphone').value.trim(),
      bio: $('#pbio').value.trim(),
      slot_minutes: Math.max(10, Math.min(180, parseInt($('#pslot').value || '30', 10))),
      active: $('#pactive').value === '1',
      photo_path
    }).eq('id', uid);
    if (error) return note(error.message, true);
    await barberPortal(); note(T.profileSaved);
  };
  $('#addAv').onclick = async () => {
    const { error } = await sb.from('availability').insert({
      barber_id: uid, weekday: parseInt($('#avDay').value, 10),
      start_time: $('#avFrom').value, end_time: $('#avTo').value
    });
    if (error) return note(error.message, true);
    await barberPortal();
  };
  $('#addOff').onclick = async () => {
    if (!$('#offDay').value) return note(T.pickDate, true);
    const { error } = await sb.from('time_off').insert({ barber_id: uid, day: $('#offDay').value, note: $('#offNote').value.trim() });
    if (error) return note(error.message, true);
    await barberPortal();
  };
  $$('[data-delav]').forEach(b => b.onclick = async () => { await sb.from('availability').delete().eq('id', b.dataset.delav); await barberPortal(); });
  $$('[data-deloff]').forEach(b => b.onclick = async () => { await sb.from('time_off').delete().eq('id', b.dataset.deloff); await barberPortal(); });
  $$('[data-cancel]').forEach(b => b.onclick = async () => {
    const { error } = await sb.rpc('cancel_appointment', { p_id: b.dataset.cancel });
    if (error) return note(error.message, true);
    await barberPortal();
  });
  const mr = $('#markRead');
  if (mr) mr.onclick = async () => { await sb.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false); await barberPortal(); };
}

/* ================= MANAGER ================= */
async function managerPortal() {
  render(`<h1>${esc(T.manager)}</h1><p class="sub">${esc(T.loading)}</p>`);
  const [users, appts, codes, settings, mail, sec] = await Promise.all([
    sb.rpc('list_users'),
    sb.from('appointments').select('*').gte('starts_at', new Date(Date.now() - 7 * 864e5).toISOString()).order('starts_at'),
    sb.from('access_codes').select('id,role,label,active,multi_use,created_at,used_at').order('created_at', { ascending: false }),
    sb.rpc('get_settings'),
    sb.rpc('recent_mail', { p_limit: 15 }),
    sb.rpc('recent_security', { p_limit: 15 })
  ]);
  if (users.error) return note(users.error.message, true);
  const cfg = settings.data || {};
  const byId = Object.fromEntries((users.data || []).map(u => [u.id, u]));
  const booked = (appts.data || []).filter(a => a.status === 'booked');
  const barbers = (users.data || []).filter(u => u.role === 'barber');

  render(`
    <h1>${esc(T.manager)}</h1>
    <p class="sub">${(users.data || []).length} ${esc(T.statsAccounts)} · ${barbers.length} ${esc(T.statsBarbers)} · ${booked.length} ${esc(T.statsBooked)}</p>

    <h2>${esc(T.appointments)}</h2>
    <div class="scroll"><table>
      <tr><th>${esc(T.when)}</th><th>${esc(T.barber)}</th><th>${esc(T.customer)}</th><th>${esc(T.phone)}</th><th>${esc(T.status)}</th><th></th></tr>
      ${(appts.data || []).length === 0 ? `<tr><td colspan="6" class="muted">${esc(T.nothingYet)}</td></tr>` : (appts.data || []).map(a => `
        <tr>
          <td>${fmtDate(a.starts_at)} ${fmtTime(a.starts_at)}</td>
          <td>${esc(byId[a.barber_id]?.full_name || '—')}</td>
          <td>${esc(a.customer_name)}</td>
          <td>${esc(a.customer_phone)}</td>
          <td>${a.status === 'booked' ? `<span class="pill">${esc(T.booked)}</span>` : `<span class="pill off">${esc(statusLabel(a.status))}</span>`}</td>
          <td>${a.status === 'booked' ? `<button class="tiny ghost" data-cancel="${a.id}">${esc(T.cancel)}</button>` : ''}</td>
        </tr>`).join('')}
    </table></div>

    <h2>${esc(T.people)}</h2>
    <div class="scroll"><table>
      <tr><th>${esc(T.name)}</th><th>${esc(T.email)}</th><th>${esc(T.phone)}</th><th>${esc(T.role)}</th><th>${esc(T.visible)}</th></tr>
      ${(users.data || []).map(u => `
        <tr>
          <td>${esc(u.full_name || '—')}</td>
          <td class="small">${esc(u.email)}</td>
          <td class="small">${esc(u.phone || '—')}</td>
          <td><select data-role="${u.id}">
            ${['customer', 'barber', 'manager'].map(r => `<option value="${r}"${u.role === r ? ' selected' : ''}>${esc(T[roleKey(r)])}</option>`).join('')}
          </select></td>
          <td>${u.role === 'barber' ? `<button class="tiny ghost" data-vis="${u.id}" data-on="${u.active ? 1 : 0}">${esc(u.active ? T.hide : T.show)}</button>` : '—'}</td>
        </tr>`).join('')}
    </table></div>

    <h2>${esc(T.codes)}</h2>
    <div class="card">
      <label>${esc(T.codeLabelField)}</label>
      <input id="codeLabel" placeholder="Yossi">
      <div style="height:12px"></div>
      <button id="mint">${esc(T.mint)}</button>
      <div id="codeOut"></div>
    </div>
    <div class="scroll"><table>
      <tr><th>${esc(T.label)}</th><th>${esc(T.role)}</th><th>${esc(T.status)}</th><th>${esc(T.created)}</th><th></th></tr>
      ${(codes.data || []).map(c => `
        <tr>
          <td>${esc(c.label || '—')}</td><td>${esc(T[roleKey(c.role)])}</td>
          <td>${c.active ? `<span class="pill">${esc(T.active)}</span>` : `<span class="pill off">${esc(T.usedOff)}</span>`}</td>
          <td class="small">${fmtDate(c.created_at)}</td>
          <td>${c.active ? `<button class="tiny ghost" data-off="${c.id}">${esc(T.disable)}</button>` : ''}</td>
        </tr>`).join('')}
    </table></div>
    <p class="small muted">${esc(T.codesFoot)}</p>

    <h2>${esc(T.siteSection)}</h2>
    <div class="card">
      <p class="small muted" style="margin-top:0">${esc(T.siteIntro)} <a href="./" class="small">${esc(T.viewSite)}</a></p>
      <div class="grid2">
        <div><label>${esc(T.taglineHe)}</label><input id="k_tagline_he" value="${esc(cfg.tagline_he || '')}"></div>
        <div><label>${esc(T.taglineEn)}</label><input id="k_tagline_en" value="${esc(cfg.tagline_en || '')}"></div>
      </div>
      <label>${esc(T.aboutHe)}</label><textarea id="k_about_he">${esc(cfg.about_he || '')}</textarea>
      <label>${esc(T.aboutEn)}</label><textarea id="k_about_en">${esc(cfg.about_en || '')}</textarea>
      <div class="grid2">
        <div><label>${esc(T.addressHe)}</label><input id="k_address_he" value="${esc(cfg.address_he || '')}"></div>
        <div><label>${esc(T.addressEn)}</label><input id="k_address_en" value="${esc(cfg.address_en || '')}"></div>
      </div>
      <div class="grid2">
        <div><label>${esc(T.phoneField)}</label><input id="k_phone" value="${esc(cfg.phone || '')}"></div>
        <div><label>${esc(T.whatsappField)}</label><input id="k_whatsapp" value="${esc(cfg.whatsapp || '')}"></div>
      </div>
      <div class="grid2">
        <div><label>${esc(T.instagramField)}</label><input id="k_instagram" value="${esc(cfg.instagram || '')}"></div>
        <div><label>${esc(T.mapsField)}</label><input id="k_maps_url" value="${esc(cfg.maps_url || '')}"></div>
      </div>
      <div class="grid2">
        <div><label>${esc(T.yearsField)}</label><input id="k_years" type="number" min="0" max="99" value="${esc(cfg.years || '')}"></div>
      </div>
      <label>${esc(T.policyHe)}</label><textarea id="k_policy_he">${esc(cfg.policy_he || '')}</textarea>
      <label>${esc(T.policyEn)}</label><textarea id="k_policy_en">${esc(cfg.policy_en || '')}</textarea>

      <h3 style="margin-top:22px">${esc(T.priceList)}</h3>
      <div id="svcRows"></div>
      <button class="ghost tiny" id="addSvc">${esc(T.addService)}</button>

      <h3 style="margin-top:22px">${esc(T.openHours)}</h3>
      <div id="hourRows"></div>

      <div style="height:16px"></div>
      <button id="saveSite">${esc(T.saveSite)}</button>
    </div>

    <h2>${esc(T.emailSection)}</h2>
    <div class="card">
      <p class="small muted" style="margin-top:0">${esc(T.emailIntro)}</p>
      <div class="grid2">
        <div><label>${esc(T.shopName)}</label><input id="cShop" value="${esc(cfg.shop_name || '')}"></div>
        <div><label>${esc(T.provider)}</label>
          <select id="cProv">
            <option value=""${!cfg.mail_provider ? ' selected' : ''}>${esc(T.providerOff)}</option>
            <option value="brevo"${cfg.mail_provider === 'brevo' ? ' selected' : ''}>${esc(T.providerBrevo)}</option>
            <option value="resend"${cfg.mail_provider === 'resend' ? ' selected' : ''}>${esc(T.providerResend)}</option>
          </select>
        </div>
      </div>
      <div class="grid2">
        <div><label>${esc(T.sendFrom)}</label><input id="cFrom" type="email" value="${esc(cfg.mail_from_email || '')}"></div>
        <div><label>${esc(T.senderName)}</label><input id="cFromName" value="${esc(cfg.mail_from_name || '')}"></div>
      </div>
      <label>${esc(T.apiKey)} ${cfg.mail_key_set ? `<span class="pill">${esc(T.stored)}</span>` : `<span class="pill off">${esc(T.notSet)}</span>`}</label>
      <input id="cKey" type="password" autocomplete="new-password" placeholder="${esc(cfg.mail_key_set ? T.keepKey : T.pasteKey)}">
      <div style="height:16px"></div>
      <div class="row">
        <button id="saveCfg">${esc(T.saveEmail)}</button>
        <button class="ghost" id="testMail">${esc(T.sendTest)}</button>
      </div>
    </div>

    <h2>${esc(T.lastEmails)}</h2>
    <div class="scroll"><table>
      <tr><th>${esc(T.when)}</th><th>${esc(T.toCol)}</th><th>${esc(T.subject)}</th><th>${esc(T.result)}</th></tr>
      ${(mail.data || []).length === 0 ? `<tr><td colspan="4" class="muted">${esc(T.nothingSent)}</td></tr>` : (mail.data || []).map(m => `
        <tr><td class="small">${fmtDate(m.created_at)} ${fmtTime(m.created_at)}</td>
        <td class="small">${esc(m.to_email)}</td><td class="small">${esc(m.subject)}</td>
        <td class="small">${m.error ? `<span class="pill off">${esc(m.error)}</span>`
          : m.status_code == null ? `<span class="pill off">${esc(T.queued)}</span>`
          : `<span class="pill">${esc(T.delivered)}</span>`}</td></tr>`).join('')}
    </table></div>

    <h2>${esc(T.securityLog)}</h2>
    <div class="scroll"><table>
      <tr><th>${esc(T.when)}</th><th>${esc(T.event)}</th><th>${esc(T.detail)}</th></tr>
      ${(sec.data || []).length === 0 ? `<tr><td colspan="3" class="muted">${esc(T.nothingYet)}</td></tr>` : (sec.data || []).map(s => `
        <tr><td class="small">${fmtDate(s.at)} ${fmtTime(s.at)}</td>
        <td class="small">${esc(s.event)}</td>
        <td class="small muted">${esc(JSON.stringify(s.detail))}</td></tr>`).join('')}
    </table></div>
  `);

  /* ---- website content editor ---- */
  const parseList = (raw, fb) => { try { const v = JSON.parse(raw || '[]'); return Array.isArray(v) ? v : fb; } catch (e) { return fb; } };
  let services = parseList(cfg.services_json, []);
  let hours = parseList(cfg.hours_json, []);

  function drawServices() {
    $('#svcRows').innerHTML = services.map((s, i) => `
      <div class="card tight" data-svc="${i}">
        <div class="grid2">
          <div><label>${esc(T.svcHe)}</label><input data-f="he" value="${esc(s.he || '')}"></div>
          <div><label>${esc(T.svcEn)}</label><input data-f="en" value="${esc(s.en || '')}"></div>
        </div>
        <div class="row" style="margin-top:8px">
          <div><label>${esc(T.svcPrice)}</label><input data-f="price" inputmode="numeric" value="${esc(s.price || '')}"></div>
          <div><label>${esc(T.svcMin)}</label><input data-f="min" inputmode="numeric" value="${esc(s.min || '')}"></div>
          <div style="display:flex;align-items:end"><button class="tiny ghost" data-delsvc="${i}">${esc(T.remove)}</button></div>
        </div>
      </div>`).join('');
    $$('[data-delsvc]').forEach(b => b.onclick = () => { collectServices(); services.splice(+b.dataset.delsvc, 1); drawServices(); });
  }
  function collectServices() {
    services = $$('[data-svc]').map(row => ({
      he: $('[data-f=he]', row).value.trim(),
      en: $('[data-f=en]', row).value.trim(),
      price: $('[data-f=price]', row).value.trim(),
      min: $('[data-f=min]', row).value.trim()
    })).filter(s => s.he || s.en);
  }
  function drawHours() {
    const byDay = {};
    hours.forEach(h => { if (h && typeof h.d === 'number') byDay[h.d] = h; });
    $('#hourRows').innerHTML = T.days.map((d, i) => {
      const h = byDay[i] || { o: '', c: '' };
      return `<div class="card tight" data-hr="${i}">
        <div class="row">
          <div><label>${esc(d)}</label>
            <select data-f="on"><option value="1"${h.o && h.c ? ' selected' : ''}>${esc(T.yes)}</option><option value="0"${h.o && h.c ? '' : ' selected'}>${esc(T.closedDay)}</option></select>
          </div>
          <div><label>${esc(T.openAt)}</label><input data-f="o" type="time" value="${esc(h.o || '')}"></div>
          <div><label>${esc(T.closeAt)}</label><input data-f="c" type="time" value="${esc(h.c || '')}"></div>
        </div>
      </div>`;
    }).join('');
  }
  function collectHours() {
    hours = $$('[data-hr]').map(row => {
      const on = $('[data-f=on]', row).value === '1';
      return { d: +row.dataset.hr, o: on ? $('[data-f=o]', row).value : '', c: on ? $('[data-f=c]', row).value : '' };
    });
  }
  drawServices(); drawHours();
  $('#addSvc').onclick = () => { collectServices(); services.push({ he: '', en: '', price: '', min: '30' }); drawServices(); };

  $('#saveSite').onclick = async () => {
    collectServices(); collectHours();
    const body = { services_json: JSON.stringify(services), hours_json: JSON.stringify(hours) };
    ['tagline_he', 'tagline_en', 'about_he', 'about_en', 'address_he', 'address_en',
     'phone', 'whatsapp', 'instagram', 'maps_url', 'years', 'policy_he', 'policy_en']
      .forEach(k => { body[k] = $(`#k_${k}`).value.trim(); });
    const { error } = await sb.rpc('set_content', { p_content: body });
    if (error) return note(error.message, true);
    await managerPortal(); note(T.siteSaved);
  };

  $('#saveCfg').onclick = async () => {
    const { error } = await sb.rpc('set_settings', {
      p_provider: $('#cProv').value,
      p_from_email: $('#cFrom').value.trim(),
      p_from_name: $('#cFromName').value.trim(),
      p_shop_name: $('#cShop').value.trim(),
      p_api_key: $('#cKey').value
    });
    if (error) return note(error.message, true);
    await managerPortal(); note(T.emailSaved);
  };
  $('#testMail').onclick = async () => {
    const { error } = await sb.rpc('send_test_email');
    if (error) return note(error.message, true);
    setTimeout(async () => { await managerPortal(); note(T.testQueued); }, 1500);
  };
  $('#mint').onclick = async () => {
    const { data, error } = await sb.rpc('create_barber_code', { p_label: $('#codeLabel').value.trim() });
    if (error) return note(error.message, true);
    $('#codeOut').innerHTML = `<div class="note"><b>${esc(T.newCode)}</b> <span class="mono">${esc(data)}</span><br><span class="small">${esc(T.shownOnce)}</span></div>`;
  };
  $$('[data-role]').forEach(s => s.onchange = async () => {
    const { error } = await sb.rpc('set_user_role', { p_user: s.dataset.role, p_role: s.value });
    if (error) { note(error.message, true); return; }
    await managerPortal(); note(T.roleUpdated);
  });
  $$('[data-vis]').forEach(b => b.onclick = async () => {
    await sb.from('profiles').update({ active: b.dataset.on !== '1' }).eq('id', b.dataset.vis);
    await managerPortal();
  });
  $$('[data-off]').forEach(b => b.onclick = async () => { await sb.from('access_codes').update({ active: false }).eq('id', b.dataset.off); await managerPortal(); });
  $$('[data-cancel]').forEach(b => b.onclick = async () => {
    const { error } = await sb.rpc('cancel_appointment', { p_id: b.dataset.cancel });
    if (error) return note(error.message, true);
    await managerPortal();
  });
}

/* ================= CUSTOMER ================= */
let cust = { barber: null, day: todayISO(), slot: null };

async function customerPortal() {
  const uid = state.session.user.id;
  render(`<h1>${esc(T.bookTitle)}</h1><p class="sub">${esc(T.loading)}</p>`);
  const [barbers, mine] = await Promise.all([
    sb.from('public_barbers').select('*').order('full_name'),
    sb.from('appointments').select('*').eq('customer_id', uid).gte('starts_at', new Date(Date.now() - 864e5).toISOString()).order('starts_at')
  ]);
  const list = barbers.data || [];
  const p = state.profile || {};
  const open = (mine.data || []).filter(a => a.status === 'booked');

  render(`
    <h1>${esc(T.bookTitle)}</h1>
    <p class="sub">${esc(T.bookSub)}</p>

    <h2>${esc(T.myAppointments)}</h2>
    <div class="list">
      ${open.length === 0 ? `<p class="muted">${esc(T.noAppointments)}</p>` : open.map(a => {
        const b = list.find(x => x.id === a.barber_id);
        return `<div class="card tight between">
          <div><h3>${fmtDate(a.starts_at)} · ${fmtTime(a.starts_at)}</h3>
          <div class="small muted">${esc(b?.full_name || T.aBarber)}</div></div>
          <button class="tiny ghost" data-cancel="${a.id}">${esc(T.cancel)}</button>
        </div>`;
      }).join('')}
    </div>

    <h2>${esc(T.ourBarbers)}</h2>
    <div class="list" id="barbers">
      ${list.length === 0 ? `<p class="muted">${esc(T.noBarbers)}</p>` : list.map(b => `
        <button class="barber ${cust.barber === b.id ? 'sel' : ''}" data-b="${b.id}">
          ${avatar(b.full_name, b.photo_path)}
          <div>
            <h3>${esc(b.full_name || T.aBarber)}</h3>
            <div class="small muted">${esc(b.bio || '')}</div>
            <div class="small muted">${b.slot_minutes} ${esc(T.minutesPer)}</div>
          </div>
        </button>`).join('')}
    </div>

    <div id="pick" class="${cust.barber ? '' : 'hidden'}">
      <h2>${esc(T.pickWhen)}</h2>
      <div class="card">
        <label>${esc(T.date)}</label>
        <input id="day" type="date" min="${todayISO()}" value="${cust.day}">
        <div style="height:14px"></div>
        <div id="slots" class="muted">${esc(T.pickDatePrompt)}</div>
      </div>
      <div id="confirm" class="hidden">
        <div class="card">
          <label>${esc(T.fullName)}</label><input id="cname" value="${esc(p.full_name || '')}">
          <label>${esc(T.phone)}</label><input id="cphone" inputmode="tel" value="${esc(p.phone || '')}">
          <label>${esc(T.notesOpt)}</label><input id="cnotes" placeholder="${esc(T.notesPlaceholder)}">
          <div style="height:16px"></div>
          <button id="book">${esc(T.confirmBooking)}</button>
        </div>
      </div>
    </div>
  `);

  $$('[data-b]').forEach(b => b.onclick = async () => {
    cust.barber = b.dataset.b; cust.slot = null;
    $$('.barber').forEach(x => x.classList.toggle('sel', x.dataset.b === cust.barber));
    $('#pick').classList.remove('hidden');
    await loadSlots();
  });
  $('#day').onchange = async () => { cust.day = $('#day').value; cust.slot = null; await loadSlots(); };
  $$('[data-cancel]').forEach(b => b.onclick = async () => {
    const { error } = await sb.rpc('cancel_appointment', { p_id: b.dataset.cancel });
    if (error) return note(error.message, true);
    await customerPortal();
  });
  if (cust.barber) await loadSlots();

  async function loadSlots() {
    const box = $('#slots');
    box.className = 'muted'; box.textContent = T.loadingSlots;
    const { data, error } = await sb.rpc('available_slots', { p_barber: cust.barber, p_day: cust.day });
    if (error) { box.textContent = humanError(error.message); return; }
    const slots = data || [];
    if (!slots.length) { box.className = 'muted'; box.textContent = T.noSlots; $('#confirm').classList.add('hidden'); return; }
    box.className = 'slots';
    box.innerHTML = slots.map(s => `<button class="slot" data-s="${esc(s)}">${fmtTime(s)}</button>`).join('');
    $$('[data-s]', box).forEach(b => b.onclick = () => {
      cust.slot = b.dataset.s;
      $$('.slot', box).forEach(x => x.classList.toggle('sel', x.dataset.s === cust.slot));
      $('#confirm').classList.remove('hidden');
      $('#confirm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const bookBtn = $('#book');
    if (bookBtn) bookBtn.onclick = async () => {
      const name = $('#cname').value.trim(), phone = $('#cphone').value.trim();
      if (!name || !phone) return note(T.needNamePhone, true);
      bookBtn.disabled = true;
      const { error } = await sb.rpc('book_appointment', {
        p_barber: cust.barber, p_start: cust.slot, p_name: name, p_phone: phone, p_notes: $('#cnotes').value.trim()
      });
      bookBtn.disabled = false;
      if (error) return note(error.message, true);
      await sb.from('profiles').update({ full_name: name, phone }).eq('id', uid);
      cust.slot = null;
      await customerPortal();
      note(T.bookedOk);
    };
  }
}

/* ---------------- go ---------------- */
sb.auth.onAuthStateChange((evt) => { if (evt === 'SIGNED_OUT') { setPortal(null); route(); } });
route();
