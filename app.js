import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

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

let state = { portal: null, session: null, role: 'customer', profile: null };
const PORTAL_KEY = 'bs.portal';
try { state.portal = localStorage.getItem(PORTAL_KEY) || null; } catch (e) { /* private mode */ }
function setPortal(p) {
  state.portal = p;
  try { p ? localStorage.setItem(PORTAL_KEY, p) : localStorage.removeItem(PORTAL_KEY); } catch (e) { /* ignore */ }
}

/* ---------------- helpers ---------------- */
const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = view) => root.querySelector(sel);
const $$ = (sel, root = view) => [...root.querySelectorAll(sel)];

function render(html, rtl = false) {
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.lang = rtl ? 'he' : 'en';
  view.innerHTML = html;
  window.scrollTo(0, 0);
}
function note(msg, isErr = false) {
  const old = $('#msg'); if (old) old.remove();
  view.prepend(el(`<div class="note ${isErr ? 'err' : ''}" id="msg">${esc(msg)}</div>`));
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
const fmtDate = (iso, loc = 'en-GB') => new Date(iso).toLocaleDateString(loc, { weekday: 'short', day: '2-digit', month: 'short', timeZone: TZ });
const todayISO = () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ })).toISOString().slice(0, 10);
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function loadMe() {
  const { data: { session } } = await sb.auth.getSession();
  state.session = session;
  if (!session) { state.role = 'customer'; state.profile = null; return; }
  const [{ data: r }, { data: p }] = await Promise.all([
    sb.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
    sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
  ]);
  state.role = r?.role || 'customer';
  state.profile = p || null;
}
function chrome() {
  const on = !!state.session;
  outBtn.classList.toggle('hidden', !on);
  homeBtn.classList.toggle('hidden', !state.portal);
  whoami.textContent = on ? `${state.session.user.email} · ${state.role}` : '';
}
outBtn.onclick = async () => { await sb.auth.signOut(); setPortal(null); await route(); };
homeBtn.onclick = async () => { setPortal(null); await route(); };

/* ---------------- router ---------------- */
async function route() {
  await loadMe();
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
    <h1>Book a chair.<br>Run the shop.</h1>
    <p class="sub">Choose how you want to sign in.</p>
    <div class="roles">
      <button class="role-card" data-p="barber"><span class="k">Barber</span><span class="d">Your schedule and your appointments. Access code required.</span></button>
      <button class="role-card" data-p="manager"><span class="k">Manager</span><span class="d">Everything and everyone. Master code required.</span></button>
      <button class="role-card" data-p="customer"><span class="k">Customer / לקוחות</span><span class="d">קבעו תור אצל הספר שלכם</span></button>
    </div>
    <hr>
    <p class="small muted">Every account is protected by email + password. Barber and manager access is granted only with a 10-digit code, verified on the server. All data is protected by per-row database policies.</p>
  `);
  $$('.role-card').forEach(b => b.onclick = async () => { setPortal(b.dataset.p); await route(); });
}

/* ---------------- auth ---------------- */
function authScreen() {
  const he = state.portal === 'customer';
  const t = he
    ? { title: 'התחברות', sub: 'התחברו או צרו חשבון כדי לקבוע תור.', email: 'אימייל', pass: 'סיסמה', name: 'שם מלא', phone: 'טלפון', inBtn: 'התחברות', upBtn: 'הרשמה', toUp: 'אין לכם חשבון? הרשמה', toIn: 'יש לכם חשבון? התחברות' }
    : { title: 'Sign in', sub: `Sign in to the ${state.portal} portal.`, email: 'Email', pass: 'Password', name: 'Full name', phone: 'Phone', inBtn: 'Sign in', upBtn: 'Create account', toUp: "No account? Create one", toIn: 'Have an account? Sign in' };

  render(`
    <h1>${esc(t.title)}</h1>
    <p class="sub">${esc(t.sub)}</p>
    <div class="card">
      <div id="upOnly" class="hidden">
        <label>${esc(t.name)}</label><input id="fname" autocomplete="name">
        <label>${esc(t.phone)}</label><input id="fphone" inputmode="tel" autocomplete="tel">
      </div>
      <label>${esc(t.email)}</label><input id="femail" type="email" inputmode="email" autocomplete="email">
      <label>${esc(t.pass)}</label><input id="fpass" type="password" autocomplete="current-password">
      <div style="height:16px"></div>
      <button id="go">${esc(t.inBtn)}</button>
      <div class="center"><button class="link" id="toggle">${esc(t.toUp)}</button></div>
    </div>
  `, he);

  let mode = 'in';
  $('#toggle').onclick = () => {
    mode = mode === 'in' ? 'up' : 'in';
    $('#upOnly').classList.toggle('hidden', mode === 'in');
    $('#go').textContent = mode === 'in' ? t.inBtn : t.upBtn;
    $('#toggle').textContent = mode === 'in' ? t.toUp : t.toIn;
  };
  $('#go').onclick = async () => {
    const email = $('#femail').value.trim(), password = $('#fpass').value;
    if (!email || password.length < 8) return note(he ? 'נדרש אימייל וסיסמה של 8 תווים לפחות.' : 'Email and a password of at least 8 characters are required.', true);
    $('#go').disabled = true;
    try {
      if (mode === 'up') {
        const meta = { full_name: $('#fname').value.trim(), phone: $('#fphone').value.trim() };
        const { error } = await sb.auth.signUp({ email, password, options: { data: meta } });
        if (error) throw error;
      }
      const { error: e2 } = await sb.auth.signInWithPassword({ email, password });
      if (e2) throw e2;
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
    <h1>${want === 'manager' ? 'Manager access' : 'Barber access'}</h1>
    <p class="sub">Enter your 10-digit code. ${want === 'manager' ? 'Only the shop owner has the master code.' : 'The manager issues barber codes.'}</p>
    <div class="card">
      <label>Access code</label>
      <input id="code" class="mono" inputmode="numeric" maxlength="10" placeholder="0000000000">
      <div style="height:16px"></div>
      <button id="go">Unlock</button>
      <p class="small muted center" style="margin:12px 0 0">Codes are stored only as bcrypt hashes. 5 wrong attempts per hour locks you out.</p>
    </div>
  `);
  $('#go').onclick = async () => {
    const code = $('#code').value.trim();
    $('#go').disabled = true;
    const { data, error } = await sb.rpc('redeem_access_code', { p_code: code });
    $('#go').disabled = false;
    if (error) return note(error.message, true);
    if (want === 'manager' && data !== 'manager') return note('That code is a barber code, not the master code.', true);
    await route();
  };
}

/* ================= BARBER ================= */
async function barberPortal() {
  const uid = state.session.user.id;
  render(`<h1>Your chair</h1><p class="sub">Loading…</p>`);
  const [appts, avail, off, notifs] = await Promise.all([
    sb.from('appointments').select('*').eq('barber_id', uid).gte('starts_at', new Date(Date.now() - 864e5).toISOString()).order('starts_at'),
    sb.from('availability').select('*').eq('barber_id', uid).order('weekday').order('start_time'),
    sb.from('time_off').select('*').eq('barber_id', uid).gte('day', todayISO()).order('day'),
    sb.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)
  ]);
  const p = state.profile || {};
  const unread = (notifs.data || []).filter(n => !n.read).length;

  render(`
    <h1>Your chair</h1>
    <p class="sub">${esc(p.full_name || state.session.user.email)}${unread ? ` · <span class="pill fill">${unread} new</span>` : ''}</p>

    <h2>Upcoming appointments</h2>
    <div class="list" id="appts">
      ${(appts.data || []).filter(a => a.status === 'booked').length === 0
        ? `<p class="muted">Nothing booked yet.</p>`
        : (appts.data || []).filter(a => a.status === 'booked').map(a => `
        <div class="card tight between">
          <div>
            <h3>${fmtDate(a.starts_at)} · ${fmtTime(a.starts_at)}</h3>
            <div class="small muted">${esc(a.customer_name)} · ${esc(a.customer_phone)}${a.notes ? ' · ' + esc(a.notes) : ''}</div>
          </div>
          <button class="tiny ghost" data-cancel="${a.id}">Cancel</button>
        </div>`).join('')}
    </div>

    <h2>Notifications</h2>
    <div class="list">
      ${(notifs.data || []).length === 0 ? `<p class="muted">No notifications.</p>` : (notifs.data || []).map(n => `
        <div class="card tight">
          <h3>${n.read ? '' : '<span class="pill fill">new</span> '}${esc(n.title)}</h3>
          <div class="small muted">${esc(n.body)} — ${fmtDate(n.created_at)} ${fmtTime(n.created_at)}</div>
        </div>`).join('')}
    </div>
    ${unread ? `<button class="ghost" id="markRead">Mark all as read</button>` : ''}

    <h2>Your profile</h2>
    <div class="card">
      <div class="between" style="margin-bottom:12px">
        ${avatar(p.full_name, p.photo_path, 'lg')}
        <div style="flex:1">
          <label>Photo (JPG / PNG / WebP, max 3 MB)</label>
          <input type="file" id="photo" accept="image/jpeg,image/png,image/webp">
        </div>
      </div>
      <div class="grid2">
        <div><label>Full name</label><input id="pname" value="${esc(p.full_name || '')}"></div>
        <div><label>Phone</label><input id="pphone" value="${esc(p.phone || '')}"></div>
      </div>
      <label>About you (customers see this)</label>
      <textarea id="pbio">${esc(p.bio || '')}</textarea>
      <div class="grid2">
        <div><label>Appointment length (minutes)</label><input id="pslot" type="number" min="10" max="180" step="5" value="${p.slot_minutes || 30}"></div>
        <div><label>Visible to customers</label>
          <select id="pactive"><option value="1"${p.active ? ' selected' : ''}>Yes</option><option value="0"${p.active ? '' : ' selected'}>No</option></select>
        </div>
      </div>
      <div style="height:16px"></div>
      <button id="saveProfile">Save profile</button>
    </div>

    <h2>Weekly hours</h2>
    <div class="card">
      <div class="list" id="availList">
        ${(avail.data || []).length === 0 ? `<p class="muted">No hours set — customers cannot book yet.</p>` :
          (avail.data || []).map(a => `<div class="card tight between"><div><h3>${DAYS_EN[a.weekday]}</h3><div class="small muted mono">${a.start_time.slice(0, 5)} – ${a.end_time.slice(0, 5)}</div></div><button class="tiny ghost" data-delav="${a.id}">Remove</button></div>`).join('')}
      </div>
      <hr>
      <div class="sched-row">
        <div><label>Day</label><select id="avDay">${DAYS_EN.map((d, i) => `<option value="${i}">${d}</option>`).join('')}</select></div>
        <div><label>From</label><input id="avFrom" type="time" value="09:00"></div>
        <div><label>To</label><input id="avTo" type="time" value="18:00"></div>
        <div><button class="tiny" id="addAv">Add</button></div>
      </div>
    </div>

    <h2>Days off</h2>
    <div class="card">
      <div class="list">
        ${(off.data || []).length === 0 ? `<p class="muted">None.</p>` : (off.data || []).map(o => `<div class="card tight between"><div>${o.day}${o.note ? ' · ' + esc(o.note) : ''}</div><button class="tiny ghost" data-deloff="${o.id}">Remove</button></div>`).join('')}
      </div>
      <hr>
      <div class="row">
        <div><label>Date</label><input id="offDay" type="date" min="${todayISO()}"></div>
        <div><label>Reason (optional)</label><input id="offNote"></div>
        <div style="display:flex;align-items:end"><button class="tiny" id="addOff">Add</button></div>
      </div>
    </div>
  `);

  $('#saveProfile').onclick = async () => {
    const f = $('#photo').files[0];
    let photo_path = p.photo_path || null;
    if (f) {
      if (f.size > 3 * 1024 * 1024) return note('Photo is larger than 3 MB.', true);
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
    await barberPortal(); note('Profile saved.');
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
    if (!$('#offDay').value) return note('Pick a date.', true);
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
  render(`<h1>Manager</h1><p class="sub">Loading…</p>`);
  const [users, appts, codes] = await Promise.all([
    sb.rpc('list_users'),
    sb.from('appointments').select('*').gte('starts_at', new Date(Date.now() - 7 * 864e5).toISOString()).order('starts_at'),
    sb.from('access_codes').select('id,role,label,active,multi_use,created_at,used_at').order('created_at', { ascending: false })
  ]);
  if (users.error) return note(users.error.message, true);
  const byId = Object.fromEntries((users.data || []).map(u => [u.id, u]));
  const booked = (appts.data || []).filter(a => a.status === 'booked');
  const barbers = (users.data || []).filter(u => u.role === 'barber');

  render(`
    <h1>Manager</h1>
    <p class="sub">${(users.data || []).length} accounts · ${barbers.length} barbers · ${booked.length} appointments booked</p>

    <h2>Appointments</h2>
    <div class="scroll"><table>
      <tr><th>When</th><th>Barber</th><th>Customer</th><th>Phone</th><th>Status</th><th></th></tr>
      ${(appts.data || []).length === 0 ? `<tr><td colspan="6" class="muted">Nothing yet.</td></tr>` : (appts.data || []).map(a => `
        <tr>
          <td>${fmtDate(a.starts_at)} ${fmtTime(a.starts_at)}</td>
          <td>${esc(byId[a.barber_id]?.full_name || '—')}</td>
          <td>${esc(a.customer_name)}</td>
          <td>${esc(a.customer_phone)}</td>
          <td>${a.status === 'booked' ? '<span class="pill">booked</span>' : `<span class="pill off">${esc(a.status)}</span>`}</td>
          <td>${a.status === 'booked' ? `<button class="tiny ghost" data-cancel="${a.id}">Cancel</button>` : ''}</td>
        </tr>`).join('')}
    </table></div>

    <h2>People</h2>
    <div class="scroll"><table>
      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Visible</th></tr>
      ${(users.data || []).map(u => `
        <tr>
          <td>${esc(u.full_name || '—')}</td>
          <td class="small">${esc(u.email)}</td>
          <td class="small">${esc(u.phone || '—')}</td>
          <td><select data-role="${u.id}">
            ${['customer', 'barber', 'manager'].map(r => `<option value="${r}"${u.role === r ? ' selected' : ''}>${r}</option>`).join('')}
          </select></td>
          <td>${u.role === 'barber' ? `<button class="tiny ghost" data-vis="${u.id}" data-on="${u.active ? 1 : 0}">${u.active ? 'Hide' : 'Show'}</button>` : '—'}</td>
        </tr>`).join('')}
    </table></div>

    <h2>Barber access codes</h2>
    <div class="card">
      <label>Label (e.g. the barber's name)</label>
      <input id="codeLabel" placeholder="Yossi">
      <div style="height:12px"></div>
      <button id="mint">Generate a single-use barber code</button>
      <div id="codeOut"></div>
    </div>
    <div class="scroll"><table>
      <tr><th>Label</th><th>Role</th><th>Status</th><th>Created</th><th></th></tr>
      ${(codes.data || []).map(c => `
        <tr>
          <td>${esc(c.label || '—')}</td><td>${esc(c.role)}</td>
          <td>${c.active ? '<span class="pill">active</span>' : '<span class="pill off">used / off</span>'}</td>
          <td class="small">${fmtDate(c.created_at)}</td>
          <td>${c.active ? `<button class="tiny ghost" data-off="${c.id}">Disable</button>` : ''}</td>
        </tr>`).join('')}
    </table></div>
    <p class="small muted">Codes are never stored in readable form — only a bcrypt hash. A generated code is shown once; copy it before you leave the page.</p>
  `);

  $('#mint').onclick = async () => {
    const { data, error } = await sb.rpc('create_barber_code', { p_label: $('#codeLabel').value.trim() });
    if (error) return note(error.message, true);
    $('#codeOut').innerHTML = `<div class="note"><b>New barber code:</b> <span class="mono">${esc(data)}</span><br><span class="small">Shown once. Single use.</span></div>`;
  };
  $$('[data-role]').forEach(s => s.onchange = async () => {
    const { error } = await sb.rpc('set_user_role', { p_user: s.dataset.role, p_role: s.value });
    if (error) { note(error.message, true); return; }
    await managerPortal(); note('Role updated.');
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

/* ================= CUSTOMER (Hebrew) ================= */
let cust = { barber: null, day: todayISO(), slot: null };

async function customerPortal() {
  const uid = state.session.user.id;
  render(`<h1>קביעת תור</h1><p class="sub">טוען…</p>`, true);
  const [barbers, mine] = await Promise.all([
    sb.from('public_barbers').select('*').order('full_name'),
    sb.from('appointments').select('*').eq('customer_id', uid).gte('starts_at', new Date(Date.now() - 864e5).toISOString()).order('starts_at')
  ]);
  const list = barbers.data || [];
  const p = state.profile || {};

  render(`
    <h1>קביעת תור</h1>
    <p class="sub">בחרו ספר, בחרו שעה פנויה, וזה נסגר.</p>

    <h2>התורים שלי</h2>
    <div class="list">
      ${(mine.data || []).filter(a => a.status === 'booked').length === 0 ? `<p class="muted">אין לכם תורים כרגע.</p>` :
        (mine.data || []).filter(a => a.status === 'booked').map(a => {
          const b = list.find(x => x.id === a.barber_id);
          return `<div class="card tight between">
            <div><h3>${fmtDate(a.starts_at, 'he-IL')} · ${fmtTime(a.starts_at)}</h3>
            <div class="small muted">${esc(b?.full_name || 'ספר')}</div></div>
            <button class="tiny ghost" data-cancel="${a.id}">ביטול</button>
          </div>`;
        }).join('')}
    </div>

    <h2>הספרים שלנו</h2>
    <div class="list" id="barbers">
      ${list.length === 0 ? `<p class="muted">אין ספרים זמינים כרגע.</p>` : list.map(b => `
        <button class="barber ${cust.barber === b.id ? 'sel' : ''}" data-b="${b.id}">
          ${avatar(b.full_name, b.photo_path)}
          <div>
            <h3>${esc(b.full_name || 'ספר')}</h3>
            <div class="small muted">${esc(b.bio || '')}</div>
            <div class="small muted">${b.slot_minutes} דקות לתור</div>
          </div>
        </button>`).join('')}
    </div>

    <div id="pick" class="${cust.barber ? '' : 'hidden'}">
      <h2>בחירת תאריך ושעה</h2>
      <div class="card">
        <label>תאריך</label>
        <input id="day" type="date" min="${todayISO()}" value="${cust.day}">
        <div style="height:14px"></div>
        <div id="slots" class="muted">בחרו תאריך</div>
      </div>
      <div id="confirm" class="hidden">
        <div class="card">
          <label>שם מלא</label><input id="cname" value="${esc(p.full_name || '')}">
          <label>טלפון</label><input id="cphone" inputmode="tel" value="${esc(p.phone || '')}">
          <label>הערות (לא חובה)</label><input id="cnotes" placeholder="תספורת + זקן">
          <div style="height:16px"></div>
          <button id="book">אישור התור</button>
        </div>
      </div>
    </div>
  `, true);

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
    box.className = 'muted'; box.textContent = 'טוען שעות…';
    const { data, error } = await sb.rpc('available_slots', { p_barber: cust.barber, p_day: cust.day });
    if (error) { box.textContent = error.message; return; }
    const slots = data || [];
    if (!slots.length) { box.className = 'muted'; box.textContent = 'אין שעות פנויות בתאריך הזה.'; $('#confirm').classList.add('hidden'); return; }
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
      if (!name || !phone) return note('נדרשים שם וטלפון.', true);
      bookBtn.disabled = true;
      const { error } = await sb.rpc('book_appointment', {
        p_barber: cust.barber, p_start: cust.slot, p_name: name, p_phone: phone, p_notes: $('#cnotes').value.trim()
      });
      bookBtn.disabled = false;
      if (error) return note(error.message, true);
      await sb.from('profiles').update({ full_name: name, phone }).eq('id', uid);
      cust.slot = null;
      await customerPortal();
      note('התור נקבע. הספר קיבל התראה.');
    };
  }
}

/* ---------------- go ---------------- */
sb.auth.onAuthStateChange((evt) => { if (evt === 'SIGNED_OUT') { setPortal(null); route(); } });
route();
