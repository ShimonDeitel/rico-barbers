-- Who is actually using the thing, and therefore who owes money.
-- Run in the Supabase SQL editor. "using it" = a real person signed in, set their hours,
-- and customers are booking. Content edits alone are just me setting up their demo.
select
  s.slug,
  s.name,
  case
    when (select count(*) from appointments ap
           where ap.shop_id = s.id and ap.created_at > now() - interval '30 days') > 0
      then 'LIVE, taking bookings'
    when (select count(distinct a.barber_id) from availability a where a.shop_id = s.id) > 0
      then 'set up, no bookings yet'
    when (select count(*) from user_roles r where r.shop_id = s.id) > 0
      then 'signed in, not set up'
    else 'demo only, never touched'
  end                                                                                as status,
  (select count(*) from user_roles r where r.shop_id = s.id)                         as staff_joined,
  (select max(u.last_sign_in_at) at time zone 'Asia/Jerusalem'
     from user_roles r join auth.users u on u.id = r.user_id where r.shop_id = s.id) as last_sign_in,
  (select count(distinct a.barber_id) from availability a where a.shop_id = s.id)    as barbers_with_hours,
  (select count(*) from appointments ap where ap.shop_id = s.id)                     as bookings_total,
  (select count(*) from appointments ap
    where ap.shop_id = s.id and ap.created_at > now() - interval '30 days')          as bookings_30d,
  (select max(ap.created_at) at time zone 'Asia/Jerusalem'
     from appointments ap where ap.shop_id = s.id)                                   as last_booking
from shops s
order by 6 desc nulls last, s.created_at;
