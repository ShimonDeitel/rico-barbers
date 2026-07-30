# The Barbershop

A single-page booking web app for a barbershop. Three doors: **Barber**, **Manager**, **Customer**.
Works on phone, tablet and desktop. Black and white. The customer side is entirely in Hebrew (RTL).

Static front end (GitHub Pages) + Supabase for auth, database, storage.

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

## Layout

- `index.html` — shell
- `app.js` — all screens and logic (vanilla ES modules, no build step)
- `styles.css` — black and white, responsive
- `schema.sql` — full database schema, policies and functions, for reference

## Notes

- Email confirmation is bypassed on signup (a database trigger marks new emails confirmed),
  because the project has no outbound SMTP. To require real email verification, remove the
  `autoconfirm_email_trg` trigger and configure an SMTP provider in Supabase.
- Barbers get in-app notifications. To also send them email or a phone push, add an SMTP or
  push provider key and call it from a Supabase Edge Function on insert into `notifications`.
