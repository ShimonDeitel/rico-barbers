/* RICO BARBERS — front page.
   Content comes from the shop's own settings, so the manager can edit the page
   without touching code. Defaults below keep the page instant and never blank. */

const SUPABASE_URL = 'https://vbhjrcakyhpexmntjgxd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Uxqwb3XTyEamTMOO9nE4Qw_RgI0vrxX';
const TZ = 'Asia/Jerusalem';
const LANG_KEY = 'bs.lang';

const UI = {
  he: {
    dir: 'rtl', locale: 'he-IL', short: 'EN',
    navServices: 'מחירון', navHours: 'שעות', navVisit: 'איפה',
    book: 'הזמן תור', bookNow: 'הזמנת תור', whatsapp: 'וואטסאפ',
    yearsLabel: 'שנות ניסיון', aboutKicker: 'על המספרה',
    servicesKicker: 'מחירון', hoursKicker: 'שעות פתיחה', visitKicker: 'איפה אנחנו',
    maps: 'ניווט', call: 'התקשרו', instagram: 'אינסטגרם',
    closer: 'כיסא אחד.<br>תור אחד.',
    staff: 'כניסת צוות',
    pricesNote: 'המחירים מתעדכנים מעת לעת. התשלום במספרה.',
    open: 'פתוח עכשיו', closed: 'סגור עכשיו', closedToday: 'סגור',
    min: 'דק׳', currency: '₪',
    days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    marquee: ['ירושלים', 'יפו 216', 'פייד', 'זקן', 'סטייל', 'ללא המתנה']
  },
  en: {
    dir: 'ltr', locale: 'en-GB', short: 'עב',
    navServices: 'Prices', navHours: 'Hours', navVisit: 'Find us',
    book: 'Book', bookNow: 'Book a chair', whatsapp: 'WhatsApp',
    yearsLabel: 'years on the chair', aboutKicker: 'The shop',
    servicesKicker: 'Price list', hoursKicker: 'Opening hours', visitKicker: 'Where we are',
    maps: 'Directions', call: 'Call us', instagram: 'Instagram',
    closer: 'One chair.<br>One appointment.',
    staff: 'Staff login',
    pricesNote: 'Prices change from time to time. Payment at the shop.',
    open: 'Open now', closed: 'Closed now', closedToday: 'Closed',
    min: 'min', currency: '₪',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    marquee: ['Jerusalem', '216 Jaffa St', 'Fades', 'Beards', 'Style', 'No waiting']
  }
};

/* Shipped defaults — replaced by whatever the shop has saved. */
const FALLBACK = {
  shop_name: 'RICO BARBERS',
  tagline_he: 'מספרה לגברים עם סטייל',
  tagline_en: 'A barbershop for men with style',
  about_he: 'מספרה לגברים עם סטייל, אווירה טובה ושירות ברמה הכי גבוהה. שש שנות ניסיון, בלב ירושלים.',
  about_en: 'A barbershop for men with style, a good atmosphere and service at the highest level. Six years of experience, in the heart of Jerusalem.',
  address_he: 'שערי העיר, יפו 216, ירושלים',
  address_en: "Sha'arei Ha'ir, 216 Jaffa St, Jerusalem",
  phone: '+972587265251',
  whatsapp: '972587265251',
  instagram: 'https://www.instagram.com/rico_barbers/',
  maps_url: 'https://maps.google.com/?q=216+Jaffa+St+Jerusalem',
  years: '6',
  policy_he: 'לא ניתן לבטל תור פחות מ-4 שעות מראש. לקוח שלא יגיע בזמן לא ייכנס לתספורת ויחויב ב-50% מהתשלום.',
  policy_en: 'Appointments cannot be cancelled less than 4 hours in advance. Arriving late means losing the slot and a 50% charge.',
  // shipped so the first paint is the same height as the loaded one — no layout jump
  hours_json: JSON.stringify([
    { d: 0, o: '10:00', c: '20:00' }, { d: 1, o: '10:00', c: '20:00' },
    { d: 2, o: '10:00', c: '20:00' }, { d: 3, o: '10:00', c: '20:00' },
    { d: 4, o: '10:00', c: '20:00' }, { d: 5, o: '09:00', c: '14:00' },
    { d: 6, o: '', c: '' }
  ]),
  services_json: JSON.stringify([
    { he: 'תספורת גבר', en: "Men's haircut", price: '70', min: '30' },
    { he: 'תספורת + זקן', en: 'Haircut + beard', price: '90', min: '45' },
    { he: 'עיצוב זקן', en: 'Beard shaping', price: '40', min: '20' },
    { he: 'תספורת ילד', en: 'Kids haircut', price: '60', min: '30' },
    { he: 'גילוח מלא', en: 'Full shave', price: '50', min: '30' }
  ])
};

let lang = 'he';
try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'he' || saved === 'en') lang = saved;
} catch (e) { /* private mode */ }

let C = { ...FALLBACK };
let T = UI[lang];

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (base) => C[`${base}_${lang}`] || C[`${base}_he`] || '';
const json = (key, fb) => { try { return JSON.parse(C[key] || '[]'); } catch (e) { return fb; } };

/* ---------- content ---------- */
async function loadContent() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/public_content?select=key,value`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) return;
    const rows = await res.json();
    for (const r of rows) if (r && r.key) C[r.key] = r.value;
  } catch (e) { /* offline: the shipped defaults still render a full page */ }
}

/* ---------- opening hours ---------- */
function nowInShop() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}
function hoursList() {
  const h = json('hours_json', []);
  const byDay = {};
  for (const row of h) if (row && typeof row.d === 'number') byDay[row.d] = row;
  return byDay;
}
function isOpenNow() {
  const byDay = hoursList();
  const now = nowInShop();
  const row = byDay[now.getDay()];
  if (!row || !row.o || !row.c) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = row.o.split(':').map(Number);
  const [ch, cm] = row.c.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

/* ---------- render ---------- */
function splitTitle() {
  $$('.title .line').forEach((line, li) => {
    const text = line.dataset.text || '';
    line.innerHTML = [...text].map((ch, i) =>
      `<span class="ch" style="animation-delay:${(li * 0.26 + i * 0.055).toFixed(2)}s">${esc(ch)}</span>`
    ).join('');
  });
}

function paint() {
  T = UI[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = T.dir;

  $$('[data-i]').forEach(elm => { elm.innerHTML = T[elm.dataset.i] ?? elm.innerHTML; });
  $('#langBtn').textContent = T.short;

  $('#tagline').textContent = pick('tagline');
  $('#about-text').textContent = pick('about');
  $('#address').textContent = pick('address');
  $('#policy').textContent = pick('policy');

  // links
  $('#waBtn').href = `https://wa.me/${encodeURIComponent(C.whatsapp || '')}`;
  $('#telBtn').href = `tel:${(C.phone || '').replace(/\s/g, '')}`;
  $('#igBtn').href = C.instagram || '#';
  $('#mapsBtn').href = C.maps_url || '#';

  // open / closed
  const open = isOpenNow();
  $('#eyebrow').classList.toggle('shut', !open);
  $('#openState').textContent = open ? T.open : T.closed;

  // marquee, doubled so the loop is seamless
  const words = T.marquee;
  $('#marquee').innerHTML = [...words, ...words]
    .map(w => `<span>${esc(w)}</span><i>&mdash;</i>`).join('');

  // services
  const services = json('services_json', []);
  $('#services-list').innerHTML = services.map(s => `
    <div class="srow reveal">
      <span class="sname">${esc(lang === 'en' ? (s.en || s.he) : (s.he || s.en))}</span>
      <span class="smin">${esc(s.min || '')} ${esc(T.min)}</span>
      <span class="sprice">${esc(T.currency)}${esc(s.price || '')}</span>
    </div>`).join('');

  // hours
  const byDay = hoursList();
  const today = nowInShop().getDay();
  $('#hours-list').innerHTML = T.days.map((d, i) => {
    const row = byDay[i];
    const shut = !row || !row.o || !row.c;
    return `<div class="hrow ${i === today ? 'today' : ''} ${shut ? 'shut' : ''}">
      <span class="hday">${esc(d)}</span>
      <span class="htime">${shut ? esc(T.closedToday) : `${esc(row.o)} — ${esc(row.c)}`}</span>
    </div>`;
  }).join('');

  observeReveals();
}

/* ---------- scroll reveals ---------- */
let io;
function observeReveals() {
  if (io) io.disconnect();
  io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const idx = [...(e.target.parentElement?.children || [])].indexOf(e.target);
      e.target.style.transitionDelay = `${Math.min(idx, 8) * 0.06}s`;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
  $$('.reveal').forEach(elm => {
    // anything already at or above the fold is shown at once: a visitor who lands
    // deep in the page (or jumps by anchor) must never scroll up into blanks
    if (elm.getBoundingClientRect().top < window.innerHeight * 0.9) elm.classList.add('in');
    else io.observe(elm);
  });
}

/* Safety net: IntersectionObserver callbacks do not fire while a tab is hidden,
   and a stuck observer would leave the page blank. A cheap scroll/visibility
   sweep guarantees anything scrolled into view is shown no matter what. */
function sweepReveals() {
  $$('.reveal:not(.in)').forEach(elm => {
    if (elm.getBoundingClientRect().top < window.innerHeight * 0.9) elm.classList.add('in');
  });
}
let sweepTimer = null;
function scheduleSweep() {
  // setTimeout rather than rAF: rAF is paused in background tabs, and this is the
  // fallback that has to keep working when the observer does not
  if (sweepTimer) return;
  sweepTimer = setTimeout(() => { sweepTimer = null; sweepReveals(); }, 80);
}
window.addEventListener('scroll', scheduleSweep, { passive: true });
window.addEventListener('resize', scheduleSweep, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) sweepReveals(); });

/* ---------- the years counter ---------- */
function countUp() {
  const elm = $('#years');
  const target = parseInt(C.years || '0', 10) || 0;
  if (!target) { elm.textContent = ''; return; }
  // show the real number first: if the observer never fires, the page still reads right
  elm.textContent = target;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const once = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    once.disconnect();
    const start = performance.now(), dur = 1100;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      elm.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: .4 });
  once.observe(elm);
}

/* ---------- chrome ---------- */
function wireChrome() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $('#langBtn').onclick = () => {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    paint();
  };

  // cursor dot, desktop only
  if (window.matchMedia('(hover: hover)').matches) {
    const dot = $('#cursor');
    window.addEventListener('mousemove', (e) => {
      dot.classList.add('on');
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      dot.classList.toggle('grow', !!e.target.closest('a, button, .srow'));
    }, { passive: true });
  }
}

/* ---------- go ---------- */
splitTitle();
wireChrome();
paint();
countUp();
loadContent().then(() => { paint(); countUp(); });
setInterval(() => {
  const open = isOpenNow();
  $('#eyebrow').classList.toggle('shut', !open);
  $('#openState').textContent = open ? T.open : T.closed;
}, 60000);
