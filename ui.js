/* Shared plumbing for every page: one Supabase client, one language switch,
   one set of strings, one set of helpers. */

import { createClient } from './vendor/supabase.js';

export const SUPABASE_URL = 'https://vbhjrcakyhpexmntjgxd.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_Uxqwb3XTyEamTMOO9nE4Qw_RgI0vrxX';
export const TZ = 'Asia/Jerusalem';
const LANG_KEY = 'bs.lang';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

/* ---------------- strings ---------------- */
const S = {
  he: {
    dir: 'rtl', locale: 'he-IL', short: 'EN',
    back: 'חזרה', loading: 'טוען…', save: 'שמירה', saved: 'נשמר', cancel: 'ביטול',
    remove: 'הסרה', add: 'הוספה', close: 'סגירה', yes: 'כן', no: 'לא', none: 'אין',
    signOut: 'יציאה', today: 'היום', week: 'השבוע', settings: 'הגדרות',

    /* booking */
    bookTitle: 'קביעת תור', bookSub: 'בוחרים ספר, בוחרים שעה. בלי הרשמה, בלי סיסמה.',
    step: 'שלב', chooseBarber: 'בחרו ספר', chooseDay: 'בחרו יום', chooseTime: 'בחרו שעה',
    yourDetails: 'הפרטים שלכם', fullName: 'שם מלא', phone: 'טלפון',
    notesOpt: 'הערות (לא חובה)', notesPh: 'תספורת + זקן',
    confirm: 'אישור התור', noBarbers: 'אין ספרים זמינים כרגע.',
    noSlots: 'אין שעות פנויות ביום הזה.', minutes: 'דקות',
    booked: 'התור נקבע', bookedSub: 'הספר קיבל התראה. נתראה!',
    myBookings: 'התורים שלי', noBookings: 'אין לכם תורים כרגע.',
    addToCal: 'הוספה ליומן', cancelBooking: 'ביטול התור', cancelled: 'בוטל',
    needNamePhone: 'צריך שם וטלפון.', another: 'קביעת תור נוסף',
    todayLabel: 'היום', tomorrowLabel: 'מחר',

    /* staff gate */
    staffTitle: 'כניסת צוות', staffSub: 'הזינו את הקוד שקיבלתם.',
    code: 'קוד', enter: 'כניסה',
    badCode: 'הקוד לא נכון.', staffFoot: 'הקוד נשמר מוצפן. אין כאן שמות משתמש וסיסמאות.',

    /* barber */
    hi: 'שלום', yourDay: 'היום שלך', upcoming: 'תורים קרובים',
    noAppts: 'אין תורים.', apptsToday: 'תורים היום',
    call: 'חיוג', whatsapp: 'וואטסאפ',
    myProfile: 'הפרופיל שלי', photo: 'תמונה', about: 'כמה מילים עליך',
    inbox: 'אימייל להתראות', inboxPh: 'לאן לשלוח הודעה על תור חדש',
    apptLength: 'אורך תור (דקות)', shownToCustomers: 'מוצג ללקוחות',
    myHours: 'שעות העבודה שלי', openDay: 'עובד', closedDay: 'לא עובד',
    from: 'משעה', to: 'עד שעה', daysOff: 'ימי חופש', date: 'תאריך',
    reason: 'סיבה', addDayOff: 'הוספת יום חופש',

    /* manager */
    manager: 'ניהול', overview: 'סקירה',
    statToday: 'תורים היום', statWeek: 'תורים השבוע', statBarbers: 'ספרים',
    schedule: 'לוח היום', allBarbers: 'כל הספרים',
    team: 'הצוות', addBarber: 'הוספת ספר', barberName: 'שם הספר',
    codeLength: 'אורך הקוד', digits: 'ספרות',
    newStaffCode: 'הקוד של', copy: 'העתקה', copied: 'הועתק',
    codeOnce: 'הקוד מוצג פעם אחת בלבד. שלחו אותו לספר עכשיו.',
    resetCode: 'קוד חדש', removeBarber: 'הסרת ספר',
    confirmRemove: 'להסיר את הספר הזה?',
    website: 'האתר', emails: 'התראות', security: 'אבטחה',
    gallery: 'גלריה', addPhotos: 'הוספת תמונות', photosHint: 'תמונות מהמספרה. גררו כדי להחליף סדר לא נתמך — הסירו והוסיפו.',
    priceList: 'מחירון', addService: 'הוספת שירות',
    svcName: 'שם', svcNameEn: 'שם באנגלית', svcPrice: 'מחיר', svcMin: 'דקות',
    openHours: 'שעות פתיחה',
    tagline: 'משפט פתיחה', aboutShop: 'על המספרה', address: 'כתובת',
    instagram: 'אינסטגרם', mapsLink: 'קישור ניווט', years: 'שנות ניסיון', policy: 'תקנון',
    mailProvider: 'ספק', mailOff: 'כבוי', mailFrom: 'שולח (כתובת מאומתת)',
    mailName: 'שם השולח', mailKey: 'מפתח API', mailKeySet: 'שמור', mailKeyNot: 'לא הוגדר',
    mailKeep: 'ריק = לא לשנות', testMail: 'שליחת מייל בדיקה',
    lastMail: 'מיילים אחרונים', when: 'מתי', who: 'למי', result: 'תוצאה',
    sent: 'נשלח', queued: 'בדרך', nothing: 'אין נתונים',
    event: 'אירוע', viewSite: 'האתר',
    days: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
    daysShort: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
    errors: {
      'name and phone required': 'צריך שם וטלפון.',
      'invalid phone number': 'מספר הטלפון לא תקין.',
      'too far in the future': 'התאריך רחוק מדי.',
      'too many bookings in the last hour, try again later': 'יותר מדי תורים בשעה האחרונה.',
      'you already have 3 upcoming appointments': 'כבר יש 3 תורים קרובים למספר הזה.',
      'you already have an appointment at that time': 'כבר יש תור בשעה הזאת.',
      'slot not available': 'השעה הזאת נתפסה.',
      'unknown barber': 'הספר לא נמצא.',
      'manager only': 'רק מנהל יכול לעשות את זה.',
      'not allowed': 'אין הרשאה.',
      'not found': 'לא נמצא.',
      'name required': 'צריך שם.',
      'you cannot remove yourself': 'אי אפשר להסיר את עצמך.',
      'Invalid login credentials': 'הקוד לא נכון.'
    }
  },

  en: {
    dir: 'ltr', locale: 'en-GB', short: 'עב',
    back: 'Back', loading: 'Loading…', save: 'Save', saved: 'Saved', cancel: 'Cancel',
    remove: 'Remove', add: 'Add', close: 'Close', yes: 'Yes', no: 'No', none: 'None',
    signOut: 'Sign out', today: 'Today', week: 'This week', settings: 'Settings',

    bookTitle: 'Book an appointment', bookSub: 'Pick a barber, pick a time. No signup, no password.',
    step: 'Step', chooseBarber: 'Choose a barber', chooseDay: 'Choose a day', chooseTime: 'Choose a time',
    yourDetails: 'Your details', fullName: 'Full name', phone: 'Phone',
    notesOpt: 'Notes (optional)', notesPh: 'Haircut + beard',
    confirm: 'Confirm appointment', noBarbers: 'No barbers available yet.',
    noSlots: 'No free times that day.', minutes: 'minutes',
    booked: "You're booked", bookedSub: 'The barber has been notified. See you soon.',
    myBookings: 'My appointments', noBookings: 'You have no appointments right now.',
    addToCal: 'Add to calendar', cancelBooking: 'Cancel appointment', cancelled: 'Cancelled',
    needNamePhone: 'Name and phone are required.', another: 'Book another',
    todayLabel: 'Today', tomorrowLabel: 'Tomorrow',

    staffTitle: 'Staff entrance', staffSub: 'Enter the code you were given.',
    code: 'Code', enter: 'Enter',
    badCode: 'That code is not right.', staffFoot: 'Codes are stored hashed. No usernames, no passwords.',

    hi: 'Hi', yourDay: 'Your day', upcoming: 'Upcoming',
    noAppts: 'Nothing booked.', apptsToday: 'appointments today',
    call: 'Call', whatsapp: 'WhatsApp',
    myProfile: 'My profile', photo: 'Photo', about: 'A few words about you',
    inbox: 'Email for alerts', inboxPh: 'where to send new-booking alerts',
    apptLength: 'Appointment length (minutes)', shownToCustomers: 'Shown to customers',
    myHours: 'My working hours', openDay: 'Working', closedDay: 'Off',
    from: 'From', to: 'To', daysOff: 'Days off', date: 'Date',
    reason: 'Reason', addDayOff: 'Add a day off',

    manager: 'Manager', overview: 'Overview',
    statToday: 'today', statWeek: 'this week', statBarbers: 'barbers',
    schedule: "Today's schedule", allBarbers: 'All barbers',
    team: 'The team', addBarber: 'Add a barber', barberName: 'Barber name',
    codeLength: 'Code length', digits: 'digits',
    newStaffCode: 'Code for', copy: 'Copy', copied: 'Copied',
    codeOnce: 'This code is shown once. Send it to the barber now.',
    resetCode: 'New code', removeBarber: 'Remove',
    confirmRemove: 'Remove this barber?',
    website: 'Website', emails: 'Notifications', security: 'Security',
    gallery: 'Gallery', addPhotos: 'Add photos', photosHint: 'Photos of the shop. To reorder, remove and add again.',
    priceList: 'Price list', addService: 'Add a service',
    svcName: 'Name', svcNameEn: 'Name in English', svcPrice: 'Price', svcMin: 'Minutes',
    openHours: 'Opening hours',
    tagline: 'Tagline', aboutShop: 'About the shop', address: 'Address',
    instagram: 'Instagram', mapsLink: 'Directions link', years: 'Years of experience', policy: 'Policy',
    mailProvider: 'Provider', mailOff: 'Off', mailFrom: 'Sender (verified address)',
    mailName: 'Sender name', mailKey: 'API key', mailKeySet: 'stored', mailKeyNot: 'not set',
    mailKeep: 'blank = keep current', testMail: 'Send a test email',
    lastMail: 'Recent emails', when: 'When', who: 'To', result: 'Result',
    sent: 'sent', queued: 'queued', nothing: 'Nothing yet',
    event: 'Event', viewSite: 'Website',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    errors: {}
  }
};

export let lang = 'he';
try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'he' || saved === 'en') lang = saved;
} catch (e) { /* private mode */ }

export let T = S[lang];

export function setLang(l, onChange) {
  lang = (l === 'en') ? 'en' : 'he';
  T = S[lang];
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  applyDir();
  if (onChange) onChange();
}
export function toggleLang(onChange) { setLang(lang === 'he' ? 'en' : 'he', onChange); }
export function applyDir() {
  document.documentElement.dir = T.dir;
  document.documentElement.lang = lang;
}

/* ---------------- helpers ---------------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const err = (m) => T.errors?.[String(m || '')] || String(m || '');

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(T.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
export const fmtShort = (iso) =>
  new Date(iso).toLocaleDateString(T.locale, { day: '2-digit', month: '2-digit', timeZone: TZ });
export const shopNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
export const todayISO = () => shopNow().toISOString().slice(0, 10);
export const dayISO = (offset) => {
  const d = shopNow(); d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export function photoUrl(path) {
  return path ? sb.storage.from('photos').getPublicUrl(path).data.publicUrl : null;
}
export function avatar(name, path, cls = '') {
  const u = photoUrl(path);
  const initial = esc((name || '?').trim().charAt(0).toUpperCase());
  return u ? `<img class="pic ${cls}" src="${esc(u)}" alt="${esc(name)}">`
           : `<div class="pic ${cls}">${initial}</div>`;
}

/* a toast that does not block anything */
export function toast(msg, bad = false) {
  const old = $('#toast'); if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'toast';
  el.className = 'toast' + (bad ? ' bad' : '');
  el.textContent = bad ? err(msg) : msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 400); }, 3200);
}

/* the code is the credential: it maps to a hidden account address */
export async function staffEmail(code) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('rico-staff:' + code));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('') + '@staff.local';
}

/* one-click "put this in my calendar" — works with Google, Apple, Outlook */
export function googleCalUrl(a, barberName, where) {
  const z = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${lang === 'he' ? 'תספורת' : 'Haircut'} — ${barberName || 'RICO BARBERS'}`,
    dates: `${z(a.starts_at)}/${z(a.ends_at)}`,
    details: lang === 'he' ? 'נקבע דרך האתר של RICO BARBERS' : 'Booked at RICO BARBERS',
    location: where || ''
  });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

/* shop content, cached for the page's lifetime */
let contentCache = null;
export async function shopContent() {
  if (contentCache) return contentCache;
  const out = {};
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/public_content?select=key,value`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (res.ok) for (const r of await res.json()) out[r.key] = r.value;
  } catch (e) { /* offline */ }
  contentCache = out;
  return out;
}
export const parseJSON = (raw, fb) => {
  try { const v = JSON.parse(raw || 'null'); return v ?? fb; } catch (e) { return fb; }
};
