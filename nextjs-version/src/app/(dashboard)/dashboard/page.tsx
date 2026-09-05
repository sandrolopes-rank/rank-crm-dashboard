import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { SectionCards } from "./components/section-cards"
import { OportunidadesSection } from "./components/oportunidades-section"

import { listarColunasOportunidades, listarCardsOportunidades, listarFiltrosDeCards } from "@/lib/oportunidades-data"
import { calcularCards, calcularSerieTempo } from "@/lib/cards"
import { createServerSupabase } from "@/lib/supabase-server"
import type { Oportunidade } from "@/lib/types/oportunidades"

export default async function Page() {
  // Busca metadados e dados reais do Supabase para os cards e gráfico
  const [colunas, cardsConfig, filtros, supabase] = await Promise.all([
    listarColunasOportunidades(),
    listarCardsOportunidades(),
    listarFiltrosDeCards(),
    createServerSupabase(),
  ])

  // Busca usuário logado e role para controle de acesso
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userId = ""
  let isAdmin = false
  if (user) {
    userId = user.id
    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .single()
    isAdmin = perfil?.role === "admin"
  }

  // Busca todas as oportunidades para cálculo dos cards e gráfico
  // Nota: em produção com muitos dados, isso deve ser otimizado com query agregada no banco
  const { data: oportunidadesRaw } = await supabase
    .from("oportunidades")
    .select("*")

  const oportunidades = (oportunidadesRaw ?? []) as Oportunidade[]

  // Calcula os cards usando o motor da Fase 3
  const cardsCalculados = calcularCards(cardsConfig, colunas, filtros, oportunidades)

  // Encontra o primeiro card do tipo "linha" para alimentar o gráfico
  const cardLinha = cardsConfig.find((c) => c.tipo_visualizacao === "linha")
  const colunaReferenciaGlobal = colunas.find((c) => c.eh_data_referencia) ?? null
  const serieTemporal = cardLinha
    ? calcularSerieTempo(cardLinha, colunas, filtros, oportunidades, colunaReferenciaGlobal)
    : []
  const tituloGrafico = cardLinha?.label ?? "Evolução"
  const labelColunaGrafico = cardLinha
    ? colunas.find((c) => c.id === cardLinha.coluna_id)?.label ?? "Valor"
    : "Valor"

  return (
    <>
      {/* Page Title and Description */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Oportunidades</h1>
          <p className="text-muted-foreground">Gerencie suas oportunidades comerciais</p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <SectionCards cards={cardsCalculados} />
        <ChartAreaInteractive
          serieTemporal={serieTemporal}
          titulo={tituloGrafico}
          labelColuna={labelColunaGrafico}
        />
      </div>
      <div className="@container/main">
        <OportunidadesSection
          colunas={colunas}
          userId={userId}
          isAdmin={isAdmin}
        />
      </div>
    </>
  )
}