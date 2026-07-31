# Free-tier ladder

Policy, set 2026-07-31: run on free tiers, move to the next free thing when one fills up,
pay only when there is nothing free left. Nothing here costs money today.

## What runs where

| Piece | Where | Free allowance | Why not something else |
|---|---|---|---|
| Booking data, accounts, security rules | **Supabase** (one project, all shops) | 500 MB database, 50k monthly users | The whole security model is Postgres RLS and SECURITY DEFINER functions. Nothing else free replaces that |
| Sites | **Cloudflare Pages** | unlimited requests, 500 builds/mo | Already there, and no GitHub Pages business ToS problem |
| Photos | **Supabase Storage** for now | 1 GB, 5 GB egress/mo | See the ladder below |

**One Supabase project serves every shop.** A new barbershop is rows, not a project. Do not
create a project per shop: free allows only 2 active projects and it does not scale.

## The photo ladder

Photos are the only thing that will realistically fill a free tier.

1. **Now: Supabase Storage, 1 GB.** Uploads are shrunk in the browser first (max 1600px,
   JPEG q0.82) which cuts a 4 MB phone photo to roughly 300 KB. That turns 1 GB into
   something like 3,000 photos, or 200 shops with a full gallery each.
2. **When storage passes ~800 MB or egress nears 5 GB/mo: Cloudflare R2.**
   10 GB storage and **no egress charge at all**, which is the part that matters for images.
   R2 has to be switched on once in the Cloudflare dashboard (Storage & databases > R2 >
   Overview, then a checkout flow) — that step needs the account owner and may ask for a card
   even at zero cost. Browser uploads to R2 need a small Worker to hold the credentials;
   Workers free tier is 100k requests/day, far beyond what photo uploads use.
3. **Only then consider paying.** Supabase Pro is $25/mo for 100 GB storage and 8 GB database.
   One paying shop at 300 covers it three times over.

## Where the real ceilings are

- Supabase free database 500 MB: barbershop text is kilobytes. Not a concern at any realistic count.
- Supabase free storage 1 GB: the first real ceiling. See the ladder.
- Supabase free egress 5 GB/mo: photos again. R2 removes it entirely.
- Cloudflare Pages: no meaningful ceiling here.

## Checking before it bites

Supabase dashboard shows storage and egress use. Check when adding roughly every tenth shop,
not every week.
