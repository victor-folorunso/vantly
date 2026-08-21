/**
 * Formatting and minifying, using what the industry actually uses.
 *
 * The first version of the formatter ran js-beautify and re-indented text.
 * That is fine until somebody compares it with a real tool, at which point it
 * is obviously a toy: it cannot reprint an expression, it has no opinion about
 * line width, and it silently pretty-prints invalid input.
 *
 * So formatting is Prettier, the same engine running in most editors, which
 * parses to a syntax tree and prints it again. Getting a syntax error back is
 * the point rather than a shortcoming: a formatter that reformats broken code
 * has hidden the bug you opened it to find.
 *
 * Minifying is Terser for JavaScript and csso for CSS. These rename
 * variables, drop unreachable branches and collapse values, which is the
 * difference between a file that is smaller and a file that is merely
 * narrower. HTML is done here, against the parsed document, because the
 * standard library for it needs Node.
 *
 * Everything is imported on demand. Prettier's parsers are large and nobody
 * needs the YAML one to format JSON.
 */

export type Lang =
  | 'json'
  | 'html'
  | 'css'
  | 'scss'
  | 'less'
  | 'js'
  | 'jsx'
  | 'ts'
  | 'tsx'
  | 'vue'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'graphql'
  | 'sql';

export type Result = { ok: true; output: string } | { ok: false; error: string };

export const LANGS: { id: Lang; label: string; canMinify: boolean }[] = [
  { id: 'json', label: 'JSON', canMinify: true },
  { id: 'html', label: 'HTML', canMinify: true },
  { id: 'css', label: 'CSS', canMinify: true },
  { id: 'scss', label: 'SCSS', canMinify: false },
  { id: 'less', label: 'Less', canMinify: false },
  { id: 'js', label: 'JavaScript', canMinify: true },
  { id: 'jsx', label: 'JSX', canMinify: false },
  { id: 'ts', label: 'TypeScript', canMinify: false },
  { id: 'tsx', label: 'TSX', canMinify: false },
  { id: 'vue', label: 'Vue', canMinify: false },
  { id: 'xml', label: 'XML', canMinify: false },
  { id: 'yaml', label: 'YAML', canMinify: false },
  { id: 'markdown', label: 'Markdown', canMinify: false },
  { id: 'graphql', label: 'GraphQL', canMinify: false },
  { id: 'sql', label: 'SQL', canMinify: false },
];

/** Prettier's name for each language, and the plugins that parser needs. */
const PARSER: Record<Lang, string> = {
  json: 'json',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  js: 'babel',
  jsx: 'babel',
  ts: 'typescript',
  tsx: 'typescript',
  vue: 'vue',
  xml: 'xml',
  yaml: 'yaml',
  markdown: 'markdown',
  graphql: 'graphql',
  sql: 'sql',
};

async function pluginsFor(lang: Lang): Promise<unknown[]> {
  const estree = () => import('prettier/plugins/estree');
  switch (lang) {
    case 'json':
    case 'js':
    case 'jsx':
      return [(await import('prettier/plugins/babel')).default, (await estree()).default];
    case 'ts':
    case 'tsx':
      return [(await import('prettier/plugins/typescript')).default, (await estree()).default];
    case 'css':
    case 'scss':
    case 'less':
      return [(await import('prettier/plugins/postcss')).default];
    case 'html':
    case 'vue':
      return [
        (await import('prettier/plugins/html')).default,
        (await import('prettier/plugins/babel')).default,
        (await estree()).default,
        (await import('prettier/plugins/postcss')).default,
      ];
    case 'yaml':
      return [(await import('prettier/plugins/yaml')).default];
    case 'markdown':
      return [(await import('prettier/plugins/markdown')).default];
    case 'graphql':
      return [(await import('prettier/plugins/graphql')).default];
    default:
      return [];
  }
}

/** Turns a thrown parse error into the line and column a person can act on. */
function readable(e: unknown): string {
  if (!(e instanceof Error)) return 'That could not be parsed.';
  const loc = (e as { loc?: { start?: { line: number; column: number } } }).loc?.start;
  const first = e.message.split('\n')[0].replace(/\s*\(\d+:\d+\)\s*$/, '');
  return loc ? `Line ${loc.line}, column ${loc.column}: ${first}` : first;
}

export async function format(
  source: string,
  lang: Lang,
  indent: 2 | 4 | 'tab' = 2,
): Promise<Result> {
  if (!source.trim()) return { ok: true, output: '' };

  try {
    /* XML and SQL are not in Prettier's core and their plugins are heavy, so
       they get a tidy of their own rather than a dependency nobody else on the
       site would use. */
    if (lang === 'xml') return { ok: true, output: formatXml(source, indent) };
    if (lang === 'sql') return { ok: true, output: formatSql(source) };

    const prettier = await import('prettier/standalone');
    const output = await prettier.format(source, {
      parser: PARSER[lang],
      plugins: (await pluginsFor(lang)) as never[],
      tabWidth: indent === 'tab' ? 2 : indent,
      useTabs: indent === 'tab',
      printWidth: 80,
    });
    return { ok: true, output };
  } catch (e) {
    return { ok: false, error: readable(e) };
  }
}

export async function minify(source: string, lang: Lang): Promise<Result> {
  if (!source.trim()) return { ok: true, output: '' };

  try {
    if (lang === 'json') {
      return { ok: true, output: JSON.stringify(JSON.parse(source)) };
    }

    if (lang === 'js') {
      const { minify: terser } = await import('terser');
      const out = await terser(source, {
        compress: true,
        mangle: true,
        format: { comments: false },
      });
      return { ok: true, output: out.code ?? '' };
    }

    if (lang === 'css') {
      const csso = await import('csso');
      return { ok: true, output: csso.minify(source, { restructure: true }).css };
    }

    if (lang === 'html') {
      return { ok: true, output: await minifyHtml(source) };
    }

    return { ok: false, error: 'Minifying is not available for this language.' };
  } catch (e) {
    return { ok: false, error: readable(e) };
  }
}

/**
 * Minifies HTML in the browser.
 *
 * The obvious library for this is html-minifier-terser, and it cannot be used
 * here: it depends on clean-css, which reads files and fetches URLs, so it
 * needs Node and will not build for a browser. Rather than ship a broken
 * import, the job is done against the parsed document.
 *
 * Parsed rather than pattern-matched, because collapsing whitespace with a
 * regular expression destroys the contents of a pre or a textarea, and that
 * is the bug every naive HTML minifier has.
 */
async function minifyHtml(source: string): Promise<string> {
  const doc = new DOMParser().parseFromString(source, 'text/html');

  // Whitespace is significant inside these, so their text is left exactly as
  // written.
  const PRESERVE = new Set(['PRE', 'TEXTAREA', 'CODE', 'SCRIPT', 'STYLE']);

  const walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];
  while (walker.nextNode()) comments.push(walker.currentNode as Comment);
  // Conditional comments still drive behaviour in old mail clients, so they
  // survive; everything else goes.
  for (const c of comments) if (!/^\s*\[if /.test(c.nodeValue ?? '')) c.remove();

  const squeeze = (node: Node, inPreserve: boolean) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (inPreserve) continue;
        const collapsed = (child.nodeValue ?? '').replace(/\s+/g, ' ');
        if (!collapsed.trim()) child.remove();
        else child.nodeValue = collapsed;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        squeeze(child, inPreserve || PRESERVE.has((child as Element).tagName));
      }
    }
  };
  squeeze(doc.documentElement, false);

  // Inline CSS and JavaScript get the real minifiers rather than a trim.
  for (const style of [...doc.querySelectorAll('style')]) {
    if (!style.textContent?.trim()) continue;
    const csso = await import('csso');
    style.textContent = csso.minify(style.textContent).css;
  }
  for (const script of [...doc.querySelectorAll('script')]) {
    const type = script.getAttribute('type');
    if (type && !/javascript|module/i.test(type)) continue;
    if (!script.textContent?.trim()) continue;
    try {
      const { minify: terser } = await import('terser');
      const out = await terser(script.textContent, { compress: true, mangle: true });
      if (out.code) script.textContent = out.code;
    } catch {
      /* A script that will not parse is left alone rather than dropped. */
    }
  }

  const html = doc.documentElement.outerHTML;
  // The parser always builds html, head and body. If the input had none of
  // them it was a fragment, and handing back a whole document would be wrong.
  const fragment = !/<html[\s>]/i.test(source);
  if (!fragment) return `${doc.doctype ? '<!doctype html>' : ''}${html}`;
  return (doc.head.innerHTML + doc.body.innerHTML).trim();
}

/* ── The two Prettier does not carry ──────────────────────────────────────── */

function formatXml(source: string, indent: 2 | 4 | 'tab'): string {
  const pad = indent === 'tab' ? '\t' : ' '.repeat(indent);
  // Parsed rather than pattern-matched, so a stray angle bracket inside an
  // attribute cannot be mistaken for a tag.
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const failure = doc.querySelector('parsererror');
  if (failure) throw new Error(failure.textContent?.split('\n')[0] ?? 'Invalid XML');

  const write = (node: Node, depth: number): string => {
    const prefix = pad.repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue?.trim() ?? '';
      return text ? prefix + text + '\n' : '';
    }
    if (node.nodeType === Node.COMMENT_NODE) {
      return `${prefix}<!--${node.nodeValue}-->\n`;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as Element;
    const attrs = [...el.attributes].map((a) => ` ${a.name}="${a.value}"`).join('');
    const children = [...el.childNodes].filter(
      (c) => c.nodeType !== Node.TEXT_NODE || (c.nodeValue ?? '').trim(),
    );

    if (children.length === 0) return `${prefix}<${el.tagName}${attrs} />\n`;

    // A single text child stays on one line, which is what makes the result
    // readable rather than a column of one word per line.
    if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
      return `${prefix}<${el.tagName}${attrs}>${children[0].nodeValue?.trim()}</${el.tagName}>\n`;
    }

    const inner = children.map((c) => write(c, depth + 1)).join('');
    return `${prefix}<${el.tagName}${attrs}>\n${inner}${prefix}</${el.tagName}>\n`;
  };

  return [...doc.childNodes].map((n) => write(n, 0)).join('').trimEnd() + '\n';
}

const SQL_BREAK = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
  'UNION ALL', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'RETURNING', 'ON CONFLICT',
];

function formatSql(source: string): string {
  // Strings are lifted out first so a keyword inside one is not treated as a
  // keyword, which is the mistake every regex-based SQL formatter makes.
  const strings: string[] = [];
  let work = source.replace(/'(?:[^']|'')*'/g, (m) => {
    strings.push(m);
    return ` ${strings.length - 1} `;
  });

  work = work.replace(/\s+/g, ' ').trim();

  /* Keywords in capitals, values as written. Uppercasing is what separates a
     query somebody can skim from a wall of lowercase, and it has to happen
     before the line breaks so the matching below sees a known shape. */
  const WORDS = [
    'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'ILIKE',
    'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC',
    'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'CAST',
    'TRUE', 'FALSE', 'USING', 'WITH',
  ];
  for (const word of WORDS) {
    work = work.replace(new RegExp(`\b${word}\b`, 'gi'), word);
  }
  // Breathing room around comparisons, which is the other thing that makes a
  // condition readable.
  work = work.replace(/\s*(<=|>=|<>|!=|=|<|>)\s*/g, ' $1 ');

  for (const keyword of SQL_BREAK) {
    work = work.replace(new RegExp(`\\s*\\b${keyword.replace(/ /g, '\\s+')}\\b\\s*`, 'gi'), `\n${keyword} `);
  }

  work = work
    .replace(/\s*\bAND\b\s*/gi, '\n  AND ')
    .replace(/\s*\bOR\b\s*/gi, '\n  OR ')
    .replace(/\s*,\s*/g, ',\n  ')
    .replace(/\s*;\s*/g, ';\n');

  return work
    .replace(/ (\d+) /g, (_, i) => strings[Number(i)])
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l, i, all) => l.trim() || (i > 0 && all[i - 1].trim()))
    .join('\n')
    .trim();
}
