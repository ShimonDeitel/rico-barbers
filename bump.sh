#!/bin/sh
# stamp every asset url with a fresh version so browsers cannot serve stale code.
# every shop folder gets stamped too, otherwise a customer's page stays pinned to
# whatever version existed the day it was created.
V=$(date +%Y%m%d%H%M%S)
python3 - "$V" <<'PY'
import sys, re, glob, os
V = sys.argv[1]

def stamp_page(path, prefix):
    h = open(path).read()
    h = re.sub(rf'href="{re.escape(prefix)}site\.css(\?v=[0-9]+)?"', f'href="{prefix}site.css?v={V}"', h)
    h = re.sub(rf'src="{re.escape(prefix)}app\.js(\?v=[0-9]+)?"',   f'src="{prefix}app.js?v={V}"', h)
    open(path, 'w').write(h)

stamp_page('index.html', '')
for page in sorted(glob.glob('*/index.html')):
    if os.path.basename(os.path.dirname(page)) in ('vendor', 'node_modules'):
        continue
    stamp_page(page, '../')
    print('  stamped', page)

a = open('app.js').read()
a = re.sub(r"from '\./ui\.js(\?v=[0-9]+)?'", f"from './ui.js?v={V}'", a)
open('app.js', 'w').write(a)
u = open('ui.js').read()
u = re.sub(r"from '\./vendor/supabase\.js(\?v=[0-9]+)?'", f"from './vendor/supabase.js?v={V}'", u)
open('ui.js', 'w').write(u)
print(V)
PY
