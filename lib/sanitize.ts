// Sanitiza HTML vindo do ERP (siteDescricao, infoPagamento…) antes de injetar via
// dangerouslySetInnerHTML. Conteúdo de autor confiável (leiloeiro) — defesa em profundidade.
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:script|style|iframe|object|embed|form|link|meta|base|noscript|svg|math|template)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/((?:href|src|xlink:href)\s*=\s*)(?:"|')?\s*(?:javascript|vbscript|data)\s*:[^"'>\s]*/gi, '$1"#"');
}
