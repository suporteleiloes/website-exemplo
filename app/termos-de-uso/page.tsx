/**
 * ⚠️⚠️  TEXTO MODELO — EXIGE REVISÃO JURÍDICA ANTES DO GO-LIVE  ⚠️⚠️
 *
 * Termos de uso tratam de obrigações contratuais (comissão do leiloeiro, prazos
 * de pagamento e retirada, penalidades, foro). Este MODELO é deliberadamente
 * genérico e NÃO fixa percentuais, prazos ou penalidades: essas condições estão
 * no EDITAL de cada leilão e variam por comitente. Inventar número aqui cria
 * conflito com o edital — que é o documento que vale.
 *
 * O texto oficial do leiloeiro deve ser cadastrado no CMS (slugs de `SLUGS`);
 * o CMS sempre vence este modelo.
 *
 * Ver `README.md §16 (LGPD)`.
 */

import type { Metadata } from 'next';

import { getSiteConfig } from '@/lib/api';
import { carregarPaginaCms } from '@/lib/pagina-cms';
import { dadosControlador } from '@/lib/legal';
import PaginaConteudo, { type ConteudoBase } from '@/components/PaginaConteudo';
import type { SiteConfig } from '@/lib/types';

const SLUGS = ['termos-de-uso', 'termos-uso', 'termos-e-condicoes', 'condicoes-de-uso'];
const TITULO = 'Termos de Uso';

function modelo(config: SiteConfig | null): ConteudoBase {
  const { nome, canais } = dadosControlador(config);
  return {
    intro: [
      `Estes termos regem o uso deste site, mantido por ${nome}. Ao navegar, criar conta, habilitar-se ou ofertar em um leilão, você declara que leu e concorda com as condições abaixo.`,
    ],
    secoes: [
      {
        titulo: 'O edital de cada leilão prevalece',
        paragrafos: [
          'Cada leilão é regido pelo seu edital, que traz as condições específicas do certame: descrição e estado dos bens, datas, valores, comissão do leiloeiro, forma e prazo de pagamento, prazo e local de retirada, ônus e penalidades. Havendo divergência entre estes termos e o edital, prevalece o edital. Leia-o integralmente antes de ofertar.',
        ],
      },
      {
        titulo: 'Cadastro e habilitação',
        paragrafos: [
          'Para participar é necessário cadastro com dados verdadeiros, completos e atualizados, e habilitação prévia no leilão pretendido. A habilitação pode exigir o envio de documentos e está sujeita a análise e aprovação.',
          'As credenciais de acesso são pessoais e intransferíveis. Você é responsável por mantê-las em sigilo e por toda oferta registrada com a sua conta. Suspeita de uso indevido deve ser comunicada imediatamente pelos canais de atendimento.',
        ],
      },
      {
        titulo: 'Ofertas e arrematação',
        paragrafos: [
          'A oferta registrada é irretratável e irrevogável, vincula quem a fez e implica plena aceitação das condições do edital. Ao encerrar o lote, a maior oferta válida é declarada vencedora e a arrematação é formalizada nos termos do edital.',
          'O não pagamento no prazo previsto sujeita o arrematante às sanções do edital e da legislação aplicável, sem prejuízo da cobrança das despesas decorrentes.',
        ],
      },
      {
        titulo: 'Estado dos bens e visitação',
        paragrafos: [
          'Os bens são vendidos no estado em que se encontram, sem garantia de funcionamento, salvo disposição diversa do edital. Fotos, descrições, medidas e demais informações são meramente ilustrativas e podem conter imprecisões de origem do comitente.',
          'Cabe ao interessado examinar o bem — presencialmente, quando houver visitação — e verificar débitos, restrições, ônus e condições de regularização antes de ofertar.',
        ],
      },
      {
        titulo: 'Disponibilidade do site',
        paragrafos: [
          'Empregamos esforços razoáveis para manter o site disponível e as informações corretas, mas não garantimos operação ininterrupta. Manutenções, indisponibilidades de rede, falhas de conexão do usuário e eventos fora do nosso controle podem afetar o acesso. Regras sobre suspensão ou prorrogação do certame nessas hipóteses constam do edital.',
        ],
      },
      {
        titulo: 'Uso permitido',
        paragrafos: [
          'É vedado utilizar o site para fins ilícitos, tentar obter acesso não autorizado a sistemas ou contas de terceiros, empregar mecanismos automatizados de coleta ou de oferta sem autorização, e reproduzir o conteúdo do site (textos, marcas, fotos e bases de dados) sem consentimento prévio.',
        ],
      },
      {
        titulo: 'Dados pessoais',
        paragrafos: [
          'O tratamento dos seus dados pessoais é descrito na Política de Privacidade, e o uso de cookies, no Aviso de Cookies — ambos parte integrante destes termos.',
        ],
      },
      {
        titulo: 'Alterações e contato',
        paragrafos: [
          'Estes termos podem ser atualizados a qualquer tempo; a versão vigente é a publicada nesta página. O uso do site após a publicação implica concordância com o texto atualizado.',
          `Dúvidas sobre estes termos podem ser encaminhadas ${canais}.`,
        ],
      },
    ],
  };
}

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Condições gerais de uso do site, do cadastro e da participação nos leilões.',
};

export default async function Page() {
  const [config, { blocos }] = await Promise.all([
    getSiteConfig().catch(() => null),
    carregarPaginaCms(SLUGS),
  ]);

  return (
    <PaginaConteudo
      titulo={TITULO}
      subtitulo="Condições gerais de uso do site, do cadastro e da participação nos leilões."
      blocos={blocos}
      fallback={modelo(config)}
    />
  );
}
