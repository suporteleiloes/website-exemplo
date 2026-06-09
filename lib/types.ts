// Tipos derivados das respostas REAIS da API Website V2 (verificados em 2026-06-09,
// tenant lancevip/localhost). Campos opcionais quando podem vir null/ausentes.

export interface Imagem {
  full: string | null;
  thumb: string | null;
  min: string | null;
}

export interface Foto {
  id: number;
  url: string;
  thumb: string | null;
  min: string | null;
  nome: string | null;
}

export interface Ref {
  id: number;
  nome: string;
}

export interface Leiloeiro {
  id: number;
  nome: string | null;
  matricula: string | null;
  matriculas?: { label: string; numero: string }[];
  foto: string | null;
}

export interface Comitente {
  id: number;
  nome: string | null;
  apelido: string | null;
  image: Imagem | string | null;
  descricao?: string | null;
}

export interface Localizacao {
  uf: string | null;
  cidade: string | null;
  bairro: string | null;
  cep: string | null;
  endereco?: string | null;
  numero?: string | null;
  mapEmbed?: string | null;
}

export interface Veiculo {
  marca: Ref | null;
  modelo: Ref | null;
  cor: Ref | null;
  combustivel: Ref | null;
  anoFabricacao: string | null;
  anoModelo: string | null;
  km: number | null;
  placa: string | null;   // mascarada no PUBLIC
  chassi: string | null;  // mascarado no PUBLIC
  ufPlaca: string | null;
  liga: boolean | null;
  possuiChave: boolean | null;
  acessorios: string[];
  sinistro: string | null;
}

export interface Imovel {
  areaTerreno: number | null;
  areaEdificada: number | null;
  ocupado: number | boolean | null;
  finalidade: Ref | null;
}

export interface Bem {
  id: number;
  identificador: string | null;
  tipo: Ref | string | null;
  tipoPai: Ref | string | null;
  isImovel: boolean;
  isVeiculo: boolean;
  siteTitulo: string | null;
  siteSubtitulo: string | null;
  siteDescricao: string | null;
  siteObservacao: string | null;
  image: Imagem | null;
  fotos: Foto[];
  videos: string[];
  tour360: string | null;
  areaTerreno: number | null;
  areaEdificada: number | null;
  localizacao: Localizacao | null;
  veiculo: Veiculo | null;
  imovel?: Imovel | null;
  comitente: Comitente | null;
}

export interface LeilaoMin {
  id: number;
  slug: string;
  titulo: string | null;
  status: number;
  statusLabel?: string;
}

export interface Leilao {
  id: number;
  codigo: string | null;
  numero: number | null;
  ano: number | null;
  slug: string;
  titulo: string | null;
  descricao: string | null;
  observacao: string | null;
  status: number;
  statusLabel: string;
  instancia: number | null;
  praca: number | null;
  judicial: boolean;
  vendaDireta: boolean;
  tipo: number | null;
  tipoLabel: string | null;
  dataProximoLeilao: string | null;
  data1: string | null;
  data2: string | null;
  data3: string | null;
  dataAbertura1: string | null;
  dataAbertura2: string | null;
  dataAbertura3: string | null;
  dataPublicacao: string | null;
  image: Imagem | null;
  totalLotes: number | null;
  local: string | null;
  infoVisitacao: string | null;
  infoPagamento: string | null;
  infoRetirada: string | null;
  habilitacao: number | null;
  permitirParcelamento: boolean | null;
  parcelamentoQtdParcelas: number | null;
  parcelamentoMinimoEntrada: number | null;
  leiloeiro: Leiloeiro | null;
  comitentes?: Comitente[];
  _urls: { edital: string | null; auditorio: string | null };
}

export interface Lote {
  id: number;
  numero: number | null;
  numeroString: string | null;
  slug: string;
  status: number;
  statusLabel: string;
  descricao: string | null;
  observacao: string | null;
  destaque: boolean;
  sobra: boolean;
  sucata: boolean;
  permitirPropostas: boolean;
  textoTaxas: string | null;
  valorInicial: number | null;
  valorInicial2: number | null;
  valorInicial3: number | null;
  valorAvaliacao: number | null;
  valorMercado: number | null;
  valorIncremento: number | null;
  valorLanceAtual: number | null;
  totalLances: number | null;
  permitirParcelamento: boolean | null;
  videos: string[];
  leilao: Leilao | LeilaoMin;
  bem: Bem | null;
}

export interface LancePublico {
  apelido: string | null;
  valor: number;
  data: string;
  tipo?: string | null;
}

export interface FacetItem {
  id?: number | string;
  value?: number | string;
  nome?: string;
  label?: string;
  total?: number;
}

export interface Filtros {
  categorias: FacetItem[];
  subcategorias: FacetItem[];
  ufs: FacetItem[];
  cidades: FacetItem[];
  bairros: FacetItem[];
  comitentes: FacetItem[];
}

export interface SiteConfig {
  siteName: string | null;
  siteUrl: string | null;
  logo: { horizontal: string | null; square: string | null; icon: string | null };
  cores: { primaria: string; secundaria: string; destaque: string };
  contato: {
    telefone: string | null;
    whatsapp: string | null;
    whatsappList: { label: string | null; numero: string }[];
    email: string | null;
    horario: string | null;
  };
  endereco: Record<string, string | null>;
  redesSociais: Record<string, string | null>;
  analytics: Record<string, string | null>;
  features: { permitirPropostas: boolean; permitirFavoritos: boolean; permitirCadastro: boolean; permitirChat: boolean };
  realtime?: { url: string | null; clientId: string | null };
}

export interface Banner {
  id: number;
  titulo: string | null;
  secao: string | null;
  tipo: number | null;
  url: string | null;
  image: Imagem | string | null;
  ordem: number | null;
}

export interface MenuGrupo {
  slug: string;
  itens: { id: number; titulo: string | null; url: string | null; ordem: number | null }[];
}

export interface Paginated<T> {
  result: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SessionUser {
  id: number;
  username?: string;
  name?: string;
  loginHash?: string;
  roles?: string[];
  papeis?: Record<string, unknown>;
}

export interface ApiError {
  error: true;
  status: number;
  message: string;
  code?: string;
  extra?: Record<string, unknown>;
}
