import { resolverValoresLinha } from "@/lib/formula";
import { formatarMoeda, formatarNumero, usuarioDoEmail } from "@/lib/format";
import type {
  ColunaTipo,
  FiltroOperador,
  Oportunidade,
  OportunidadeCard,
  OportunidadeCardFiltro,
  OportunidadeColuna,
} from "@/lib/types/oportunidades";

export interface CardCalculado {
  card: OportunidadeCard;
  coluna: OportunidadeColuna | null;
  formatado: string;
}

function agregar(agregacao: OportunidadeCard["agregacao"], valores: number[]): number {
  if (agregacao === "contagem") return valores.length;
  if (valores.length === 0) return 0;

  switch (agregacao) {
    case "soma":
      return valores.reduce((soma, v) => soma + v, 0);
    case "media":
      return valores.reduce((soma, v) => soma + v, 0) / valores.length;
    case "minimo":
      return Math.min(...valores);
    case "maximo":
      return Math.max(...valores);
  }
}

function formatarValorCard(
  card: OportunidadeCard,
  coluna: OportunidadeColuna,
  numero: number
): string {
  if (card.agregacao === "contagem") return formatarNumero(numero);
  return coluna.tipo === "monetario" ? formatarMoeda(numero) : formatarNumero(numero);
}

/** Rótulo de exibição de um valor bruto agrupado por uma coluna Select (mapeia id da opção → label). */
function labelDeAgrupamento(coluna: OportunidadeColuna, valorBruto: string): string {
  if (coluna.tipo === "select") {
    const opcoes = (coluna.config as { opcoes?: { id: string; label: string }[] }).opcoes ?? [];
    return opcoes.find((o) => o.id === valorBruto)?.label ?? valorBruto;
  }
  return valorBruto;
}

/** Compara ordenáveis (gt/gte/lt/lte): numérico para a maioria, lexical pra "data" (formato ISO já ordena certo como texto). */
function paraComparavel(valor: string | number, tipo: ColunaTipo): number | string {
  return tipo === "data" ? String(valor) : Number(valor);
}

/** "YYYY-MM" do mês atual + um deslocamento (0 = este mês, -1 = anterior, 1 = próximo). Calculado na hora — por isso o filtro nunca fica desatualizado. */
function mesRelativo(deslocamento: number): string {
  const data = new Date();
  data.setDate(1); // evita virar o mês errado em dias 29-31 ao somar/subtrair mês
  data.setMonth(data.getMonth() + deslocamento);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function avaliarFiltro(
  valor: string | number | null,
  operador: FiltroOperador,
  valoresFiltro: (string | number)[],
  tipo: ColunaTipo
): boolean {
  const vazio = valor === null || valor === undefined || valor === "";
  if (operador === "is_empty") return vazio;
  if (operador === "is_not_empty") return !vazio;
  if (vazio) return false; // qualquer outro operador exige um valor presente pra comparar

  switch (operador) {
    case "eq":
      return String(valor) === String(valoresFiltro[0]);
    case "neq":
      return String(valor) !== String(valoresFiltro[0]);
    case "in":
      return valoresFiltro.some((v) => String(v) === String(valor));
    case "not_in":
      return !valoresFiltro.some((v) => String(v) === String(valor));
    case "gt":
      return paraComparavel(valor, tipo) > paraComparavel(valoresFiltro[0], tipo);
    case "gte":
      return paraComparavel(valor, tipo) >= paraComparavel(valoresFiltro[0], tipo);
    case "lt":
      return paraComparavel(valor, tipo) < paraComparavel(valoresFiltro[0], tipo);
    case "lte":
      return paraComparavel(valor, tipo) <= paraComparavel(valoresFiltro[0], tipo);
    case "contains":
      return String(valor).toLowerCase().includes(String(valoresFiltro[0]).toLowerCase());
    case "not_contains":
      return !String(valor).toLowerCase().includes(String(valoresFiltro[0]).toLowerCase());
    case "mes_atual":
      return String(valor).slice(0, 7) === mesRelativo(0);
    case "mes_anterior":
      return String(valor).slice(0, 7) === mesRelativo(-1);
    case "mes_proximo":
      return String(valor).slice(0, 7) === mesRelativo(1);
    case "proximos_meses": {
      // Inclui o mês atual até "hoje + N meses" — cobre "tudo previsto pra
      // frente", não só um mês isolado.
      const n = Number(valoresFiltro[0]) || 0;
      const mesValor = String(valor).slice(0, 7);
      for (let i = 0; i <= n; i++) {
        if (mesValor === mesRelativo(i)) return true;
      }
      return false;
    }
    case "ultimos_meses": {
      const n = Number(valoresFiltro[0]) || 0;
      const mesValor = String(valor).slice(0, 7);
      for (let i = 0; i <= n; i++) {
        if (mesValor === mesRelativo(-i)) return true;
      }
      return false;
    }
  }
}

interface LinhaResolvida {
  oportunidade: Oportunidade;
  valoresLinha: Record<string, string | number | null>;
}

/** Resolve os valores de cada oportunidade e mantém só as que passam em TODOS os filtros do card (E lógico). */
function linhasQuePassamFiltros(
  colunas: OportunidadeColuna[],
  colunasPorId: Map<string, OportunidadeColuna>,
  filtrosDoCard: OportunidadeCardFiltro[],
  oportunidades: Oportunidade[]
): LinhaResolvida[] {
  const resultado: LinhaResolvida[] = [];

  for (const oportunidade of oportunidades) {
    const valoresLinha = resolverValoresLinha(colunas, oportunidade.dados);

    const passaFiltros = filtrosDoCard.every((filtro) => {
      const colunaFiltro = colunasPorId.get(filtro.coluna_id);
      if (!colunaFiltro) return true; // coluna do filtro foi excluída — ignora esse filtro
      return avaliarFiltro(valoresLinha[colunaFiltro.key], filtro.operador, filtro.valores, colunaFiltro.tipo);
    });
    if (!passaFiltros) continue;

    resultado.push({ oportunidade, valoresLinha });
  }

  return resultado;
}

function agruparFiltrosPorCard(filtros: OportunidadeCardFiltro[]): Map<string, OportunidadeCardFiltro[]> {
  const filtrosPorCard = new Map<string, OportunidadeCardFiltro[]>();
  for (const filtro of filtros) {
    const lista = filtrosPorCard.get(filtro.card_id) ?? [];
    lista.push(filtro);
    filtrosPorCard.set(filtro.card_id, lista);
  }
  return filtrosPorCard;
}

/** Calcula o valor de cada card do tipo "número" a partir das oportunidades atuais. Cards cuja coluna foi excluída são ignorados. */
export function calcularCards(
  cards: OportunidadeCard[],
  colunas: OportunidadeColuna[],
  filtros: OportunidadeCardFiltro[],
  oportunidades: Oportunidade[]
): CardCalculado[] {
  const colunasPorId = new Map(colunas.map((c) => [c.id, c]));
  const filtrosPorCard = agruparFiltrosPorCard(filtros);

  return cards
    .filter((card) => card.tipo_visualizacao === "numero")
    .map((card): CardCalculado | null => {
      const coluna = colunasPorId.get(card.coluna_id) ?? null;
      if (!coluna) return null;

      const filtrosDoCard = filtrosPorCard.get(card.id) ?? [];
      const linhas = linhasQuePassamFiltros(colunas, colunasPorId, filtrosDoCard, oportunidades);

      // "contagem" conta linhas com valor preenchido, mesmo em colunas de
      // texto/select/data; as demais agregações só fazem sentido em valores
      // numéricos (monetário/cálculo).
      const valores: (string | number)[] = [];
      for (const { valoresLinha } of linhas) {
        const valor = valoresLinha[coluna.key];
        if (valor !== null && valor !== undefined && valor !== "") valores.push(valor);
      }

      const numero =
        card.agregacao === "contagem"
          ? valores.length
          : agregar(
              card.agregacao,
              valores.filter((v): v is number => typeof v === "number")
            );

      return { card, coluna, formatado: formatarValorCard(card, coluna, numero) };
    })
    .filter((c): c is CardCalculado => c !== null);
}

export interface PontoSerieTempo {
  /** "YYYY-MM" — chave de ordenação. */
  mes: string;
  /** "Set/26" — rótulo de exibição. */
  label: string;
  valor: number;
  formatado: string;
}

const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function labelMes(mesIso: string): string {
  const [ano, mes] = mesIso.split("-");
  return `${NOMES_MES[Number(mes) - 1]}/${ano.slice(2)}`;
}

/**
 * Série mensal de um card "linha": agrupa as oportunidades (já filtradas)
 * pelo mês da coluna de data e agrega a coluna do card em cada balde. A
 * coluna de data é a escolhida no próprio card (`coluna_data_id`); se ele
 * não tiver uma específica, cai na coluna global marcada como "data de
 * referência". Meses sem nenhuma oportunidade ficam de fora (não aparecem
 * como zero).
 */
export function calcularSerieTempo(
  card: OportunidadeCard,
  colunas: OportunidadeColuna[],
  filtros: OportunidadeCardFiltro[],
  oportunidades: Oportunidade[],
  colunaReferenciaGlobal: OportunidadeColuna | null
): PontoSerieTempo[] {
  const colunasPorId = new Map(colunas.map((c) => [c.id, c]));
  const coluna = colunasPorId.get(card.coluna_id);
  if (!coluna) return [];

  const colunaData = (card.coluna_data_id ? colunasPorId.get(card.coluna_data_id) : null) ?? colunaReferenciaGlobal;
  if (!colunaData) return [];

  const filtrosDoCard = agruparFiltrosPorCard(filtros).get(card.id) ?? [];
  const linhas = linhasQuePassamFiltros(colunas, colunasPorId, filtrosDoCard, oportunidades);

  const grupos = new Map<string, (string | number)[]>();
  for (const { valoresLinha } of linhas) {
    const dataBruta = valoresLinha[colunaData.key];
    if (dataBruta === null || dataBruta === undefined || dataBruta === "") continue;

    const valor = valoresLinha[coluna.key];
    if (valor === null || valor === undefined || valor === "") continue;

    const mes = String(dataBruta).slice(0, 7);
    const lista = grupos.get(mes) ?? [];
    lista.push(valor);
    grupos.set(mes, lista);
  }

  return [...grupos.keys()].sort().map((mes) => {
    const valoresDoMes = grupos.get(mes)!;
    const numero =
      card.agregacao === "contagem"
        ? valoresDoMes.length
        : agregar(
            card.agregacao,
            valoresDoMes.filter((v): v is number => typeof v === "number")
          );

    return { mes, label: labelMes(mes), valor: numero, formatado: formatarValorCard(card, coluna, numero) };
  });
}

export interface GrupoCalculado {
  chave: string;
  label: string;
  valor: number;
  formatado: string;
}

/**
 * Grupos de um card "barras" ou "rosca": agrupa as oportunidades (já
 * filtradas) e agrega a coluna do card em cada grupo. A dimensão de
 * agrupamento é a coluna Select escolhida no card (`coluna_agrupamento_id`);
 * se ele não tiver uma, agrupa por responsável (owner_id). Ordenado do maior
 * pro menor — é um ranking.
 */
export function calcularGrupos(
  card: OportunidadeCard,
  colunas: OportunidadeColuna[],
  filtros: OportunidadeCardFiltro[],
  oportunidades: Oportunidade[],
  emailPorOwnerId: Record<string, string | undefined>,
  currentUserId: string
): GrupoCalculado[] {
  const colunasPorId = new Map(colunas.map((c) => [c.id, c]));
  const coluna = colunasPorId.get(card.coluna_id);
  if (!coluna) return [];

  const colunaAgrupamento = card.coluna_agrupamento_id ? colunasPorId.get(card.coluna_agrupamento_id) ?? null : null;

  const filtrosDoCard = agruparFiltrosPorCard(filtros).get(card.id) ?? [];
  const linhas = linhasQuePassamFiltros(colunas, colunasPorId, filtrosDoCard, oportunidades);

  const grupos = new Map<string, (string | number)[]>();
  for (const { oportunidade, valoresLinha } of linhas) {
    const valor = valoresLinha[coluna.key];
    if (valor === null || valor === undefined || valor === "") continue;

    const chave = colunaAgrupamento ? valoresLinha[colunaAgrupamento.key] : oportunidade.owner_id;
    if (chave === null || chave === undefined || chave === "") continue; // sem valor de agrupamento — não dá pra formar um grupo

    const lista = grupos.get(String(chave)) ?? [];
    lista.push(valor);
    grupos.set(String(chave), lista);
  }

  const gruposCalculados = [...grupos.entries()].map(([chave, valoresDoGrupo]): GrupoCalculado => {
    const numero =
      card.agregacao === "contagem"
        ? valoresDoGrupo.length
        : agregar(
            card.agregacao,
            valoresDoGrupo.filter((v): v is number => typeof v === "number")
          );

    const label = colunaAgrupamento
      ? labelDeAgrupamento(colunaAgrupamento, chave)
      : chave === currentUserId
        ? "Você"
        : usuarioDoEmail(emailPorOwnerId[chave]) ?? "—";

    return { chave, label, valor: numero, formatado: formatarValorCard(card, coluna, numero) };
  });

  return gruposCalculados.sort((a, b) => b.valor - a.valor);
}