"use client"

import { formatarNumero } from "@/lib/format"

interface CalculationCellProps {
  value: number | null
}

export function CalculationCell({ value }: CalculationCellProps) {
  const displayValue = value != null ? formatarNumero(value) : "—"

  return (
    <span className="flex items-center italic text-muted-foreground tabular-nums px-1 py-0.5 h-full">
      {displayValue}
    </span>
  )
}