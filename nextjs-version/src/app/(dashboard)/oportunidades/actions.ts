"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { listarColunasOportunidades } from "@/lib/oportunidades-data";
import { executarAction, type ActionResult } from "@/lib/action-result";
import type { Oportunidade, OportunidadeDados } from "@/lib/types/oportunidades";

async function exigirUsuario() {
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

  return { supabase, user, isAdmin: perfil?.role === "admin" };
}

/**
 * Resolve de quem será a oportunidade. Só admin pode atribuir a outra
 * pessoa (atuando em nome de terceiros ou subindo uma base já existente);
 * pra qualquer outro papel o dono é sempre o próprio usuário, mesmo que a
 * requisição tente mandar outro id. A RLS no banco também barra isso, mas
 * checar aqui dá uma mensagem de erro decente em vez de um erro cru do
 * Postgres.
 */
function resolverOwnerId(
  ownerIdSolicitado: string | undefined,
  userId: string,
  isAdmin: boolean
): string {
  if (!ownerIdSolicitado || ownerIdSolicitado === userId) return userId;

  if (!isAdmin) {
    throw new Error("Apenas administradores podem cadastrar em nome de outra pessoa.");
  }

  return ownerIdSolicitado;
}

function validarDados(dados: OportunidadeDados, colunas: Awaited<ReturnType<typeof listarColunasOportunidades>>) {
  for (const coluna of colunas) {
    if (coluna.tipo === "calculo") continue; // calculado, nunca vem do formulário
    if (!coluna.obrigatorio) continue;

    const valor = dados[coluna.key];
    const vazio = valor === null || valor === undefined || valor === "";
    if (vazio) {
      throw new Error(`O campo "${coluna.label}" é obrigatório.`);
    }
  }
}

/** Remove chaves que não correspondem a nenhuma coluna atual e valores de colunas "calculo" (nunca persistidos). */
function sanearDados(
  dados: OportunidadeDados,
  colunas: Awaited<ReturnType<typeof listarColunasOportunidades>>
): OportunidadeDados {
  const porKey = new Map(colunas.map((c) => [c.key, c]));
  const saneado: OportunidadeDados = {};
  for (const [key, valor] of Object.entries(dados)) {
    const coluna = porKey.get(key);
    if (!coluna || coluna.tipo === "calculo") continue;
    saneado[key] = valor;
  }
  return saneado;
}

export async function criarOportunidade(
  dados: OportunidadeDados,
  ownerId?: string
): Promise<ActionResult<Oportunidade>> {
  return executarAction(async () => {
    const { supabase, user, isAdmin } = await exigirUsuario();

    const colunas = await listarColunasOportunidades();
    const saneado = sanearDados(dados, colunas);
    validarDados(saneado, colunas);

    const owner = resolverOwnerId(ownerId, user.id, isAdmin);

    const { data: criada, error } = await supabase
      .from("oportunidades")
      // created_by fica com quem realmente criou (auditoria), owner_id com
      // quem é o responsável — os dois só divergem quando um admin cadastra
      // em nome de outra pessoa.
      .insert({ owner_id: owner, created_by: user.id, dados: saneado })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard");
    return criada as Oportunidade;
  });
}

export async function atualizarOportunidade(
  id: string,
  dados: OportunidadeDados,
  ownerId?: string
): Promise<ActionResult<Oportunidade>> {
  return executarAction(async () => {
    const { supabase, user, isAdmin } = await exigirUsuario();

    const colunas = await listarColunasOportunidades();
    const saneado = sanearDados(dados, colunas);
    validarDados(saneado, colunas);

    const atualizacao: { dados: OportunidadeDados; owner_id?: string } = { dados: saneado };
    if (ownerId) {
      atualizacao.owner_id = resolverOwnerId(ownerId, user.id, isAdmin);
    }

    const { data: atualizada, error } = await supabase
      .from("oportunidades")
      .update(atualizacao)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!atualizada) throw new Error("Oportunidade não encontrada (ou sem permissão para editar).");

    revalidatePath("/dashboard");
    return atualizada as Oportunidade;
  });
}

export async function excluirOportunidade(id: string): Promise<ActionResult> {
  return executarAction(async () => {
    const { supabase } = await exigirUsuario();

    const { error } = await supabase.from("oportunidades").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard");
  });
}