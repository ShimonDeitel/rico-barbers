# Selling it

Price: **300 ILS/month**, paid by **Bit**. Shlomo Brami (RICO) stays at 100, agreed 2026-07-31.

Say the price on the first contact, every time. A barber who hears the number up front and keeps
talking is a real lead. One who only hears it after you have done the work is an argument.

---

## Phone script, for the two landlines

**אבי אביב** 02-654-3334 · **Zuhair's** 02-678-4121

Call when they are open but not slammed. Mid-morning or mid-afternoon, not Friday.
Sundays are dead for Zuhair (closed) and Fridays close early for both.

### Opening

> שלום, מדבר שמעון. אני תופס אותך באמצע תספורת?

If yes: *מתי נוח לחזור אליך?* Write down the time and hang up. Call back exactly then.

If no, keep going.

### The hook, fifteen seconds

> בניתי לכם אתר למספרה ואני רוצה שתראה אותו. לא לקחתי מכם כלום, פשוט בניתי אותו.
> יש בו את הכתובת ואת שעות הפתיחה שלכם מגוגל, והלקוחות יכולים לקבוע תור לבד בלי להתקשר.

Stop talking. Let him react.

### If he asks what it costs, or after he sounds interested

> 300 שקל בחודש, הכל כלול. אני בונה, אני מתחזק, אם משהו נשבר אני מתקן.
> התשלום בביט, פעם בחודש.

Do not soften it and do not offer a discount in the first call.

### Sending him the link

> תגיד לי מספר נייד ואני שולח לך את הקישור עכשיו, תסתכל ותגיד לי מה אתה חושב.

Getting the mobile is the real goal of the call. The landline cannot receive WhatsApp.

### The four objections you will actually hear

**"יש לי כבר אינסטגרם"**
> אינסטגרם זה בשביל שיראו אותך. זה בשביל שיקבעו תור בלי להתקשר אליך.
> הלקוח מזמין בעצמו בשתיים בלילה ואתה רואה את זה בבוקר ביומן.

**"אני עסוק, תשלח לי הודעה"**
> בכיף. תן לי נייד ואני שולח עכשיו.

**"כמה זמן זה לוקח להקים"**
> האתר כבר קיים. אני צריך רק את המחירון והתמונות שלך וזה עולה לאוויר היום.

**"יקר לי"**
> אני מבין. תספורת אחת בחודש מכסה את זה. אם אחרי חודש זה לא מביא לך תורים, תפסיק.

### Closing

> אני שולח לך את הקישור עכשיו. אתקשר ביום ראשון לשמוע מה אתה אומר.

Then actually call on Sunday. Write the date down.

---

## Getting paid

Say **300 a month, in Bit** on the first call and again when you hand over the manager code.
The moment he says yes, ask for the Bit payment before you fill in his prices and photos.

### Checking who is actually using it

Run `usage.sql` in the Supabase SQL editor. It labels every shop:

| status | meaning |
|---|---|
| `demo only, never touched` | I built it, nobody signed in. Not a customer yet |
| `signed in, not set up` | He redeemed the code and looked around |
| `set up, no bookings yet` | He entered his working hours. He is committed |
| `LIVE, taking bookings` | Real customers are booking. **He owes you money** |

### If he is using it and has not paid

Anything at `set up` or `LIVE` with no Bit received. Send this, once, friendly:

> היי, ראיתי שהתחלתם לעבוד עם האתר, מעולה.
> נשאר רק לסגור את התשלום, 300 בחודש. איך נוח לך, ביט?

If no answer after a few days, one more:

> היי, מזכיר לגבי התשלום על האתר. אפשר בביט למספר שלי.
> אם החלטת שזה לא בשבילך תגיד לי ואני מוריד את זה, בלי בעיות.

Then act on it. An unpaid shop either pays or gets switched off with
`update shops set active = false where slug = '<slug>';` — that hides the site and stops new
bookings without deleting anything, so it comes straight back if he pays.

Do not chase more than twice. Two unanswered messages means the answer is no, and your time
is better spent on the next shop on the list.
