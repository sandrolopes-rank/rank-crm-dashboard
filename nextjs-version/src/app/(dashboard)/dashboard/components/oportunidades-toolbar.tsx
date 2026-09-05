"use client"

import { useState, useEffect } from "react"
import { Download, Filter, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { baixarCsv } from "@/lib/csv"
import type { Oportunidade, OportunidadeColuna } from "@/lib/types/oportunidades"
import { renderizarValorOportunidade } from "@/lib/oportunidade-display"

interface OportunidadesToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  totalCount: number
  colunas: OportunidadeColuna[]
  oportunidades: Oportunidade[]
  onCreateNew: () => void
}

export function OportunidadesToolbar({
  search,
  onSearchChange,
  totalCount,
  colunas,
  oportunidades,
  onCreateNew,
}: OportunidadesToolbarProps) {
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  // Debounce de 300ms para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch, onSearchChange])

  const handleExportCsv = () => {
    const sorted = [...colunas].sort((a, b) => a.ordem - b.ordem)
    const cabecalhos = sorted.map((c) => c.label)
    const linhas = oportunidades.map((opp) =>
      sorted.map((coluna) =>
        renderizarValorOportunidade(coluna, opp.dados[coluna.key] ?? null)
      )
    )
    baixarCsv("oportunidades.csv", cabecalhos, linhas)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={debouncedSearch}
          onChange={(e) => setDebouncedSearch(e.target.value)}
          placeholder="Buscar oportunidades..."
          className="pl-9 h-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden md:inline">
          {totalCount} {totalCount === 1 ? "registro" : "registros"}
        </span>

        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>

        <Button size="sm" onClick={onCreateNew}>
          <Plus className="size-4 mr-1.5" />
          Nova Oportunidade
        </Button>
      </div>
    </div>
  )
}