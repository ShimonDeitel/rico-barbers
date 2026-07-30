/* Staff entrance. One box: the master code opens the manager view,
   a barber's code opens that barber's day. Nothing else to remember. */

import {
  sb, T, lang, toggleLang, applyDir, $, $$, esc, toast, err,
  fmtTime, fmtDate, fmtShort, todayISO, shopNow, avatar, staffEmail,
  googleCalUrl, shopContent, parseJSON
} from './ui.js';

const view = $('#view');
let me = { id: null, role: null, profile: null };

applyDir();
$('#langBtn').textContent = T.short;
$('#langBtn').onclick = () => toggleLang(() => { $('#langBtn').textContent = T.short; route(); });
$('#outBtn').onclick = async () => { await sb.auth.signOut(); location.reload(); };

/* ---------------- routing ---------------- */
async function route() {
  applyDir();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { chrome(false); return gate(); }

  const { error: bad } = await sb.auth.getUser();
  if (bad) { await sb.auth.signOut(); chrome(false); return gate(); }

  me.id = session.user.id;
  const [r, p] = await Promise.all([
    sb.from('user_roles').select('role').eq('user_id', me.id).maybeSingle(),
    sb.from('profiles').select('*').eq('id', me.id).maybeSingle()
  ]);
  me.role = r.data?.role || 'customer';
  me.profile = p.data || {};
  chrome(true);
  if (me.role === 'manager') return managerView();
  if (me.role === 'barber') return barberView();
  await sb.auth.signOut();
  gate();
}

function chrome(on) {
  $('#outBtn').classList.toggle('hide', !on);
  $('#outBtn').textContent = T.signOut;
  $('#who').textContent = on ? (me.profile?.full_name || '') : '';
}

/* ---------------- the one door ---------------- */
function gate() {
  view.innerHTML = `
    <h1 class="page">${esc(T.staffTitle)}</h1>
    <p class="dek">${esc(T.staffSub)}</p>
    <div class="panel pad" style="max-width:420px;margin-top:22px">
      <div class="field">
        <label>${esc(T.code)}</label>
        <input id="code" inputmode="numeric" autocomplete="off" maxlength="12"
               style="font-size:30px;text-align:center;letter-spacing:.3em;direction:ltr" placeholder="••••••">
      </div>
      <button class="b" id="go">${esc(T.enter)}</button>
      <p class="dek" style="margin:16px 0 0;font-size:13px">${esc(T.staffFoot)}</p>
    </div>`;

  const go = async () => {
    const code = $('#code').value.replace(/\D/g, '');
    if (code.length < 4) return toast(T.badCode, true);
    $('#go').disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: await staffEmail(code), password: code });
    $('#go').disabled = false;
    if (error) { $('#code').value = ''; return toast(T.badCode, true); }
    route();
  };
  $('#go').onclick = go;
  $('#code').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  $('#code').focus();
}

/* ================= BARBER ================= */
async function barberView() {
  view.innerHTML = `<h1 class="page">${esc(T.loading)}</h1>`;
  const startOfToday = new Date(todayISO() + 'T00:00:00Z');
  const [appts, avail, off, content] = await Promise.all([
    sb.from('appointments').select('*').eq('barber_id', me.id).eq('status', 'booked')
      .gte('starts_at', startOfToday.toISOString()).order('starts_at'),
    sb.from('availability').select('*').eq('barber_id', me.id).order('weekday').order('start_time'),
    sb.from('time_off').select('*').eq('barber_id', me.id).gte('day', todayISO()).order('day'),
    shopContent()
  ]);

  const list = appts.data || [];
  const today = todayISO();
  const isToday = (a) => a.starts_at.slice(0, 10) === today ||
    new Date(a.starts_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }) === today;
  const todays = list.filter(isToday);
  const later = list.filter(a => !isToday(a));
  const addr = content[`address_${lang}`] || content.address_he || '';
  const p = me.profile || {};

  const card = (a) => `
    <div class="appt">
      <span class="time">${fmtTime(a.starts_at)}</span>
      <span class="grow">
        <span class="who2">${esc(a.customer_name)}</span>
        <span class="meta">${esc(a.customer_phone)}${a.notes ? ' · ' + esc(a.notes) : ''}</span>
      </span>
    </div>
    <div class="brow" style="margin:-4px 0 12px">
      <a class="b ghost sm" href="tel:${esc(a.customer_phone.replace(/[^0-9+]/g, ''))}">${esc(T.call)}</a>
      <a class="b ghost sm" target="_blank" rel="noopener"
         href="https://wa.me/${esc(a.customer_phone.replace(/[^0-9]/g, '').replace(/^0/, '972'))}">${esc(T.whatsapp)}</a>
      <a class="b ghost sm" target="_blank" rel="noopener"
         href="${esc(googleCalUrl(a, p.full_name, addr))}">${esc(T.addToCal)}</a>
      <button class="b danger sm" data-cancel="${a.id}">${esc(T.cancel)}</button>
    </div>`;

  view.innerHTML = `
    <h1 class="page">${esc(T.hi)} ${esc(p.full_name || '')}</h1>
    <p class="dek">${todays.length} ${esc(T.apptsToday)}</p>

    <h2 class="sec">${esc(T.today)} · ${esc(fmtDate(new Date().toISOString()))}</h2>
    ${todays.length ? todays.map(card).join('') : `<p class="dek">${esc(T.noAppts)}</p>`}

    <h2 class="sec">${esc(T.upcoming)}</h2>
    ${later.length ? later.map(a => `
      <div class="appt">
        <span class="time" style="font-size:15px;min-width:74px">${esc(fmtShort(a.starts_at))}<br>${fmtTime(a.starts_at)}</span>
        <span class="grow">
          <span class="who2">${esc(a.customer_name)}</span>
          <span class="meta">${esc(a.customer_phone)}</span>
        </span>
        <button class="b danger sm" data-cancel="${a.id}">${esc(T.cancel)}</button>
      </div>`).join('') : `<p class="dek">${esc(T.noAppts)}</p>`}

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
        <div class="field"><label>${esc(T.inbox)}</label>
          <input id="mail" type="email" placeholder="${esc(T.inboxPh)}" value="${esc(p.notify_email || '')}"></div>
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
    </details>
  `;

  wireCancels(barberView);
  drawHours(avail.data || [], me.id, barberView);
  drawOff(off.data || [], barberView);

  $('#saveProfile').onclick = async () => {
    const f = $('#photo').files[0];
    let photo_path = p.photo_path || null;
    if (f) {
      if (f.size > 3 * 1024 * 1024) return toast('3MB', true);
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
      photo_path = `${me.id}/avatar.${ext}`;
      const up = await sb.storage.from('photos').upload(photo_path, f, { upsert: true, contentType: f.type });
      if (up.error) return toast(up.error.message, true);
    }
    const mail = await sb.rpc('set_notify_email', { p_user: me.id, p_email: $('#mail').value.trim() });
    if (mail.error) return toast(mail.error.message, true);
    const { error } = await sb.from('profiles').update({
      bio: $('#bio').value.trim(),
      slot_minutes: Math.max(10, Math.min(180, parseInt($('#slotmin').value || '30', 10))),
      active: $('#active').value === '1',
      photo_path
    }).eq('id', me.id);
    if (error) return toast(error.message, true);
    toast(T.saved); route();
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

function drawHours(rows, barberId, after) {
  const box = $('#hoursBox');
  if (!box) return;
  const byDay = {};
  rows.forEach(r => { byDay[r.weekday] = r; });
  box.innerHTML = T.days.map((d, i) => {
    const r = byDay[i];
    return `<div class="panel" data-day="${i}" style="margin-bottom:8px">
      <div class="rowline" style="gap:10px;flex-wrap:wrap">
        <b style="min-width:74px">${esc(d)}</b>
        <select data-f="on" style="width:auto;flex:0 0 auto">
          <option value="1"${r ? ' selected' : ''}>${esc(T.openDay)}</option>
          <option value="0"${r ? '' : ' selected'}>${esc(T.closedDay)}</option>
        </select>
        <input data-f="o" type="time" style="width:auto;flex:1 1 110px" value="${esc(r ? r.start_time.slice(0, 5) : '10:00')}">
        <input data-f="c" type="time" style="width:auto;flex:1 1 110px" value="${esc(r ? r.end_time.slice(0, 5) : '20:00')}">
      </div>
    </div>`;
  }).join('') + `<button class="b" id="saveHours">${esc(T.save)}</button>`;

  $('#saveHours').onclick = async () => {
    const wanted = $$('[data-day]', box).map(row => ({
      weekday: +row.dataset.day,
      on: $('[data-f=on]', row).value === '1',
      start_time: $('[data-f=o]', row).value,
      end_time: $('[data-f=c]', row).value
    })).filter(r => r.on && r.start_time && r.end_time && r.end_time > r.start_time);

    const del = await sb.from('availability').delete().eq('barber_id', barberId);
    if (del.error) return toast(del.error.message, true);
    if (wanted.length) {
      const ins = await sb.from('availability').insert(
        wanted.map(w => ({ barber_id: barberId, weekday: w.weekday, start_time: w.start_time, end_time: w.end_time })));
      if (ins.error) return toast(ins.error.message, true);
    }
    toast(T.saved); after();
  };
}

function drawOff(rows, after) {
  const list = $('#offList');
  if (!list) return;
  list.innerHTML = rows.length ? rows.map(o => `
    <div class="panel rowline" style="margin:0">
      <span class="grow">${esc(o.day)}${o.note ? ' · ' + esc(o.note) : ''}</span>
      <button class="b ghost sm" data-deloff="${o.id}">${esc(T.remove)}</button>
    </div>`).join('') : `<p class="dek">${esc(T.none)}</p>`;

  $$('[data-deloff]').forEach(b => b.onclick = async () => {
    await sb.from('time_off').delete().eq('id', b.dataset.deloff);
    after();
  });
  $('#addOff').onclick = async () => {
    const day = $('#offDay').value;
    if (!day) return toast(T.date, true);
    const { error } = await sb.from('time_off').insert({ barber_id: me.id, day, note: $('#offNote').value.trim() });
    if (error) return toast(error.message, true);
    after();
  };
}

/* ================= MANAGER ================= */
async function managerView() {
  view.innerHTML = `<h1 class="page">${esc(T.loading)}</h1>`;
  const weekAhead = new Date(Date.now() + 7 * 864e5).toISOString();
  const startOfToday = new Date(todayISO() + 'T00:00:00Z');

  const [people, appts, cfg, mail, sec, content] = await Promise.all([
    sb.rpc('list_users'),
    sb.from('appointments').select('*').eq('status', 'booked')
      .gte('starts_at', startOfToday.toISOString()).lte('starts_at', weekAhead).order('starts_at'),
    sb.rpc('get_settings'),
    sb.rpc('recent_mail', { p_limit: 8 }),
    sb.rpc('recent_security', { p_limit: 8 }),
    shopContent()
  ]);
  if (people.error) return toast(people.error.message, true);

  const staff = (people.data || []).filter(u => u.role === 'barber' || u.role === 'manager');
  const barbers = staff.filter(u => u.role === 'barber');
  const byId = Object.fromEntries((people.data || []).map(u => [u.id, u]));
  const today = todayISO();
  const isToday = (a) => new Date(a.starts_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }) === today;
  const todays = (appts.data || []).filter(isToday);
  const c = cfg.data || {};

  view.innerHTML = `
    <h1 class="page">${esc(T.manager)}</h1>

    <div class="tiles" style="margin-top:18px">
      <div class="tile"><b>${todays.length}</b><span>${esc(T.statToday)}</span></div>
      <div class="tile"><b>${(appts.data || []).length}</b><span>${esc(T.statWeek)}</span></div>
      <div class="tile"><b>${barbers.length}</b><span>${esc(T.statBarbers)}</span></div>
    </div>

    <h2 class="sec">${esc(T.schedule)}</h2>
    ${todays.length ? todays.map(a => `
      <div class="appt">
        <span class="time">${fmtTime(a.starts_at)}</span>
        <span class="grow">
          <span class="who2">${esc(a.customer_name)}</span>
          <span class="meta">${esc(byId[a.barber_id]?.full_name || '')} · ${esc(a.customer_phone)}</span>
        </span>
        <button class="b danger sm" data-cancel="${a.id}">${esc(T.cancel)}</button>
      </div>`).join('') : `<p class="dek">${esc(T.noAppts)}</p>`}

    <h2 class="sec">${esc(T.team)}</h2>
    <div class="stack" id="teamList">
      ${staff.map(u => `
        <div class="panel rowline">
          ${avatar(u.full_name, u.photo_path)}
          <span class="grow">
            <span class="name" style="font-size:17px;font-weight:600">${esc(u.full_name || '')}</span><br>
            <span class="sub2" style="color:var(--dim);font-size:13px">${esc(u.role === 'manager' ? T.manager : '')}${u.role === 'barber' ? ((appts.data || []).filter(a => a.barber_id === u.id).length + ' · ' + T.statWeek) : ''}</span>
          </span>
          ${u.role === 'barber' ? `
            <button class="b ghost sm" data-reset="${u.id}">${esc(T.resetCode)}</button>
            <button class="b danger sm" data-del="${u.id}">${esc(T.removeBarber)}</button>` : ''}
        </div>`).join('')}
    </div>

    <div class="panel pad" style="margin-top:12px">
      <div class="two">
        <div class="field"><label>${esc(T.barberName)}</label><input id="newName" placeholder="${esc(T.barberName)}"></div>
        <div class="field"><label>${esc(T.codeLength)}</label>
          <select id="newLen">${[4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}"${n === 6 ? ' selected' : ''}>${n} ${esc(T.digits)}</option>`).join('')}</select>
        </div>
      </div>
      <button class="b" id="addBarber">${esc(T.addBarber)}</button>
      <div id="codeOut"></div>
    </div>

    <details class="fold" style="margin-top:34px">
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
        <div class="two">
          <div class="field"><label>${esc(T.years)}</label><input id="k_years" type="number" min="0" max="99" value="${esc(c.years || '')}"></div>
        </div>
        <div class="field"><label>${esc(T.policy)} (HE)</label><textarea id="k_policy_he">${esc(c.policy_he || '')}</textarea></div>
        <div class="field"><label>${esc(T.policy)} (EN)</label><textarea id="k_policy_en">${esc(c.policy_en || '')}</textarea></div>

        <h2 class="sec">${esc(T.priceList)}</h2>
        <div id="svcRows"></div>
        <button class="b ghost sm" id="addSvc">${esc(T.addService)}</button>

        <h2 class="sec">${esc(T.openHours)}</h2>
        <div id="shopHours"></div>

        <h2 class="sec">${esc(T.gallery)}</h2>
        <p class="dek" style="font-size:13px">${esc(T.photosHint)}</p>
        <div class="gal" id="gal"></div>
        <div class="field" style="margin-top:12px">
          <label>${esc(T.addPhotos)}</label>
          <input type="file" id="galFiles" accept="image/jpeg,image/png,image/webp" multiple>
        </div>

        <button class="b" id="saveSite" style="margin-top:16px">${esc(T.save)}</button>
      </div>
    </details>

    <details class="fold">
      <summary>${esc(T.emails)}</summary>
      <div class="inner">
        <div class="two">
          <div class="field"><label>${esc(T.mailProvider)}</label>
            <select id="cProv">
              <option value=""${!c.mail_provider ? ' selected' : ''}>${esc(T.mailOff)}</option>
              <option value="brevo"${c.mail_provider === 'brevo' ? ' selected' : ''}>Brevo</option>
              <option value="resend"${c.mail_provider === 'resend' ? ' selected' : ''}>Resend</option>
            </select></div>
          <div class="field"><label>${esc(T.mailName)}</label><input id="cFromName" value="${esc(c.mail_from_name || '')}"></div>
        </div>
        <div class="field"><label>${esc(T.mailFrom)}</label><input id="cFrom" type="email" value="${esc(c.mail_from_email || '')}"></div>
        <div class="field"><label>${esc(T.inbox)}</label>
          <input id="myMail" type="email" placeholder="${esc(T.inboxPh)}" value="${esc(me.profile?.notify_email || '')}"></div>
        <div class="field">
          <label>${esc(T.mailKey)} <span class="tag ${c.mail_key_set ? 'ok' : ''}">${esc(c.mail_key_set ? T.mailKeySet : T.mailKeyNot)}</span></label>
          <input id="cKey" type="password" autocomplete="new-password" placeholder="${esc(T.mailKeep)}">
        </div>
        <div class="brow">
          <button class="b" id="saveMail">${esc(T.save)}</button>
          <button class="b ghost" id="testMail">${esc(T.testMail)}</button>
        </div>
        <h2 class="sec">${esc(T.lastMail)}</h2>
        <table class="mini">
          <tr><th>${esc(T.when)}</th><th>${esc(T.who)}</th><th>${esc(T.result)}</th></tr>
          ${(mail.data || []).length ? (mail.data || []).map(m => `
            <tr><td>${esc(fmtShort(m.created_at))} ${fmtTime(m.created_at)}</td>
            <td>${esc(m.to_email)}</td>
            <td>${m.error ? `<span class="tag">${esc(String(m.error).slice(0, 40))}</span>`
              : m.status_code == null ? `<span class="tag">${esc(T.queued)}</span>`
              : `<span class="tag ok">${esc(T.sent)}</span>`}</td></tr>`).join('')
            : `<tr><td colspan="3" style="color:var(--dim)">${esc(T.nothing)}</td></tr>`}
        </table>
      </div>
    </details>

    <details class="fold">
      <summary>${esc(T.security)}</summary>
      <div class="inner">
        <table class="mini">
          <tr><th>${esc(T.when)}</th><th>${esc(T.event)}</th></tr>
          ${(sec.data || []).length ? (sec.data || []).map(s => `
            <tr><td>${esc(fmtShort(s.at))} ${fmtTime(s.at)}</td><td>${esc(s.event)}</td></tr>`).join('')
            : `<tr><td colspan="2" style="color:var(--dim)">${esc(T.nothing)}</td></tr>`}
        </table>
      </div>
    </details>
  `;

  wireCancels(managerView);

  /* ---- team ---- */
  const showCode = (name, code) => {
    $('#codeOut').innerHTML = `
      <div class="codebox">
        <div class="dek" style="margin:0 0 6px">${esc(T.newStaffCode)} ${esc(name)}</div>
        <div class="num" id="theCode">${esc(code)}</div>
        <div class="cap">${esc(T.codeOnce)}</div>
        <button class="b ghost sm" id="cp" style="margin-top:12px">${esc(T.copy)}</button>
      </div>`;
    $('#cp').onclick = async () => {
      try { await navigator.clipboard.writeText(code); toast(T.copied); }
      catch (e) { toast(code); }
    };
  };

  $('#addBarber').onclick = async () => {
    const name = $('#newName').value.trim();
    if (!name) return toast('name required', true);
    $('#addBarber').disabled = true;
    const { data, error } = await sb.rpc('create_staff',
      { p_name: name, p_role: 'barber', p_len: +$('#newLen').value });
    $('#addBarber').disabled = false;
    if (error) return toast(error.message, true);
    showCode(name, data);
    $('#newName').value = '';
  };
  $$('[data-reset]').forEach(b => b.onclick = async () => {
    const u = byId[b.dataset.reset];
    const { data, error } = await sb.rpc('reset_staff_code', { p_user: b.dataset.reset, p_len: 6 });
    if (error) return toast(error.message, true);
    showCode(u?.full_name || '', data);
    window.scrollTo({ top: $('#codeOut').offsetTop - 120, behavior: 'smooth' });
  });
  $$('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm(T.confirmRemove)) return;
    const { error } = await sb.rpc('delete_staff', { p_user: b.dataset.del });
    if (error) return toast(error.message, true);
    toast(T.saved); managerView();
  });

  /* ---- website content ---- */
  let services = parseJSON(c.services_json, []);
  let hours = parseJSON(c.hours_json, []);
  let gallery = parseJSON(c.gallery_json, []);

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
        </div>
      </div>`).join('');
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
      const h = by[i] || { o: '', c: '' };
      const on = !!(h.o && h.c);
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
    $('#gal').innerHTML = gallery.map((p, i) => `
      <figure>
        <img src="${esc(sb.storage.from('photos').getPublicUrl(p).data.publicUrl)}" alt="">
        <button class="b ghost sm" data-delpic="${i}">${esc(T.remove)}</button>
      </figure>`).join('');
    $$('[data-delpic]').forEach(b => b.onclick = () => { gallery.splice(+b.dataset.delpic, 1); drawGal(); });
  };
  drawSvc(); drawShopHours(); drawGal();
  $('#addSvc').onclick = () => { readSvc(); services.push({ he: '', en: '', price: '', min: '30' }); drawSvc(); };

  $('#galFiles').onchange = async () => {
    const files = [...$('#galFiles').files].slice(0, 12);
    for (const f of files) {
      if (f.size > 3 * 1024 * 1024) { toast('3MB', true); continue; }
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${me.id}/gallery/${Date.now()}-${Math.floor(performance.now())}.${ext}`;
      const up = await sb.storage.from('photos').upload(path, f, { upsert: true, contentType: f.type });
      if (up.error) { toast(up.error.message, true); continue; }
      gallery.push(path);
    }
    $('#galFiles').value = '';
    drawGal();
    toast(T.saved);
  };

  $('#saveSite').onclick = async () => {
    readSvc(); readShopHours();
    const body = {
      services_json: JSON.stringify(services),
      hours_json: JSON.stringify(hours),
      gallery_json: JSON.stringify(gallery)
    };
    ['tagline_he', 'tagline_en', 'about_he', 'about_en', 'address_he', 'address_en',
     'phone', 'whatsapp', 'instagram', 'maps_url', 'years', 'policy_he', 'policy_en']
      .forEach(k => { body[k] = $(`#k_${k}`).value.trim(); });
    const { error } = await sb.rpc('set_content', { p_content: body });
    if (error) return toast(error.message, true);
    toast(T.saved);
  };

  /* ---- email ---- */
  $('#saveMail').onclick = async () => {
    const mine = await sb.rpc('set_notify_email', { p_user: me.id, p_email: $('#myMail').value.trim() });
    if (mine.error) return toast(mine.error.message, true);
    const { error } = await sb.rpc('set_settings', {
      p_provider: $('#cProv').value, p_from_email: $('#cFrom').value.trim(),
      p_from_name: $('#cFromName').value.trim(), p_shop_name: c.shop_name || 'RICO BARBERS',
      p_api_key: $('#cKey').value
    });
    if (error) return toast(error.message, true);
    toast(T.saved); managerView();
  };
  $('#testMail').onclick = async () => {
    const { error } = await sb.rpc('send_test_email');
    if (error) return toast(error.message, true);
    toast(T.saved);
    setTimeout(managerView, 2500);
  };
}

/* ---------------- go ---------------- */
route();
