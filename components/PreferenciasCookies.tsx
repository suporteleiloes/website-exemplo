'use client';

/**
 * Link "Preferências de cookies" do rodapé — **forma canônica de revogação**.
 *
 * A LGPD exige que retirar o consentimento seja tão fácil quanto dá-lo (art. 8º,
 * §5º). Sem este ponto de reabertura, o banner aparece uma vez e a pessoa nunca
 * mais muda de ideia — a única saída seria limpar o navegador, o que não é
 * revogação, é o titular apagando os próprios dados.
 *
 * Reabre o banner **sem apagar** a decisão vigente: fechar sem escolher mantém o
 * que já valia. Quem quiser um controle mais rico (tela com as quatro categorias)
 * constrói sobre `lib/consentimento.ts` — o registro já é granular.
 */

import { abrirPreferenciasCookies } from '@/lib/consentimento';

export default function PreferenciasCookies({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={abrirPreferenciasCookies}
      className={`text-left hover:text-marca ${className}`}
    >
      Preferências de cookies
    </button>
  );
}
