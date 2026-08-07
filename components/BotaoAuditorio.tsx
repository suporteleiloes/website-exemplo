import { PAINEL_URL } from '@/lib/config';
import { hrefPainel, rotaAuditorio } from '@/lib/painel';

/**
 * Botão "Auditório Virtual" — CONVENÇÃO de todo site de leiloeiro (2026-07-30).
 *
 * Presente nas telas de LEILÃO e de LOTE, sempre visível, em VERMELHO (suave).
 * É o caminho pra acompanhar o pregão ao vivo no app do arrematante.
 *
 * Destino = `/auditorio/{leilaoId}` no app-cliente NOVO (`app.<dominio>`).
 * ⚠️ NUNCA use `leilao._urls.auditorio` da API: aponta pro arrematante LEGADO
 * (`arrematante.<dominio>`, hash-routing) — sites novos não referenciam o legado.
 *
 * ⚠️ SEMPRE VIA `hrefPainel()` → `/api/sso/handoff` (2026-08-07). Linkar direto o
 * domínio do painel fazia o visitante LOGADO no site chegar ao auditório
 * DESLOGADO — a sessão não atravessa domínio sozinha; quem faz a ponte é o
 * handoff SSO (código de troca de uso único). `publico: true` (→ `anon=1`) mantém
 * o auditório aberto pra quem não está logado. Ver `lib/painel.ts`.
 *
 * `variant`: `destaque` (sólido, p/ hero do leilão) | `sutil` (rosado, p/ dentro
 * do painel de lance, abaixo do "Dar lance"). Some se o leilão está encerrado/
 * cancelado/adiado (96/97/99).
 */
const SEM_AUDITORIO = new Set([96, 97, 99]);

export default function BotaoAuditorio({
  leilaoId,
  status,
  aoVivo = false,
  variant = 'destaque',
  className = '',
}: {
  leilaoId: number | null | undefined;
  status?: number | null;
  aoVivo?: boolean;
  variant?: 'destaque' | 'sutil';
  className?: string;
}) {
  if (!leilaoId || !PAINEL_URL) return null;
  if (typeof status === 'number' && SEM_AUDITORIO.has(status)) return null;

  const sutil = variant === 'sutil';
  const estilo: React.CSSProperties = sutil
    ? { background: '#fdefef', color: '#c0392b', border: '1px solid #f0c9c9', boxShadow: 'none' }
    : { background: '#d9534f', color: '#fff', border: 'none', boxShadow: '0 12px 26px rgba(217,83,79,.34)' };

  return (
    <a
      href={hrefPainel(rotaAuditorio(leilaoId), { publico: true })}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '13px 22px',
        borderRadius: 12,
        fontWeight: 800,
        ...estilo,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: sutil ? '#d9534f' : '#fff', animation: aoVivo ? 'pulse 1.6s infinite' : 'none' }} />
      {aoVivo ? 'Auditório ao vivo' : 'Auditório Virtual'}
    </a>
  );
}
