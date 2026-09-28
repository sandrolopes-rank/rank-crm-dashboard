import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase-server"
import { listarColunasOportunidades, listarCardsOportunidades, listarFiltrosDeCards } from "@/lib/oportunidades-data"
import type { OportunidadeCardFiltro } from "@/lib/types/oportunidades"
import { ConfiguracoesClient } from "./components/configuracoes-client"

export default async function ConfiguracoesPage() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", user.id)
    .single()

  if (perfil?.role !== "admin") {
    redirect("/dashboard")
  }

  const [colunas, cards, filtros] = await Promise.all([
    listarColunasOportunidades(),
    listarCardsOportunidades(),
    listarFiltrosDeCards(),
  ])

  // Agrupa filtros por card_id para passar ao CardsManager
  const filtrosPorCard: Record<string, OportunidadeCardFiltro[]> = {}
  for (const f of filtros) {
    if (!filtrosPorCard[f.card_id]) filtrosPorCard[f.card_id] = []
    filtrosPorCard[f.card_id].push(f)
  }

  return (
    <ConfiguracoesClient
      colunas={colunas}
      cards={cards}
      filtrosPorCard={filtrosPorCard}
    />
  )
}