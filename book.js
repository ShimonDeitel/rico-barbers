/* Customer booking. No account, no password: a booking is remembered by its id. */

import {
  sb, T, lang, toggleLang, applyDir, $, $$, esc, toast,
  fmtTime, fmtDate, todayISO, dayISO, avatar, googleCalUrl,
  shopContent, parseJSON
} from './ui.js';

const REFS_KEY = 'rico.bookings';
const view = $('#view');

const loadRefs = () => { try { return JSON.parse(localStorage.getItem(REFS_KEY) || '[]'); } catch (e) { return []; } };
const saveRefs = (a) => { try { localStorage.setItem(REFS_KEY, JSON.stringify(a.slice(-20))); } catch (e) { /* ignore */ } };

let barbers = [];
let content = {};
let pick = { barber: null, day: todayISO(), slot: null, name: '', phone: '' };

applyDir();
$('#langBtn').onclick = () => toggleLang(() => { $('#langBtn').textContent = T.short; render(); });
$('#langBtn').textContent = T.short;

/* ---------------- data ---------------- */
async function load() {
  const [b, c] = await Promise.all([
    sb.from('public_barbers').select('*').order('full_name'),
    shopContent()
  ]);
  barbers = b.data || [];
  content = c;
  if (barbers.length === 1) pick.barber = barbers[0].id;
}

async function myBookings() {
  const refs = loadRefs();
  if (!refs.length) return [];
  const rows = await Promise.all(refs.map(id =>
    sb.rpc('get_booking', { p_id: id }).then(r => (r.data && r.data[0]) || null)));
  const live = rows.filter(Boolean).filter(a => a.status === 'booked' && new Date(a.ends_at) > new Date());
  saveRefs(live.map(a => a.id));
  return live.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

/* ---------------- screens ---------------- */
async function render() {
  applyDir();
  view.innerHTML = `<h1 class="page">${esc(T.bookTitle)}</h1><p class="dek">${esc(T.loading)}</p>`;

  const mine = await myBookings();
  const addr = content[`address_${lang}`] || content.address_he || '';

  view.innerHTML = `
    <h1 class="page">${esc(T.bookTitle)}</h1>
    <p class="dek">${esc(T.bookSub)}</p>

    ${mine.length ? `
      <h2 class="sec">${esc(T.myBookings)}</h2>
      <div class="stack">
        ${mine.map(a => `
          <div class="panel rowline">
            <div class="grow">
              <div class="appt" style="border:none;padding:0">
                <span class="time">${fmtTime(a.starts_at)}</span>
                <span>
                  <span class="who2">${esc(fmtDate(a.starts_at))}</span>
                  <span class="meta">${esc(a.barber_name || '')}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="brow" style="margin:-4px 0 10px">
            <a class="b ghost sm" target="_blank" rel="noopener"
               href="${esc(googleCalUrl(a, a.barber_name, addr))}">${esc(T.addToCal)}</a>
            <button class="b ghost sm" data-cancel="${a.id}">${esc(T.cancelBooking)}</button>
          </div>`).join('')}
      </div>` : ''}

    <h2 class="sec">${esc(T.chooseBarber)}</h2>
    <div class="stack" id="barbers">
      ${barbers.length === 0 ? `<p class="dek">${esc(T.noBarbers)}</p>` : barbers.map(b => `
        <button class="choice ${pick.barber === b.id ? 'on' : ''}" data-b="${b.id}">
          ${avatar(b.full_name, b.photo_path)}
          <span class="grow">
            <span class="name">${esc(b.full_name || '')}</span><br>
            <span class="sub2">${esc(b.bio || '')}${b.bio ? ' · ' : ''}${b.slot_minutes} ${esc(T.minutes)}</span>
          </span>
        </button>`).join('')}
    </div>

    <div id="rest" class="${pick.barber ? '' : 'hide'}">
      <h2 class="sec">${esc(T.chooseDay)}</h2>
      <div class="chips" id="days"></div>

      <h2 class="sec">${esc(T.chooseTime)}</h2>
      <div id="slots" class="dek">${esc(T.loading)}</div>

      <div id="details" class="hide">
        <h2 class="sec">${esc(T.yourDetails)}</h2>
        <div class="panel pad">
          <div class="field"><label>${esc(T.fullName)}</label><input id="cname" autocomplete="name" value="${esc(pick.name)}"></div>
          <div class="field"><label>${esc(T.phone)}</label><input id="cphone" inputmode="tel" autocomplete="tel" value="${esc(pick.phone)}"></div>
          <div class="field"><label>${esc(T.notesOpt)}</label><input id="cnotes" placeholder="${esc(T.notesPh)}"></div>
          <button class="b" id="go">${esc(T.confirm)}</button>
        </div>
      </div>
    </div>
  `;

  $$('[data-cancel]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await sb.rpc('cancel_booking', { p_id: b.dataset.cancel });
    if (error) { b.disabled = false; return toast(error.message, true); }
    saveRefs(loadRefs().filter(x => x !== b.dataset.cancel));
    toast(T.cancelled);
    render();
  });

  $$('[data-b]').forEach(el => el.onclick = () => {
    pick.barber = el.dataset.b; pick.slot = null;
    $$('.choice').forEach(c => c.classList.toggle('on', c.dataset.b === pick.barber));
    $('#rest').classList.remove('hide');
    drawDays(); loadSlots();
  });

  if (pick.barber) { drawDays(); loadSlots(); }
}

function drawDays() {
  const box = $('#days');
  const items = [];
  for (let i = 0; i < 14; i++) {
    const iso = dayISO(i);
    const d = new Date(iso + 'T12:00:00');
    const label = i === 0 ? T.todayLabel : i === 1 ? T.tomorrowLabel : T.daysShort[d.getDay()];
    items.push(`<button class="chip ${pick.day === iso ? 'on' : ''}" data-day="${iso}">
      <span class="d1">${esc(label)}</span>${d.getDate()}/${d.getMonth() + 1}</button>`);
  }
  box.innerHTML = items.join('');
  $$('[data-day]', box).forEach(b => b.onclick = () => {
    pick.day = b.dataset.day; pick.slot = null;
    $$('.chip', box).forEach(c => c.classList.toggle('on', c.dataset.day === pick.day));
    loadSlots();
  });
}

async function loadSlots() {
  const box = $('#slots');
  box.className = 'dek'; box.textContent = T.loading;
  const { data, error } = await sb.rpc('available_slots', { p_barber: pick.barber, p_day: pick.day });
  if (error) { box.textContent = error.message; return; }
  const slots = data || [];
  $('#details').classList.add('hide');
  if (!slots.length) { box.className = 'dek'; box.textContent = T.noSlots; return; }
  box.className = 'chips';
  box.innerHTML = slots.map(s => `<button class="chip" data-s="${esc(s)}">${fmtTime(s)}</button>`).join('');
  $$('[data-s]', box).forEach(b => b.onclick = () => {
    pick.slot = b.dataset.s;
    $$('.chip', box).forEach(c => c.classList.toggle('on', c.dataset.s === pick.slot));
    $('#details').classList.remove('hide');
    $('#details').scrollIntoView({ behavior: 'smooth', block: 'center' });
    wireConfirm();
  });
}

function wireConfirm() {
  const btn = $('#go');
  if (!btn) return;
  btn.onclick = async () => {
    const name = $('#cname').value.trim();
    const phone = $('#cphone').value.trim();
    if (!name || !phone) return toast(T.needNamePhone, true);
    pick.name = name; pick.phone = phone;
    btn.disabled = true;
    const { data, error } = await sb.rpc('book_public', {
      p_barber: pick.barber, p_start: pick.slot, p_name: name,
      p_phone: phone, p_notes: $('#cnotes').value.trim(), p_lang: lang
    });
    btn.disabled = false;
    if (error) return toast(error.message, true);
    saveRefs([...loadRefs(), data]);
    done(data);
  };
}

async function done(id) {
  const { data } = await sb.rpc('get_booking', { p_id: id });
  const a = (data && data[0]) || null;
  const addr = content[`address_${lang}`] || content.address_he || '';
  view.innerHTML = `
    <h1 class="page">${esc(T.booked)}</h1>
    <p class="dek">${esc(T.bookedSub)}</p>
    ${a ? `
      <div class="panel pad" style="margin-top:18px">
        <div class="appt" style="border:none;padding:0">
          <span class="time">${fmtTime(a.starts_at)}</span>
          <span>
            <span class="who2">${esc(fmtDate(a.starts_at))}</span>
            <span class="meta">${esc(a.barber_name || '')}${addr ? ' · ' + esc(addr) : ''}</span>
          </span>
        </div>
      </div>
      <div class="brow" style="margin-top:14px">
        <a class="b" target="_blank" rel="noopener" href="${esc(googleCalUrl(a, a.barber_name, addr))}">${esc(T.addToCal)}</a>
        <button class="b ghost" id="again">${esc(T.another)}</button>
      </div>` : ''}
    <p class="dek" style="margin-top:26px">${esc(content[`policy_${lang}`] || content.policy_he || '')}</p>
  `;
  const again = $('#again');
  if (again) again.onclick = () => { pick.slot = null; render(); };
  window.scrollTo(0, 0);
}

/* ---------------- go ---------------- */
await load();
render();
