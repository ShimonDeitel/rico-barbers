/* RICO BARBERS — one page, one link.
   #/        the shop
   #/book    booking, no account needed
   #/staff   the team, signed in with Google
*/

import {
  sb, T, lang, toggleLang, applyDir, $, $$, esc, toast,
  fmtTime, fmtDate, fmtShort, todayISO, dayISO, shopNow,
  avatar, googleCalUrl, shopContent, parseJSON, SUPABASE_URL, TZ
} from './ui.js?v=20260730205304';

const home = $('#home');
const view = $('#view');
const REFS_KEY = 'rico.bookings';
const SITE = location.origin + location.pathname;

let C = {};                                   // shop content
let me = { id: null, role: null, profile: null, email: null };

/* ============================ THE SHOP ============================ */

function splitTitle() {
  $$('.title .line').forEach((line, li) => {
    const text = line.dataset.text || '';
    line.innerHTML = [...text].map((ch, i) =>
      `<span class="ch" style="animation-delay:${(li * 0.26 + i * 0.055).toFixed(2)}s">${esc(ch)}</span>`).join('');
  });
}

const hoursByDay = () => {
  const out = {};
  for (const r of parseJSON(C.hours_json, [])) if (r && typeof r.d === 'number') out[r.d] = r;
  return out;
};
function isOpenNow() {
  const row = hoursByDay()[shopNow().getDay()];
  if (!row || !row.o || !row.c) return false;
  const now = shopNow(), mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = row.o.split(':').map(Number);
  const [ch, cm] = row.c.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}
const pick = (base) => C[`${base}_${lang}`] || C[`${base}_he`] || '';

function paintHome() {
  $$('[data-i]').forEach(el => { el.innerHTML = T[el.dataset.i] ?? el.innerHTML; });
  $('#langBtn').textContent = T.short;

  $('#tagline').textContent = pick('tagline');
  $('#about-text').textContent = pick('about');
  $('#address').textContent = pick('address');
  $('#policy').textContent = pick('policy');
  $('#years').textContent = C.years || '';

  $('#waBtn').href = `https://wa.me/${encodeURIComponent(C.whatsapp || '')}`;
  $('#telBtn').href = `tel:${(C.phone || '').replace(/\s/g, '')}`;
  $('#igBtn').href = C.instagram || '#';
  $('#mapsBtn').href = C.maps_url || '#';

  const open = isOpenNow();
  $('#eyebrow').classList.toggle('shut', !open);
  $('#openState').textContent = open ? T.open : T.closed;

  const w = T.marquee;
  $('#marquee').innerHTML = [...w, ...w].map(x => `<span>${esc(x)}</span><i>&mdash;</i>`).join('');

  $('#services-list').innerHTML = parseJSON(C.services_json, []).map(s => `
    <div class="srow reveal">
      <span class="sname">${esc(lang === 'en' ? (s.en || s.he) : (s.he || s.en))}</span>
      <span class="smin">${esc(s.min || '')} ${esc(T.min)}</span>
      <span class="sprice">${esc(T.currency)}${esc(s.price || '')}</span>
    </div>`).join('');

  // a photo is {p, he, en}; older entries were bare strings
  const shots = parseJSON(C.gallery_json, []).map(s => typeof s === 'string' ? { p: s } : s);
  $('#gallery').innerHTML = shots.map((s, i) => {
    const cap = (lang === 'en' ? (s.en || s.he) : (s.he || s.en)) || '';
    return `<figure class="reveal${i === 0 ? ' lead' : ''}">
      <img loading="lazy" alt="${esc(cap)}"
           src="${SUPABASE_URL}/storage/v1/object/public/photos/${encodeURI(s.p)}">
      ${cap ? `<figcaption><span>${esc(cap)}</span></figcaption>` : ''}
    </figure>`;
  }).join('');
  $('#shots').style.display = shots.length ? '' : 'none';

  const revs = parseJSON(C.reviews_json, []);
  $('#reviews-list').innerHTML = revs.map(r => `
    <figure class="rev reveal">
      <div class="stars" aria-label="${esc(String(r.stars || 5))}">${'★'.repeat(Math.max(1, Math.min(5, +r.stars || 5)))}</div>
      <blockquote>${esc(r.text || '')}</blockquote>
      <figcaption>${esc(r.name || '')}${r.src ? ` · <span>${esc(r.src)}</span>` : ''}</figcaption>
    </figure>`).join('');
  $('#reviews').style.display = revs.length ? '' : 'none';

  const by = hoursByDay(), today = shopNow().getDay();
  $('#hours-list').innerHTML = T.days.map((d, i) => {
    const r = by[i], shut = !r || !r.o || !r.c;
    return `<div class="hrow ${i === today ? 'today' : ''} ${shut ? 'shut' : ''}">
      <span class="hday">${esc(d)}</span>
      <span class="htime">${shut ? esc(T.closedToday) : `${esc(r.o)} — ${esc(r.c)}`}</span></div>`;
  }).join('');

  observeReveals();
}

/* reveal on scroll, with a sweep that also covers anything already in view */
let io;
function observeReveals() {
  if (io) io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px', threshold: .12 });
  $$('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('in');
    else io.observe(el);
  });
}
function sweep() {
  $$('.reveal:not(.in)').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('in');
  });
}
let sweepT = null;
addEventListener('scroll', () => { if (!sweepT) sweepT = setTimeout(() => { sweepT = null; sweep(); }, 80); }, { passive: true });
addEventListener('resize', sweep, { passive: true });

/* ============================ BOOKING ============================ */

const loadRefs = () => { try { return JSON.parse(localStorage.getItem(REFS_KEY) || '[]'); } catch (e) { return []; } };
const saveRefs = (a) => { try { localStorage.setItem(REFS_KEY, JSON.stringify(a.slice(-20))); } catch (e) { /* ignore */ } };

let barbers = [];
let pickd = { barber: null, day: todayISO(), slot: null, name: '', phone: '' };

async function bookView() {
  view.innerHTML = `<h1 class="page">${esc(T.bookTitle)}</h1><p class="dek">${esc(T.loading)}</p>`;

  if (!barbers.length) {
    const { data } = await sb.from('public_barbers').select('*').order('full_name');
    barbers = data || [];
  }
  if (barbers.length === 1) pickd.barber = barbers[0].id;

  const refs = loadRefs();
  const rows = await Promise.all(refs.map(id =>
    sb.rpc('get_booking', { p_id: id }).then(r => (r.data && r.data[0]) || null)));
  const mine = rows.filter(Boolean)
    .filter(a => a.status === 'booked' && new Date(a.ends_at) > new Date())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  saveRefs(mine.map(a => a.id));

  const addr = pick('address');

  view.innerHTML = `
    <h1 class="page">${esc(T.bookTitle)}</h1>
    <p class="dek">${esc(T.bookSub)}</p>

    ${mine.length ? `
      <h2 class="sec">${esc(T.myBookings)}</h2>
      ${mine.map(a => `
        <div class="appt">
          <span class="time">${fmtTime(a.starts_at)}</span>
          <span class="grow">
            <span class="who2">${esc(fmtDate(a.starts_at))}</span>
            <span class="meta">${esc(a.barber_name || '')}</span>
          </span>
        </div>
        <div class="brow" style="margin:-4px 0 12px">
          <a class="b ghost sm" target="_blank" rel="noopener"
             href="${esc(googleCalUrl(a, a.barber_name, addr))}">${esc(T.addToCal)}</a>
          <button class="b ghost sm" data-cancel="${a.id}">${esc(T.cancelBooking)}</button>
        </div>`).join('')}` : ''}

    <h2 class="sec">${esc(T.chooseBarber)}</h2>
    <div class="stack">
      ${barbers.length === 0 ? `<p class="dek">${esc(T.noBarbers)}</p>` : barbers.map(b => `
        <button class="choice ${pickd.barber === b.id ? 'on' : ''}" data-b="${b.id}">
          ${avatar(b.full_name, b.photo_path)}
          <span class="grow">
            <span class="name">${esc(b.full_name || '')}</span><br>
            <span class="sub2">${esc(b.bio || '')}${b.bio ? ' · ' : ''}${b.slot_minutes} ${esc(T.minutes)}</span>
          </span>
        </button>`).join('')}
    </div>

    <div id="rest" class="${pickd.barber ? '' : 'hide'}">
      <h2 class="sec">${esc(T.chooseDay)}</h2>
      <div class="chips" id="days"></div>
      <h2 class="sec">${esc(T.chooseTime)}</h2>
      <div id="slots" class="dek">${esc(T.loading)}</div>
      <div id="details" class="hide">
        <h2 class="sec">${esc(T.yourDetails)}</h2>
        <div class="panel pad">
          <div class="field"><label>${esc(T.fullName)}</label><input id="cname" autocomplete="name" value="${esc(pickd.name)}"></div>
          <div class="field"><label>${esc(T.phone)}</label><input id="cphone" inputmode="tel" autocomplete="tel" value="${esc(pickd.phone)}"></div>
          <div class="field"><label>${esc(T.notesOpt)}</label><input id="cnotes" placeholder="${esc(T.notesPh)}"></div>
          <button class="b" id="go">${esc(T.confirm)}</button>
        </div>
      </div>
    </div>`;

  $$('[data-cancel]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await sb.rpc('cancel_booking', { p_id: b.dataset.cancel });
    if (error) { b.disabled = false; return toast(error.message, true); }
    saveRefs(loadRefs().filter(x => x !== b.dataset.cancel));
    toast(T.cancelled); bookView();
  });

  $$('[data-b]').forEach(el => el.onclick = () => {
    pickd.barber = el.dataset.b; pickd.slot = null;
    $$('.choice').forEach(c => c.classList.toggle('on', c.dataset.b === pickd.barber));
    $('#rest').classList.remove('hide');
    drawDays(); loadSlots();
  });

  if (pickd.barber) { drawDays(); loadSlots(); }
}

function drawDays() {
  const box = $('#days');
  box.innerHTML = Array.from({ length: 14 }, (_, i) => {
    const iso = dayISO(i), d = new Date(iso + 'T12:00:00');
    const label = i === 0 ? T.todayLabel : i === 1 ? T.tomorrowLabel : T.daysShort[d.getDay()];
    return `<button class="chip ${pickd.day === iso ? 'on' : ''}" data-day="${iso}">
      <span class="d1">${esc(label)}</span>${d.getDate()}/${d.getMonth() + 1}</button>`;
  }).join('');
  $$('[data-day]', box).forEach(b => b.onclick = () => {
    pickd.day = b.dataset.day; pickd.slot = null;
    $$('.chip', box).forEach(c => c.classList.toggle('on', c.dataset.day === pickd.day));
    loadSlots();
  });
}

async function loadSlots() {
  const box = $('#slots');
  box.className = 'dek'; box.textContent = T.loading;
  const { data, error } = await sb.rpc('available_slots', { p_barber: pickd.barber, p_day: pickd.day });
  if (error) { box.textContent = error.message; return; }
  const slots = data || [];
  $('#details').classList.add('hide');
  if (!slots.length) { box.className = 'dek'; box.textContent = T.noSlots; return; }
  box.className = 'chips';
  box.innerHTML = slots.map(s => `<button class="chip" data-s="${esc(s)}">${fmtTime(s)}</button>`).join('');
  $$('[data-s]', box).forEach(b => b.onclick = () => {
    pickd.slot = b.dataset.s;
    $$('.chip', box).forEach(c => c.classList.toggle('on', c.dataset.s === pickd.slot));
    $('#details').classList.remove('hide');
    $('#details').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#go').onclick = confirmBooking;
  });
}

async function confirmBooking() {
  const name = $('#cname').value.trim(), phone = $('#cphone').value.trim();
  if (!name || !phone) return toast(T.needNamePhone, true);
  pickd.name = name; pickd.phone = phone;
  $('#go').disabled = true;
  const { data, error } = await sb.rpc('book_public', {
    p_barber: pickd.barber, p_start: pickd.slot, p_name: name,
    p_phone: phone, p_notes: $('#cnotes').value.trim(), p_lang: lang
  });
  $('#go').disabled = false;
  if (error) return toast(error.message, true);
  saveRefs([...loadRefs(), data]);

  const got = await sb.rpc('get_booking', { p_id: data });
  const a = (got.data && got.data[0]) || null;
  const addr = pick('address');
  view.innerHTML = `
    <h1 class="page">${esc(T.booked)}</h1>
    <p class="dek">${esc(T.bookedSub)}</p>
    ${a ? `<div class="panel pad" style="margin-top:18px">
      <div class="appt" style="border:none;padding:0">
        <span class="time">${fmtTime(a.starts_at)}</span>
        <span><span class="who2">${esc(fmtDate(a.starts_at))}</span>
        <span class="meta">${esc(a.barber_name || '')}${addr ? ' · ' + esc(addr) : ''}</span></span>
      </div></div>
      <div class="brow" style="margin-top:14px">
        <a class="b" target="_blank" rel="noopener" href="${esc(googleCalUrl(a, a.barber_name, addr))}">${esc(T.addToCal)}</a>
        <button class="b ghost" id="again">${esc(T.another)}</button>
      </div>` : ''}
    <p class="dek" style="margin-top:26px">${esc(pick('policy'))}</p>`;
  const again = $('#again');
  if (again) again.onclick = () => { pickd.slot = null; bookView(); };
  scrollTo(0, 0);
}


/* One tap opens WhatsApp with the reminder already written, sent from the
   barber's own number. No provider, no cost, and it is what barbers do anyway. */
function remindLink(a, barberName) {
  const when = fmtTime(a.starts_at);
  const day = new Date(a.starts_at).toLocaleDateString(T.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
  const shop = C.shop_name || 'RICO BARBERS';
  const body = (a.customer_lang === 'en' || lang === 'en')
    ? `Hi ${a.customer_name}, a reminder about your appointment at ${shop} on ${day} at ${when}. See you.`
    : `היי ${a.customer_name}, תזכורת לתור שלך ב${shop} ב${day} בשעה ${when}. נתראה!`;
  const phone = a.customer_phone.replace(/[^0-9]/g, '').replace(/^0/, '972');
  return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
}

/* ---------------- calendar ----------------
   A month grid built by hand:each day shows how many appointments sit on it,
   the picked day drives the list underneath. */
let calCursor = null;            // first of the month being shown
let calPicked = null;            // 'YYYY-MM-DD'

const isoOf = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const shopDay = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });

function calendarHTML(appts, offDays) {
  const now = shopNow();
  if (!calCursor) calCursor = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!calPicked) calPicked = todayISO();

  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const lead = first.getDay();                       // week starts Sunday, as in Israel

  const counts = {};
  appts.forEach(a => { const k = shopDay(a.starts_at); counts[k] = (counts[k] || 0) + 1; });
  const off = new Set(offDays || []);

  const title = first.toLocaleDateString(T.locale, { month: 'long', year: 'numeric' });
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span class="cday empty"></span>');
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOf(new Date(y, m, d));
    const n = counts[iso] || 0;
    const cls = [
      'cday',
      iso === todayISO() ? 'today' : '',
      iso === calPicked ? 'picked' : '',
      off.has(iso) ? 'off' : '',
      n ? 'has' : ''
    ].filter(Boolean).join(' ');
    cells.push(`<button class="${cls}" data-cal="${iso}">
      <span class="n">${d}</span>${n ? `<span class="pips">${'<i></i>'.repeat(Math.min(n, 4))}</span>` : ''}
    </button>`);
  }

  return `
    <div class="cal">
      <div class="calhead">
        <button class="b ghost sm" data-cal-move="-1" aria-label="${esc(T.prevMonth)}">‹</button>
        <b>${esc(title)}</b>
        <button class="b ghost sm" data-cal-move="1" aria-label="${esc(T.nextMonth)}">›</button>
        <button class="b ghost sm" data-cal-move="0">${esc(T.todayBtn)}</button>
      </div>
      <div class="calgrid">
        ${T.daysShort.map(d => `<span class="cdow">${esc(d)}</span>`).join('')}
        ${cells.join('')}
      </div>
    </div>`;
}

function wireCalendar(rerender) {
  $$('[data-cal-move]').forEach(b => b.onclick = () => {
    const step = +b.dataset.calMove;
    if (step === 0) { const n = shopNow(); calCursor = new Date(n.getFullYear(), n.getMonth(), 1); calPicked = todayISO(); }
    else calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + step, 1);
    rerender();
  });
  $$('[data-cal]').forEach(b => b.onclick = () => { calPicked = b.dataset.cal; rerender(); });
}

/* ============================ STAFF ============================ */

/* A barber leaves this page open on the counter all day, so it has to keep
   itself current: refresh every minute while visible, and the moment the tab
   is looked at again. */
let liveTimer = null;
function keepLive() {
  if (liveTimer) return;
  liveTimer = setInterval(() => {
    if (document.hidden) return;
    if (currentRoute() !== 'staff') return;
    if (document.querySelector('#view input:focus, #view textarea:focus, #view select:focus')) return;
    if (document.querySelector('#view details.fold[open]')) return;   // mid-edit, leave them alone
    staffView();
  }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentRoute() === 'staff') staffView();
  });
}

async function staffView() {
  view.innerHTML = `<h1 class="page">${esc(T.loading)}</h1>`;
  const { data: { session } } = await sb.auth.getSession();

  if (!session) return doorScreen();

  const { error: dead } = await sb.auth.getUser();
  if (dead) { await sb.auth.signOut(); return doorScreen(); }

  me.id = session.user.id;
  me.email = session.user.email || '';
  const [r, p] = await Promise.all([
    sb.from('user_roles').select('role').eq('user_id', me.id).maybeSingle(),
    sb.from('profiles').select('*').eq('id', me.id).maybeSingle()
  ]);
  me.role = r.data?.role || 'customer';
  me.profile = p.data || {};

  keepLive();
  if (me.role === 'manager') return managerView();
  if (me.role === 'barber') return barberView();
  return codeScreen();
}

/* the door: who are you here as? */
async function doorScreen() {
  const card = await sb.rpc('manager_card').then(r => (r.data && r.data[0]) || null);
  view.innerHTML = `
    <h1 class="page">${esc(T.staffTitle)}</h1>
    <p class="dek">${esc(T.doorSub)}</p>

    ${card ? `
      <div class="panel rowline" style="margin-top:22px;max-width:460px">
        ${avatar(card.full_name, card.photo_path)}
        <span class="grow">
          <span style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)">${esc(T.managerOfShop)}</span><br>
          <span style="font-size:18px;font-weight:600">${esc(card.full_name || '')}</span>
          ${card.phone ? `<br><a class="sub2" style="color:var(--dim);text-decoration:none" href="tel:${esc(card.phone.replace(/[^0-9+]/g,''))}">${esc(card.phone)}</a>` : ''}
        </span>
      </div>` : ''}

    <div class="stack" style="max-width:460px;margin-top:16px">
      <button class="b" id="asBarber">${esc(T.doorBarber)}</button>
      <button class="b ghost" id="asManager">${esc(T.doorManager)}</button>
    </div>
    <p class="dek" style="margin-top:16px;font-size:13px;max-width:460px">${esc(T.staffFoot)}</p>`;

  const go = async (kind) => {
    try { localStorage.setItem('rico.door', kind); } catch (e) { /* ignore */ }
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: SITE + '#/staff' }
    });
    if (error) toast(error.message, true);
  };
  $('#asBarber').onclick = () => go('barber');
  $('#asManager').onclick = () => go('manager');
}

/* signed in with Google but not staff yet: ask for the code */
function codeScreen() {
  let kind = 'barber';
  try { kind = localStorage.getItem('rico.door') === 'manager' ? 'manager' : 'barber'; } catch (e) { /* ignore */ }
  const label = kind === 'manager' ? T.codeManager : T.codeBarber;

  view.innerHTML = `
    <h1 class="page">${esc(label)}</h1>
    <p class="dek">${esc(T.signedInAs)} ${esc(me.email)}</p>
    <div class="panel pad" style="max-width:420px;margin-top:18px">
      <div class="field">
        <label>${esc(T.yourNameQ)}</label>
        <input id="myName" autocomplete="name" value="${esc(me.profile?.full_name || '')}">
      </div>
      <div class="field">
        <label>${esc(label)}</label>
        <input id="theCode" inputmode="numeric" maxlength="12" autocomplete="off"
               style="font-size:26px;text-align:center;letter-spacing:.3em;direction:ltr" placeholder="••••••">
      </div>
      <button class="b" id="claim">${esc(T.finish)}</button>
      <p class="dek" style="margin:14px 0 0;font-size:13px">${esc(T.codeHint)}</p>
      <div class="center2" style="margin-top:10px">
        <button class="b ghost sm" id="other">${esc(T.switchAccount)}</button>
      </div>
    </div>`;

  const submit = async () => {
    const code = $('#theCode').value.replace(/\D/g, '');
    if (code.length < 4) return toast(T.wrongCode, true);
    $('#claim').disabled = true;
    const { error } = await sb.rpc('claim_role',
      { p_kind: kind, p_code: code, p_name: $('#myName').value.trim() });
    $('#claim').disabled = false;
    if (error) { $('#theCode').value = ''; return toast(error.message, true); }
    staffView();
  };
  $('#claim').onclick = submit;
  $('#theCode').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('#other').onclick = async () => { await sb.auth.signOut(); doorScreen(); };
  $('#theCode').focus();
}

async function barberView() {
  const [appts, avail, off] = await Promise.all([
    sb.from('appointments').select('*').eq('barber_id', me.id).eq('status', 'booked')
      .gte('starts_at', new Date(Date.now() - 40 * 864e5).toISOString())
      .lte('starts_at', new Date(Date.now() + 70 * 864e5).toISOString()).order('starts_at'),
    sb.from('availability').select('*').eq('barber_id', me.id).order('weekday'),
    sb.from('time_off').select('*').eq('barber_id', me.id).gte('day', todayISO()).order('day')
  ]);

  const list = appts.data || [];
  const offDays = (off.data || []).map(o => o.day);
  if (!calPicked) calPicked = todayISO();
  const dayList = list.filter(a => shopDay(a.starts_at) === calPicked);
  const p = me.profile || {};
  const addr = pick('address');
  const pickedLabel = new Date(calPicked + 'T12:00:00').toLocaleDateString(T.locale,
    { weekday: 'long', day: 'numeric', month: 'long' });
  const tomorrowISO = dayISO(1);
  const tomorrowList = list.filter(a => shopDay(a.starts_at) === tomorrowISO);

  const wa = (ph) => 'https://wa.me/' + ph.replace(/[^0-9]/g, '').replace(/^0/, '972');

  view.innerHTML = `
    <div class="rowline" style="margin-bottom:6px">
      <h1 class="page grow" style="margin:0">${esc(T.hi)} ${esc(p.full_name || '')}</h1>
      <button class="b ghost sm" id="out">${esc(T.signOut)}</button>
    </div>
    <p class="dek">${list.filter(a => shopDay(a.starts_at) === todayISO()).length} ${esc(T.apptsToday)}</p>

    <h2 class="sec">${esc(T.tomorrow)} · ${esc(new Date(tomorrowISO + 'T12:00:00').toLocaleDateString(T.locale, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
    ${tomorrowList.length ? `
      ${tomorrowList.map(a => `
        <div class="appt">
          <span class="time">${fmtTime(a.starts_at)}</span>
          <span class="grow">
            <span class="who2">${esc(a.customer_name)}</span>
            <span class="meta">${esc(a.customer_phone)}</span>
          </span>
          <a class="b sm" target="_blank" rel="noopener"
             href="${esc(remindLink(a, p.full_name))}">${esc(T.remind)}</a>
        </div>`).join('')}
      <p class="dek" style="font-size:13px;margin-top:4px">${esc(T.remindHint)}</p>
    ` : `<p class="dek">${esc(T.noTomorrow)}</p>`}

    <h2 class="sec">${esc(T.calendar)}</h2>
    <div id="calBox">${calendarHTML(list, offDays)}</div>

    <h2 class="sec">${esc(pickedLabel)}</h2>
    ${dayList.length ? dayList.map(a => `
      <div class="appt">
        <span class="time">${fmtTime(a.starts_at)}</span>
        <span class="grow">
          <span class="who2">${esc(a.customer_name)}</span>
          <span class="meta">${esc(a.customer_phone)}${a.notes ? ' · ' + esc(a.notes) : ''}</span>
        </span>
      </div>
      <div class="brow" style="margin:-4px 0 12px">
        <a class="b ghost sm" href="tel:${esc(a.customer_phone.replace(/[^0-9+]/g, ''))}">${esc(T.call)}</a>
        <a class="b ghost sm" target="_blank" rel="noopener" href="${esc(wa(a.customer_phone))}">${esc(T.whatsapp)}</a>
        <a class="b ghost sm" target="_blank" rel="noopener" href="${esc(googleCalUrl(a, p.full_name, addr))}">${esc(T.addToCal)}</a>
        <button class="b danger sm" data-cancel="${a.id}">${esc(T.cancel)}</button>
      </div>`).join('') : `<p class="dek">${esc(offDays.includes(calPicked) ? T.freeDay : T.noneThatDay)}</p>`}

    <details class="fold" style="margin-top:34px">
      <summary>${esc(T.myProfile)}</summary>
      <div class="inner">
        <div class="rowline" style="margin-bottom:14px">
          ${avatar(p.full_name, p.photo_path, 'lg')}
          <div class="grow field" style="margin:0">
            <label>${esc(T.photo)}</label>
            <input type="file" id="photo" accept="image/jpeg,image/png,image/webp">
          </div>
        </div>
        <div class="field"><label>${esc(T.about)}</label><textarea id="bio">${esc(p.bio || '')}</textarea></div>
        <div class="two">
          <div class="field"><label>${esc(T.apptLength)}</label>
            <input id="slotmin" type="number" min="10" max="180" step="5" value="${p.slot_minutes || 30}"></div>
          <div class="field"><label>${esc(T.shownToCustomers)}</label>
            <select id="active"><option value="1"${p.active ? ' selected' : ''}>${esc(T.yes)}</option><option value="0"${p.active ? '' : ' selected'}>${esc(T.no)}</option></select></div>
        </div>
        <button class="b" id="saveProfile">${esc(T.save)}</button>
      </div>
    </details>

    <details class="fold">
      <summary>${esc(T.myHours)}</summary>
      <div class="inner" id="hoursBox"></div>
    </details>

    <details class="fold">
      <summary>${esc(T.daysOff)}</summary>
      <div class="inner">
        <div class="stack" id="offList"></div>
        <div class="two" style="margin-top:12px">
          <div class="field"><label>${esc(T.date)}</label><input id="offDay" type="date" min="${todayISO()}"></div>
          <div class="field"><label>${esc(T.reason)}</label><input id="offNote"></div>
        </div>
        <button class="b ghost" id="addOff">${esc(T.addDayOff)}</button>
      </div>
    </details>`;

  $('#out').onclick = async () => { await sb.auth.signOut(); staffView(); };
  wireCancels(barberView);
  wireCalendar(barberView);
  drawWorkHours(avail.data || [], me.id, barberView);
  drawDaysOff(off.data || [], barberView);

  $('#saveProfile').onclick = async () => {
    const f = $('#photo').files[0];
    let photo_path = p.photo_path || null;
    if (f) {
      if (f.size > 3 * 1024 * 1024) return toast('3MB', true);
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      // a fresh name every time: the bucket is CDN-cached, so overwriting one
      // path would keep serving the old picture
      const next = `${me.id}/avatar-${Date.now()}.${ext}`;
      const up = await sb.storage.from('photos').upload(next, f, { contentType: f.type });
      if (up.error) return toast(up.error.message, true);
      if (photo_path && photo_path !== next) {
        await sb.storage.from('photos').remove([photo_path]);   // no orphans left behind
      }
      photo_path = next;
    }
    const { error } = await sb.from('profiles').update({
      bio: $('#bio').value.trim(),
      slot_minutes: Math.max(10, Math.min(180, parseInt($('#slotmin').value || '30', 10))),
      active: $('#active').value === '1',
      photo_path
    }).eq('id', me.id);
    if (error) return toast(error.message, true);
    toast(f ? T.photoChanged : T.saved);
    me.profile = { ...p, photo_path };
    staffView();
  };
}

function wireCancels(after) {
  $$('[data-cancel]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await sb.rpc('cancel_booking', { p_id: b.dataset.cancel });
    if (error) { b.disabled = false; return toast(error.message, true); }
    toast(T.cancelled); after();
  });
}

function drawWorkHours(rows, barberId, after) {
  const box = $('#hoursBox');
  if (!box) return;
  const by = {}; rows.forEach(r => { by[r.weekday] = r; });
  box.innerHTML = T.days.map((d, i) => {
    const r = by[i];
    return `<div class="panel" data-day="${i}" style="margin-bottom:8px">
      <div class="rowline" style="gap:10px;flex-wrap:wrap">
        <b style="min-width:74px">${esc(d)}</b>
        <select data-f="on" style="width:auto">
          <option value="1"${r ? ' selected' : ''}>${esc(T.openDay)}</option>
          <option value="0"${r ? '' : ' selected'}>${esc(T.closedDay)}</option>
        </select>
        <input data-f="o" type="time" style="width:auto;flex:1 1 110px" value="${esc(r ? r.start_time.slice(0, 5) : '10:00')}">
        <input data-f="c" type="time" style="width:auto;flex:1 1 110px" value="${esc(r ? r.end_time.slice(0, 5) : '20:00')}">
      </div></div>`;
  }).join('') + `<button class="b" id="saveHours">${esc(T.save)}</button>`;

  $('#saveHours').onclick = async () => {
    const rows2 = $$('[data-day]', box).map(row => ({
      weekday: +row.dataset.day,
      on: $('[data-f=on]', row).value === '1',
      start_time: $('[data-f=o]', row).value,
      end_time: $('[data-f=c]', row).value
    })).filter(r => r.on && r.start_time && r.end_time && r.end_time > r.start_time);

    const del = await sb.from('availability').delete().eq('barber_id', barberId);
    if (del.error) return toast(del.error.message, true);
    if (rows2.length) {
      const ins = await sb.from('availability').insert(rows2.map(w =>
        ({ barber_id: barberId, weekday: w.weekday, start_time: w.start_time, end_time: w.end_time })));
      if (ins.error) return toast(ins.error.message, true);
    }
    toast(T.saved); after();
  };
}

function drawDaysOff(rows, after) {
  const list = $('#offList');
  if (!list) return;
  list.innerHTML = rows.length ? rows.map(o => `
    <div class="panel rowline" style="margin:0">
      <span class="grow">${esc(o.day)}${o.note ? ' · ' + esc(o.note) : ''}</span>
      <button class="b ghost sm" data-deloff="${o.id}">${esc(T.remove)}</button>
    </div>`).join('') : `<p class="dek">${esc(T.none)}</p>`;
  $$('[data-deloff]').forEach(b => b.onclick = async () => {
    await sb.from('time_off').delete().eq('id', b.dataset.deloff); after();
  });
  $('#addOff').onclick = async () => {
    if (!$('#offDay').value) return toast(T.date, true);
    const { error } = await sb.from('time_off').insert(
      { barber_id: me.id, day: $('#offDay').value, note: $('#offNote').value.trim() });
    if (error) return toast(error.message, true);
    after();
  };
}

async function managerView() {
  const start = new Date(todayISO() + 'T00:00:00Z').toISOString();
  const weekEnd = new Date(Date.now() + 7 * 864e5).toISOString();
  const monthEnd = new Date(Date.now() + 70 * 864e5).toISOString();
  const [team, appts, cfg, sec] = await Promise.all([
    sb.rpc('list_team'),
    sb.from('appointments').select('*').eq('status', 'booked')
      .gte('starts_at', new Date(Date.now() - 40 * 864e5).toISOString())
      .lte('starts_at', monthEnd).order('starts_at'),
    sb.rpc('get_settings'),
    sb.rpc('recent_security', { p_limit: 8 })
  ]);
  if (team.error) return toast(team.error.message, true);

  const rows = team.data || [];
  const byId = Object.fromEntries(rows.filter(r => r.user_id).map(r => [r.user_id, r]));
  const all = appts.data || [];
  if (!calPicked) calPicked = todayISO();
  const dayList = all.filter(a => shopDay(a.starts_at) === calPicked);
  const todays = all.filter(a => shopDay(a.starts_at) === todayISO());
  const c = cfg.data || {};
  const pickedLabel = new Date(calPicked + 'T12:00:00').toLocaleDateString(T.locale,
    { weekday: 'long', day: 'numeric', month: 'long' });

  view.innerHTML = `
    <div class="rowline" style="margin-bottom:6px">
      <h1 class="page grow" style="margin:0">${esc(T.manager)}</h1>
      <button class="b ghost sm" id="out">${esc(T.signOut)}</button>
    </div>

    <div class="tiles" style="margin-top:18px">
      <div class="tile"><b>${todays.length}</b><span>${esc(T.statToday)}</span></div>
      <div class="tile"><b>${all.filter(a => a.starts_at >= start && a.starts_at <= weekEnd).length}</b><span>${esc(T.statWeek)}</span></div>
      <div class="tile"><b>${rows.filter(r => r.role === 'barber').length}</b><span>${esc(T.statBarbers)}</span></div>
    </div>

    <h2 class="sec">${esc(T.calendar)}</h2>
    <div id="calBox">${calendarHTML(all, [])}</div>

    <h2 class="sec">${esc(pickedLabel)}</h2>
    ${dayList.length ? dayList.map(a => `
      <div class="appt">
        <span class="time">${fmtTime(a.starts_at)}</span>
        <span class="grow"><span class="who2">${esc(a.customer_name)}</span>
        <span class="meta">${esc(byId[a.barber_id]?.full_name || '')} · ${esc(a.customer_phone)}</span></span>
        <button class="b danger sm" data-cancel="${a.id}">${esc(T.cancel)}</button>
      </div>`).join('') : `<p class="dek">${esc(T.noneThatDay)}</p>`}

    <h2 class="sec">${esc(T.team)}</h2>
    <div class="stack">
      ${rows.map(u => `
        <div class="panel rowline">
          ${avatar(u.full_name || u.email, u.photo_path)}
          <span class="grow">
            <span style="font-size:17px;font-weight:600">${esc(u.full_name || u.email)}</span><br>
            <span style="color:var(--dim);font-size:13px">${esc(u.email)}</span>
          </span>
          ${u.role === 'manager' ? `<span class="tag">${esc(T.manager)}</span>` :
            `<button class="b danger sm" data-rm="${esc(u.user_id)}">${esc(T.removeBarber)}</button>`}
        </div>`).join('')}
    </div>

    <h2 class="sec">${esc(T.codes)}</h2>
    <div class="panel pad">
      <p class="dek" style="margin-top:0;font-size:13px">${esc(T.codeHint2)}</p>
      <div class="two">
        <div class="field"><label>${esc(T.barberCodeLbl)}</label>
          <input id="codeBarber" inputmode="numeric" maxlength="12" placeholder="${esc(T.codeRule)}"></div>
        <div class="field"><label>${esc(T.managerCodeLbl)}</label>
          <input id="codeManager" inputmode="numeric" maxlength="12" placeholder="${esc(T.codeRule)}"></div>
      </div>
      <button class="b" id="saveCodes">${esc(T.newCode)}</button>
    </div>

    <details class="fold" style="margin-top:34px">
      <summary>${esc(T.myProfile)}</summary>
      <div class="inner">
        <div class="rowline" style="margin-bottom:14px">
          ${avatar(me.profile?.full_name, me.profile?.photo_path, 'lg')}
          <div class="grow field" style="margin:0">
            <label>${esc(T.photo)}</label>
            <input type="file" id="photo" accept="image/jpeg,image/png,image/webp">
          </div>
        </div>
        <div class="two">
          <div class="field"><label>${esc(T.fullName)}</label><input id="mName" value="${esc(me.profile?.full_name || '')}"></div>
          <div class="field"><label>${esc(T.phone)}</label><input id="mPhone" inputmode="tel" value="${esc(me.profile?.phone || '')}"></div>
        </div>
        <div class="field"><label>${esc(T.showPhone)}</label>
          <select id="mShow"><option value="1"${me.profile?.show_phone !== false ? ' selected' : ''}>${esc(T.yes)}</option><option value="0"${me.profile?.show_phone === false ? ' selected' : ''}>${esc(T.no)}</option></select>
        </div>
        <button class="b" id="saveMe">${esc(T.save)}</button>
      </div>
    </details>

    <details class="fold">
      <summary>${esc(T.website)}</summary>
      <div class="inner">
        <div class="two">
          <div class="field"><label>${esc(T.tagline)} (HE)</label><input id="k_tagline_he" value="${esc(c.tagline_he || '')}"></div>
          <div class="field"><label>${esc(T.tagline)} (EN)</label><input id="k_tagline_en" value="${esc(c.tagline_en || '')}"></div>
        </div>
        <div class="field"><label>${esc(T.aboutShop)} (HE)</label><textarea id="k_about_he">${esc(c.about_he || '')}</textarea></div>
        <div class="field"><label>${esc(T.aboutShop)} (EN)</label><textarea id="k_about_en">${esc(c.about_en || '')}</textarea></div>
        <div class="two">
          <div class="field"><label>${esc(T.address)} (HE)</label><input id="k_address_he" value="${esc(c.address_he || '')}"></div>
          <div class="field"><label>${esc(T.address)} (EN)</label><input id="k_address_en" value="${esc(c.address_en || '')}"></div>
        </div>
        <div class="two">
          <div class="field"><label>${esc(T.phone)}</label><input id="k_phone" value="${esc(c.phone || '')}"></div>
          <div class="field"><label>WhatsApp</label><input id="k_whatsapp" value="${esc(c.whatsapp || '')}"></div>
        </div>
        <div class="two">
          <div class="field"><label>${esc(T.instagram)}</label><input id="k_instagram" value="${esc(c.instagram || '')}"></div>
          <div class="field"><label>${esc(T.mapsLink)}</label><input id="k_maps_url" value="${esc(c.maps_url || '')}"></div>
        </div>
        <div class="field"><label>${esc(T.years)}</label><input id="k_years" type="number" min="0" max="99" value="${esc(c.years || '')}"></div>
        <div class="field"><label>${esc(T.policy)} (HE)</label><textarea id="k_policy_he">${esc(c.policy_he || '')}</textarea></div>
        <div class="field"><label>${esc(T.policy)} (EN)</label><textarea id="k_policy_en">${esc(c.policy_en || '')}</textarea></div>

        <h2 class="sec">${esc(T.priceList)}</h2>
        <div id="svcRows"></div>
        <button class="b ghost sm" id="addSvc">${esc(T.addService)}</button>

        <h2 class="sec">${esc(T.openHours)}</h2>
        <div id="shopHours"></div>

        <h2 class="sec">${esc(T.reviews)}</h2>
        <div id="revRows"></div>
        <button class="b ghost sm" id="addRev">${esc(T.addReview)}</button>

        <h2 class="sec">${esc(T.gallery)}</h2>
        <div class="gal" id="gal"></div>
        <div class="field" style="margin-top:12px">
          <label>${esc(T.addPhotos)}</label>
          <input type="file" id="galFiles" accept="image/jpeg,image/png,image/webp" multiple>
        </div>
        <button class="b" id="saveSite" style="margin-top:16px">${esc(T.save)}</button>
      </div>
    </details>

    <details class="fold">
      <summary>${esc(T.security)}</summary>
      <div class="inner"><table class="mini">
        <tr><th>${esc(T.when)}</th><th>${esc(T.event)}</th></tr>
        ${(sec.data || []).length ? (sec.data || []).map(s => `
          <tr><td>${esc(fmtShort(s.at))} ${fmtTime(s.at)}</td><td>${esc(s.event)}</td></tr>`).join('')
          : `<tr><td colspan="2" style="color:var(--dim)">${esc(T.nothing)}</td></tr>`}
      </table></div>
    </details>`;

  $('#out').onclick = async () => { await sb.auth.signOut(); staffView(); };
  wireCancels(managerView);
  wireCalendar(managerView);

  $('#saveMe').onclick = async () => {
    const f = $('#photo').files[0];
    let photo_path = me.profile?.photo_path || null;
    if (f) {
      if (f.size > 3 * 1024 * 1024) return toast('3MB', true);
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const next = `${me.id}/avatar-${Date.now()}.${ext}`;
      const up = await sb.storage.from('photos').upload(next, f, { contentType: f.type });
      if (up.error) return toast(up.error.message, true);
      if (photo_path && photo_path !== next) await sb.storage.from('photos').remove([photo_path]);
      photo_path = next;
    }
    const { error } = await sb.from('profiles').update({
      full_name: $('#mName').value.trim(),
      phone: $('#mPhone').value.trim(),
      show_phone: $('#mShow').value === '1',
      photo_path
    }).eq('id', me.id);
    if (error) return toast(error.message, true);
    toast(f ? T.photoChanged : T.saved);
    staffView();
  };

  $('#saveCodes').onclick = async () => {
    const jobs = [];
    if ($('#codeBarber').value.trim())  jobs.push(['barber',  $('#codeBarber').value.trim()]);
    if ($('#codeManager').value.trim()) jobs.push(['manager', $('#codeManager').value.trim()]);
    if (!jobs.length) return;
    for (const [kind, code] of jobs) {
      const { error } = await sb.rpc('set_code', { p_kind: kind, p_code: code });
      if (error) return toast(error.message, true);
    }
    toast(T.codeSaved); managerView();
  };
  $$('[data-rm]').forEach(b => b.onclick = async () => {
    if (!confirm(T.confirmRemove)) return;
    const { error } = await sb.rpc('remove_staff', { p_user: b.dataset.rm });
    if (error) return toast(error.message, true);
    toast(T.saved); managerView();
  });

  /* website content */
  let services = parseJSON(c.services_json, []);
  let hours = parseJSON(c.hours_json, []);
  let gallery = parseJSON(c.gallery_json, []).map(s => typeof s === 'string' ? { p: s } : s);
  let reviews = parseJSON(c.reviews_json, []);

  const drawSvc = () => {
    $('#svcRows').innerHTML = services.map((s, i) => `
      <div class="panel" data-svc="${i}" style="margin-bottom:8px">
        <div class="two">
          <div class="field" style="margin:0"><label>${esc(T.svcName)}</label><input data-f="he" value="${esc(s.he || '')}"></div>
          <div class="field" style="margin:0"><label>${esc(T.svcNameEn)}</label><input data-f="en" value="${esc(s.en || '')}"></div>
        </div>
        <div class="rowline" style="gap:10px;margin-top:10px">
          <input data-f="price" inputmode="numeric" style="flex:1" value="${esc(s.price || '')}" placeholder="${esc(T.svcPrice)}">
          <input data-f="min" inputmode="numeric" style="flex:1" value="${esc(s.min || '')}" placeholder="${esc(T.svcMin)}">
          <button class="b ghost sm" data-delsvc="${i}">${esc(T.remove)}</button>
        </div></div>`).join('');
    $$('[data-delsvc]').forEach(b => b.onclick = () => { readSvc(); services.splice(+b.dataset.delsvc, 1); drawSvc(); });
  };
  const readSvc = () => {
    services = $$('[data-svc]').map(r => ({
      he: $('[data-f=he]', r).value.trim(), en: $('[data-f=en]', r).value.trim(),
      price: $('[data-f=price]', r).value.trim(), min: $('[data-f=min]', r).value.trim()
    })).filter(s => s.he || s.en);
  };
  const drawShopHours = () => {
    const by = {}; hours.forEach(h => { if (h && typeof h.d === 'number') by[h.d] = h; });
    $('#shopHours').innerHTML = T.days.map((d, i) => {
      const h = by[i] || { o: '', c: '' }, on = !!(h.o && h.c);
      return `<div class="panel" data-hr="${i}" style="margin-bottom:8px">
        <div class="rowline" style="gap:10px;flex-wrap:wrap">
          <b style="min-width:74px">${esc(d)}</b>
          <select data-f="on" style="width:auto"><option value="1"${on ? ' selected' : ''}>${esc(T.openDay)}</option><option value="0"${on ? '' : ' selected'}>${esc(T.closedDay)}</option></select>
          <input data-f="o" type="time" style="width:auto;flex:1 1 110px" value="${esc(h.o || '10:00')}">
          <input data-f="c" type="time" style="width:auto;flex:1 1 110px" value="${esc(h.c || '20:00')}">
        </div></div>`;
    }).join('');
  };
  const readShopHours = () => {
    hours = $$('[data-hr]').map(r => {
      const on = $('[data-f=on]', r).value === '1';
      return { d: +r.dataset.hr, o: on ? $('[data-f=o]', r).value : '', c: on ? $('[data-f=c]', r).value : '' };
    });
  };
  const drawGal = () => {
    $('#gal').innerHTML = gallery.map((s, i) => `
      <div class="galedit" data-pic="${i}">
        <figure><img src="${SUPABASE_URL}/storage/v1/object/public/photos/${encodeURI(s.p)}" alt="">
        <button class="b ghost sm" data-delpic="${i}">${esc(T.remove)}</button></figure>
        <input data-f="he" placeholder="${esc(T.capHe)}" value="${esc(s.he || '')}">
        <input data-f="en" placeholder="${esc(T.capEn)}" value="${esc(s.en || '')}">
      </div>`).join('');
    $$('[data-delpic]').forEach(b => b.onclick = () => { readGal(); gallery.splice(+b.dataset.delpic, 1); drawGal(); });
  };
  const readGal = () => {
    gallery = $$('[data-pic]').map((row, i) => ({
      p: gallery[+row.dataset.pic].p,
      he: $('[data-f=he]', row).value.trim(),
      en: $('[data-f=en]', row).value.trim()
    }));
  };
  const drawRev = () => {
    $('#revRows').innerHTML = reviews.map((r, i) => `
      <div class="panel" data-rev="${i}" style="margin-bottom:8px">
        <div class="rowline" style="gap:10px">
          <input data-f="name" style="flex:2" placeholder="${esc(T.revName)}" value="${esc(r.name || '')}">
          <input data-f="stars" style="flex:0 0 70px" inputmode="numeric" placeholder="${esc(T.revStars)}" value="${esc(String(r.stars ?? 5))}">
          <button class="b ghost sm" data-delrev="${i}">${esc(T.remove)}</button>
        </div>
        <textarea data-f="text" style="margin-top:10px" placeholder="${esc(T.revText)}">${esc(r.text || '')}</textarea>
      </div>`).join('');
    $$('[data-delrev]').forEach(b => b.onclick = () => { readRev(); reviews.splice(+b.dataset.delrev, 1); drawRev(); });
  };
  const readRev = () => {
    reviews = $$('[data-rev]').map((row, i) => ({
      name: $('[data-f=name]', row).value.trim(),
      stars: Math.max(1, Math.min(5, parseInt($('[data-f=stars]', row).value || '5', 10))),
      text: $('[data-f=text]', row).value.trim(),
      src: reviews[+row.dataset.rev]?.src || T.onGoogle
    })).filter(r => r.name || r.text);
  };
  drawSvc(); drawShopHours(); drawGal(); drawRev();
  $('#addRev').onclick = () => { readRev(); reviews.push({ name: '', stars: 5, text: '', src: T.onGoogle }); drawRev(); };
  $('#addSvc').onclick = () => { readSvc(); services.push({ he: '', en: '', price: '', min: '30' }); drawSvc(); };

  $('#galFiles').onchange = async () => {
    readGal();
    for (const f of [...$('#galFiles').files].slice(0, 12)) {
      if (f.size > 3 * 1024 * 1024) { toast('3MB', true); continue; }
      const path = `${me.id}/gallery/${Date.now()}-${Math.floor(performance.now())}.${(f.name.split('.').pop() || 'jpg').toLowerCase()}`;
      const up = await sb.storage.from('photos').upload(path, f, { upsert: true, contentType: f.type });
      if (up.error) { toast(up.error.message, true); continue; }
      gallery.push({ p: path, he: '', en: '' });
    }
    $('#galFiles').value = ''; drawGal(); toast(T.saved);
  };

  $('#saveSite').onclick = async () => {
    readSvc(); readShopHours(); readGal(); readRev();
    const body = {
      services_json: JSON.stringify(services),
      hours_json: JSON.stringify(hours),
      gallery_json: JSON.stringify(gallery),
      reviews_json: JSON.stringify(reviews)
    };
    ['tagline_he', 'tagline_en', 'about_he', 'about_en', 'address_he', 'address_en',
     'phone', 'whatsapp', 'instagram', 'maps_url', 'years', 'policy_he', 'policy_en']
      .forEach(k => { body[k] = $(`#k_${k}`).value.trim(); });
    const { error } = await sb.rpc('set_content', { p_content: body });
    if (error) return toast(error.message, true);
    C = { ...C, ...body };
    paintHome();
    toast(T.saved);
  };

}

/* ============================ ROUTER ============================ */

function currentRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('book')) return 'book';
  if (h.startsWith('staff')) return 'staff';
  return 'home';
}

async function route() {
  applyDir();
  const r = currentRoute();
  const nav = $('#nav');
  home.classList.toggle('hide', r !== 'home');
  view.classList.toggle('hide', r === 'home');
  $$('.navlinks a, .cta, .sticky-cta').forEach(a => a.classList.toggle('hide', r !== 'home'));
  nav.classList.toggle('stuck', r !== 'home');

  if (r === 'home') { paintHome(); sweep(); return; }
  if (r === 'book') return bookView();
  return staffView();
}

addEventListener('hashchange', () => { scrollTo(0, 0); route(); });

/* Tapping a link for the page you are already on fires no hashchange, so the
   view would sit there — e.g. "book" while still on a booking confirmation. */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  if (a.getAttribute('href') === (location.hash || '#/')) { e.preventDefault(); scrollTo(0, 0); route(); }
});
addEventListener('scroll', () => {
  if (currentRoute() === 'home') $('#nav').classList.toggle('stuck', scrollY > 30);
}, { passive: true });

$('#langBtn').onclick = () => toggleLang(route);

/* desktop cursor dot */
if (matchMedia('(hover: hover)').matches) {
  const dot = $('#cursor');
  addEventListener('mousemove', e => {
    dot.classList.add('on');
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  }, { passive: true });
  document.addEventListener('mouseover', e => {
    dot.classList.toggle('grow', !!e.target.closest('a, button, .srow, .choice, .chip'));
  }, { passive: true });
}

/* ============================ GO ============================ */
splitTitle();
C = await shopContent();
$('#langBtn').textContent = T.short;
await route();

// PKCE leaves ?code= in the address bar after Google sends the user back; tidy it
if (location.search.includes('code=')) {
  history.replaceState({}, '', SITE + location.hash);
}
