"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Oportunidade, OportunidadeColuna } from "@/lib/types/oportunidades"
import { resolverValoresLinha } from "@/lib/formula"
import { renderizarValorOportunidade } from "@/lib/oportunidade-display"
import { TextCell } from "../components/cell-renderers/text-cell"
import { CurrencyCell } from "../components/cell-renderers/currency-cell"
import { SelectCell } from "../components/cell-renderers/select-cell"
import { DateCell } from "../components/cell-renderers/date-cell"
import { CalculationCell } from "../components/cell-renderers/calculation-cell"
import { ResponsibleCell } from "../components/cell-renderers/responsible-cell"

export interface UseDynamicColumnsParams {
  colunas: OportunidadeColuna[]
  isAdmin: boolean
  onUpdate: (id: string, dados: Record<string, string | number | null>) => Promise<void>
  perfisMap: Record<string, { id: string; email: string; nome: string | null }>
}

export function useDynamicColumns({
  colunas,
  isAdmin,
  onUpdate,
  perfisMap,
}: UseDynamicColumnsParams) {
  return useMemo<ColumnDef<Oportunidade>[]>(() => {
    const sorted = [...colunas].sort((a, b) => a.ordem - b.ordem)

    // Mapeamento de alinhamento por tipo de coluna - todos à esquerda
    const alinhamentoPorTipo: Record<string, string> = {
      texto: "text-left",
      monetario: "text-left",
      calculo: "text-left",
      select: "text-left",
      data: "text-left",
    }

    // Coluna "Responsável" na posição 0 — só para admin
    const responsibleCol: ColumnDef<Oportunidade> | null = isAdmin
      ? {
          id: "owner_id",
          accessorFn: (row) => row.owner_id,
          header: "Responsável",
          enableSorting: false,
          enableHiding: false,
          meta: { align: "text-left" },
          cell: ({ getValue, row }) => (
            <ResponsibleCell
              ownerId={getValue() as string}
              oportunidadeId={row.original.id}
              onUpdate={onUpdate}
              perfisMap={perfisMap}
            />
          ),
        }
      : null

    const dynamicCols: ColumnDef<Oportunidade>[] = sorted.map((coluna) => ({
      id: coluna.key,
      accessorFn: (row) => {
        const resolvidos = resolverValoresLinha(colunas, row.dados)
        return resolvidos[coluna.key] ?? null
      },
      header: coluna.label,
      enableSorting: coluna.tipo !== "calculo",
      enableHiding: true,
      meta: { coluna, align: alinhamentoPorTipo[coluna.tipo] ?? "text-left" },
      cell: ({ getValue, row }) => {
        const value = getValue() as string | number | null
        const oppId = row.original.id

        switch (coluna.tipo) {
          case "texto":
            return (
              <TextCell
                value={value as string | null}
                onUpdate={(v) => onUpdate(oppId, { [coluna.key]: v })}
              />
            )
          case "monetario":
            return (
              <CurrencyCell
                value={value as number | null}
                onUpdate={(v) => onUpdate(oppId, { [coluna.key]: v })}
              />
            )
          case "select":
            return (
              <SelectCell
                value={value as string | null}
                coluna={coluna}
                onUpdate={(v) => onUpdate(oppId, { [coluna.key]: v })}
              />
            )
          case "data":
            return (
              <DateCell
                value={value as string | null}
                onUpdate={(v) => onUpdate(oppId, { [coluna.key]: v })}
              />
            )
          case "calculo":
            return <CalculationCell value={value as number | null} />
          default:
            return <span>{renderizarValorOportunidade(coluna, value)}</span>
        }
      },
    }))

    // Insere coluna Responsável na posição 0 se admin
    if (responsibleCol) {
      dynamicCols.unshift(responsibleCol)
    }

    return dynamicCols
  }, [colunas, isAdmin, onUpdate])
}