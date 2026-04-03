#!/usr/bin/env python3
"""
bundle.py — Single-file bundler for SquanGo CSP
Concatenates all CSS and JS (in HTML order), rewrites index.html to point at
the two bundle files, and optionally minifies everything.

Usage:
    python bundle.py              # bundle only
    python bundle.py --minify     # bundle + minify
    python bundle.py --out dist   # output to ./dist/ (default: ./build/)
"""

import argparse
import re
import shutil
from pathlib import Path

# ── optional minifiers (pip install rcssmin rjsmin) ──────────────────────────
try:
    import csscompressor
    HAS_CSSCOMPRESSOR = True
except ImportError:
    HAS_CSSCOMPRESSOR = False

try:
    from jsmin import jsmin as _jsmin
    HAS_JSMIN = True
except ImportError:
    HAS_JSMIN = False


# ─────────────────────────────────────────────────────────────────────────────
def collect_tags(html: str, tag: str, attr: str) -> list[str]:
    """Return a list of attribute values for all matching tags in order."""
    pattern = rf'<{tag}\b[^>]*\s{attr}=["\']([^"\']+)["\'][^>]*/?\s*>'
    return re.findall(pattern, html, flags=re.IGNORECASE)


def remove_tags(html: str, tag: str, attr: str) -> str:
    """Strip every <tag … attr="…"> line from the HTML."""
    pattern = rf'\s*<{tag}\b[^>]*\s{attr}=["\'][^"\']+["\'][^>]*/?\s*>\n?'
    return re.sub(pattern, '', html, flags=re.IGNORECASE)


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8')


def minify_css(src: str) -> str:
    if HAS_CSSCOMPRESSOR:
        return csscompressor.compress(src)
    # Fallback: strip comments and collapse whitespace (good enough)
    src = re.sub(r'/\*.*?\*/', '', src, flags=re.DOTALL)
    src = re.sub(r'\s+', ' ', src)
    src = re.sub(r'\s*([{}:;,>~+])\s*', r'\1', src)
    return src.strip()


def minify_js(src: str, mangle: bool = False) -> str:
    # Try terser first (best quality + mangling)
    try:
        import subprocess, tempfile, os
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
            f.write(src)
            tmp = f.name
        cmd = ['terser', tmp, '--compress', '--mangle'] if mangle else ['terser', tmp, '--compress']
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8')
        os.unlink(tmp)
        if result.returncode == 0 and result.stdout:
            return result.stdout
        else:
            print(f'  [warn] terser error: {result.stderr[:200]}')
    except (FileNotFoundError, Exception) as e:
        print(f'  [warn] terser failed ({e}), falling back to jsmin')
    # Fallback: jsmin
    if HAS_JSMIN:
        return _jsmin(src)
    # Last resort
    lines = []
    for line in src.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith('//'):
            lines.append(stripped)
    return '\n'.join(lines)


# ─────────────────────────────────────────────────────────────────────────────
def bundle(root: Path, out_dir: Path, minify: bool):
    out_dir.mkdir(parents=True, exist_ok=True)

    html_src = read(root / 'index.html')

    # ── CSS ──────────────────────────────────────────────────────────────────
    css_hrefs = collect_tags(html_src, 'link', 'href')
    css_hrefs = [h for h in css_hrefs if h.endswith('.css')]

    css_parts = []
    for href in css_hrefs:
        path = root / href
        if path.exists():
            content = read(path)
            css_parts.append(f'/* === {href} === */\n{content}')
            print(f'  [css] {href}')
        else:
            print(f'  [css] MISSING: {href}')

    bundle_css = '\n\n'.join(css_parts)
    if minify:
        bundle_css = minify_css(bundle_css)

    (out_dir / 'bundle.css').write_text(bundle_css, encoding='utf-8')

    # ── JS ───────────────────────────────────────────────────────────────────
    js_srcs = collect_tags(html_src, 'script', 'src')

    js_parts = []
    for src in js_srcs:
        path = root / src
        if path.exists():
            content = read(path)
            js_parts.append(f'/* === {src} === */\n{content}')
            print(f'  [js]  {src}')
        else:
            print(f'  [js]  MISSING: {src}')

    bundle_js = '\n\n'.join(js_parts)
    if minify:
        bundle_js = minify_js(bundle_js, mangle=True)

    (out_dir / 'bundle.js').write_text(bundle_js, encoding='utf-8')

    # ── Rewrite HTML ─────────────────────────────────────────────────────────
    new_html = html_src

    # Remove all <link rel="stylesheet"> tags
    new_html = remove_tags(new_html, 'link', 'href')

    # Remove all <script src="…"> tags
    new_html = remove_tags(new_html, 'script', 'src')

    # Inject bundle.css before </head>
    new_html = new_html.replace(
        '</head>',
        '    <link rel="stylesheet" href="bundle.css">\n</head>'
    )

    # Inject bundle.js before </body>
    new_html = new_html.replace(
        '</body>',
        '    <script src="bundle.js"></script>\n</body>'
    )

    (out_dir / 'index.html').write_text(new_html, encoding='utf-8')

    # ── Copy non-CSS/JS/HTML assets ──────────────────────────────────────────
    skip_files = {'index.html', 'bundle.css', 'bundle.js', 'bundle.py'}
    # Normalise bundled paths to forward slashes for reliable comparison
    bundled_paths = set(p.replace('\\', '/') for p in js_srcs + css_hrefs)

    for item in root.rglob('*'):
        if item.is_dir():
            continue
        # Skip anything inside the output dir or .git
        if out_dir.resolve() in item.resolve().parents:
            continue
        if '.git' in item.resolve().parts:
            continue
        rel = item.relative_to(root)
        rel_posix = rel.as_posix()
        # Skip bundled source files
        if rel_posix in bundled_paths:
            continue
        # Skip top-level JS/CSS source folders entirely
        if rel.parts[0] in ('js', 'css'):
            continue
        if item.name in skip_files:
            continue
        dest = out_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dest)

    # ── Remove leftover js/css folders from output if they snuck in ──────────
    for folder in ('js', 'css'):
        leftover = out_dir / folder
        if leftover.exists():
            shutil.rmtree(leftover)
            print(f'  [clean] removed {folder}/')

    print(f'\nDone! Output → {out_dir.resolve()}')
    print(f'  bundle.css  {(out_dir/"bundle.css").stat().st_size:>8,} bytes')
    print(f'  bundle.js   {(out_dir/"bundle.js").stat().st_size:>8,} bytes')


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Bundle SquanGo CSP assets.')
    parser.add_argument('--minify', action='store_true', help='Minify CSS and JS output')
    parser.add_argument('--out', default='build', help='Output directory (default: build)')
    args = parser.parse_args()

    root = Path(__file__).parent
    out  = root / args.out

    print(f'Bundling {"(+ minify) " if args.minify else ""}→ {out}')
    bundle(root, out, minify=args.minify)