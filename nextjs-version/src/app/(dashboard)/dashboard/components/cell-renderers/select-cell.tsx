"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OportunidadeColuna } from "@/lib/types/oportunidades"

interface SelectCellProps {
  value: string | null
  coluna: OportunidadeColuna
  onUpdate: (value: string | null) => Promise<void>
}

// Paleta de cores automática para opções sem cor configurada (classes Tailwind seguras)
const PALETTE = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
]

interface CorOpcaoResult {
  className?: string
  style?: React.CSSProperties
}

/**
 * Retorna classes Tailwind da paleta quando a opção não tem cor customizada.
 * Quando tem cor customizada (vinda do banco), usa style inline pois classes
 * Tailwind dinâmicas não são geradas pelo purger.
 */
function getCorOpcao(opcaoId: string, opcoes: { id: string; label: string; cor?: string }[], index: number): CorOpcaoResult {
  const opcao = opcoes.find((o) => o.id === opcaoId)
  if (opcao?.cor) {
    // cor customizada do banco → usar como style inline
    return { style: { backgroundColor: opcao.cor, color: "#fff" } }
  }
  return { className: PALETTE[index % PALETTE.length] }
}

export function SelectCell({ value, coluna, onUpdate }: SelectCellProps) {
  const [isEditing, setIsEditing] = useState(false)

  const config = coluna.config as { opcoes?: { id: string; label: string; cor?: string }[] }
  const opcoes = config?.opcoes ?? []

  const selectedOpcao = opcoes.find((o) => o.id === value)
  const selectedIndex = opcoes.findIndex((o) => o.id === value)
  const badgeStyle = value ? getCorOpcao(value, opcoes, selectedIndex >= 0 ? selectedIndex : 0) : {}

  if (isEditing) {
    return (
      <Select
        value={value ?? ""}
        onValueChange={async (newValue) => {
          setIsEditing(false)
          const finalValue = newValue === "__clear__" ? null : newValue
          if (finalValue !== value) {
            await onUpdate(finalValue)
          }
        }}
        open={true}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false)
        }}
      >
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder="Selecionar..." />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.id} value={opcao.id}>
              {opcao.label}
            </SelectItem>
          ))}
          {value && (
            <SelectItem value="__clear__" className="text-muted-foreground italic">
              Limpar
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="flex items-center cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 h-full"
    >
      {selectedOpcao ? (
        <Badge
          variant="outline"
          className={`${badgeStyle.className ?? ""} border-transparent font-medium`}
          style={badgeStyle.style}
        >
          {selectedOpcao.label}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}