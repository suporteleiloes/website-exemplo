// Unidades de atendimento FIXAS no site ("fixo no site").
//
// Usado quando o leiloeiro atende por mais de uma praça/unidade e o config do ERP
// (que hoje comporta um único endereço/contato) ainda não representa isso. O Footer e a
// página de Contato renderizam UMA unidade por bloco quando esta lista tem itens; quando
// está vazia (caso do template-base), o site usa o contato único vindo do config do ERP.
export interface Unidade {
  cidade: string;
  uf: string;
  leiloeiro?: string; // leiloeiro oficial da praça
  registro?: string;  // matrícula na junta (ex.: "JUCEPE 315/98")
  enderecoL1: string; // logradouro, número e complemento
  enderecoL2: string; // bairro · cidade - uf · cep
  telefones: string[];
  email?: string;
}

/** Query pronta para o Google Maps a partir do endereço da unidade. */
export const mapsQueryUnidade = (u: Unidade): string =>
  encodeURIComponent(`${u.enderecoL1}, ${u.enderecoL2}`.replace(/\s·\s/g, ', '));

/** Só dígitos do telefone, com DDI 55, para href tel:. */
export const telHrefUnidade = (t: string): string => `tel:+55${t.replace(/\D/g, '')}`;

// Template-base: sem unidades fixas. Cada cliente que precisar preenche no SEU repo.
export const UNIDADES: Unidade[] = [];
