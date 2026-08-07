/**
 * ⚠️⚠️  TEXTO MODELO — EXIGE REVISÃO JURÍDICA ANTES DO GO-LIVE  ⚠️⚠️
 *
 * Além da revisão jurídica, este aviso tem uma exigência TÉCNICA: as categorias
 * declaradas aqui são exatamente as de `lib/consentimento.ts` (necessários,
 * preferências, medição, marketing) e precisam descrever os cookies que o site
 * realmente usa. Ligou GA4, Pixel, mapa de calor ou vídeo com cookie de perfil?
 * Acrescente aqui, no mesmo commit — declarar uma coisa e coletar outra é o
 * defeito que a LGPD pune, não a coleta em si. Categoria nova ⇒ subir a versão
 * da chave (`_v2`) em `lib/consentimento.ts`.
 *
 * Se o leiloeiro tiver aviso próprio, cadastre no CMS (slugs de `SLUGS`): o CMS
 * sempre vence este texto.
 *
 * Ver `README.md §16 (LGPD)`.
 */

import type { Metadata } from 'next';

import { getSiteConfig } from '@/lib/api';
import { carregarPaginaCms } from '@/lib/pagina-cms';
import { dadosControlador } from '@/lib/legal';
import PaginaConteudo, { type ConteudoBase } from '@/components/PaginaConteudo';
import type { SiteConfig } from '@/lib/types';

const SLUGS = ['aviso-de-cookies', 'politica-de-cookies', 'cookies'];
const TITULO = 'Aviso de Cookies';

function modelo(config: SiteConfig | null): ConteudoBase {
  const { nome, canais } = dadosControlador(config);
  return {
    intro: [
      `Cookies são pequenos arquivos gravados no seu dispositivo quando você visita um site. Este aviso explica quais ${nome} utiliza, para quê, e como você controla a sua escolha.`,
    ],
    secoes: [
      {
        titulo: 'Estritamente necessários',
        paragrafos: [
          'São indispensáveis para o site funcionar e por isso não dependem de consentimento. Mantêm a sua sessão autenticada (login do arrematante), protegem os formulários contra uso abusivo e registram a sua própria decisão sobre este aviso — sem esse registro, o banner perguntaria de novo a cada página.',
          'Se você bloquear esses cookies pelo navegador, partes do site — como login, habilitação e envio de lances — deixam de funcionar.',
        ],
      },
      {
        titulo: 'Preferências e funcionalidade',
        paragrafos: [
          'Guardam escolhas suas para melhorar o uso do site — como a forma de exibir listagens, filtros recentes e itens marcados neste dispositivo. Não identificam você para terceiros. Recusar não impede a navegação: o site apenas deixa de lembrar dessas preferências.',
        ],
      },
      {
        titulo: 'Medição e desempenho',
        paragrafos: [
          'Ajudam a entender como o site é usado — quais páginas e lotes são mais consultados, onde ocorrem erros, quanto tempo as telas levam para carregar — e assim corrigir problemas e melhorar a experiência. Enquanto você não autorizar, nenhum script de medição é carregado: a escolha bloqueia a coleta na origem, não apenas o cookie.',
        ],
      },
      {
        titulo: 'Marketing e campanhas',
        paragrafos: [
          'Permitem medir o resultado de anúncios e apresentar comunicações mais relevantes, inclusive em outras plataformas. Também dependem da sua autorização e, sem ela, nenhum pixel ou tag de campanha é carregado.',
          'As ferramentas de medição e de campanha efetivamente utilizadas por este site, quando houver, são listadas nesta seção com a respectiva finalidade.',
        ],
      },
      {
        titulo: 'Como rever a sua escolha',
        paragrafos: [
          'Use o link "Preferências de cookies", no rodapé de qualquer página, para reabrir o aviso e mudar a sua decisão a qualquer momento. Retirar o consentimento é tão simples quanto concedê-lo, e não afeta a legalidade do tratamento feito antes da retirada.',
          'Você também pode bloquear ou apagar cookies nas configurações do seu navegador. Nesse caso, os cookies necessários também serão afetados e o site poderá deixar de funcionar corretamente.',
          'Respeitamos os sinais de privacidade do navegador: se o seu navegador enviar Global Privacy Control (GPC) ou Do Not Track, tratamos como recusa dos cookies opcionais e não perguntamos novamente.',
        ],
      },
      {
        titulo: 'Cookies de terceiros',
        paragrafos: [
          'Páginas que incorporam conteúdo externo — vídeos, mapas ou widgets — podem fazer o seu navegador receber cookies do provedor desse conteúdo, sujeitos às políticas dele. Carregamos esse tipo de conteúdo apenas quando os cookies opcionais são aceitos ou quando você opta por exibi-lo.',
        ],
      },
      {
        titulo: 'Dúvidas',
        paragrafos: [
          `Para saber mais sobre o tratamento dos seus dados, consulte a nossa Política de Privacidade. Dúvidas sobre este aviso podem ser encaminhadas ${canais}.`,
        ],
      },
    ],
  };
}

export const metadata: Metadata = {
  title: 'Aviso de Cookies',
  description: 'Quais cookies este site utiliza, para quê, e como rever a sua escolha a qualquer momento.',
};

export default async function Page() {
  const [config, { blocos }] = await Promise.all([
    getSiteConfig().catch(() => null),
    carregarPaginaCms(SLUGS),
  ]);

  return (
    <PaginaConteudo
      titulo={TITULO}
      subtitulo="O que gravamos no seu dispositivo, por quê, e como mudar de ideia."
      blocos={blocos}
      fallback={modelo(config)}
    />
  );
}
