#!/usr/bin/env bash
# Scaffold a new customer's site folder. The database side is one SQL call:
#
#   select * from new_shop('<slug>', '<Business Name>');
#
# which returns the manager and barber codes ONCE, in the clear. Only the bcrypt
# hashes are stored, so copy them out of that result or you are rotating codes.
#
#   ./newshop.sh <slug> "<Business Name>" ["<Tagline>"]
#
# Then commit and push; the folder is served at <pages-url>/<slug>/.
set -euo pipefail

slug=${1:-}; name=${2:-}; tagline=${3:-}
if [ -z "$slug" ] || [ -z "$name" ]; then
  echo "usage: ./newshop.sh <slug> \"<Business Name>\" [\"<Tagline>\"]" >&2; exit 1
fi
if ! printf '%s' "$slug" | grep -Eq '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'; then
  echo "slug must be lowercase letters, digits and dashes" >&2; exit 1
fi

here=$(cd "$(dirname "$0")" && pwd)
dest="$here/$slug"
[ -e "$dest" ] && { echo "$dest already exists" >&2; exit 1; }
mkdir -p "$dest"

first=$(printf '%s' "$name" | awk '{print toupper($1)}')
rest=$(printf '%s' "$name" | awk '{$1=""; print toupper($0)}' | sed 's/^ *//')

sed -e "s|<meta name=\"shop\" content=\"rico\">|<meta name=\"shop\" content=\"$slug\">|" \
    -e "s|RICO<span>BARBERS</span>|${first}<span>${rest}</span>|" \
    -e "s|data-text=\"RICO\"|data-text=\"${first}\"|" \
    -e "s|data-text=\"BARBERS\"|data-text=\"${rest}\"|" \
    -e "s|aria-label=\"RICO BARBERS\"|aria-label=\"${name}\"|" \
    -e "s|<title>.*</title>|<title>${name}</title>|" \
    -e "s|RICO BARBERS · ירושלים|${name}|" \
    -e 's|href="site.css|href="../site.css|' \
    -e 's|src="app.js|src="../app.js|' \
    -e 's|href="favicon|href="../favicon|g' \
    -e 's|href="apple-touch-icon|href="../apple-touch-icon|' \
    "$here/index.html" > "$dest/index.html"

[ -n "$tagline" ] && sed -i '' "s|<p class=\"lede\" id=\"tagline\">.*</p>|<p class=\"lede\" id=\"tagline\">${tagline}</p>|" "$dest/index.html"

# the og: tags still point at Rico's photo and url; blank them rather than lie
sed -i '' -e '/property="og:image"/d' -e '/name="twitter:image"/d' \
          -e "s|<meta property=\"og:url\" content=\"[^\"]*\">|<meta property=\"og:url\" content=\"\">|" \
          "$dest/index.html"

echo "created $dest"
echo "next:"
echo "  1. run in Supabase SQL:  select * from new_shop('$slug', '$name');"
echo "  2. save the two codes it prints, they are shown only once"
echo "  3. ./bump.sh && git add -A && git commit && git push"
