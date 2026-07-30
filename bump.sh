#!/bin/sh
# stamp every asset url with a fresh version so browsers cannot serve stale code
V=$(date +%Y%m%d%H%M%S)
python3 - "$V" <<'PY'
import sys, re
V = sys.argv[1]
h = open('index.html').read()
h = re.sub(r'href="site\.css(\?v=[0-9]+)?"', f'href="site.css?v={V}"', h)
h = re.sub(r'src="app\.js(\?v=[0-9]+)?"',   f'src="app.js?v={V}"', h)
open('index.html','w').write(h)
a = open('app.js').read()
a = re.sub(r"from '\./ui\.js(\?v=[0-9]+)?'", f"from './ui.js?v={V}'", a)
open('app.js','w').write(a)
u = open('ui.js').read()
u = re.sub(r"from '\./vendor/supabase\.js(\?v=[0-9]+)?'", f"from './vendor/supabase.js?v={V}'", u)
open('ui.js','w').write(u)
print(V)
PY
