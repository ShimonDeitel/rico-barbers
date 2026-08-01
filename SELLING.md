# Selling it

## Price

- **100 ILS/month minimum.** That is the floor and the target. Do not go below it.
- Paid by **Bit**. THE BIT NUMBER IS NOT RECORDED YET — Shimon has to supply it before anyone
  can actually pay. Do not invent one and do not send a number you have not been given.
- Shlomo Brami (RICO) is already at 100.
- Goal: **10 paying shops**, which is 1,000 a month.

At a normal cold conversion of 5 to 10 percent, ten closes needs on the order of a hundred
qualified conversations. The 203-name list is the right size for that. The funnel is weeks of
work, not one evening.

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

## The approach, after Lior said no

**What happened.** One message carried the whole thing: who I am, a link to a finished site he
never asked for, and a price. He replied "hope you have a good day". That is a polite close, and
it is what a stranger sends when there is nothing left to be curious about.

**Two likely reasons, and both are fixable.** The desperate register made it easy to dismiss
without cost. And handing over the finished product in message one left him nothing to ask for.
A man who has already seen everything has no reason to reply.

**The rule now: never send the link until he asks for it.** The link is what he gets for showing
interest, not the thing that creates it.

### Message 1, a question about his day

```
היי, שמעון.
שאלה אחת ואני עף: כמה פעמים ביום אתה עוצר באמצע תספורת בשביל לענות לטלפון?
```

No link. No price. No product. It costs him one sentence to answer and it is about him, not me.
A barber has a real feeling about this question, and the feeling is the sale.

### Message 2, only after he answers

```
זה בדיוק מה שאני פותר. הלקוח קובע לבד, אתה לא עוצר באמצע.
```

Still no link. One line.

### Message 3, only when he asks to see it

```
https://rico-barbers.pages.dev/<slug>/
```

The link alone. Nothing around it.

### When he asks the price

```
50 בחודש. אני בונה ומתחזק.
```

Only when asked, never before.

### If he goes quiet

Nothing. Do not chase. A barber who wanted it answers within a day.

### Register

Professional, not chummy and not begging. Short lines. No "אחי", no pleading, no emoji,
no explaining what a website is. You are a supplier making an offer, not someone asking a favour.

### When someone says no

```
סבבה, תודה ובהצלחה.
```

That is all. It costs nothing, and a shop that says no in July sometimes calls in November.
Arguing with a no guarantees it is permanent and gets you reported.

## Who can actually receive a text right now

| Shop | Number | Reachable? |
|---|---|---|
| **Lior The Barber** | 052-346-5906 | **Yes, mobile.** The only one |
| אבי אביב | 02-654-3334 | No. Landline, no WhatsApp and no SMS |
| Zuhair's | 02-678-4121 | No. Landline |

No Instagram business account found for any of the three in a first search, so Instagram DM is
not a confirmed channel for them either.

