#!/usr/bin/env python3
"""
Simple static build script: inline `includes/header.html` and `includes/footer.html`
into pages and write to `build/`.
Usage: python3 scripts/build.py
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INCLUDES = ROOT / 'includes'
BUILD = ROOT / 'build'
PAGES = ['index.html', 'about.html', 'blog.html', 'blog-post.html']

BUILD.mkdir(exist_ok=True)

header_html = (INCLUDES / 'header.html').read_text(encoding='utf-8') if (INCLUDES / 'header.html').exists() else ''
footer_html = (INCLUDES / 'footer.html').read_text(encoding='utf-8') if (INCLUDES / 'footer.html').exists() else ''

for p in PAGES:
    src = ROOT / p
    if not src.exists():
        print('skip, not found:', p)
        continue
    out = BUILD / p
    content = src.read_text(encoding='utf-8')
    content = content.replace('<div id="site-header"></div>', header_html)
    content = content.replace('<div id="site-footer"></div>', footer_html)
    out.write_text(content, encoding='utf-8')
    print('built', out)

# Copy assets and web-resource for completeness
import shutil
for name in ['assets', 'web-resource', 'includes', 'sitemap.xml', 'robots.txt']:
    src = ROOT / name
    dst = BUILD / name
    if src.exists():
        if dst.exists():
            shutil.rmtree(dst)
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        print('copied', name)

print('Build complete. Output in', BUILD)
