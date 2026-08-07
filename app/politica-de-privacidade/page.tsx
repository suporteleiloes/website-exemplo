/**
 * ⚠️⚠️  TEXTO MODELO — EXIGE REVISÃO JURÍDICA ANTES DO GO-LIVE  ⚠️⚠️
 *
 * O conteúdo abaixo é um MODELO genérico de boas práticas de LGPD, escrito para
 * um site de leiloeiro padrão. Não somos advogados e este texto NÃO substitui a
 * política do cliente: prazos de retenção, bases legais aplicáveis à atividade,
 * operadores contratados e a identificação do encarregado (DPO) variam de
 * leiloeiro para leiloeiro.
 *
 * Antes de publicar o site:
 *   1. Peça ao leiloeiro a política aprovada pelo jurídico dele e cadastre-a no
 *      ERP (CMS → página com um dos slugs de `SLUGS` abaixo). O CMS sempre vence
 *      este texto — é o caminho correto.
 *   2. Se o cliente não tiver documento próprio, o texto MODELO fica no ar com o
 *      aviso de "conteúdo informativo", mas isso é solução TEMPORÁRIA e precisa
 *      constar do checklist de lançamento.
 *
 * Ver `README.md §16 (LGPD)`.
 */

import type { Metadata } from 'next';

import { getSiteConfig } from '@/lib/api';
import { carregarPaginaCms } from '@/lib/pagina-cms';
import { dadosControlador } from '@/lib/legal';
import PaginaConteudo, { type ConteudoBase } from '@/components/PaginaConteudo';
import type { SiteConfig } from '@/lib/types';

/** Slugs candidatos no CMS — variam por tenant. O primeiro que existir vence. */
const SLUGS = ['politica-de-privacidade', 'politica-privacidade', 'privacidade'];
const TITULO = 'Política de Privacidade';

function modelo(config: SiteConfig | null): ConteudoBase {
  const { nome, canais } = dadosControlador(config);
  return {
    intro: [
      `Esta política explica como ${nome} trata os dados pessoais coletados quando você navega neste site, se cadastra, participa de leilões ou fala com o nosso atendimento. Ela segue a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).`,
    ],
    secoes: [
      {
        titulo: 'Quais dados coletamos',
        paragrafos: [
          'Dados que você nos fornece: nome, CPF ou CNPJ, documento de identificação, endereço, e-mail e telefone informados no cadastro e na habilitação para leilões; dados bancários ou de pagamento quando necessários à liquidação de uma arrematação; e o conteúdo das mensagens que você envia pelos formulários de contato e pelo atendimento.',
          'Dados gerados pelo uso do site: páginas visitadas, lotes e leilões consultados, lances registrados, endereço IP, data e hora dos acessos e informações do dispositivo e do navegador, coletados por cookies e tecnologias semelhantes (ver o Aviso de Cookies).',
        ],
      },
      {
        titulo: 'Para que usamos e com qual base legal',
        paragrafos: [
          'Execução de contrato e procedimentos preliminares (art. 7º, V): criar e manter a sua conta, habilitar você em leilões, registrar lances, comunicar resultados e viabilizar o pagamento e a retirada dos bens arrematados.',
          'Cumprimento de obrigação legal ou regulatória (art. 7º, II): guarda de registros exigidos da atividade de leiloaria, emissão de documentos fiscais e atendimento a determinações de autoridades.',
          'Legítimo interesse (art. 7º, IX): segurança e prevenção a fraudes, manutenção e melhoria do site e comunicações operacionais sobre leilões dos quais você participa. Você pode se opor a esse tratamento pelos canais indicados abaixo.',
          'Consentimento (art. 7º, I): envio de comunicações de marketing e uso de cookies não essenciais. O consentimento é livre, específico e pode ser retirado a qualquer momento — retirar é tão simples quanto conceder.',
        ],
      },
      {
        titulo: 'Com quem compartilhamos',
        paragrafos: [
          'Não vendemos os seus dados. Compartilhamos apenas o necessário para prestar o serviço, com: comitentes e seus representantes quanto aos lotes que você arrematou; prestadores que operam a plataforma, o envio de mensagens, a hospedagem e os meios de pagamento, sempre na condição de operadores e vinculados contratualmente a esta política; e autoridades públicas, quando houver obrigação legal ou requisição regular.',
        ],
      },
      {
        titulo: 'Por quanto tempo guardamos',
        paragrafos: [
          'Mantemos os dados enquanto a sua conta existir e, depois disso, pelo prazo necessário ao cumprimento de obrigações legais, fiscais e regulatórias e à defesa em eventuais processos. Encerrado esse período, os dados são eliminados ou anonimizados.',
        ],
      },
      {
        titulo: 'Segurança',
        paragrafos: [
          'Adotamos medidas técnicas e administrativas para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida — entre elas conexão criptografada (HTTPS), controle de acesso por perfil e registro de operações. Nenhum sistema é infalível; se ocorrer incidente de segurança relevante, comunicaremos você e a ANPD conforme a lei.',
        ],
      },
      {
        titulo: 'Seus direitos como titular (art. 18 da LGPD)',
        paragrafos: [
          'Você pode solicitar a qualquer momento: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade; portabilidade a outro fornecedor; eliminação dos dados tratados com base no seu consentimento; informação sobre com quem compartilhamos os dados; informação sobre a possibilidade de não consentir e as consequências disso; e revogação do consentimento.',
          `Para exercer qualquer desses direitos, fale conosco ${canais}. Responderemos no menor prazo possível, podendo solicitar informações que confirmem a sua identidade — é uma proteção contra pedidos feitos por terceiros em seu nome.`,
        ],
      },
      {
        titulo: 'Cookies',
        paragrafos: [
          'Usamos cookies necessários ao funcionamento do site e, mediante o seu consentimento, cookies opcionais de medição e melhoria de experiência. O detalhamento e a forma de rever a sua escolha estão no Aviso de Cookies.',
        ],
      },
      {
        titulo: 'Encarregado pelo tratamento de dados (DPO) e contato',
        paragrafos: [
          `Dúvidas sobre esta política, sobre o tratamento dos seus dados ou pedidos relacionados a eles podem ser encaminhados ${canais}. A comunicação é recebida pelo encarregado indicado por ${nome}.`,
        ],
      },
      {
        titulo: 'Atualizações',
        paragrafos: [
          'Esta política pode ser atualizada para refletir mudanças no site, nos serviços ou na legislação. A versão vigente é sempre a publicada nesta página.',
        ],
      },
    ],
  };
}

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como coletamos, usamos, compartilhamos e protegemos os seus dados pessoais, conforme a LGPD.',
};

export default async function Page() {
  const [config, { blocos }] = await Promise.all([
    getSiteConfig().catch(() => null),
    carregarPaginaCms(SLUGS),
  ]);

  return (
    <PaginaConteudo
      titulo={TITULO}
      subtitulo="Como coletamos, usamos, compartilhamos e protegemos os seus dados pessoais."
      blocos={blocos}
      fallback={modelo(config)}
    />
  );
}
