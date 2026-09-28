export type ColunaTipo = "texto" | "monetario" | "calculo" | "select" | "data";

export interface OpcaoSelect {
  id: string;
  label: string;
}

export interface ColunaConfigSelect {
  opcoes: OpcaoSelect[];
}

export interface ColunaConfigCalculo {
  /** Referencia outras colunas pela própria `key`, entre chaves — ex.: "{valor_atual} * {probabilidade}". */
  formula: string;
  regra?: RuleThreshold;
}

export type RuleMode = "threshold" | "sign";

export interface RuleThreshold {
  /** Modo de avaliação: "threshold" usa limites absolutos, "sign" usa o sinal do valor (>0 verde, <0 vermelho, 0 amarelo). Padrão: "threshold". */
  mode?: RuleMode;
  /** Valor mínimo para considerar "bom" (verde). Ignorado quando mode === "sign". */
  goodAbove?: number;
  /** Valor máximo para considerar "ruim" (vermelho). Abaixo disso é vermelho. Ignorado quando mode === "sign". */
  badBelow?: number;
}

export type ColunaConfigTexto = Record<string, never>;
export interface ColunaConfigMonetario {
  regra?: RuleThreshold;
}
export type ColunaConfigData = Record<string, never>;

export type ColunaConfig =
  | ColunaConfigTexto
  | ColunaConfigMonetario
  | ColunaConfigData
  | ColunaConfigSelect
  | ColunaConfigCalculo;

export interface OportunidadeColuna {
  id: string;
  key: string;
  label: string;
  tipo: ColunaTipo;
  ordem: number;
  config: ColunaConfig;
  obrigatorio: boolean;
  /** Marca a coluna (tipo "data") que representa a data de negócio da oportunidade — usada pelo dashboard como eixo do tempo. Só uma por vez. */
  eh_data_referencia: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CardAgregacao = "soma" | "media" | "contagem" | "minimo" | "maximo";

/** Tipos de coluna em que faz sentido somar/tirar média/mín/máx (valor numérico). */
export const TIPOS_COLUNA_NUMERICOS = new Set<ColunaTipo>(["monetario", "calculo"]);

export type TipoVisualizacaoCard = "numero" | "linha" | "barras" | "rosca";

/** Só "barras": colunas em pé (padrão) ou barras deitadas. */
export type OrientacaoBarra = "vertical" | "horizontal";

export interface OportunidadeCard {
  id: string;
  coluna_id: string;
  agregacao: CardAgregacao;
  label: string;
  ordem: number;
  tipo_visualizacao: TipoVisualizacaoCard;
  /** Só "linha": qual coluna de Data usar no eixo do tempo. Null = usa a coluna marcada como "data de referência". */
  coluna_data_id: string | null;
  /** Só "barras"/"rosca": qual coluna Select usar pra agrupar. Null = agrupa por responsável. */
  coluna_agrupamento_id: string | null;
  orientacao_barra: OrientacaoBarra;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type FiltroOperador =
  | "eq"
  | "neq"
  | "in"
  | "not_in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "mes_atual"
  | "mes_anterior"
  | "mes_proximo"
  | "proximos_meses"
  | "ultimos_meses";

/** Operadores válidos por tipo de coluna, na ordem em que devem aparecer na UI. */
export const OPERADORES_POR_TIPO: Record<ColunaTipo, FiltroOperador[]> = {
  select: ["in", "not_in", "is_empty", "is_not_empty"],
  texto: ["eq", "neq", "contains", "not_contains", "is_empty", "is_not_empty"],
  monetario: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  calculo: ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"],
  data: [
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "mes_atual",
    "mes_anterior",
    "mes_proximo",
    "proximos_meses",
    "ultimos_meses",
    "is_empty",
    "is_not_empty",
  ],
};

/** Operadores cujo valor é um número de meses (intervalo a partir de hoje), não um valor de comparação direta. */
export const OPERADORES_INTERVALO_MESES = new Set<FiltroOperador>(["proximos_meses", "ultimos_meses"]);

/** Operadores cujo valor é uma lista (0+ valores) em vez de um único valor. */
export const OPERADORES_LISTA = new Set<FiltroOperador>(["in", "not_in"]);

/** Operadores que não usam nenhum valor — inclui os de mês relativo, que já sabem qual mês é sem precisar de input. */
export const OPERADORES_SEM_VALOR = new Set<FiltroOperador>([
  "is_empty",
  "is_not_empty",
  "mes_atual",
  "mes_anterior",
  "mes_proximo",
]);

export interface OportunidadeCardFiltro {
  id: string;
  card_id: string;
  coluna_id: string;
  operador: FiltroOperador;
  /** Ids de opção (Select), ou o valor bruto como string/número (demais tipos). Vazio para is_empty/is_not_empty. */
  valores: (string | number)[];
  created_at: string;
}

/** Valores de uma oportunidade, chaveados pela `key` de cada OportunidadeColuna. */
export type OportunidadeDados = Record<string, string | number | null>;

export interface Oportunidade {
  id: string;
  owner_id: string;
  dados: OportunidadeDados;
  /** Quem de fato criou a linha — hoje sempre igual a owner_id na prática, guardado separado para auditoria. */
  created_by: string | null;
  created_at: string;
  updated_at: string;
}