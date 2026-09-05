"use client"

import { TrendingDown, TrendingUp, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RuleThreshold } from "@/lib/types/oportunidades"

interface RuleIndicatorProps {
  value: number | null
  threshold?: RuleThreshold
  className?: string
}

/**
 * Indicador visual baseado em regras.
 * - mode === "sign": >0 verde, <0 vermelho, 0 amarelo
 * - mode === "threshold" (padrão): >= goodAbove verde, <= badBelow vermelho, entre = amarelo
 * - Sem valor ou sem threshold: não renderiza
 */
export function RuleIndicator({ value, threshold, className }: RuleIndicatorProps) {
  if (value == null || !threshold) return null

  const mode = threshold.mode ?? "threshold"

  let variant: "good" | "bad" | "neutral" = "neutral"

  if (mode === "sign") {
    if (value > 0) variant = "good"
    else if (value < 0) variant = "bad"
  } else {
    const { goodAbove, badBelow } = threshold
    if (goodAbove != null && value >= goodAbove) {
      variant = "good"
    } else if (badBelow != null && value <= badBelow) {
      variant = "bad"
    }
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