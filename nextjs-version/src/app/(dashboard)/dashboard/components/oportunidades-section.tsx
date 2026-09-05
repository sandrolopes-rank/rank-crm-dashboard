"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { OportunidadeColuna } from "@/lib/types/oportunidades"
import { useOportunidades } from "../hooks/use-oportunidades"
import { useDynamicColumns } from "../hooks/use-dynamic-columns"
import { DataTable } from "./data-table"
import { OportunidadeModal } from "./oportunidade-modal"
import { OportunidadesToolbar } from "./oportunidades-toolbar"
import { atualizarOportunidade } from "@/app/(dashboard)/oportunidades/actions"

interface OportunidadesSectionProps {
  colunas: OportunidadeColuna[]
  userId: string
  isAdmin: boolean
  perfisMap: Record<string, { id: string; email: string; nome: string | null }>
}

export function OportunidadesSection({ colunas, userId, isAdmin, perfisMap }: OportunidadesSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading, refetch, totalCount, search, setSearch } = useOportunidades({
    colunas,
    userId,
    isAdmin,
    pageSize: 20,
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
        onCreateNew={() => setModalOpen(true)}
      />
      <DataTable
        columns={columns}
        data={data}
        onAddNew={() => setModalOpen(true)}
      />
      <OportunidadeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        colunas={colunas}
        oportunidade={null}
        onSuccess={refetch}
      />
    </div>
  )
}