"use client"

import { formatarNumero } from "@/lib/format"
import { RuleIndicator } from "../rule-indicator"
import type { RuleThreshold } from "@/lib/types/oportunidades"

interface CalculationCellProps {
  value: number | null
  threshold?: RuleThreshold
}

export function CalculationCell({ value, threshold }: CalculationCellProps) {
  const displayValue = value != null ? formatarNumero(value) : "—"

  return (
    <span className="flex items-center gap-1 italic text-muted-foreground tabular-nums px-1 py-0.5 h-full">
      {displayValue}
      <RuleIndicator value={value} threshold={threshold} />
    </span>
  )
}