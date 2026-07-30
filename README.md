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

## One link

There is a single URL. Everything lives behind it:

- `#/` the shop — photos, price list, live opening hours, location
- `#/book` customers book: **no account, no password, no email.** Name and phone. The booking is
  remembered in the browser by its own id, so they can see or cancel it without ever signing in.
- `#/staff` the team, signed in with Google

## How access works

**Sign in with Google. Nothing else.** There is no sign-up form and no password anywhere.

- A `staff_allowlist` table maps Google addresses to a role. The manager adds a barber by typing
  their Gmail address; the next time that person signs in with Google they land on their own day.
- Anyone else who signs in is told the account is not on the team and can do nothing.
- Removing someone deletes the allowlist row and the account with it.
- Only a manager can add or remove staff, edit the website or read the logs. A barber who tries
  is refused by the database, not by the interface.

### Turning Google on (once)

The provider has to be enabled with credentials from the shop's own Google account:

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → Web application.
   Authorised redirect URI: `https://vbhjrcakyhpexmntjgxd.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Sign In / Providers → **Google**: on, paste the client ID and secret.
3. Supabase → Authentication → URL Configuration → Site URL and Redirect URLs:
   `https://shimondeitel.github.io/rico-barbers/`

Until that is done the booking side works fully; only the staff door is closed.

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

A nightly `pg_cron` job trims old rows so a free-tier database never fills up.

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

- There is no email and no outbound messaging of any kind, so there is no provider account,
  no API key and no per-message cost. A booking appears on the barber's dashboard immediately;
  that is the notification.
