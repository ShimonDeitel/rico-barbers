# Selling it

## Price

- Opening offer to the first Jerusalem shops: **50 ILS/month**, paid by **Bit**.
- Shlomo Brami (RICO) pays 100.

**Give 50 a reason, or it reads as worthless.** A price that low with no explanation tells a
barber the thing is worth nothing and he will treat it that way. "50 for the first shops in
Jerusalem while I build my name" is true, keeps the value intact, and makes raising it later
possible. A number with no story cannot be raised.

**Note the collision:** Shlomo is paying 100 for the same product. Jerusalem barbers talk. If
he hears 50, expect that conversation.

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

A barber reads this standing up, between two customers. Four seconds or it does not get read.

### Version A, the one you asked for

```
תשמע, אני צעיר ומנסה להתחיל משהו משלי.
בניתי לך אתר שלם, בלי שביקשת ובלי לקחת שקל:
https://rico-barbers.pages.dev/lior-the-barber/
50 בחודש. אני ממש צריך לקוח ראשון שייתן לי צ'אנס.
```

### Version B, the one I would send

```
בניתי לך אתר למספרה, תראה:
https://rico-barbers.pages.dev/lior-the-barber/
50 בחודש למספרות הראשונות בירושלים, אני בונה שם לעצמי.
```

Same warmth, same low price, same young-guy-starting-out story. The difference is that B gives
him a reason to say yes and A gives him a reason to feel sorry for you. Sympathy does not open
a wallet every month; a working booking page does. Desperation also invites him to push 50 down
to nothing, and there is nowhere left to go.

### When he replies

```
הלקוחות קובעים תור לבד, בלי טלפונים באמצע תספורת.
הכתובת והשעות שלך כבר בפנים.
```

### If he goes quiet, once, after two days

```
ראית את זה?
```

Then stop.

### Rules

- Two to four lines per message, never more.
- The link goes in the first message. It does the selling.
- No greeting paragraph, no explaining what a website is, no emoji.

Swap the link per shop: `/avi-aviv/`, `/lior-the-barber/`, `/zuhairs-barbershop/`.

## Who can actually receive a text right now

| Shop | Number | Reachable? |
|---|---|---|
| **Lior The Barber** | 052-346-5906 | **Yes, mobile.** The only one |
| אבי אביב | 02-654-3334 | No. Landline, no WhatsApp and no SMS |
| Zuhair's | 02-678-4121 | No. Landline |

No Instagram business account found for any of the three in a first search, so Instagram DM is
not a confirmed channel for them either.

