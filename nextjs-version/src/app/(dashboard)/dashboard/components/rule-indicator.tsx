"use client"

import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RuleThreshold {
  /** Valor mínimo para considerar "bom" (verde). */
  goodAbove?: number
  /** Valor máximo para considerar "ruim" (vermelho). Abaixo disso é vermelho. */
  badBelow?: number
}

interface RuleIndicatorProps {
  value: number | null
  threshold?: RuleThreshold
  className?: string
}

/**
 * Indicador visual baseado em regras simples.
 * - Verde + TrendingUp: valor >= goodAbove
 * - Vermelho + TrendingDown: valor <= badBelow
 * - Amarelo + Minus: entre os dois thresholds ou sem threshold definido
 * - Sem valor: não renderiza nada
 */
export function RuleIndicator({ value, threshold, className }: RuleIndicatorProps) {
  if (value == null || !threshold) return null

  const { goodAbove, badBelow } = threshold

  let variant: "good" | "bad" | "neutral" = "neutral"

  if (goodAbove != null && value >= goodAbove) {
    variant = "good"
  } else if (badBelow != null && value <= badBelow) {
    variant = "bad"
  }

  const config = {
    good: { icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
    bad: { icon: TrendingDown, color: "text-red-600 dark:text-red-400" },
    neutral: { icon: Minus, color: "text-amber-500 dark:text-amber-400" },
  }[variant]

  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center", config.color, className)}>
      <Icon className="size-3" />
    </span>
  )
}