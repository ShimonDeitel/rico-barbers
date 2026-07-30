/* Shared plumbing for every page: one Supabase client, one language switch,
   one set of strings, one set of helpers. */

import { createClient } from './vendor/supabase.js?v=20260730211203';

export const SUPABASE_URL = 'https://vbhjrcakyhpexmntjgxd.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_Uxqwb3XTyEamTMOO9nE4Qw_RgI0vrxX';
export const TZ = 'Asia/Jerusalem';
const LANG_KEY = 'bs.lang';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // PKCE returns ?code= in the query string, so it never collides with our #/ routes
    flowType: 'pkce',
    detectSessionInUrl: true
  }
});

/* ---------------- strings ---------------- */
const S = {
  he: {
    dir: 'rtl', locale: 'he-IL', short: 'EN',
    back: 'חזרה', loading: 'טוען…', save: 'שמירה', saved: 'נשמר', cancel: 'ביטול',
    remove: 'הסרה', add: 'הוספה', close: 'סגירה', yes: 'כן', no: 'לא', none: 'אין',
    signOut: 'יציאה', today: 'היום', week: 'השבוע', settings: 'הגדרות',

    /* front page */
    navServices: 'מחירון', navHours: 'שעות', navVisit: 'איפה',
    book: 'הזמן תור', bookNow: 'הזמנת תור', whatsapp: 'וואטסאפ',
    yearsLabel: 'שנות ניסיון', aboutKicker: 'על המספרה', galleryKicker: 'מהמספרה',
    servicesKicker: 'מחירון', hoursKicker: 'שעות פתיחה', visitKicker: 'איפה אנחנו',
    maps: 'ניווט', call: 'התקשרו', instagram: 'אינסטגרם',
    closer: 'כיסא אחד.<br>תור אחד.', staff: 'כניסת צוות',
    pricesNote: 'המחירים מתעדכנים מעת לעת. התשלום במספרה.',
    open: 'פתוח עכשיו', closed: 'סגור עכשיו', closedToday: 'סגור',
    min: 'דק׳', currency: '₪',
    marquee: ['ירושלים', 'יפו 216', 'פייד', 'זקן', 'סטייל', 'ללא המתנה'],

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

    doorManager: 'כניסה כמנהל', doorBarber: 'כניסה כספר',
    doorSub: 'בוחרים דלת, מזינים את הקוד, ואז מתחברים עם Google.',
    codeFirst: 'קודם הקוד. בלי קוד נכון אי אפשר להמשיך.',
    codeOk: 'הקוד אושר. עכשיו מתחברים עם חשבון Google שלך.',
    googleWhy: 'חשבון Google הוא מה שיזכור אותך בפעם הבאה — בלי סיסמאות.',
    continueBtn: 'המשך',
    managerOfShop: 'מנהל המספרה',
    codeManager: 'קוד מנהל', codeBarber: 'קוד ספר',
    codeHint: 'את הקוד מקבלים מהמנהל.', yourNameQ: 'איך קוראים לך?',
    finish: 'סיום', wrongCode: 'הקוד לא נכון.',
    signedInAs: 'מחובר כ', switchAccount: 'חשבון אחר',
    codeHint2: 'הקוד לספרים הוא מה שאתה נותן למי שמצטרף. אפשר להחליף מתי שרוצים — הקוד הישן מפסיק לעבוד מיד.',
    codes: 'קודים', managerCodeLbl: 'קוד כניסה למנהלים', barberCodeLbl: 'קוד כניסה לספרים',
    newCode: 'קוד חדש', codeSaved: 'הקוד עודכן.', codeRule: '4 עד 12 ספרות',
    showPhone: 'להציג את הטלפון שלי בדף הכניסה',
    tomorrow: 'מחר', remind: 'תזכורת', reminded: 'נשלח',
    remindHint: 'לחיצה פותחת וואטסאפ עם ההודעה מוכנה, מהמספר שלך.',
    remindAll: 'שליחת תזכורת לכולם', noTomorrow: 'אין תורים מחר.',
    reviews: 'ביקורות', reviewsKicker: 'מה אומרים', addReview: 'הוספת ביקורת',
    revName: 'שם', revText: 'טקסט', revStars: 'כוכבים', onGoogle: 'בגוגל',
    /* staff gate */
    staffTitle: 'כניסת צוות', staffSub: 'התחברו עם חשבון Google שלכם.',
    google: 'התחברות עם Google', signingIn: 'מתחבר…',
    notStaff: 'החשבון הזה לא מורשה. פנו למנהל.',
    staffFoot: 'רק כתובות שהמנהל הוסיף יכולות להיכנס. אין סיסמאות.',
    inviteEmail: 'כתובת Gmail', inviteName: 'שם', invite: 'הוספה לצוות',
    pending: 'טרם התחבר', joined: 'פעיל',

    calendar: 'יומן', month: 'חודש', day: 'יום',
    prevMonth: 'חודש קודם', nextMonth: 'חודש הבא', todayBtn: 'היום',
    noneThatDay: 'אין תורים ביום הזה.', freeDay: 'יום חופש',
    photoChanged: 'התמונה עודכנה.',
    /* barber */
    hi: 'שלום', yourDay: 'היום שלך', upcoming: 'תורים קרובים',
    noAppts: 'אין תורים.', apptsToday: 'תורים היום',
    call: 'חיוג', whatsapp: 'וואטסאפ',
    myProfile: 'הפרופיל שלי', photo: 'תמונה', about: 'כמה מילים עליך',
    apptLength: 'אורך תור (דקות)', shownToCustomers: 'מוצג ללקוחות',
    myHours: 'שעות העבודה שלי', openDay: 'עובד', closedDay: 'לא עובד',
    from: 'משעה', to: 'עד שעה', daysOff: 'ימי חופש', date: 'תאריך',
    reason: 'סיבה', addDayOff: 'הוספת יום חופש',

    /* manager */
    manager: 'ניהול', overview: 'סקירה',
    statToday: 'תורים היום', statWeek: 'תורים השבוע', statBarbers: 'ספרים',
    schedule: 'לוח היום', allBarbers: 'כל הספרים',
    team: 'הצוות', addBarber: 'הוספת ספר', barberName: 'שם הספר',
    removeBarber: 'הסרה',
    confirmRemove: 'להסיר את הספר הזה?',
    website: 'האתר', security: 'אבטחה',
    gallery: 'גלריה', addPhotos: 'הוספת תמונות',
    capHe: 'כיתוב בעברית', capEn: 'כיתוב באנגלית', photosHint: 'תמונות מהמספרה. גררו כדי להחליף סדר לא נתמך — הסירו והוסיפו.',
    priceList: 'מחירון', addService: 'הוספת שירות',
    svcName: 'שם', svcNameEn: 'שם באנגלית', svcPrice: 'מחיר', svcMin: 'דקות',
    openHours: 'שעות פתיחה',
    tagline: 'משפט פתיחה', aboutShop: 'על המספרה', address: 'כתובת',
    instagram: 'אינסטגרם', mapsLink: 'קישור ניווט', years: 'שנות ניסיון', policy: 'תקנון', when: 'מתי', nothing: 'אין נתונים',
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
      'invalid email': 'כתובת אימייל לא תקינה.',
      'wrong code': 'הקוד לא נכון.',
      'too many attempts, try again later': 'יותר מדי נסיונות, נסו שוב בעוד שעה.',
      'code must be 4 to 12 digits': 'הקוד חייב להיות 4 עד 12 ספרות.',
      'you cannot remove yourself': 'אי אפשר להסיר את עצמך.'
    }
  },

  en: {
    dir: 'ltr', locale: 'en-GB', short: 'עב',
    back: 'Back', loading: 'Loading…', save: 'Save', saved: 'Saved', cancel: 'Cancel',
    remove: 'Remove', add: 'Add', close: 'Close', yes: 'Yes', no: 'No', none: 'None',
    signOut: 'Sign out', today: 'Today', week: 'This week', settings: 'Settings',

    /* front page */
    navServices: 'Prices', navHours: 'Hours', navVisit: 'Find us',
    book: 'Book', bookNow: 'Book a chair', whatsapp: 'WhatsApp',
    yearsLabel: 'years on the chair', aboutKicker: 'The shop', galleryKicker: 'Inside the shop',
    servicesKicker: 'Price list', hoursKicker: 'Opening hours', visitKicker: 'Where we are',
    maps: 'Directions', call: 'Call us', instagram: 'Instagram',
    closer: 'One chair.<br>One appointment.', staff: 'Staff login',
    pricesNote: 'Prices change from time to time. Payment at the shop.',
    open: 'Open now', closed: 'Closed now', closedToday: 'Closed',
    min: 'min', currency: '₪',
    marquee: ['Jerusalem', '216 Jaffa St', 'Fades', 'Beards', 'Style', 'No waiting'],

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

    doorManager: 'Enter as manager', doorBarber: 'Enter as barber',
    doorSub: 'Pick a door, enter the code, then sign in with Google.',
    codeFirst: 'The code comes first. Without it there is nothing to sign in to.',
    codeOk: 'Code accepted. Now sign in with your Google account.',
    googleWhy: 'Google is what remembers you next time — no passwords.',
    continueBtn: 'Continue',
    managerOfShop: 'Shop manager',
    codeManager: 'Manager code', codeBarber: 'Barber code',
    codeHint: 'The manager gives you this code.', yourNameQ: 'What is your name?',
    finish: 'Finish', wrongCode: 'That code is wrong.',
    signedInAs: 'Signed in as', switchAccount: 'Use another account',
    codeHint2: 'The barber code is what you hand to someone joining. Change it whenever you like — the old one stops working at once.',
    codes: 'Codes', managerCodeLbl: 'Manager entry code', barberCodeLbl: 'Barber entry code',
    newCode: 'New code', codeSaved: 'Code updated.', codeRule: '4 to 12 digits',
    showPhone: 'Show my phone on the entrance page',
    tomorrow: 'Tomorrow', remind: 'Remind', reminded: 'sent',
    remindHint: 'Opens WhatsApp with the message written, from your own number.',
    remindAll: 'Remind everyone', noTomorrow: 'Nothing booked tomorrow.',
    reviews: 'Reviews', reviewsKicker: 'What people say', addReview: 'Add a review',
    revName: 'Name', revText: 'Text', revStars: 'Stars', onGoogle: 'on Google',
    staffTitle: 'Staff entrance', staffSub: 'Sign in with your Google account.',
    google: 'Sign in with Google', signingIn: 'Signing in…',
    notStaff: 'This account is not on the team. Ask the manager to add it.',
    staffFoot: 'Only addresses the manager added can get in. There are no passwords.',
    inviteEmail: 'Gmail address', inviteName: 'Name', invite: 'Add to the team',
    pending: 'not signed in yet', joined: 'active',

    calendar: 'Calendar', month: 'Month', day: 'Day',
    prevMonth: 'Previous month', nextMonth: 'Next month', todayBtn: 'Today',
    noneThatDay: 'Nothing booked that day.', freeDay: 'Day off',
    photoChanged: 'Photo updated.',
    hi: 'Hi', yourDay: 'Your day', upcoming: 'Upcoming',
    noAppts: 'Nothing booked.', apptsToday: 'appointments today',
    call: 'Call', whatsapp: 'WhatsApp',
    myProfile: 'My profile', photo: 'Photo', about: 'A few words about you',
    apptLength: 'Appointment length (minutes)', shownToCustomers: 'Shown to customers',
    myHours: 'My working hours', openDay: 'Working', closedDay: 'Off',
    from: 'From', to: 'To', daysOff: 'Days off', date: 'Date',
    reason: 'Reason', addDayOff: 'Add a day off',

    manager: 'Manager', overview: 'Overview',
    statToday: 'today', statWeek: 'this week', statBarbers: 'barbers',
    schedule: "Today's schedule", allBarbers: 'All barbers',
    team: 'The team', addBarber: 'Add a barber', barberName: 'Barber name',
    removeBarber: 'Remove',
    confirmRemove: 'Remove this barber?',
    website: 'Website', security: 'Security',
    gallery: 'Gallery', addPhotos: 'Add photos',
    capHe: 'Caption in Hebrew', capEn: 'Caption in English', photosHint: 'Photos of the shop. To reorder, remove and add again.',
    priceList: 'Price list', addService: 'Add a service',
    svcName: 'Name', svcNameEn: 'Name in English', svcPrice: 'Price', svcMin: 'Minutes',
    openHours: 'Opening hours',
    tagline: 'Tagline', aboutShop: 'About the shop', address: 'Address',
    instagram: 'Instagram', mapsLink: 'Directions link', years: 'Years of experience', policy: 'Policy', when: 'When', nothing: 'Nothing yet',
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
  if (!path) return null;
  // the bucket is public and CDN-cached; a changed photo at the same path would
  // keep serving the old bytes, so every path carries its own version suffix
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
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
