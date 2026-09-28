"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { Oportunidade, OportunidadeColuna } from "@/lib/types/oportunidades"
import { useOportunidades, type ActiveFilters } from "../hooks/use-oportunidades"
import { useDynamicColumns } from "../hooks/use-dynamic-columns"
import { DataTable } from "./data-table"
import { OportunidadeModal } from "./oportunidade-modal"
import { OportunidadesToolbar } from "./oportunidades-toolbar"
import { atualizarOportunidade, excluirOportunidade } from "@/app/(dashboard)/oportunidades/actions"

interface OportunidadesSectionProps {
  colunas: OportunidadeColuna[]
  userId: string
  isAdmin: boolean
  perfisMap: Record<string, { id: string; email: string; nome: string | null }>
}

export function OportunidadesSection({ colunas, userId, isAdmin, perfisMap }: OportunidadesSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOportunidade, setEditingOportunidade] = useState<Oportunidade | null>(null)
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({})

  const { data, isLoading, refetch, totalCount, search, setSearch } = useOportunidades({
    colunas,
    userId,
    isAdmin,
    pageSize: 20,
    activeFilters,
  })

  const handleUpdate = useCallback(
    async (id: string, dados: Record<string, string | number | null>) => {
      const result = await atualizarOportunidade(id, dados)
      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      toast.success("Atualizado!")
      refetch()
    },
    [refetch]
  )

  const handleDelete = useCallback(
    async (row: Oportunidade) => {
      const result = await excluirOportunidade(row.id)
      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      toast.success("Oportunidade excluída!")
      refetch()
    },
    [refetch]
  )

  const handleEdit = useCallback((row: Oportunidade) => {
    setEditingOportunidade(row)
    setModalOpen(true)
  }, [])

  const handleCreateNew = useCallback(() => {
    setEditingOportunidade(null)
    setModalOpen(true)
  }, [])

  const columns = useDynamicColumns({
    colunas,
    isAdmin,
    onUpdate: handleUpdate,
    perfisMap,
  })

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando oportunidades...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <OportunidadesToolbar
        search={search}
        onSearchChange={setSearch}
        totalCount={totalCount}
        colunas={colunas}
        oportunidades={data}
        onCreateNew={handleCreateNew}
      />
      <DataTable
        columns={columns}
        data={data}
        onAddNew={handleCreateNew}
        onFiltersChange={setActiveFilters}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
      />
      <OportunidadeModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingOportunidade(null)
        }}
        colunas={colunas}
        oportunidade={editingOportunidade}
        onSuccess={refetch}
      />
    </div>
  )
}