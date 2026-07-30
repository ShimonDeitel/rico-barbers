# RICO BARBERS

The shop's website and its booking system. Jerusalem, Sha'arei Ha'ir, 216 Jaffa St.

Works on phone, tablet and desktop. Black and white, Hebrew first.
Static front end (GitHub Pages) + Supabase for auth, database, storage.

## The front page

Content is not hardcoded. Everything on it — tagline, about, address, phone, WhatsApp, Instagram,
years, cancellation policy, the whole price list and the opening hours — lives in the shop's own
settings and is edited from **Manager → Website content**. The page ships with the same values
baked in, so it renders instantly and stays complete even if the network is slow or unavailable.

The "open now / closed now" badge is computed live from the opening hours in the shop's timezone,
and rechecks every minute.

## Three doors, one site

- `index.html` — the shop's front page. Photos, price list, live opening hours, location.
- `book.html` — customers book here. **No account, no password, no email.** Name and phone,
  that's it. The booking is remembered in the browser by its own id, so a customer can see and
  cancel their appointment without ever signing in.
- `staff.html` — one box asking for a code. The master code opens the manager view; a barber's
  code opens that barber's day. There is no sign-up anywhere in the product.

## How access works

There are no usernames and no passwords. A code **is** the account.

- The manager mints a barber by name and picks how many digits the code should have (4 to 10).
  The code is shown once and never again — it is stored only as a bcrypt hash.
- Signing in hashes the typed code into a hidden account address and authenticates with it, so
  every row-level policy in the database still applies exactly as before.
- `New code` rotates a barber's code (the old one dies instantly). `Remove` deletes them.
- Only a manager can create staff, see the team, edit the website or read the logs. A barber who
  tries any of it is refused by the database, not by the interface.

## Languages

The whole thing is bilingual — Hebrew (RTL, default) and English — with a toggle on every page.

## Calendar

Every appointment has an **Add to calendar** button for both the barber and the customer. It opens
Google Calendar prefilled, and the same link works with Apple Calendar and Outlook. No accounts to
connect, no OAuth, nothing to pay for.

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

- Codes are stored **only as bcrypt hashes**. There is no way to read a code back out.
- Nobody can create an account. The only way in is a code a manager issued.
- Roles live in `user_roles`, a table with **no client write policies**. Nobody can grant
  themselves a role; only a manager, through a checked function, can.
- Row Level Security on every table: a customer can read only their own appointments,
  a barber only their own, a manager everything.
- Appointments can only be created through `book_appointment`, which re-validates the slot
  server-side, so a crafted request cannot book an unavailable or past time.
- Customers never see other customers' rows. The barber directory is a column-limited view
  (name, bio, photo, slot length) — phone numbers and emails are not in it.
- Photo uploads are restricted to each user's own folder, 3 MB, image types only.
- Booking is throttled server-side by phone number: at most 6 an hour, at most 3 upcoming, no two
  overlapping, nothing more than 90 days out, and the number must match a strict pattern.
- A booking id is an unguessable uuid and is the only thing that proves ownership of a booking,
  so a customer needs no account to manage one and cannot see anyone else's.
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

- `index.html` / `site.js` — the public front page
- `book.html` / `book.js` — accountless customer booking
- `staff.html` / `staff.js` — the code gate and both dashboards
- `ui.js` — one Supabase client, the language switch, every string, shared helpers
- `site.css` — the whole design system: front page and app layer
- `vendor/` — pinned copy of the Supabase client, so the app loads no third-party script
- `schema.sql` — full database schema, policies and functions, for reference

## Notes

- Email confirmation is bypassed on signup (a database trigger marks new emails confirmed),
  because the project has no outbound SMTP. To require real email verification, remove the
  `autoconfirm_email_trg` trigger and configure an SMTP provider in Supabase.
- Staff sign in with a code, so their account address is a hash and cannot receive mail. Each
  barber sets a real inbox in their own profile if they want booking alerts by email.
- Phone push would need a native app or an installed PWA with VAPID keys; email plus the
  dashboard covers the same need for free today.
