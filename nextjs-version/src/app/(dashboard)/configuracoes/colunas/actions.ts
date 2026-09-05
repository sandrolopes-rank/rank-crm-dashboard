"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { slugify } from "@/lib/slug";
import { extrairReferencias, validarFormula } from "@/lib/formula";
import {
  listarCardsOportunidades,
  listarColunasOportunidades,
  listarFiltrosDeCards,
} from "@/lib/oportunidades-data";
import { executarAction, type ActionResult } from "@/lib/action-result";
import type {
  ColunaConfig,
  ColunaTipo,
  OpcaoSelect,
  OportunidadeColuna,
} from "@/lib/types/oportunidades";

export interface DadosColuna {
  label: string;
  tipo: ColunaTipo;
  obrigatorio: boolean;
  config: ColunaConfig;
  ehDataReferencia: boolean;
}

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
    throw new Error("Apenas administradores podem gerenciar colunas.");
  }

  return { supabase, user };
}

function validarDadosPorTipo(
  dados: DadosColuna,
  key: string,
  outrasColunas: OportunidadeColuna[]
) {
  if (!dados.label.trim()) {
    throw new Error("O nome da coluna não pode ficar vazio.");
  }

  if (dados.tipo === "select") {
    const opcoes = (dados.config as { opcoes?: OpcaoSelect[] }).opcoes ?? [];
    if (opcoes.length === 0) {
      throw new Error("Adicione ao menos uma opção para o campo Select.");
    }
    if (opcoes.some((o) => !o.label.trim())) {
      throw new Error("Nenhuma opção do Select pode ficar com o nome vazio.");
    }
    const labels = opcoes.map((o) => o.label.trim().toLowerCase());
    if (new Set(labels).size !== labels.length) {
      throw new Error("Não pode haver opções repetidas no Select.");
    }
  }

  if (dados.tipo === "calculo") {
    const formula = (dados.config as { formula?: string }).formula ?? "";
    const validacao = validarFormula(formula, key, outrasColunas);
    if (!validacao.valida) {
      throw new Error(validacao.erro);
    }
  }
}

export async function criarColuna(dados: DadosColuna): Promise<ActionResult<OportunidadeColuna>> {
  return executarAction(async () => {
    const { supabase, user } = await exigirAdmin();

    const key = slugify(dados.label);
    if (!key) {
      throw new Error("Não foi possível gerar uma chave a partir desse nome. Use letras ou números.");
    }

    const outrasColunas = await listarColunasOportunidades();
    validarDadosPorTipo(dados, key, outrasColunas);

    const ehDataReferencia = dados.tipo === "data" && dados.ehDataReferencia;

    const { data: ultimaOrdem } = await supabase
      .from("oportunidade_colunas")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();

    const proximaOrdem = (ultimaOrdem?.ordem ?? -1) + 1;

    if (ehDataReferencia) {
      // Libera a flag em qualquer outra coluna antes de criar esta com ela
      // ativa — evita colidir com o índice único parcial no banco.
      await supabase
        .from("oportunidade_colunas")
        .update({ eh_data_referencia: false })
        .eq("eh_data_referencia", true);
    }

    const { data: criada, error } = await supabase
      .from("oportunidade_colunas")
      .insert({
        key,
        label: dados.label.trim(),
        tipo: dados.tipo,
        obrigatorio: dados.tipo === "calculo" ? false : dados.obrigatorio,
        config: dados.config,
        eh_data_referencia: ehDataReferencia,
        created_by: user.id,
        ordem: proximaOrdem,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe uma coluna com um nome muito parecido. Escolha outro nome.");
      }
      throw new Error(error.message);
    }

    revalidatePath("/configuracoes/colunas");
    return criada as OportunidadeColuna;
  });
}

export async function atualizarColuna(
  id: string,
  dados: DadosColuna
): Promise<ActionResult<OportunidadeColuna>> {
  return executarAction(async () => {
    const { supabase } = await exigirAdmin();

    const { data: atual } = await supabase
      .from("oportunidade_colunas")
      .select("key, tipo")
      .eq("id", id)
      .single();

    if (!atual) throw new Error("Coluna não encontrada.");

    const outrasColunas = (await listarColunasOportunidades()).filter((c) => c.id !== id);
    validarDadosPorTipo(dados, atual.key, outrasColunas);

    const ehDataReferencia = dados.tipo === "data" && dados.ehDataReferencia;

    if (ehDataReferencia) {
      await supabase
        .from("oportunidade_colunas")
        .update({ eh_data_referencia: false })
        .eq("eh_data_referencia", true)
        .neq("id", id);
    }

    const { data: atualizada, error } = await supabase
      .from("oportunidade_colunas")
      .update({
        label: dados.label.trim(),
        obrigatorio: dados.tipo === "calculo" ? false : dados.obrigatorio,
        config: dados.config,
        eh_data_referencia: ehDataReferencia,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/configuracoes/colunas");
    return atualizada as OportunidadeColuna;
  });
}

export async function excluirColuna(id: string): Promise<ActionResult> {
  return executarAction(async () => {
    const { supabase } = await exigirAdmin();

    const { data: atual } = await supabase
      .from("oportunidade_colunas")
      .select("key, label")
      .eq("id", id)
      .single();

    if (!atual) throw new Error("Coluna não encontrada.");

    const todas = await listarColunasOportunidades();
    const dependentes = todas.filter((c) => {
      if (c.id === id || c.tipo !== "calculo") return false;
      const formula = (c.config as { formula?: string }).formula ?? "";
      return extrairReferencias(formula).includes(atual.key);
    });

    if (dependentes.length > 0) {
      const nomes = dependentes.map((d) => `"${d.label}"`).join(", ");
      throw new Error(
        `Não é possível excluir "${atual.label}": a fórmula de ${nomes} depende dela. Edite ou exclua essas colunas primeiro.`
      );
    }

    const cards = await listarCardsOportunidades();
    const cardsDependentes = cards.filter((c) => c.coluna_id === id);
    if (cardsDependentes.length > 0) {
      const nomes = cardsDependentes.map((c) => `"${c.label}"`).join(", ");
      throw new Error(
        `Não é possível excluir "${atual.label}": o card ${nomes} depende dela. Edite ou exclua esse card primeiro.`
      );
    }

    const cardsComEixoDependente = cards.filter(
      (c) => c.coluna_data_id === id || c.coluna_agrupamento_id === id
    );
    if (cardsComEixoDependente.length > 0) {
      const nomes = cardsComEixoDependente.map((c) => `"${c.label}"`).join(", ");
      throw new Error(
        `Não é possível excluir "${atual.label}": o gráfico ${nomes} usa ela como eixo (data ou agrupamento). Edite ou exclua esse gráfico primeiro.`
      );
    }

    const filtros = await listarFiltrosDeCards();
    const cardsPorId = new Map(cards.map((c) => [c.id, c]));
    const cardsComFiltroDependente = new Set(
      filtros.filter((f) => f.coluna_id === id).map((f) => cardsPorId.get(f.card_id)?.label ?? null)
    );
    if (cardsComFiltroDependente.size > 0) {
      const nomes = [...cardsComFiltroDependente].filter(Boolean).map((label) => `"${label}"`);
      throw new Error(
        `Não é possível excluir "${atual.label}": um filtro do card ${nomes.join(", ")} depende dela. Edite ou exclua esse filtro primeiro.`
      );
    }

    const { error } = await supabase.from("oportunidade_colunas").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/configuracoes/colunas");
  });
}

export async function reordenarColunas(idsNaNovaOrdem: string[]): Promise<ActionResult> {
  return executarAction(async () => {
    const { supabase } = await exigirAdmin();

    const resultados = await Promise.all(
      idsNaNovaOrdem.map((id, index) =>
        supabase.from("oportunidade_colunas").update({ ordem: index }).eq("id", id)
      )
    );

    const comErro = resultados.find((r) => r.error);
    if (comErro?.error) throw new Error(comErro.error.message);

    revalidatePath("/configuracoes/colunas");
  });
}