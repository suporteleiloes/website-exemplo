// Conteúdo-base (genérico) dos Termos de Uso e da Política de Privacidade.
//
// As páginas /termos e /privacidade renderizam o HTML vindo do ERP
// (config.paginas.termos / config.paginas.privacidade) quando o leiloeiro preenche.
// Enquanto não houver conteúdo próprio, exibimos estes textos-base — eles NUNCA
// devem deixar a página 404 (são links legais obrigatórios do rodapé).
//
// ⚠️ Texto GENÉRICO, pensado para leilão público/extrajudicial. Deve ser revisado
// juridicamente pelo leiloeiro e, idealmente, substituído pelo conteúdo oficial no ERP.

export const TERMOS_PADRAO = `
<p><em>Última atualização: conforme publicação neste site. Este é um texto-base e pode ser
complementado pelas condições específicas de cada edital.</em></p>

<h2>1. Aceitação</h2>
<p>Ao navegar, cadastrar-se ou participar de leilões neste site, o usuário declara ter lido e
aceito integralmente estes Termos de Uso, bem como as regras do edital de cada leilão. Caso não
concorde, não utilize os serviços.</p>

<h2>2. Cadastro e habilitação</h2>
<p>A participação exige cadastro prévio com informações verdadeiras, completas e atualizadas, e o
envio da documentação solicitada. O leiloeiro poderá aprovar, recusar ou solicitar complementação
do cadastro. A habilitação em um leilão específico está sujeita à aceitação do respectivo edital e à
aprovação do leiloeiro.</p>

<h2>3. Responsabilidade do usuário</h2>
<p>O usuário é o único responsável pela guarda do seu login e senha e por todos os atos praticados
com sua conta. Os lances são irrevogáveis e irretratáveis, representando proposta firme de compra
nas condições do edital.</p>

<h2>4. Lances e arrematação</h2>
<p>Os lances seguem as regras, prazos e incrementos definidos no edital de cada leilão. Encerrado o
lote, o maior lance válido é declarado vencedor. O arrematante obriga-se ao pagamento do valor do
lance acrescido da comissão do leiloeiro e demais encargos previstos no edital, nos prazos ali
estabelecidos.</p>

<h2>5. Pagamento, nota de arrematação e retirada</h2>
<p>Após o arremate, o arrematante recebe a nota de arrematação e deve efetuar o pagamento dentro do
prazo do edital. A retirada do bem ocorre após a confirmação do pagamento, no local e nas condições
indicadas, mediante agendamento quando aplicável. O inadimplemento sujeita o arrematante às
penalidades do edital e da legislação aplicável.</p>

<h2>6. Bens e informações</h2>
<p>Os bens são vendidos no estado em que se encontram, cabendo ao interessado examiná-los
previamente. As descrições, fotos e avaliações são meramente informativas e não substituem a
vistoria. O leiloeiro não se responsabiliza por vícios ou informações prestadas pelos comitentes.</p>

<h2>7. Propriedade intelectual</h2>
<p>Marcas, logotipos, textos, imagens e o layout deste site são protegidos e não podem ser
reproduzidos sem autorização.</p>

<h2>8. Alterações</h2>
<p>Estes Termos podem ser atualizados a qualquer tempo. A versão vigente é sempre a publicada neste
site. O uso continuado após alterações implica concordância.</p>

<h2>9. Foro e contato</h2>
<p>Em caso de dúvidas, utilize os canais de atendimento informados no site. Fica eleito o foro da
comarca indicada no edital para dirimir questões decorrentes destes Termos.</p>
`;

export const PRIVACIDADE_PADRAO = `
<p><em>Última atualização: conforme publicação neste site. Texto-base elaborado em conformidade com a
Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</em></p>

<h2>1. Quem trata seus dados</h2>
<p>Os dados pessoais coletados neste site são tratados pelo leiloeiro responsável, na condição de
controlador, para viabilizar o cadastro, a habilitação e a participação em leilões.</p>

<h2>2. Dados que coletamos</h2>
<p>Coletamos os dados que você fornece no cadastro e na habilitação (como nome, CPF/CNPJ, e-mail,
telefone, endereço e documentos), além de dados de navegação e de uso do site (como registros de
acesso e cookies).</p>

<h2>3. Para que usamos</h2>
<p>Utilizamos seus dados para: criar e gerenciar sua conta; analisar e aprovar cadastros e
habilitações; processar lances, arremates, pagamentos e emissão de documentos; cumprir obrigações
legais e regulatórias; prevenir fraudes; e comunicar informações sobre leilões e sua conta.</p>

<h2>4. Compartilhamento</h2>
<p>Seus dados podem ser compartilhados com comitentes, órgãos públicos e autoridades quando exigido
por lei ou pelo edital, e com prestadores de serviço que atuam em nome do leiloeiro (como meios de
pagamento e infraestrutura de TI), sempre no limite necessário.</p>

<h2>5. Cookies</h2>
<p>Utilizamos cookies para o funcionamento do site, segurança e melhoria da experiência. Você pode
gerenciar os cookies nas configurações do seu navegador.</p>

<h2>6. Segurança e retenção</h2>
<p>Adotamos medidas técnicas e administrativas para proteger seus dados. Eles são mantidos pelo
tempo necessário às finalidades acima e ao cumprimento de obrigações legais.</p>

<h2>7. Seus direitos</h2>
<p>Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção,
anonimização, portabilidade, eliminação e informações sobre compartilhamento, entre outros direitos.
Para exercê-los, utilize o canal de LGPD/atendimento informado no site.</p>

<h2>8. Alterações</h2>
<p>Esta Política pode ser atualizada periodicamente. A versão vigente é sempre a publicada neste
site.</p>
`;
