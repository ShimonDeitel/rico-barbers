# The Barbershop

A single-page booking web app for a barbershop. Three doors: **Barber**, **Manager**, **Customer**.
Works on phone, tablet and desktop. Black and white. The customer side is entirely in Hebrew (RTL).

Static front end (GitHub Pages) + Supabase for auth, database, storage.

## Languages

The whole app is bilingual — Hebrew (RTL) and English (LTR) — with a toggle in the header on
every screen. It opens in Hebrew by default. The choice is remembered in the browser and saved
on the account, so notifications and emails go out in each person's own language: a Hebrew-speaking
barber gets the booking alert in Hebrew while the same booking sends the customer an English
confirmation. All strings live in `i18n.js`; adding a third language means adding one object there.

## How it works

1. **Everyone signs in** with their own email + password. A new account is always a plain customer.
2. **Barber** — enter a 10-digit barber code (issued by the manager) once, and the account becomes a barber.
   From then on the barber logs in normally and lands on their dashboard: upcoming appointments,
   notifications, profile (name, phone, bio, photo, appointment length), weekly working hours, days off.
3. **Manager** — enter the 10-digit master code once. The manager sees every account, every appointment,
   can change anyone's role, hide or show a barber, cancel any appointment, and generate barber codes.
4. **Customer** (Hebrew) — sees the barbers with their photos and bios, picks a barber, picks a date,
   picks a free time, confirms with name and phone. The barber immediately gets a notification.
   Customers can cancel their own appointments.

Free slots are computed on the server from the barber's weekly hours, minus days off, minus
appointments already taken, minus anything in the past. Shop timezone: `Asia/Jerusalem`.

## Where the backend actually lives

GitHub Pages serves static files only — it cannot run a backend, and GitHub Actions is a CI
scheduler, not a request-serving API. So the front end is on GitHub Pages and the backend is a
Supabase project: Postgres with row level security, Supabase Auth for accounts, Supabase Storage
for photos, and all business logic as Postgres functions. Nothing else needs to be running,
there is no server to keep alive, and both halves are on free tiers.

Two `pg_cron` jobs run inside the database around the clock: one folds email delivery results
back into the log every minute, one trims old log rows nightly.

## Email notifications

Booking creates a row in `notifications`, and an `AFTER INSERT` trigger turns every such row
into an email — so bookings, cancellations and test messages all mail out with no extra wiring.
The barber gets an English mail, the customer gets a Hebrew confirmation.

Set it up once from **Manager → Email notifications**:

1. Create a free sender account. Brevo's free tier is 300 emails a day, forever, and lets you
   verify a single sender address (your own Gmail works) with no domain of your own.
2. Copy the API key, pick the provider, fill in the verified sender address, save.
3. Press **Send a test email to me** and watch the result appear under *Last emails sent*.

The key is stored encrypted in Supabase Vault, never in a normal table and never in this repo.
`send_email()` reads it server-side; the browser never sees it. If no key is set, the app still
works and everyone still gets in-app notifications — only the mail is skipped.
Every attempt is logged with the provider's real HTTP status, so a bounce is visible instead of silent.

## Security model

- Passwords are handled by Supabase Auth (bcrypt, never in the app).
- The 10-digit codes are stored **only as bcrypt hashes**. There is no way to read a code back.
- Codes are verified inside the database (`redeem_access_code`), never in the browser.
  5 failed attempts per user per hour locks further attempts.
- Roles live in `user_roles`, a table with **no client write policies**. A user cannot grant
  themselves a role; only the code-redemption function and a manager can change roles.
- Row Level Security on every table: a customer can read only their own appointments,
  a barber only their own, a manager everything.
- Appointments can only be created through `book_appointment`, which re-validates the slot
  server-side, so a crafted request cannot book an unavailable or past time.
- Customers never see other customers' rows. The barber directory is a column-limited view
  (name, bio, photo, slot length) — phone numbers and emails are not in it.
- Photo uploads are restricted to each user's own folder, 3 MB, image types only.
- Booking is throttled server-side: at most 6 bookings an hour per customer, at most 3 upcoming
  appointments, no two overlapping appointments for the same person, nothing more than 90 days out,
  and the phone number must match a strict pattern.
- Every security-relevant action (code redeemed, code rejected, lockout, role change, key change)
  is written to an append-only audit log the manager can read and nobody else can.
- The email API key is held in Supabase Vault, encrypted at rest, readable only by a
  `SECURITY DEFINER` function. It never reaches the browser.
- No third-party CDN: `@supabase/supabase-js` is vendored into `vendor/`, so no outside script
  can be swapped under the app. A Content Security Policy limits the page to its own files
  plus the one Supabase host; scripts, frames and form posts to anywhere else are blocked.
- Trigger-only functions have `EXECUTE` revoked from every client role, so they cannot be
  called as API endpoints.

## Layout

- `index.html` — shell, plus the Content Security Policy
- `app.js` — all screens and logic (vanilla ES modules, no build step)
- `i18n.js` — every user-facing string, Hebrew and English
- `styles.css` — black and white, responsive
- `vendor/` — pinned copy of the Supabase client, so the app loads no third-party script
- `schema.sql` — full database schema, policies and functions, for reference

## Notes

- Email confirmation is bypassed on signup (a database trigger marks new emails confirmed),
  because the project has no outbound SMTP. To require real email verification, remove the
  `autoconfirm_email_trg` trigger and configure an SMTP provider in Supabase.
- Barbers get both in-app notifications and email. Phone push notifications would need a
  native app or an installed PWA with VAPID keys; email covers the same need for free today.
