const ALLOWED_TAGS = new Set([
  'p',
  'h2',
  'h3',
  'strong',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'br',
]);

const DANGEROUS_BLOCK = /<(script|style|iframe|object|embed|form|input|textarea|button)[\s>]/gi;

export function isChapterHtml(content: string): boolean {
  return /<\s*(p|h[1-6]|ul|ol|li|blockquote|strong|em|br|div)\b/i.test(content.trim());
}

/** Sanitizado básico en cliente (la API ya filtra al guardar). */
export function sanitizeReaderHtml(html: string): string {
  let result = html.replace(DANGEROUS_BLOCK, '');
  result = result.replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (match, slash, tag, attrs) => {
    const name = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    if (name === 'a' && !slash) {
      const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const href = hrefMatch?.[1] ?? '';
      if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) return '';
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
    }
    return `<${slash}${name}>`;
  });
  return result;
}

function injectHighlightsInHtml(html: string, highlights: string[]): string {
  const unique = [...new Set(highlights.map((h) => h.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!unique.length) return html;

  let result = html;
  for (const excerpt of unique) {
    const parts = result.split(/(<[^>]+>)/g);
    for (let i = 0; i < parts.length; i += 1) {
      if (parts[i].startsWith('<')) continue;
      if (parts[i].includes(excerpt)) {
        parts[i] = parts[i].split(excerpt).join(`<mark class="egw-highlight">${excerpt}</mark>`);
      }
    }
    result = parts.join('');
  }
  return result;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainTextToHtml(text: string): string {
  const escaped = escapeHtml(text.trim());
  if (!escaped) return '';
  return `<p>${escaped.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
}

export function prepareChapterBody(body: string, highlights: string[]): string {
  const trimmed = body.trim();
  if (!trimmed) return '';

  const base = isChapterHtml(trimmed) ? sanitizeReaderHtml(trimmed) : plainTextToHtml(trimmed);
  return injectHighlightsInHtml(base, highlights);
}

export const READER_CONTENT_CSS = `
  #content p { margin: 0 0 1em; }
  #content h2 { font-size: 1.15em; font-weight: 700; margin: 1.25em 0 0.5em; }
  #content h3 { font-size: 1.05em; font-weight: 700; margin: 1em 0 0.4em; }
  #content ul, #content ol { margin: 0 0 1em; padding-left: 1.35em; }
  #content li { margin-bottom: 0.35em; }
  #content blockquote {
    margin: 0 0 1em;
    padding-left: 0.85em;
    border-left: 3px solid rgba(201, 162, 39, 0.55);
    font-style: italic;
    opacity: 0.92;
  }
  #content a { color: #c9a227; text-decoration: underline; }
`;
