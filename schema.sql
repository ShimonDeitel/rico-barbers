-- The Barbershop — full database schema (Supabase / Postgres).
-- Applied as migrations: core_schema, rls_policies, rpcs,
-- manager_directory_and_storage, fix_code_generator, autoconfirm_signups, harden_grants.

create extension if not exists pgcrypto with schema extensions;

-- ============ tables ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  bio text not null default '',
  photo_path text,
  slot_minutes int not null default 30 check (slot_minutes between 10 and 180),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','barber','manager')),
  granted_at timestamptz not null default now()
);

create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,                -- bcrypt only; the code itself is never stored
  role text not null check (role in ('barber','manager')),
  multi_use boolean not null default false,
  active boolean not null default true,
  label text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null
);

create table public.code_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ok boolean not null,
  at timestamptz not null default now()
);
create index on public.code_attempts (user_id, at desc);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index on public.availability (barber_id, weekday);

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  note text not null default '',
  unique (barber_id, day)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked','done','cancelled')),
  customer_name text not null default '',
  customer_phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on public.appointments (barber_id, starts_at);
create index on public.appointments (customer_id, starts_at);
create unique index appointments_no_overlap
  on public.appointments (barber_id, starts_at) where status <> 'cancelled';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

-- ============ helpers ============
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.user_roles where user_id = auth.uid()), 'customer');
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'manager');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- no outbound SMTP on this project, so new emails are treated as confirmed.
-- Drop this trigger and configure SMTP to require real email verification.
create or replace function public.autoconfirm_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is null then new.email_confirmed_at := now(); end if;
  return new;
end $$;

create trigger autoconfirm_email_trg
  before insert on auth.users for each row execute function public.autoconfirm_email();

create or replace function public.gen_10_digit()
returns text language sql volatile security definer set search_path = public, extensions as $$
  with b as (select extensions.gen_random_bytes(10) as x)
  select string_agg((get_byte(b.x, i) % 10)::text, '' order by i)
  from b, generate_series(0,9) i;
$$;

-- ============ row level security ============
alter table public.profiles       enable row level security;
alter table public.user_roles     enable row level security;
alter table public.access_codes   enable row level security;
alter table public.code_attempts  enable row level security;  -- deny-all: no policies on purpose
alter table public.availability   enable row level security;
alter table public.time_off       enable row level security;
alter table public.appointments   enable row level security;
alter table public.notifications  enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_manager());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_manager())
  with check (id = auth.uid() or public.is_manager());

-- read-only to clients: roles can only be written by the definer functions below
create policy roles_select_own on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_manager());

create policy codes_select_mgr on public.access_codes for select to authenticated
  using (public.is_manager());
create policy codes_update_mgr on public.access_codes for update to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy avail_select on public.availability for select to authenticated using (true);
create policy avail_write on public.availability for all to authenticated
  using (barber_id = auth.uid() or public.is_manager())
  with check (barber_id = auth.uid() or public.is_manager());

create policy off_select on public.time_off for select to authenticated using (true);
create policy off_write on public.time_off for all to authenticated
  using (barber_id = auth.uid() or public.is_manager())
  with check (barber_id = auth.uid() or public.is_manager());

-- no INSERT policy: appointments can only be created through book_appointment()
create policy appt_select on public.appointments for select to authenticated
  using (customer_id = auth.uid() or barber_id = auth.uid() or public.is_manager());
create policy appt_update on public.appointments for update to authenticated
  using (barber_id = auth.uid() or customer_id = auth.uid() or public.is_manager())
  with check (barber_id = auth.uid() or customer_id = auth.uid() or public.is_manager());
create policy appt_delete_mgr on public.appointments for delete to authenticated
  using (public.is_manager());

create policy notif_select on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- customer-facing barber directory: safe columns only, no phone, no email
create view public.public_barbers
with (security_invoker = false) as
  select p.id, p.full_name, p.bio, p.photo_path, p.slot_minutes
  from public.profiles p
  join public.user_roles r on r.user_id = p.id
  where r.role = 'barber' and p.active;

revoke all on public.public_barbers from anon, authenticated;
grant select on public.public_barbers to anon, authenticated;

-- ============ RPCs ============

-- redeem a 10-digit access code to gain the barber or manager role
create or replace function public.redeem_access_code(p_code text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_uid uuid := auth.uid(); v_rec record; v_fails int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_code is null or p_code !~ '^[0-9]{10}$' then
    insert into code_attempts(user_id, ok) values (v_uid, false);
    raise exception 'invalid code';
  end if;

  select count(*) into v_fails from code_attempts
   where user_id = v_uid and not ok and at > now() - interval '1 hour';
  if v_fails >= 5 then raise exception 'too many attempts, try again later'; end if;

  select * into v_rec from access_codes
   where active and code_hash = extensions.crypt(p_code, code_hash)
   limit 1;

  if v_rec is null then
    insert into code_attempts(user_id, ok) values (v_uid, false);
    raise exception 'invalid code';
  end if;

  insert into code_attempts(user_id, ok) values (v_uid, true);

  insert into user_roles(user_id, role) values (v_uid, v_rec.role)
  on conflict (user_id) do update set role = excluded.role, granted_at = now();

  update access_codes set used_at = now(), used_by = v_uid,
         active = case when multi_use then active else false end
   where id = v_rec.id;

  return v_rec.role;
end $$;

-- manager: mint a single-use barber invite code (returned once, stored hashed)
create or replace function public.create_barber_code(p_label text default '')
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_code text;
begin
  if not is_manager() then raise exception 'manager only'; end if;
  v_code := public.gen_10_digit();
  insert into access_codes(code_hash, role, multi_use, label, created_by)
  values (extensions.crypt(v_code, extensions.gen_salt('bf', 10)), 'barber', false, p_label, auth.uid());
  return v_code;
end $$;

-- manager: change someone's role
create or replace function public.set_user_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_manager() then raise exception 'manager only'; end if;
  if p_role not in ('customer','barber','manager') then raise exception 'bad role'; end if;
  if p_user = auth.uid() and p_role <> 'manager' then raise exception 'cannot demote yourself'; end if;
  insert into user_roles(user_id, role) values (p_user, p_role)
  on conflict (user_id) do update set role = excluded.role, granted_at = now();
end $$;

-- manager: account directory (joins auth.users for the email)
create or replace function public.list_users()
returns table (id uuid, email text, full_name text, phone text, role text,
               photo_path text, active boolean, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_manager() then raise exception 'manager only'; end if;
  return query
    select p.id, u.email::text, p.full_name, p.phone,
           coalesce(r.role,'customer'), p.photo_path, p.active, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.user_roles r on r.user_id = p.id
    order by p.created_at desc;
end $$;

-- free slots for one barber on one day, in shop time
create or replace function public.available_slots(p_barber uuid, p_day date)
returns setof timestamptz language plpgsql security definer set search_path = public as $$
declare v_tz text := 'Asia/Jerusalem'; v_step int; v_dow int; r record; t timestamptz;
begin
  select slot_minutes into v_step from profiles p
    join user_roles ur on ur.user_id = p.id
   where p.id = p_barber and ur.role = 'barber' and p.active;
  if v_step is null then return; end if;
  if exists (select 1 from time_off where barber_id = p_barber and day = p_day) then return; end if;

  v_dow := extract(dow from p_day)::int;

  for r in select start_time, end_time from availability
            where barber_id = p_barber and weekday = v_dow order by start_time loop
    t := ((p_day::text || ' ' || r.start_time::text)::timestamp) at time zone v_tz;
    while t + (v_step || ' minutes')::interval
          <= ((p_day::text || ' ' || r.end_time::text)::timestamp) at time zone v_tz loop
      if t > now() and not exists (
           select 1 from appointments a
            where a.barber_id = p_barber and a.status <> 'cancelled'
              and a.starts_at < t + (v_step || ' minutes')::interval
              and a.ends_at   > t)
      then return next t; end if;
      t := t + (v_step || ' minutes')::interval;
    end loop;
  end loop;
end $$;

-- book: re-validates the slot server side, then notifies the barber
create or replace function public.book_appointment(
  p_barber uuid, p_start timestamptz, p_name text, p_phone text, p_notes text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_step int; v_end timestamptz; v_id uuid; v_bname text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then
    raise exception 'name and phone required'; end if;

  if not exists (select 1 from available_slots(p_barber, (p_start at time zone 'Asia/Jerusalem')::date) s
                  where s = p_start) then
    raise exception 'slot not available';
  end if;

  select slot_minutes, full_name into v_step, v_bname from profiles where id = p_barber;
  v_end := p_start + (v_step || ' minutes')::interval;

  insert into appointments(barber_id, customer_id, starts_at, ends_at, customer_name, customer_phone, notes)
  values (p_barber, v_uid, p_start, v_end, left(trim(p_name),80), left(trim(p_phone),30), left(coalesce(p_notes,''),300))
  returning id into v_id;

  insert into notifications(user_id, title, body)
  values (p_barber, 'תור חדש נקבע',
          p_name || ' קבע תור ל' ||
          to_char(p_start at time zone 'Asia/Jerusalem', 'DD/MM/YYYY HH24:MI') ||
          ' (' || p_phone || ')');
  return v_id;
end $$;

-- cancel: customer, barber or manager; the other side gets a notification
create or replace function public.cancel_appointment(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from appointments where id = p_id;
  if r is null then raise exception 'not found'; end if;
  if not (r.customer_id = auth.uid() or r.barber_id = auth.uid() or is_manager()) then
    raise exception 'not allowed'; end if;
  update appointments set status = 'cancelled' where id = p_id;
  insert into notifications(user_id, title, body)
  values (case when auth.uid() = r.barber_id then r.customer_id else r.barber_id end,
          'תור בוטל',
          to_char(r.starts_at at time zone 'Asia/Jerusalem', 'DD/MM/YYYY HH24:MI'));
end $$;

-- ============ storage ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos','photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- public bucket: object URLs are readable without RLS, so clients only get their own folder
create policy "photos own read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos own write" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos own update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ grants ============
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke all on function public.autoconfirm_email() from anon, authenticated, public;
revoke all on function public.gen_10_digit() from anon, authenticated, public;

revoke all on function public.create_barber_code(text) from anon, public;
revoke all on function public.set_user_role(uuid, text) from anon, public;
revoke all on function public.list_users() from anon, public;
revoke all on function public.redeem_access_code(text) from anon, public;
revoke all on function public.book_appointment(uuid, timestamptz, text, text, text) from anon, public;
revoke all on function public.cancel_appointment(uuid) from anon, public;

grant execute on function public.create_barber_code(text) to authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.list_users() to authenticated;
grant execute on function public.redeem_access_code(text) to authenticated;
grant execute on function public.book_appointment(uuid, timestamptz, text, text, text) to authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;

-- the one master manager code is inserted once, hashed, and shown only to the owner:
--   insert into public.access_codes(code_hash, role, multi_use, label)
--   select extensions.crypt(c.code, extensions.gen_salt('bf',10)), 'manager', true, 'MASTER manager code'
--   from (select public.gen_10_digit() as code) c returning (select code from c);

-- ============================================================================
-- Added in the second pass: outbound email, audit trail, abuse limits, cron.
-- Migrations: email_delivery, audit_log_and_booking_limits, manager_mail_settings,
--             test_email_rpc, mail_result_reconciler.
-- ============================================================================

create extension if not exists pg_net;   -- async HTTP from inside Postgres
create extension if not exists pg_cron;  -- in-database scheduler

-- non-secret settings, written only by set_settings() (manager)
create table public.app_config (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;   -- deny-all

-- every outbound email, with the provider's real HTTP result
create table public.mail_log (
  id bigserial primary key,
  to_email text not null,
  subject text not null,
  provider text not null default '',
  request_id bigint,
  status_code int,
  error text,
  created_at timestamptz not null default now()
);
alter table public.mail_log enable row level security;
create policy mail_log_select_mgr on public.mail_log for select to authenticated
  using (public.is_manager());

-- audit trail of every security-relevant action
create table public.security_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  user_id uuid,
  event text not null,
  detail jsonb not null default '{}'::jsonb
);
alter table public.security_events enable row level security;
create policy sec_select_mgr on public.security_events for select to authenticated
  using (public.is_manager());

-- The API key lives in Supabase Vault (encrypted), never in a normal column:
--   perform vault.create_secret(<key>, 'mail_api_key', 'outbound email provider key');
-- send_email() reads it through vault.decrypted_secrets, posts to Brevo or Resend
-- with net.http_post, and never raises — a mail failure cannot roll back a booking.
-- notification_to_email() is an AFTER INSERT trigger on notifications, so anything
-- that creates a notification (booking, cancellation, test) also sends an email.
-- reconcile_mail() runs every minute under pg_cron and folds the provider's async
-- reply back into mail_log.status_code / mail_log.error.
-- prune_logs() runs nightly and trims logs so a free-tier database never fills up.
--
-- book_appointment() additionally enforces: valid phone shape, at most 6 bookings
-- per customer per hour, at most 3 upcoming appointments, no self-overlap, and
-- nothing further out than 90 days. See the live functions for the exact bodies.
