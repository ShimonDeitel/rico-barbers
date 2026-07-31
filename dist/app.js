/* RICO BARBERS — one page, one link.
   #/        the shop
   #/book    booking, no account needed
   #/staff   the team, signed in with Google
*/

import {
  sb, T, lang, toggleLang, applyDir, $, $$, esc, toast,
  fmtTime, fmtDate, fmtShort, todayISO, dayISO, shopNow,
  avatar, googleCalUrl, shopContent, parseJSON, SUPABASE_URL, TZ, SHOP
} from './ui.js?v=20260731144412';

const home = $('#home');
const view = $('#view');
const REFS_KEY = 'rico.bookings';
const SITE = location.origin + location.pathname;

let C = {};                                   // shop content
let me = { id: null, role: null, profile: null, email: null };
let shopId = null;                            // this shop's uuid, resolved once from its slug

async function loadShopId() {
  if (shopId) return shopId;
  const { data } = await sb.rpc('shop_id', { p_slug: SHOP });
  shopId = data || null;
  return shopId;
}

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

  // the ticker belongs to the shop, not to the codebase: its own city and services
  const city = (pick('address').split(',').pop() || '').trim();
  const svcNames = parseJSON(C.services_json, [])
    .map(s => (lang === 'en' ? (s.en || s.he) : (s.he || s.en)) || '').filter(Boolean).slice(0, 4);
  const w = [city, ...svcNames].filter(Boolean);
  const words = w.length >= 3 ? w : T.marquee;
  $('#marquee').innerHTML = [...words, ...words].map(x => `<span>${esc(x)}</span><i>&mdash;</i>`).join('');

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
let pickd = { barber: null, day: todayISO(), slot: null, mins: null, name: '', phone: '' };

const lengthsOf = (id) => {
  const b = barbers.find(x => x.id === id);
  const o = (b && b.slot_options) || [];
  return o.length ? o : [b?.slot_minutes || 30];
};

async function bookView() {
  view.innerHTML = `<h1 class="page">${esc(T.bookTitle)}</h1><p class="dek">${esc(T.loading)}</p>`;

  if (!barbers.length) {
    const { data } = await sb.from('public_barbers').select('*').eq('shop', SHOP).order('full_name');
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
            <span class="sub2">${esc(b.bio || '')}${b.bio ? ' · ' : ''}${esc(lengthsOf(b.id).join(' / '))} ${esc(T.minutes)}</span>
          </span>
        </button>`).join('')}
    </div>

    <div id="rest" class="${pickd.barber ? '' : 'hide'}">
      <div id="lenBox"></div>
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
    pickd.barber = el.dataset.b; pickd.slot = null; pickd.mins = null;
    $$('.choice').forEach(c => c.classList.toggle('on', c.dataset.b === pickd.barber));
    $('#rest').classList.remove('hide');
    drawLengths(); drawDays(); loadSlots();
  });

  if (pickd.barber) { drawLengths(); drawDays(); loadSlots(); }
}

/* only worth asking when the barber actually offers a choice */
function drawLengths() {
  const box = $('#lenBox');
  if (!box) return;
  const opts = lengthsOf(pickd.barber);
  if (!pickd.mins || !opts.includes(pickd.mins)) pickd.mins = opts[0];
  if (opts.length < 2) { box.innerHTML = ''; return; }
  box.innerHTML = `<h2 class="sec">${esc(T.chooseLength)}</h2>
    <div class="chips">${opts.map(m =>
      `<button class="chip ${m === pickd.mins ? 'on' : ''}" data-m="${m}">${m} ${esc(T.minutes)}</button>`).join('')}</div>`;
  $$('[data-m]', box).forEach(b => b.onclick = () => {
    pickd.mins = +b.dataset.m; pickd.slot = null;
    $$('.chip', box).forEach(c => c.classList.toggle('on', +c.dataset.m === pickd.mins));
    loadSlots();
  });
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
  const { data, error } = await sb.rpc('available_slots',
    { p_shop: SHOP, p_barber: pickd.barber, p_day: pickd.day, p_minutes: pickd.mins });
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
    p_shop: SHOP, p_barber: pickd.barber, p_start: pickd.slot, p_name: name,
    p_phone: phone, p_notes: $('#cnotes').value.trim(), p_lang: lang,
    p_minutes: pickd.mins
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
  await loadShopId();
  const [r, p] = await Promise.all([
    sb.rpc('my_role', { p_shop: SHOP }),
    sb.from('profiles').select('*').eq('id', me.id).maybeSingle()
  ]);
  me.role = r.data || 'customer';
  me.profile = p.data || {};

  keepLive();
  if (me.role === 'manager') return managerView();
  if (me.role === 'barber') return barberView();

  const ticket = readTicket();
  if (ticket && Date.now() - ticket.at < 15 * 60 * 1000) return nameScreen(ticket);
  writeTicket(null);
  return noAccessScreen();
}

/* the door: code first, Google second */
const TICKET_KEY = 'rico.ticket';
const readTicket = () => { try { return JSON.parse(localStorage.getItem(TICKET_KEY) || 'null'); } catch (e) { return null; } };
const writeTicket = (t) => { try { t ? localStorage.setItem(TICKET_KEY, JSON.stringify(t)) : localStorage.removeItem(TICKET_KEY); } catch (e) { /* ignore */ } };

async function doorScreen() {
  const card = await sb.rpc('manager_card', { p_shop: SHOP }).then(r => (r.data && r.data[0]) || null);
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
      <button class="b" data-door="barber">${esc(T.doorBarber)}</button>
      <button class="b ghost" data-door="manager">${esc(T.doorManager)}</button>
    </div>
    <p class="dek" style="margin-top:16px;font-size:13px;max-width:460px">${esc(T.staffFoot)}</p>`;

  $$('[data-door]').forEach(b => b.onclick = () => askCode(b.dataset.door));
}

/* nothing happens, and no sign-in is offered, until the code checks out */
function askCode(kind) {
  const label = kind === 'manager' ? T.codeManager : T.codeBarber;
  view.innerHTML = `
    <h1 class="page">${esc(label)}</h1>
    <p class="dek">${esc(T.codeFirst)}</p>
    <div class="panel pad" style="max-width:420px;margin-top:18px">
      <div class="field">
        <label>${esc(label)}</label>
        <input id="theCode" autocomplete="off" spellcheck="false"
               autocapitalize="characters" autocorrect="off"
               style="font-size:22px;text-align:center;letter-spacing:.18em;direction:ltr" placeholder="••••••">
      </div>
      <button class="b" id="checkIt">${esc(T.continueBtn)}</button>
      <p class="dek" style="margin:14px 0 0;font-size:13px">${esc(T.codeHint)}</p>
      <div class="center2" style="margin-top:10px">
        <button class="b ghost sm" id="back">${esc(T.back)}</button>
      </div>
    </div>`;

  const submit = async () => {
    const code = $('#theCode').value.trim();
    if (code.length < 4) return toast(T.wrongCode, true);
    $('#checkIt').disabled = true;
    const { data, error } = await sb.rpc('check_code', { p_shop: SHOP, p_kind: kind, p_code: code });
    $('#checkIt').disabled = false;
    if (error) return toast(error.message, true);
    if (!data) {                                     // wrong, or locked out for guessing
      $('#theCode').select();                        // leave it there so a typo can be fixed
      return toast(T.wrongCode, true);
    }
    $('#theCode').value = '';
    writeTicket({ id: data, kind, at: Date.now() });
    googleStep(kind);
  };
  $('#checkIt').onclick = submit;
  /* a phone keyboard likes to send lowercase; show the owner what is really going out */
  $('#theCode').oninput = (e) => {
    const at = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(at, at);
  };
  /* a copied code drags its label along with it; keep only the code itself */
  $('#theCode').addEventListener('paste', (e) => {
    const raw = (e.clipboardData || window.clipboardData || {}).getData?.('text') || '';
    const tok = raw.match(/[A-Za-z]{2}[^A-Za-z0-9]?[A-Za-z0-9]{6,24}/);
    if (!tok) return;
    e.preventDefault();
    e.target.value = tok[0].toUpperCase();
  });
  $('#theCode').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  $('#back').onclick = doorScreen;
  $('#theCode').focus();
}

/* code accepted: now, and only now, offer Google */
function googleStep(kind) {
  view.innerHTML = `
    <h1 class="page">${esc(kind === 'manager' ? T.doorManager : T.doorBarber)}</h1>
    <p class="dek">${esc(T.codeOk)}</p>
    <div class="panel pad" style="max-width:420px;margin-top:18px">
      <button class="b" id="g">${esc(T.google)}</button>
      <p class="dek" style="margin:14px 0 0;font-size:13px">${esc(T.googleWhy)}</p>
    </div>`;
  $('#g').onclick = async () => {
    $('#g').disabled = true; $('#g').textContent = T.signingIn;
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: SITE + '#/staff' }
    });
    if (error) { $('#g').disabled = false; $('#g').textContent = T.google; toast(error.message, true); }
  };
}

/* signed in, ticket in hand: last step is the name */
function nameScreen(ticket) {
  view.innerHTML = `
    <h1 class="page">${esc(T.yourNameQ)}</h1>
    <p class="dek">${esc(T.signedInAs)} ${esc(me.email)}</p>
    <div class="panel pad" style="max-width:420px;margin-top:18px">
      <div class="field">
        <label>${esc(T.fullName)}</label>
        <input id="myName" autocomplete="name" value="${esc(me.profile?.full_name || '')}">
      </div>
      <button class="b" id="claim">${esc(T.finish)}</button>
      <div class="center2" style="margin-top:10px">
        <button class="b ghost sm" id="other">${esc(T.switchAccount)}</button>
      </div>
    </div>`;
  $('#claim').onclick = async () => {
    $('#claim').disabled = true;
    const { error } = await sb.rpc('claim_role', { p_ticket: ticket.id, p_name: $('#myName').value.trim() });
    $('#claim').disabled = false;
    if (error) { writeTicket(null); toast(error.message, true); return doorScreen(); }
    writeTicket(null);
    staffView();
  };
  $('#other').onclick = async () => { await sb.auth.signOut(); doorScreen(); };
  $('#myName').focus();
}

/* signed in but holding no ticket: dead end, on purpose */
function noAccessScreen() {
  view.innerHTML = `
    <h1 class="page">${esc(T.staffTitle)}</h1>
    <p class="dek">${esc(T.notStaff)}</p>
    <p class="dek" style="margin-top:6px">${esc(me.email)}</p>
    <div class="brow" style="margin-top:20px;max-width:420px">
      <button class="b ghost" id="out">${esc(T.signOut)}</button>
    </div>`;
  $('#out').onclick = async () => { await sb.auth.signOut(); doorScreen(); };
}

async function barberView() {
  const [appts, avail, off, team] = await Promise.all([
    sb.from('appointments').select('*').eq('shop_id', shopId).eq('barber_id', me.id).eq('status', 'booked')
      .gte('starts_at', new Date(Date.now() - 40 * 864e5).toISOString())
      .lte('starts_at', new Date(Date.now() + 70 * 864e5).toISOString()).order('starts_at'),
    sb.from('availability').select('*').eq('shop_id', shopId).eq('barber_id', me.id).order('weekday'),
    sb.from('time_off').select('*').eq('shop_id', shopId).eq('barber_id', me.id).gte('day', todayISO()).order('day'),
    sb.rpc('list_team', { p_shop: SHOP })
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

    ${teamHTML(team.data || [])}

    <details class="fold" style="margin-top:34px">
      <summary>${esc(T.myProfile)}</summary>
      <div class="inner">
        ${photoFieldHTML(p)}
        <div class="field"><label>${esc(T.fullName)}</label><input id="bName" value="${esc(p.full_name || '')}"></div>
        <div class="field"><label>${esc(T.about)}</label><textarea id="bio">${esc(p.bio || '')}</textarea></div>
        ${lengthsHTML()}
        <div class="field"><label>${esc(T.shownToCustomers)}</label>
          <select id="active"><option value="1"${p.active ? ' selected' : ''}>${esc(T.yes)}</option><option value="0"${p.active ? '' : ' selected'}>${esc(T.no)}</option></select></div>
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
  wireTeam(barberView);
  wirePhotoPreview();
  wireLengths(p.slot_options && p.slot_options.length ? p.slot_options : [p.slot_minutes || 30]);
  drawWorkHours(avail.data || [], me.id, barberView);
  drawDaysOff(off.data || [], barberView);

  $('#saveProfile').onclick = async () => {
    const shot = await uploadPhoto(p.photo_path);
    if (!shot) return;
    const { error } = await sb.from('profiles').update({
      full_name: $('#bName').value.trim(),
      bio: $('#bio').value.trim(),
      slot_options: myLens,
      slot_minutes: myLens[0] || 30,
      active: $('#active').value === '1',
      photo_path: shot.path
    }).eq('id', me.id);
    if (error) return toast(error.message, true);
    toast(shot.changed ? T.photoChanged : T.saved);
    me.profile = { ...p, photo_path: shot.path };
    forgetCachedFaces();
    staffView();
  };
}

/* ---- pieces both dashboards share ---- */

/* The whole team, and the door out of it. Everyone can remove everyone,
   the owner included; the code is what lets anyone back in. */
function teamHTML(rows) {
  return `
    <h2 class="sec">${esc(T.team)}</h2>
    <p class="dek" style="margin:-6px 0 12px;font-size:13px">${esc(T.teamHint)}</p>
    <div class="stack">
      ${rows.map(u => `
        <div class="panel rowline">
          ${avatar(u.full_name || u.email, u.photo_path)}
          <span class="grow">
            <span style="font-size:17px;font-weight:600">${esc(u.full_name || u.email)}</span><br>
            <span style="color:var(--dim);font-size:13px">${esc(u.email)}${u.user_id === me.id ? ' · ' + esc(T.you) : ''}</span>
          </span>
          ${u.role === 'manager' ? `<span class="tag">${esc(T.manager)}</span>` : ''}
          <button class="b danger sm" data-rm="${esc(u.user_id)}">${esc(T.removeBarber)}</button>
        </div>`).join('')}
    </div>`;
}

function wireTeam(after) {
  $$('[data-rm]').forEach(b => b.onclick = async () => {
    const self = b.dataset.rm === me.id;
    if (!confirm(self ? T.confirmRemoveSelf : T.confirmRemove)) return;
    b.disabled = true;
    const { error } = await sb.rpc('remove_staff', { p_shop: SHOP, p_user: b.dataset.rm });
    if (error) { b.disabled = false; return toast(error.message, true); }
    if (self) { await sb.auth.signOut(); me = { id: null, role: null, profile: null, email: null }; return staffView(); }
    toast(T.saved); after();
  });
}

/* Appointment lengths: a list, not a number. One entry and the customer is
   never asked; several and they choose. */
let myLens = [];
function lengthsHTML() {
  return `
    <div class="field">
      <label>${esc(T.lengths)}</label>
      <div class="chips" id="lenChips"></div>
      <div class="rowline" style="gap:8px;margin-top:10px">
        <input id="lenNew" type="number" min="5" max="240" step="5" placeholder="30" style="flex:0 0 110px">
        <button class="b ghost sm" id="lenAdd" type="button">${esc(T.addLength)}</button>
      </div>
      <p class="dek" style="font-size:13px;margin:8px 0 0">${esc(T.lengthsHint)}</p>
    </div>`;
}
function wireLengths(initial) {
  myLens = [...new Set((initial || []).filter(n => n >= 5 && n <= 240))].sort((a, b) => a - b);
  const draw = () => {
    $('#lenChips').innerHTML = myLens.length
      ? myLens.map(m => `<button class="chip on" type="button" data-dellen="${m}">${m} ${esc(T.minutes)} ✕</button>`).join('')
      : `<span class="dek" style="font-size:13px">${esc(T.none)}</span>`;
    $$('[data-dellen]').forEach(b => b.onclick = () => {
      myLens = myLens.filter(m => m !== +b.dataset.dellen); draw();
    });
  };
  $('#lenAdd').onclick = () => {
    const n = parseInt($('#lenNew').value || '0', 10);
    if (!(n >= 5 && n <= 240)) return;
    if (!myLens.includes(n)) myLens = [...myLens, n].sort((a, b) => a - b);
    $('#lenNew').value = ''; draw();
  };
  draw();
}

/* one photo field, one uploader, and every cached copy dropped afterwards */
function photoFieldHTML(p) {
  return `
    <div class="rowline" style="margin-bottom:14px">
      <span id="photoPrev">${avatar(p?.full_name, p?.photo_path, 'lg')}</span>
      <div class="grow field" style="margin:0">
        <label>${esc(T.photo)}</label>
        <input type="file" id="photo" accept="image/jpeg,image/png,image/webp">
        <p class="dek" style="font-size:13px;margin:8px 0 0">${esc(T.photoNow)}</p>
      </div>
    </div>`;
}
function wirePhotoPreview() {
  const inp = $('#photo');
  if (!inp) return;
  inp.onchange = () => {
    const f = inp.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    $('#photoPrev').innerHTML = `<img class="pic lg" src="${url}" alt="">`;
  };
}
async function uploadPhoto(current) {
  const f = $('#photo')?.files[0];
  if (!f) return { path: current || null, changed: false };
  if (f.size > 3 * 1024 * 1024) { toast('3MB', true); return null; }
  const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  // a fresh name every time: the bucket is CDN-cached, so overwriting one
  // path would keep serving the old picture
  const next = `${me.id}/avatar-${Date.now()}.${ext}`;
  const up = await sb.storage.from('photos').upload(next, f, { contentType: f.type });
  if (up.error) { toast(up.error.message, true); return null; }
  if (current && current !== next) await sb.storage.from('photos').remove([current]);
  return { path: next, changed: true };
}
/* the new face has to reach the booking page too, not just this screen */
function forgetCachedFaces() { barbers = []; }

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

    const del = await sb.from('availability').delete().eq('shop_id', shopId).eq('barber_id', barberId);
    if (del.error) return toast(del.error.message, true);
    if (rows2.length) {
      const ins = await sb.from('availability').insert(rows2.map(w =>
        ({ shop_id: shopId, barber_id: barberId, weekday: w.weekday, start_time: w.start_time, end_time: w.end_time })));
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
      { shop_id: shopId, barber_id: me.id, day: $('#offDay').value, note: $('#offNote').value.trim() });
    if (error) return toast(error.message, true);
    after();
  };
}

async function managerView() {
  const start = new Date(todayISO() + 'T00:00:00Z').toISOString();
  const weekEnd = new Date(Date.now() + 7 * 864e5).toISOString();
  const monthEnd = new Date(Date.now() + 70 * 864e5).toISOString();
  const [team, appts, cfg, sec, myAvail, myOff] = await Promise.all([
    sb.rpc('list_team', { p_shop: SHOP }),
    sb.from('appointments').select('*').eq('shop_id', shopId).eq('status', 'booked')
      .gte('starts_at', new Date(Date.now() - 40 * 864e5).toISOString())
      .lte('starts_at', monthEnd).order('starts_at'),
    sb.rpc('get_settings', { p_shop: SHOP }),
    sb.rpc('recent_security', { p_shop: SHOP, p_limit: 8 }),
    sb.from('availability').select('*').eq('shop_id', shopId).eq('barber_id', me.id).order('weekday'),
    sb.from('time_off').select('*').eq('shop_id', shopId).eq('barber_id', me.id).gte('day', todayISO()).order('day')
  ]);
  // a toast alone would leave the screen on "loading" forever; say what broke
  if (team.error) {
    view.innerHTML = `<h1 class="page">${esc(T.manager)}</h1>
      <p class="dek">${esc(team.error.message)}</p>
      <button class="b ghost" id="retry">${esc(T.back)}</button>`;
    $('#retry').onclick = staffView;
    return toast(team.error.message, true);
  }

  const rows = team.data || [];
  const byId = Object.fromEntries(rows.filter(r => r.user_id).map(r => [r.user_id, r]));
  const all = appts.data || [];
  if (!calPicked) calPicked = todayISO();
  const dayList = all.filter(a => shopDay(a.starts_at) === calPicked);
  const todays = all.filter(a => shopDay(a.starts_at) === todayISO());
  const c = cfg.data || {};
  /* a manager does not have to be one of the barbers */
  const cuts = me.profile?.active !== false;
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
      <div class="tile"><b>${rows.filter(r => r.active).length}</b><span>${esc(T.statBarbers)}</span></div>
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

    ${teamHTML(rows)}

    <h2 class="sec">${esc(T.codes)}</h2>
    <div class="panel pad">
      <p class="dek" style="margin-top:0;font-size:13px">${esc(T.codeHint2)}</p>
      <div class="field">
        <label>${esc(T.currentCode)}</label>
        <input id="codeNow" autocomplete="off" spellcheck="false" autocapitalize="characters"
               autocorrect="off" maxlength="40" style="direction:ltr">
        <p class="dek" style="font-size:13px;margin:8px 0 0">${esc(T.currentCodeHint)}</p>
      </div>
      <div class="two">
        <div class="field"><label>${esc(T.barberCodeLbl)}</label>
          <input id="codeBarber" autocomplete="off" spellcheck="false" autocapitalize="characters"
                 autocorrect="off" maxlength="32" style="direction:ltr" placeholder="${esc(T.codeRule)}"></div>
        <div class="field"><label>${esc(T.managerCodeLbl)}</label>
          <input id="codeManager" autocomplete="off" spellcheck="false" autocapitalize="characters"
                 autocorrect="off" maxlength="32" style="direction:ltr" placeholder="${esc(T.codeRule)}"></div>
      </div>
      <button class="b" id="saveCodes">${esc(T.newCode)}</button>
    </div>

    <details class="fold" style="margin-top:34px">
      <summary>${esc(T.myProfile)}</summary>
      <div class="inner">
        ${photoFieldHTML(me.profile)}
        <div class="two">
          <div class="field"><label>${esc(T.fullName)}</label><input id="mName" value="${esc(me.profile?.full_name || '')}"></div>
          <div class="field"><label>${esc(T.phone)}</label><input id="mPhone" inputmode="tel" value="${esc(me.profile?.phone || '')}"></div>
        </div>
        <div class="field"><label>${esc(T.showPhone)}</label>
          <select id="mShow"><option value="1"${me.profile?.show_phone !== false ? ' selected' : ''}>${esc(T.yes)}</option><option value="0"${me.profile?.show_phone === false ? ' selected' : ''}>${esc(T.no)}</option></select>
        </div>
        <div class="field">
          <label>${esc(T.alsoCuts)}</label>
          <select id="mActive"><option value="1"${cuts ? ' selected' : ''}>${esc(T.yes)}</option><option value="0"${cuts ? '' : ' selected'}>${esc(T.no)}</option></select>
          <p class="dek" style="font-size:13px;margin:8px 0 0">${esc(T.alsoCutsHint)}</p>
        </div>
        ${cuts ? lengthsHTML() : ''}
        <div class="field"><label>${esc(T.about)}</label><textarea id="mBio">${esc(me.profile?.bio || '')}</textarea></div>
        <button class="b" id="saveMe">${esc(T.save)}</button>
      </div>
    </details>

    ${cuts ? `
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
    </details>` : ''}

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
  wireTeam(managerView);
  wirePhotoPreview();
  if (cuts) {
    wireLengths(me.profile?.slot_options?.length ? me.profile.slot_options : [me.profile?.slot_minutes || 30]);
    drawWorkHours(myAvail.data || [], me.id, managerView);
    drawDaysOff(myOff.data || [], managerView);
  }

  $('#saveMe').onclick = async () => {
    const shot = await uploadPhoto(me.profile?.photo_path);
    if (!shot) return;
    const nowCuts = $('#mActive').value === '1';
    const patch = {
      full_name: $('#mName').value.trim(),
      phone: $('#mPhone').value.trim(),
      show_phone: $('#mShow').value === '1',
      bio: $('#mBio').value.trim(),
      active: nowCuts,
      photo_path: shot.path
    };
    if (cuts && nowCuts) { patch.slot_options = myLens; patch.slot_minutes = myLens[0] || 30; }
    const { error } = await sb.from('profiles').update(patch).eq('id', me.id);
    if (error) return toast(error.message, true);
    toast(shot.changed ? T.photoChanged : T.saved);
    me.profile = { ...me.profile, ...patch };
    forgetCachedFaces();
    staffView();
  };

  $('#saveCodes').onclick = async () => {
    const current = $('#codeNow').value.trim();
    const jobs = [];
    if ($('#codeBarber').value.trim())  jobs.push(['barber',  $('#codeBarber').value.trim()]);
    if ($('#codeManager').value.trim()) jobs.push(['manager', $('#codeManager').value.trim()]);
    if (!jobs.length) return;
    if (!current) return toast(T.needCurrentCode, true);
    $('#saveCodes').disabled = true;
    for (const [kind, code] of jobs) {
      const { data, error } = await sb.rpc('set_code', { p_shop: SHOP, p_kind: kind, p_code: code, p_current: current });
      if (error || data !== 'ok') {
        $('#saveCodes').disabled = false;
        return toast(error ? error.message : 'current manager code is wrong', true);
      }
    }
    toast(T.codeSaved); managerView();
  };

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
    const { error } = await sb.rpc('set_content', { p_shop: SHOP, p_content: body });
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

/* The staff link is not for customers. Three taps inside a second and a half. */
(() => {
  const link = document.querySelector('.foot a[href="#/staff"]');
  if (!link) return;
  let taps = 0, timer = null;
  link.addEventListener('click', (e) => {
    if (location.hash === '#/staff') return;         // already there, let it be
    e.preventDefault();
    taps += 1;
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; link.classList.remove('armed'); }, 1500);
    if (taps >= 2) link.classList.add('armed');      // a hint only once they are trying
    if (taps >= 3) {
      taps = 0; clearTimeout(timer); link.classList.remove('armed');
      location.hash = '#/staff';
    }
  });
})();

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
