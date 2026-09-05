"use client"

import { useState, useCallback, useRef } from "react"
import { useReactTable, flexRender, getCoreRowModel } from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Oportunidade, OportunidadeColuna } from "@/lib/types/oportunidades"
import { atualizarOportunidade, excluirOportunidade } from "@/app/(dashboard)/oportunidades/actions"
import { useOportunidades } from "../hooks/use-oportunidades"
import { useDynamicColumns } from "../hooks/use-dynamic-columns"
import { OportunidadesToolbar } from "./oportunidades-toolbar"
import { OportunidadeModal } from "./oportunidade-modal"
import { ColumnFilterPopover } from "./column-filter-popover"
import type { FiltroOperador } from "@/lib/types/oportunidades"

interface OportunidadesTableProps {
  colunas: OportunidadeColuna[]
  userId: string
  isAdmin: boolean
  perfisMap: Record<string, { id: string; email: string; nome: string | null }>
}

export function OportunidadesTable({ colunas, userId, isAdmin, perfisMap }: OportunidadesTableProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOpp, setEditingOpp] = useState<Oportunidade | null>(null)
  const [filters, setFilters] = useState<Record<string, { operator: FiltroOperador; values: (string | number)[] }>>({})

  const {
    data,
    totalCount,
    isLoading,
    refetch,
    page,
    setPage,
    search,
    setSearch,
  } = useOportunidades({ colunas, userId, isAdmin, pageSize: 20 })

  const handleUpdate = useCallback(async (id: string, dados: Record<string, string | number | null>) => {
    const result = await atualizarOportunidade(id, dados)
    if (!result.ok) {
      toast.error(result.erro)
      return
    }
    toast.success("Atualizado!")
    refetch()
  }, [refetch])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta oportunidade?")) return
    const result = await excluirOportunidade(id)
    if (!result.ok) {
      toast.error(result.erro)
      return
    }
    toast.success("Oportunidade excluída!")
    refetch()
  }, [refetch])

  const columns = useDynamicColumns({
    colunas,
    isAdmin,
    onUpdate: handleUpdate,
    perfisMap,
  })

  // Adiciona coluna de ações no final
  const allColumns = [
    ...columns,
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      size: 50,
      cell: ({ row }: { row: { original: Oportunidade } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingOpp(row.original)
                setModalOpen(true)
              }}
            >
              <Pencil className="size-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="size-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / 20),
    state: {
      pagination: { pageIndex: page, pageSize: 20 },
    },
  })

  // Virtualização
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  })

  const totalPages = Math.ceil(totalCount / 20)

  const handleFilterApply = (columnKey: string, operator: FiltroOperador, values: (string | number)[]) => {
    setFilters((prev) => ({ ...prev, [columnKey]: { operator, values } }))
    // TODO: Integrar filtros com busca server-side no hook
    refetch()
  }

  const handleFilterClear = (columnKey: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      delete next[columnKey]
      return next
    })
    refetch()
  }

  return (
    <div className="space-y-4">
      <OportunidadesToolbar
        search={search}
        onSearchChange={setSearch}
        totalCount={totalCount}
        colunas={colunas}
        oportunidades={data}
        onCreateNew={() => {
          setEditingOpp(null)
          setModalOpen(true)
        }}
      />

      <div className="rounded-md border">
        {isLoading && data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-lg font-medium">Nenhuma oportunidade encontrada</p>
            <p className="text-sm">Crie uma nova oportunidade para começar.</p>
          </div>
        ) : (
          <div ref={parentRef} className="h-[calc(100vh-320px)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const colunaMeta = header.column.columnDef.meta as { coluna?: OportunidadeColuna } | undefined
                      const coluna = colunaMeta?.coluna

                      return (
                        <TableHead
                          key={header.id}
                          style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                          className="whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                            {coluna && (
                              <ColumnFilterPopover
                                coluna={coluna}
                                activeOperator={filters[coluna.key]?.operator}
                                activeValues={filters[coluna.key]?.values}
                                onApply={(op, vals) => handleFilterApply(coluna.key, op, vals)}
                                onClear={() => handleFilterClear(coluna.key)}
                              />
                            )}
                          </div>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = table.getRowModel().rows[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{ height: `${virtualRow.size}px` }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-1">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} ({totalCount} registros)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || isLoading}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1 || isLoading}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <OportunidadeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        colunas={colunas}
        oportunidade={editingOpp}
        onSuccess={refetch}
      />
    </div>
  )
}