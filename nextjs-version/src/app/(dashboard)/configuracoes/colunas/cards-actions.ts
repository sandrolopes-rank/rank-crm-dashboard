"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { listarColunasOportunidades } from "@/lib/oportunidades-data";
import { executarAction, type ActionResult } from "@/lib/action-result";
import {
  OPERADORES_INTERVALO_MESES,
  OPERADORES_LISTA,
  OPERADORES_POR_TIPO,
  OPERADORES_SEM_VALOR,
  TIPOS_COLUNA_NUMERICOS,
} from "@/lib/types/oportunidades";
import type {
  CardAgregacao,
  FiltroOperador,
  OportunidadeCard,
  OportunidadeCardFiltro,
  OportunidadeColuna,
  OrientacaoBarra,
  TipoVisualizacaoCard,
} from "@/lib/types/oportunidades";

export interface DadosFiltro {
  colunaId: string;
  operador: FiltroOperador;
  valores: (string | number)[];
}

export interface DadosCard {
  colunaId: string;
  agregacao: CardAgregacao;
  label: string;
  filtros: DadosFiltro[];
  tipoVisualizacao: TipoVisualizacaoCard;
  /** Só "linha": coluna de Data pro eixo do tempo. Null = usa a "data de referência" global. */
  colunaDataId: string | null;
  /** Só "barras"/"rosca": coluna Select pra agrupar. Null = agrupa por responsável. */
  colunaAgrupamentoId: string | null;
  /** Só "barras": colunas em pé (padrão) ou barras deitadas. */
  orientacaoBarra: OrientacaoBarra;
}

export interface CardComFiltros {
  card: OportunidadeCard;
  filtros: OportunidadeCardFiltro[];
}

const AGREGACOES_VALIDAS = new Set<CardAgregacao>(["soma", "media", "contagem", "minimo", "maximo"]);
const OPERADORES_COMPARACAO_NUMERICA: FiltroOperador[] = ["eq", "neq", "gt", "gte", "lt", "lte"];
const TIPOS_VISUALIZACAO_VALIDOS = new Set<TipoVisualizacaoCard>(["numero", "linha", "barras", "rosca"]);
const ORIENTACOES_BARRA_VALIDAS = new Set<OrientacaoBarra>(["vertical", "horizontal"]);

async function exigirAdmin() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    throw new Error("Apenas administradores podem gerenciar cards.");
  }

  return { supabase, user };
}

function validarDadosCard(dados: DadosCard, colunas: OportunidadeColuna[]): OportunidadeColuna {
  if (!dados.label.trim()) {
    throw new Error("O nome do card não pode ficar vazio.");
  }

  if (!AGREGACOES_VALIDAS.has(dados.agregacao)) {
    throw new Error("Tipo de agregação inválido.");
  }

  const coluna = colunas.find((c) => c.id === dados.colunaId);
  if (!coluna) {
    throw new Error("Coluna não encontrada.");
  }

  if (dados.agregacao !== "contagem" && !TIPOS_COLUNA_NUMERICOS.has(coluna.tipo)) {
    throw new Error(
      `A coluna "${coluna.label}" não é numérica — só a agregação "Contagem" está disponível para ela.`
    );
  }

  if (!TIPOS_VISUALIZACAO_VALIDOS.has(dados.tipoVisualizacao)) {
    throw new Error("Tipo de visualização inválido.");
  }

  if (dados.tipoVisualizacao === "linha") {
    if (dados.colunaDataId) {
      const colunaData = colunas.find((c) => c.id === dados.colunaDataId);
      if (!colunaData) throw new Error("Coluna de data não encontrada.");
      if (colunaData.tipo !== "data") {
        throw new Error(`A coluna "${colunaData.label}" não é do tipo Data.`);
      }
    } else if (!colunas.some((c) => c.eh_data_referencia)) {
      throw new Error(
        'Escolha uma coluna de data pra esse gráfico, ou marque uma como "data de referência" no Gerador de Colunas.'
      );
    }
  }

  if ((dados.tipoVisualizacao === "barras" || dados.tipoVisualizacao === "rosca") && dados.colunaAgrupamentoId) {
    const colunaAgrupamento = colunas.find((c) => c.id === dados.colunaAgrupamentoId);
    if (!colunaAgrupamento) throw new Error("Coluna de agrupamento não encontrada.");
    if (colunaAgrupamento.tipo !== "select") {
      throw new Error(`A coluna "${colunaAgrupamento.label}" não é do tipo Select — só dá pra agrupar por Select ou por Responsável.`);
    }
  }

  if (!ORIENTACOES_BARRA_VALIDAS.has(dados.orientacaoBarra)) {
    throw new Error("Orientação de barra inválida.");
  }

  return coluna;
}

function validarFiltro(filtro: DadosFiltro, colunas: OportunidadeColuna[]) {
  const coluna = colunas.find((c) => c.id === filtro.colunaId);
  if (!coluna) {
    throw new Error("A coluna de um dos filtros não foi encontrada.");
  }

  if (!OPERADORES_POR_TIPO[coluna.tipo].includes(filtro.operador)) {
    throw new Error(`O operador escolhido não é válido para a coluna "${coluna.label}".`);
  }

  if (OPERADORES_SEM_VALOR.has(filtro.operador)) return;

  if (OPERADORES_LISTA.has(filtro.operador)) {
    if (filtro.valores.length === 0) {
      throw new Error(`Escolha ao menos um valor para o filtro em "${coluna.label}".`);
    }
  } else if (filtro.valores.length !== 1 || filtro.valores[0] === "" || filtro.valores[0] == null) {
    throw new Error(`Informe um valor para o filtro em "${coluna.label}".`);
  }

  if (coluna.tipo === "select") {
    const opcoesValidas = new Set(
      ((coluna.config as { opcoes?: { id: string }[] }).opcoes ?? []).map((o) => o.id)
    );
    for (const valor of filtro.valores) {
      if (!opcoesValidas.has(String(valor))) {
        throw new Error(`O filtro em "${coluna.label}" tem uma opção que não existe mais.`);
      }
    }
  }

  if (TIPOS_COLUNA_NUMERICOS.has(coluna.tipo) && OPERADORES_COMPARACAO_NUMERICA.includes(filtro.operador)) {
    if (Number.isNaN(Number(filtro.valores[0]))) {
      throw new Error(`O valor do filtro em "${coluna.label}" precisa ser numérico.`);
    }
  }

  if (OPERADORES_INTERVALO_MESES.has(filtro.operador)) {
    const n = Number(filtro.valores[0]);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error(`Informe um número inteiro de meses (1 ou mais) para o filtro em "${coluna.label}".`);
    }
  }
}

async function substituirFiltros(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  cardId: string,
  filtros: DadosFiltro[]
): Promise<OportunidadeCardFiltro[]> {
  const { error: erroExclusao } = await supabase
    .from("oportunidade_card_filtros")
    .delete()
    .eq("card_id", cardId);
  if (erroExclusao) throw new Error(erroExclusao.message);

  if (filtros.length === 0) return [];

  const { data, error } = await supabase
    .from("oportunidade_card_filtros")
    .insert(
      filtros.map((f) => ({
        card_id: cardId,
        coluna_id: f.colunaId,
        operador: f.operador,
        valores: f.valores,
      }))
    )
    .select();

  if (error) throw new Error(error.message);
  return (data ?? []) as OportunidadeCardFiltro[];
}

export async function criarCard(dados: DadosCard): Promise<ActionResult<CardComFiltros>> {
  return executarAction(async () => {
    const { supabase, user } = await exigirAdmin();
    const colunas = await listarColunasOportunidades();
    validarDadosCard(dados, colunas);
    for (const filtro of dados.filtros) validarFiltro(filtro, colunas);

    const { data: ultimaOrdem } = await supabase
      .from("oportunidade_cards")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const proximaOrdem = (ultimaOrdem?.ordem ?? -1) + 1;

    const { data: criado, error } = await supabase
      .from("oportunidade_cards")
      .insert({
        coluna_id: dados.colunaId,
        agregacao: dados.agregacao,
        label: dados.label.trim(),
        ordem: proximaOrdem,
        tipo_visualizacao: dados.tipoVisualizacao,
        coluna_data_id: dados.tipoVisualizacao === "linha" ? dados.colunaDataId : null,
        coluna_agrupamento_id:
          dados.tipoVisualizacao === "barras" || dados.tipoVisualizacao === "rosca"
            ? dados.colunaAgrupamentoId
            : null,
        orientacao_barra: dados.orientacaoBarra,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const filtros = await substituirFiltros(supabase, criado.id, dados.filtros);

    revalidatePath("/configuracoes/colunas");
    revalidatePath("/dashboard");
    return { card: criado as OportunidadeCard, filtros };
  });
}

export async function atualizarCard(id: string, dados: DadosCard): Promise<ActionResult<CardComFiltros>> {
  return executarAction(async () => {
    const { supabase } = await exigirAdmin();
    const colunas = await listarColunasOportunidades();
    validarDadosCard(dados, colunas);
    for (const filtro of dados.filtros) validarFiltro(filtro, colunas);

    const { data: atualizado, error } = await supabase
      .from("oportunidade_cards")
      .update({
        coluna_id: dados.colunaId,
        agregacao: dados.agregacao,
        label: dados.label.trim(),
        tipo_visualizacao: dados.tipoVisualizacao,
        coluna_data_id: dados.tipoVisualizacao === "linha" ? dados.colunaDataId : null,
        coluna_agrupamento_id:
          dados.tipoVisualizacao === "barras" || dados.tipoVisualizacao === "rosca"
            ? dados.colunaAgrupamentoId
            : null,
        orientacao_barra: dados.orientacaoBarra,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!atualizado) throw new Error("Card não encontrado.");

    const filtros = await substituirFiltros(supabase, id, dados.filtros);

    revalidatePath("/configuracoes/colunas");
    revalidatePath("/dashboard");
    return { card: atualizado as OportunidadeCard, filtros };
  });
}

export async function excluirCard(id: string): Promise<ActionResult> {
  return executarAction(async () => {
    const { supabase } = await exigirAdmin();

    // Os filtros são excluídos em cascata pelo banco (on delete cascade).
    const { error } = await supabase.from("oportunidade_cards").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/configuracoes/colunas");
    revalidatePath("/dashboard");
  });
}

export async function reordenarCards(idsNaNovaOrdem: string[]): Promise<ActionResult> {
  return executarAction(async () => {
    const { supabase } = await exigirAdmin();

    const resultados = await Promise.all(
      idsNaNovaOrdem.map((id, index) =>
        supabase.from("oportunidade_cards").update({ ordem: index }).eq("id", id)
      )
    );

    const comErro = resultados.find((r) => r.error);
    if (comErro?.error) throw new Error(comErro.error.message);

    revalidatePath("/configuracoes/colunas");
    revalidatePath("/dashboard");
  });
}