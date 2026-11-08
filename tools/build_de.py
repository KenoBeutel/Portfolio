"""Build the German pages under de/ from the English pages and add the DE/EN switch.

Run from the repo root:  python3 tools/build_de.py
English pages are the source. Re-run after every English change; de/ is regenerated.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from i18n_de import COMMON, PAGES

ROOT = os.path.join(os.path.dirname(__file__), '..')
BASE = 'https://kenobeutel.github.io/Portfolio/'
PAGES_LIST = ['index.html', 'cv.html'] + ['work/' + f for f in sorted(os.listdir(os.path.join(ROOT, 'work'))) if f.endswith('.html')]


def url(lang, p):
    path = ('de/' if lang == 'de' else '') + ('' if p == 'index.html' else p)
    return BASE + path


def switch(lang, p):
    depth = p.count('/')
    if lang == 'en':
        other = '../' * depth + 'de/' + p
    else:
        other = '../' * (depth + 1) + p
    en = '<a href="%s" hreflang="en" lang="en"%s>EN</a>' % ('#' if lang == 'en' else other, ' aria-current="true"' if lang == 'en' else '')
    de = '<a href="%s" hreflang="de" lang="de"%s>DE</a>' % ('#' if lang == 'de' else other, ' aria-current="true"' if lang == 'de' else '')
    label = 'Sprache' if lang == 'de' else 'Language'
    return '<nav class="lang caps" aria-label="%s">%s<span aria-hidden="true">/</span>%s</nav>' % (label, de, en)


def add_chrome(s, lang, p):
    # DE/EN switch + theme button grouped on the right of the header (idempotent)
    s = re.sub(r'<div class="tools">\s*<nav class="lang caps".*?</nav>\s*', '<div class="tools">\n      ', s, flags=re.S)
    if '<div class="tools">' not in s:
        s = re.sub(r'(\n\s*)(<button class="theme-btn".*?</button>)', r'\1<div class="tools">\n      \2\n    </div>', s, count=1, flags=re.S)
    s = s.replace('<div class="tools">\n      ', '<div class="tools">\n      ' + switch(lang, p) + '\n      ', 1)
    # hreflang alternates
    s = re.sub(r'\n<link rel="alternate" hreflang="[^"]+" href="[^"]+">', '', s)
    alt = '\n<link rel="alternate" hreflang="en" href="%s">\n<link rel="alternate" hreflang="de" href="%s">' % (url('en', p), url('de', p))
    s = s.replace('</title>', '</title>' + alt, 1)
    return s


def to_de_paths(s, p):
    depth = p.count('/')
    up = '../' * depth
    for asset in ('css/', 'img/', 'js/', 'fonts/'):
        s = s.replace('"%s%s' % (up, asset), '"../%s%s' % (up, asset))
        s = s.replace("'%s%s" % (up, asset), "'../%s%s" % (up, asset))
    return s


missing = []
for p in PAGES_LIST:
    fp = os.path.join(ROOT, p)
    en = add_chrome(open(fp).read(), 'en', p)
    open(fp, 'w').write(en)

    de = en
    for a, b in PAGES.get(p, []):
        if a not in de:
            missing.append((p, a[:70]))
        de = de.replace(a, b)
    for a, b in COMMON:
        de = de.replace(a, b)
    de = re.sub(r'aria-label="Listen to ([^"]+)"', r'aria-label="\1 anhören"', de)
    de = re.sub(r'aria-label="([^"]+) on (Bandcamp|Spotify|Apple Music)"', r'aria-label="\1 auf \2"', de)
    de = to_de_paths(de, p)
    de = add_chrome(de, 'de', p)
    out = os.path.join(ROOT, 'de', p)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(de)
    print('built', 'de/' + p)

if missing:
    print('\nNOT FOUND:')
    for m in missing:
        print(' ', m)
    sys.exit(1)
