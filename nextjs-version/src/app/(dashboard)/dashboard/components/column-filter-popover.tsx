"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OportunidadeColuna, FiltroOperador } from "@/lib/types/oportunidades"
import {
  OPERADORES_POR_TIPO,
  OPERADORES_SEM_VALOR,
  OPERADORES_LISTA,
  OPERADORES_INTERVALO_MESES,
} from "@/lib/types/oportunidades"

interface ColumnFilterPopoverProps {
  coluna: OportunidadeColuna
  activeOperator?: FiltroOperador
  activeValues?: (string | number)[]
  onApply: (operator: FiltroOperador, values: (string | number)[]) => void
  onClear: () => void
}

const OPERATOR_LABELS: Record<FiltroOperador, string> = {
  eq: "Igual a",
  neq: "Diferente de",
  in: "É um dos valores",
  not_in: "Não é nenhum dos valores",
  gt: "Maior que",
  gte: "Maior ou igual a",
  lt: "Menor que",
  lte: "Menor ou igual a",
  contains: "Contém",
  not_contains: "Não contém",
  is_empty: "Está vazio",
  is_not_empty: "Não está vazio",
  mes_atual: "Mês atual",
  mes_anterior: "Mês anterior",
  mes_proximo: "Próximo mês",
  proximos_meses: "Próximos N meses",
  ultimos_meses: "Últimos N meses",
}

export function ColumnFilterPopover({
  coluna,
  activeOperator,
  activeValues,
  onApply,
  onClear,
}: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [operator, setOperator] = useState<FiltroOperador>(
    activeOperator ?? OPERADORES_POR_TIPO[coluna.tipo][0]
  )
  const [singleValue, setSingleValue] = useState<string>(
    activeValues?.[0]?.toString() ?? ""
  )
  const [monthCount, setMonthCount] = useState<string>(
    activeValues?.[0]?.toString() ?? "3"
  )
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(activeValues?.map(String) ?? [])
  )

  const operadores = OPERADORES_POR_TIPO[coluna.tipo]
  const semValor = OPERADORES_SEM_VALOR.has(operator)
  const isLista = OPERADORES_LISTA.has(operator)
  const isIntervalo = OPERADORES_INTERVALO_MESES.has(operator)

  const handleApply = () => {
    let values: (string | number)[] = []

    if (!semValor) {
      if (isLista) {
        values = [...selectedOptions]
      } else if (isIntervalo) {
        values = [parseInt(monthCount) || 3]
      } else {
        values = [singleValue]
      }
    }

    onApply(operator, values)
    setOpen(false)
  }

  const handleClear = () => {
    onClear()
    setOpen(false)
  }

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const opcoes =
    coluna.tipo === "select"
      ? ((coluna.config as { opcoes?: { id: string; label: string }[] })?.opcoes ?? [])
      : []

  const hasActiveFilter = !!activeOperator

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`size-6 ${hasActiveFilter ? "text-primary" : "text-muted-foreground"}`}
        >
          <Filter className="size-3.5" />
          <span className="sr-only">Filtrar {coluna.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtrar: {coluna.label}</h4>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 px-2 text-xs">
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Condição</Label>
            <Select value={operator} onValueChange={(v) => setOperator(v as FiltroOperador)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operadores.map((op) => (
                  <SelectItem key={op} value={op}>
                    {OPERATOR_LABELS[op]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!semValor && (
            <div className="space-y-1.5">
              <Label className="text-xs">Valor</Label>

              {isLista && coluna.tipo === "select" ? (
                <div className="max-h-40 overflow-y-auto space-y-1.5 rounded border p-2">
                  {opcoes.map((opcao) => (
                    <div key={opcao.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedOptions.has(opcao.id)}
                        onCheckedChange={() => toggleOption(opcao.id)}
                        id={`filter-opt-${opcao.id}`}
                      />
                      <label
                        htmlFor={`filter-opt-${opcao.id}`}
                        className="text-sm cursor-pointer truncate"
                      >
                        {opcao.label}
                      </label>
                    </div>
                  ))}
                  {opcoes.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sem opções disponíveis</p>
                  )}
                </div>
              ) : isIntervalo ? (
                <Input
                  type="number"
                  min="1"
                  value={monthCount}
                  onChange={(e) => setMonthCount(e.target.value)}
                  placeholder="Número de meses"
                  className="h-8"
                />
              ) : (
                <Input
                  value={singleValue}
                  onChange={(e) => setSingleValue(e.target.value)}
                  placeholder="Valor..."
                  className="h-8"
                />
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-8" onClick={handleApply}>
              Aplicar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}