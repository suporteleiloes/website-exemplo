/**
 * Consentimento de cookies — estado, persistência e assinatura. **Fonte única.**
 *
 * ── Este arquivo é o CONTRATO CANÔNICO da plataforma ─────────────────────────
 * Todo site nascido deste template usa ESTE shape. Ele existe porque os
 * primeiros sites saíram cada um com um formato próprio na MESMA chave de
 * `localStorage` — o que não quebra hoje (domínios distintos), mas garantiria
 * bug silencioso no dia em que dois deles compartilhassem código ou domínio.
 * Divergências conhecidas e o caminho de convergência: **README §16.2**.
 *
 * ── O contrato (vale para qualquer site feito sobre este template) ───────────
 * ⛔ NENHUM script não-essencial pode carregar antes do consentimento.
 * Analytics, pixels de remarketing, mapas de calor, chat de terceiro, vídeo
 * embedado com cookie de perfil: TODOS passam por `quandoAutorizado(categoria)`
 * ou checam `permite(categoria)`. Injetar `<script>` de terceiro direto no
 * layout, em `next/script` ou via `dangerouslySetInnerHTML` fura o gate — e é
 * exatamente o defeito que a LGPD pune (coleta sem base legal), não a coleta
 * em si.
 *
 * ── As categorias NÃO são livres ─────────────────────────────────────────────
 * São exatamente as quatro declaradas em `/aviso-de-cookies`. Se o código
 * permitir uma coisa e a política declarar outra, o site fica em desconformidade
 * mesmo coletando pouco. Mudou aqui, muda lá, no mesmo commit.
 *
 * ── Banner binário, registro granular ────────────────────────────────────────
 * O banner padrão oferece duas opções ("Aceitar todos" × "Apenas essenciais"),
 * porque é o que o site padrão precisa — ele não carrega nenhum terceiro. Mas o
 * REGISTRO já é por categoria: um site que amanhã precisar de uma tela granular
 * (aceitar medição, recusar marketing) ganha isso **sem trocar o formato nem
 * invalidar o consentimento de quem já respondeu**.
 *
 * ── Guardar a decisão é "estritamente necessário" ────────────────────────────
 * Registrar que a pessoa recusou não exige consentimento: o contrário seria
 * circular e o site perguntaria de novo a cada visita.
 *
 * ── Store externo, não estado de React ───────────────────────────────────────
 * A decisão vive no navegador, fora do React, e pode mudar em OUTRA aba. Por
 * isso o módulo expõe o trio de `useSyncExternalStore` — o banner se sincroniza
 * sem `setState` dentro de efeito e sem divergir entre SSR e hidratação.
 */

/** As quatro categorias declaradas em `/aviso-de-cookies`. Nesta ordem. */
export const CATEGORIAS = ['necessarios', 'preferencias', 'medicao', 'marketing'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Rótulos da política — o banner/UI não reescreve a redação por conta própria. */
export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  necessarios: 'Estritamente necessários',
  preferencias: 'Preferências e funcionalidade',
  medicao: 'Medição e desempenho',
  marketing: 'Marketing e campanhas',
};

export type Consentimento = Record<Categoria, boolean>;

/**
 * Chave versionada no `localStorage`.
 *
 * ⚠️ INCREMENTE o sufixo (`_v2`, `_v3`…) — e o `VERSAO_CONSENTIMENTO` junto —
 * sempre que acrescentar categoria, mudar o que uma delas abrange **ou mudar o
 * formato do registro**. Registro de versão diferente é tratado como
 * inexistente e a pessoa decide de novo: herdar em silêncio um "sim" dado para
 * outro escopo é consentimento que ninguém deu.
 *
 * ⚠️ Site que já publicou OUTRO formato nesta mesma chave (ver README §16.2)
 * tem de subir para `_v2` ao adotar o canônico — senão o registro antigo é lido
 * pelo parser novo. Aqui a leitura falha fechada (pergunta de novo), mas a
 * versão explícita é o que torna isso previsível.
 */
export const CHAVE_CONSENTIMENTO = 'consentimento_cookies_v1';
export const VERSAO_CONSENTIMENTO = 1;

/** Evento de DOM que reabre o banner (link "Preferências de cookies"). */
export const EVENTO_ABRIR = 'sl:consentimento:abrir';
/** Evento de DOM emitido a cada decisão — gancho para código fora do React. */
export const EVENTO_MUDOU = 'sl:consentimento:mudou';

interface Registro {
  versao: number;
  decididoEm: string;
  categorias: Consentimento;
}

/** Só o que o site precisa para funcionar (sessão, CSRF, esta própria decisão). */
export const APENAS_ESSENCIAIS: Consentimento = {
  necessarios: true,
  preferencias: false,
  medicao: false,
  marketing: false,
};

export const ACEITE_TOTAL: Consentimento = {
  necessarios: true,
  preferencias: true,
  medicao: true,
  marketing: true,
};

/**
 * O navegador já sinalizou recusa?
 *
 * `Global Privacy Control` e `Do Not Track` são recusa explícita e legível por
 * máquina. Respeitar evita perguntar a quem já respondeu — e é a leitura que a
 * ANPD faz de uma manifestação inequívoca de vontade.
 */
export function recusaDoNavegador(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}

/** Lê e valida o registro. Uso interno — o resto do código usa `consentimentoAtual()`. */
function lerDoArmazenamento(): Consentimento | null {
  if (typeof window === 'undefined') return null;
  if (recusaDoNavegador()) return APENAS_ESSENCIAIS;
  try {
    const bruto = window.localStorage.getItem(CHAVE_CONSENTIMENTO);
    if (!bruto) return null;
    const reg = JSON.parse(bruto) as Partial<Registro>;
    if (reg?.versao !== VERSAO_CONSENTIMENTO) return null; // escopo/formato mudou → perguntar de novo
    // Categoria ausente vira `false`: registro antigo nunca ganha permissão nova.
    return CATEGORIAS.reduce((acc, c) => {
      acc[c] = c === 'necessarios' ? true : reg.categorias?.[c] === true;
      return acc;
    }, {} as Consentimento);
  } catch {
    return null; // localStorage bloqueado ou JSON corrompido → indeciso
  }
}

// ── Store ────────────────────────────────────────────────────────────────────
// O snapshot é memorizado porque `useSyncExternalStore` compara por identidade:
// devolver um objeto novo a cada chamada faria o React re-renderizar em laço.
let snapshot: Consentimento | null = null;
let carregado = false;
/** Reabertura manual do banner (link do rodapé) — estado de UI, não de consentimento. */
let reaberto = false;
const assinantes = new Set<() => void>();

function notificar(): void {
  assinantes.forEach((fn) => fn());
}

/**
 * Decisão atual, ou `null` se a pessoa ainda não decidiu.
 *
 * ⚠️ `null` ≠ recusa para efeito de UI (o banner precisa aparecer), mas vale
 * como recusa para efeito de coleta: nada não-essencial carrega enquanto for `null`.
 */
export function consentimentoAtual(): Consentimento | null {
  if (typeof window === 'undefined') return null;
  if (!carregado) {
    snapshot = lerDoArmazenamento();
    carregado = true;
  }
  return snapshot;
}

/** `subscribe` do `useSyncExternalStore`. Inclui sincronização entre abas. */
export function assinarConsentimento(avisar: () => void): () => void {
  assinantes.add(avisar);

  // Aceitar (ou revogar) numa aba não pode deixar a outra coletando por horas.
  const entreAbas = (e: StorageEvent) => {
    if (e.key !== CHAVE_CONSENTIMENTO) return;
    carregado = false;
    consentimentoAtual();
    notificar();
  };
  const reabrir = () => { reaberto = true; notificar(); };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', entreAbas);
    window.addEventListener(EVENTO_ABRIR, reabrir);
  }

  return () => {
    assinantes.delete(avisar);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', entreAbas);
      window.removeEventListener(EVENTO_ABRIR, reabrir);
    }
  };
}

/** Assinatura com o valor pronto — para quem não usa `useSyncExternalStore`. */
export function aoMudarConsentimento(fn: (c: Consentimento | null) => void): () => void {
  return assinarConsentimento(() => fn(consentimentoAtual()));
}

/**
 * `getSnapshot` do banner: mostrar ou não?
 *
 * Snapshot booleano (primitivo, estável por definição) = ninguém decidiu ainda
 * **ou** a pessoa pediu para rever pelo link do rodapé.
 */
export function deveMostrarBanner(): boolean {
  return consentimentoAtual() === null || reaberto;
}

/**
 * `getServerSnapshot` do banner: **nunca** no HTML do servidor.
 *
 * O SSR não sabe o que o navegador guardou, e a página é cacheada (ISR): marcar
 * "mostrar" no servidor faria o banner piscar para todo mundo que já decidiu —
 * inclusive quem recusou —, convidando a cliques acidentais. Nada é coletado
 * nesse intervalo, então o custo de mostrar só depois da hidratação é nulo.
 */
export const bannerNoServidor = (): boolean => false;

/** Esta categoria está autorizada? Sem decisão = não. */
export function permite(categoria: Categoria): boolean {
  if (categoria === 'necessarios') return true;
  return consentimentoAtual()?.[categoria] === true;
}

/** Atalho: o visitante liberou tudo o que é opcional? */
export function aceitaOpcionais(): boolean {
  const c = consentimentoAtual();
  return !!c && CATEGORIAS.every((cat) => c[cat]);
}

/**
 * Executa `fn` UMA vez, assim que a categoria estiver (ou já estiver) autorizada.
 *
 * É o gancho canônico dos scripts não-essenciais:
 *
 * ```ts
 * useEffect(() => quandoAutorizado('medicao', () => {
 *   const s = document.createElement('script');
 *   s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXX';
 *   document.head.appendChild(s);
 * }), []);
 * ```
 *
 * Devolve o cancelador — chamado no cleanup, evita carregar depois de desmontar.
 */
export function quandoAutorizado(categoria: Categoria, fn: () => void): () => void {
  if (permite(categoria)) { fn(); return () => {}; }
  let feito = false;
  const cancelar = assinarConsentimento(() => {
    if (feito || !permite(categoria)) return;
    feito = true;
    fn();
    cancelar();
  });
  return cancelar;
}

/** Grava a decisão e notifica os assinantes. Só o banner deveria chamar isto. */
export function salvarConsentimento(categorias: Consentimento): void {
  if (typeof window === 'undefined') return;
  const efetivo: Consentimento = { ...categorias, necessarios: true };
  const reg: Registro = {
    versao: VERSAO_CONSENTIMENTO,
    decididoEm: new Date().toISOString(),
    categorias: efetivo,
  };
  try {
    window.localStorage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify(reg));
  } catch {
    // Aba anônima restrita: a decisão vale para esta navegação (o snapshot em
    // memória é atualizado abaixo), mas não sobrevive ao reload e o banner
    // reaparece. Melhor que quebrar o clique.
  }
  snapshot = efetivo;
  carregado = true;
  reaberto = false;
  notificar();
  window.dispatchEvent(new CustomEvent<Registro>(EVENTO_MUDOU, { detail: reg }));
}

/** "Aceitar todos" do banner. */
export function aceitarTodos(): void {
  salvarConsentimento(ACEITE_TOTAL);
}

/**
 * "Apenas essenciais" — também o caminho de REVOGAÇÃO.
 *
 * A LGPD exige que retirar o consentimento seja tão fácil quanto dá-lo
 * (art. 8º, §5º); por isso o rodapé tem o link "Preferências de cookies".
 * ⚠️ Revogar NÃO desfaz o que um script de terceiro já carregou nesta aba: quem
 * plugar um provedor deve parar a coleta, limpar os cookies dele e, se preciso,
 * recarregar a página.
 */
export function revogarConsentimento(): void {
  salvarConsentimento(APENAS_ESSENCIAIS);
}

/**
 * Reabre o banner para a pessoa rever a escolha (link do rodapé).
 *
 * Não apaga a decisão vigente: se ela fechar sem escolher, o que já valia
 * continua valendo.
 */
export function abrirPreferenciasCookies(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

/** Fecha o banner reaberto sem alterar a decisão vigente (usado pelo "fechar"). */
export function fecharPreferenciasCookies(): void {
  reaberto = false;
  notificar();
}
