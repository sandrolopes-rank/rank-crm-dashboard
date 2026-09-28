import { createServerSupabase } from "@/lib/supabase-server";
import type { OportunidadeCard, OportunidadeCardFiltro, OportunidadeColuna } from "@/lib/types/oportunidades";

export async function listarColunasOportunidades(): Promise<OportunidadeColuna[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("oportunidade_colunas")
    .select("*")
    .order("ordem", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarCardsOportunidades(): Promise<OportunidadeCard[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("oportunidade_cards")
    .select("*")
    .order("ordem", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarFiltrosDeCards(): Promise<OportunidadeCardFiltro[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("oportunidade_card_filtros")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}