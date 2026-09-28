"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { OportunidadeCard, OportunidadeCardFiltro, OportunidadeColuna } from "@/lib/types/oportunidades"
import { ColunasManager } from "./colunas-manager"
import { CardsManager } from "./cards-manager"

interface ConfiguracoesClientProps {
  colunas: OportunidadeColuna[]
  cards: OportunidadeCard[]
  filtrosPorCard: Record<string, OportunidadeCardFiltro[]>
}

export function ConfiguracoesClient({
  colunas: initialColunas,
  cards: initialCards,
  filtrosPorCard: initialFiltros,
}: ConfiguracoesClientProps) {
  const router = useRouter()
  const [colunas, setColunas] = useState(initialColunas)
  const [cards, setCards] = useState(initialCards)
  const [filtrosPorCard, setFiltrosPorCard] = useState(initialFiltros)
  const [isRefreshing, startRefresh] = useTransition()

  const handleRefresh = () => {
    startRefresh(() => {
      router.refresh()
      // Após o refresh do server component, os dados atualizados chegam via re-render
      // Como este é um client component com estado local, usamos router.refresh()
      // que re-executa o server component pai e passa novas props
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie colunas e cards do dashboard de oportunidades
        </p>
      </div>

      <Tabs defaultValue="colunas" className="w-full">
        <TabsList>
          <TabsTrigger value="colunas">
            Colunas ({colunas.length})
          </TabsTrigger>
          <TabsTrigger value="cards">
            Cards ({cards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colunas" className="mt-4">
          <ColunasManager colunas={colunas} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          <CardsManager
            cards={cards}
            filtrosPorCard={filtrosPorCard}
            colunas={colunas}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}