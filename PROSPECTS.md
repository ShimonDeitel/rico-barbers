# Prospects

Price: **300 ILS/month** for everyone new. Shlomo Brami (RICO) stays at 100, agreed 2026-07-31.

Every row below was opened individually on Google Maps and read from its own place page.
The Maps *result list* under-reports websites — it claimed "no website" for all seven of these,
and four of them do have one. Never trust the list view.

## Jerusalem barbershops, checked 2026-07-31

| Shop | Rating | Reviews | Web presence | Verdict |
|---|---|---|---|---|
| **אבי אביב** | 4.9 | 233 | none at all | **best prospect.** Moshe Dayan 154, 02-654-3334 |
| **Lior The Barber** | 4.7 | 116 | b144 directory listing only | **prospect.** Avinadav 23, 052-346-5906 |
| **Zuhair's Barbershop** | 4.7 | 62 | israelbusinessguide listing only | **prospect.** E-Natr 6, 02-678-4121 |
| אבישי דיין | 4.2 | 5 | avishay.tormahir.co.il | already pays a booking SaaS, but only 5 reviews |
| Haim Simhon | 4.9 | 395 | haimbarber.com | real site. Different pitch, not a no-website one |
| Meiri Barbershop | 5.0 | 116 | meiribarbershop.co.il | real site |
| Jeries barbershop | 4.9 | 102 | jeriesbarbershop.com | real site |

**Competitor spotted:** `tormahir.co.il` ("תור מהיר") is an Israeli booking SaaS. אבישי דיין is on it.
Worth pricing against, the way Simpletor was at RICO.

## Live demos built

- **אבי אביב** — https://rico-barbers.pages.dev/avi-aviv/
  Built from his Google listing only: name, real address, real phone, real opening hours.
  No prices, no photos, no reviews, because I do not have them and will not invent them.
  Gallery and reviews sections hide themselves when empty. **No staff or availability is set up,
  so the booking screen says "no barbers available" and cannot take a real appointment nobody
  would see.** Shop codes are in the database; do not publish them.

## Watch out

- **אבי אביב has a REAL WhatsApp mobile: 050-7782431**, published on his B144 listing with a
  "ווטסאפ לעסק" badge. Google Maps showed only the shop landline 02-654-3334. Always check B144
  as well as Maps before writing a prospect off as unreachable.
- B144 masks most numbers behind an 076 proxy. Only some businesses publish a real mobile, and
  those are the reachable ones. Clicking B144's WhatsApp button does not reveal the number.

## Blocker: WhatsApp cannot send these

2026-07-31: WhatsApp restricted the account's LINKED DEVICES for **7 days**, saying recent
activity "may be a sign of spam, automated or bulk messaging". WhatsApp Web can no longer
START NEW CHATS. The phone itself is unrestricted.

So these three first-contact messages have to go out from the phone by hand. Automating cold
first contact through WhatsApp Web is what caused this and will risk the number itself.

## Messages ready to send

**אבי אביב** — 02-654-3334 (landline, WhatsApp unlikely; may need a call or a walk-in)
**Lior The Barber** — 052-346-5906 (mobile)
**Zuhair's Barbershop** — 02-678-4121 (landline)

Text, swapping the link per shop:

```
היי, מדבר שמעון

בניתי לכם אתר למספרה, אפשר לראות אותו כאן:
https://rico-barbers.pages.dev/<slug>/

לקחתי את הפרטים מגוגל, הכתובת והשעות כבר בפנים. אין עדיין מחירון ותמונות כי אין לי אותם.

מה שהוא עושה זה שהלקוחות קובעים תור לבד, בלי אפליקציה ובלי הרשמה, ואתם רואים את היומן מהטלפון.
פחות טלפונים באמצע תספורת.

אם זה מעניין אני משלים את המחירון והתמונות ומעביר לכם את הניהול. 300 שקל בחודש, הכל כלול ואני מתחזק.

אם לא מעניין תגידו ואני לא מפריע יותר.
```
