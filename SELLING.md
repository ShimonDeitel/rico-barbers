# Selling it

## Price

- List price **300 ILS/month**, paid by **Bit**.
- Opening offer to the first Jerusalem shops: **150**.
- Floor: **100**. Never open there, and never put the floor in writing.
- Shlomo Brami (RICO) stays at 100, agreed 2026-07-31.

Say the price on the first contact, every time. A barber who hears the number and keeps talking
is a real lead. One who hears it only after you have done the work is an argument.

**On "50% off":** do not write that nobody has ever paid 300. An invented old price is the kind
of thing a barber checks with one phone call to another barber, and then you have lost him for
good. "First shops in Jerusalem get it for 150" is true, does exactly the same job, and you can
say it to his face. That is the framing used below.

---

## What you are actually selling

Not a website. A barber does not want a website. Lead with his problem:

1. **The phone rings mid-haircut.** He puts down the clippers, wipes his hands, answers, loses
   the thread with the man in the chair. Twenty times a day.
2. **The calls he misses are money walking away.** Nobody leaves a voicemail for a barbershop.
   They call the next one on Maps.
3. **Nobody can book at 23:00.** That is exactly when people remember they need a haircut.
4. **No-shows.** He has no way to remind anyone without typing it himself.

The site answers all four, and the day-before WhatsApp reminder is the one that pays for itself.

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

---

## The text, short

A barber reads this standing up, between two customers, with a phone in one hand.
If it takes more than four seconds it does not get read. Short beats complete.

### First message

```
בניתי לך אתר למספרה, תראה:
https://rico-barbers.pages.dev/lior-the-barber/
```

Two lines. That is the whole thing. The link does the selling, not the text.

### When he replies

```
הלקוחות קובעים תור לבד, בלי טלפונים באמצע תספורת.
הכתובת והשעות שלך כבר בפנים.
```

### When he asks the price

```
300 בחודש. למספרות הראשונות בירושלים 150.
אני בונה ומתחזק, אתה רק חותך.
```

### If he goes quiet, once, after two days

```
ראית את זה?
```

Then stop.

### Rules

- Two lines per message, never more.
- One question or one idea per message. Let him reply between them.
- The link goes in the first message. It is the only thing that matters.
- No greeting paragraph, no explaining what a website is, no emoji.
- Say the price the moment he asks and not before.

Swap the link per shop: `/avi-aviv/`, `/lior-the-barber/`, `/zuhairs-barbershop/`.

## Who can actually receive a text right now

| Shop | Number | Reachable? |
|---|---|---|
| **Lior The Barber** | 052-346-5906 | **Yes, mobile.** The only one |
| אבי אביב | 02-654-3334 | No. Landline, no WhatsApp and no SMS |
| Zuhair's | 02-678-4121 | No. Landline |

No Instagram business account found for any of the three in a first search, so Instagram DM is
not a confirmed channel for them either.

