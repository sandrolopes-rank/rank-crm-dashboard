"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns2,
  Plus,
} from "lucide-react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ColumnFilterPopover } from "./column-filter-popover"
import type { OportunidadeColuna, FiltroOperador } from "@/lib/types/oportunidades"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  onAddNew?: () => void
}

export function DataTable<TData>({ columns, data, onAddNew }: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [activeFilters, setActiveFilters] = React.useState<Record<string, { operator: FiltroOperador; values: (string | number)[] }>>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 5,
  })

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 flex-wrap gap-3">
        <Label htmlFor="view-selector" className="sr-only">
          Visualização
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit sm:hidden cursor-pointer"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Selecionar visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Visão Geral</SelectItem>
            <SelectItem value="past-performance" disabled>Desempenho Anterior</SelectItem>
            <SelectItem value="key-personnel" disabled>Pessoal Chave</SelectItem>
            <SelectItem value="focus-documents" disabled>Documentos Foco</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 sm:flex">
          <TabsTrigger value="outline" className="cursor-pointer">Visão Geral</TabsTrigger>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <TabsTrigger value="past-performance" disabled className="cursor-not-allowed opacity-50">
                    Desempenho Anterior
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent>Em breve</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <TabsTrigger value="key-personnel" disabled className="cursor-not-allowed opacity-50">
                    Pessoal Chave
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent>Em breve</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <TabsTrigger value="focus-documents" disabled className="cursor-not-allowed opacity-50">
                    Documentos Foco
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent>Em breve</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={onAddNew}>
            <Plus />
            <span className="hidden lg:inline">Seção</span>
            <span className="lg:hidden">Seção</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Columns2 />
                <span className="hidden lg:inline">Personalizar Colunas</span>
                <span className="lg:hidden">Colunas</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.columnDef.meta && typeof (column.columnDef.meta as { coluna?: { label?: string } }).coluna?.label === "string"
                        ? (column.columnDef.meta as { coluna?: { label?: string } }).coluna!.label
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div
          ref={tableContainerRef}
          className="overflow-auto rounded-lg border"
          style={{ maxHeight: "600px" }}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as { align?: string; coluna?: OportunidadeColuna } | undefined
                    const alignClass = meta?.align ?? "text-left"
                    const coluna = meta?.coluna
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan} className={`whitespace-nowrap ${alignClass}`}>
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {coluna && (
                              <ColumnFilterPopover
                                coluna={coluna}
                                activeOperator={activeFilters[coluna.key]?.operator}
                                activeValues={activeFilters[coluna.key]?.values}
                                onApply={(op, vals) => {
                                  setActiveFilters(prev => ({ ...prev, [coluna.key]: { operator: op, values: vals } }))
                                  table.setColumnFilters(prev => {
                                    const newFilters = prev.filter(f => f.id !== coluna.key)
                                    newFilters.push({ id: coluna.key, value: vals })
                                    return newFilters
                                  })
                                }}
                                onClear={() => {
                                  setActiveFilters(prev => {
                                    const next = { ...prev }
                                    delete next[coluna.key]
                                    return next
                                  })
                                  table.setColumnFilters(prev => prev.filter(f => f.id !== coluna.key))
                                }}
                              />
                            )}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                <>
                  <tr>
                    <td style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }} colSpan={columns.length} />
                  </tr>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index]
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        style={{ height: `${virtualRow.size}px` }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as { align?: string } | undefined
                          const alignClass = meta?.align ?? "text-left"
                          return (
                            <TableCell key={cell.id} className={alignClass}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                  <tr>
                    <td
                      style={{
                        height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)}px`,
                      }}
                      colSpan={columns.length}
                    />
                  </tr>
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                  >
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Linhas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20 cursor-pointer" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex cursor-pointer"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir para a primeira página</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 cursor-pointer"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir para a página anterior</span>
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 cursor-pointer"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir para a próxima página</span>
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex cursor-pointer"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir para a última página</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="past-performance" className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Em breve
        </div>
      </TabsContent>
      <TabsContent value="key-personnel" className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Em breve
        </div>
      </TabsContent>
      <TabsContent value="focus-documents" className="px-4 lg:px-6">
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Em breve
        </div>
      </TabsContent>
    </Tabs>
  )
}