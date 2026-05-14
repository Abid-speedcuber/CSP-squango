import * as esbuild from 'esbuild'
import { optimize } from 'svgo'
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MAIN = join(__dirname, 'main')
const PUBLIC = join(__dirname, 'public')

// ── helpers ────────────────────────────────────────────────────

function looksLikeHTML(str) {
  const body = str[0] === '`' || str[0] === "'" || str[0] === '"' ? str.slice(1, -1) : str
  return /<\s*[a-z!\/]/i.test(body)
}

function minifyCSS(css) {
  return css.replace(/\s*([:;,!])\s*/g, '$1').replace(/;\s*$/, '').replace(/\s+/g, ' ')
}

function minifyHTMLText(text) {
  return text
    .replace(/\n\s*/g, ' ')         // newline → space (keeps token separation)
    .replace(/>\s+</g, '><')         // remove whitespace between tags
    .replace(/\s{2,}/g, ' ')         // collapse multiple spaces
    .replace(/\s+\/>/g, '/>')        // remove space before self-close
    .replace(/style="([^"]*)"/g, (m, css) =>
      css.includes('${') ? m : `style="${minifyCSS(css)}"`)
}

function skipString(code, i) {
  const q = code[i]; i++
  while (i < code.length && code[i] !== q) {
    if (code[i] === '\\') i++
    i++
  }
  return i < code.length ? i + 1 : i
}

// Find the end of a template literal (matching closing backtick).
function findTemplateEnd(code, start) {
  let i = start + 1, depth = 0
  while (i < code.length) {
    const ch = code[i]
    if (ch === '`' && depth === 0) return i
    if ((ch === "'" || ch === '"') && depth > 0) {
      i = skipString(code, i)
      continue
    }
    if (ch === '`' && depth > 0) {
      i = findTemplateEnd(code, i)
      if (i === -1) return -1
      i++
      continue
    }
    if (ch === '$' && code[i + 1] === '{') { depth++; i += 2; continue }
    if (ch === '{' && depth > 0) { depth++; i++; continue }
    if (ch === '}') { if (depth > 0) depth--; i++; continue }
    i++
  }
  return -1
}

// Find the end of a ${ … } expression (matching closing brace).
function findExprEnd(code, start) {
  let i = start + 1, depth = 1
  while (i < code.length && depth) {
    if (code[i] === '`') {
      i = findTemplateEnd(code, i)
      if (i === -1) return -1
      i++
      continue
    }
    if (code[i] === "'" || code[i] === '"') {
      i = skipString(code, i)
      continue
    }
    if (code[i] === '{') depth++
    else if (code[i] === '}') depth--
    i++
  }
  return i - 1
}

// Iterate through code, find strings & template literals,
// flatten any that contain HTML/XML.
function flattenHTML(code) {
  const out = []
  let i = 0
  while (i < code.length) {
    const ch = code[i]

    // ── template literal ──
    if (ch === '`') {
      const end = findTemplateEnd(code, i)
      if (end === -1) { out.push(ch); i++; continue }
      const lit = code.slice(i, end + 1)
      const isHTML = looksLikeHTML(lit)

      if (isHTML) {
        const body = lit.slice(1, -1)
        const rebuilt = []
        let p = 0, lastEnd = 0
        while (p < body.length) {
          if (body[p] === '$' && body[p + 1] === '{') {
            rebuilt.push(minifyHTMLText(body.slice(lastEnd, p)))
            const exprEnd = findExprEnd(body, p + 1)
            rebuilt.push(body.slice(p, exprEnd + 1))
            p = exprEnd + 1
            lastEnd = p
          } else {
            p++
          }
        }
        rebuilt.push(minifyHTMLText(body.slice(lastEnd)))
        out.push('`' + rebuilt.join('') + '`')
      } else {
        out.push(lit)
      }
      i = end + 1
      continue
    }

    // ── regular string literal ──
    if (ch === "'" || ch === '"') {
      const q = ch
      let end = i + 1
      while (end < code.length && code[end] !== q) {
        if (code[end] === '\\') end++
        end++
      }
      if (end >= code.length) { out.push(ch); i++; continue }
      const str = code.slice(i, end + 1)
      out.push(looksLikeHTML(str) ? q + minifyHTMLText(str.slice(1, -1)) + q : str)
      i = end + 1
      continue
    }

    out.push(ch)
    i++
  }
  return out.join('')
}

// ── esbuild plugins ────────────────────────────────────────────

const stripQueryParams = {
  name: 'strip-query-params',
  setup(build) {
    build.onResolve({ filter: /\?v=/ }, args => {
      const clean = args.path.replace(/\?v=[^#?]*/, '')
      return {
        path: clean.startsWith('.') ? resolve(dirname(args.importer), clean) : clean,
        namespace: 'file',
      }
    })
  },
}

const optimizeSVGLiterals = {
  name: 'optimize-svg-literals',
  setup(build) {
    build.onLoad({ filter: /svg\.js$/ }, args => {
      const raw = readFileSync(args.path, 'utf-8')
      const code = raw.replace(/`[\s\S]*?`/g, lit => {
        if (!lit.includes('<svg')) return lit
        const result = optimize(lit.slice(1, -1), {
          multipass: true,
          plugins: [{
            name: 'preset-default',
            params: { overrides: { mergePaths: false } },
          }],
        })
        return '`' + result.data + '`'
      })
      return { contents: code, loader: 'js' }
    })
  },
}

// ── build ──────────────────────────────────────────────────────

if (existsSync(PUBLIC)) rmSync(PUBLIC, { recursive: true })
mkdirSync(join(PUBLIC, 'js'), { recursive: true })
mkdirSync(join(PUBLIC, 'css'), { recursive: true })
mkdirSync(join(PUBLIC, 'res'), { recursive: true })
mkdirSync(join(PUBLIC, 'presets'), { recursive: true })

await esbuild.build({
  entryPoints: [join(MAIN, 'js', 'index.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: join(PUBLIC, 'js', 'app.bundle.js'),
  plugins: [stripQueryParams, optimizeSVGLiterals],
})

// Post-process bundle: flatten HTML/CSS in strings & template literals
const bundlePath = join(PUBLIC, 'js', 'app.bundle.js')
let bundle = readFileSync(bundlePath, 'utf-8')
bundle = flattenHTML(bundle)
writeFileSync(bundlePath, bundle)

// Copy assets
cpSync(join(MAIN, 'css'), join(PUBLIC, 'css'), { recursive: true })
cpSync(join(MAIN, 'res'), join(PUBLIC, 'res'), { recursive: true })
cpSync(join(MAIN, 'presets'), join(PUBLIC, 'presets'), { recursive: true })
copyFileSync(join(MAIN, 'favicon.ico'), join(PUBLIC, 'favicon.ico'))

// Copy and patch index.html
let html = readFileSync(join(MAIN, 'index.html'), 'utf-8')
html = html.replace(
  /<script type="module" src="js\/index\.js\?v=[^"]*"><\/script>/,
  '<script src="js/app.bundle.js"></script>'
)
writeFileSync(join(PUBLIC, 'index.html'), html)

console.log('✓ Build complete → public/')
