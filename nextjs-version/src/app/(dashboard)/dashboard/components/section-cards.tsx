import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CardCalculado } from "@/lib/cards"

interface SectionCardsProps {
  /** Cards já calculados pelo motor de cards da Fase 3. Se vazio ou undefined, renderiza placeholders vazios. */
  cards?: CardCalculado[]
}

/**
 * Determina o indicador visual baseado no valor do card.
 * Como não temos comparação temporal nesta fase, usamos heurística simples:
 * - Valor > 0 → TrendingUp (positivo)
 * - Valor = 0 ou null → Minus (neutro)
 * Futuramente pode ser configurável por card.
 */
function getIndicator(formatado: string) {
  // Extrai o valor numérico removendo formatação BRL e separadores
  const numerico = parseFloat(
    formatado.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".")
  )

  if (Number.isNaN(numerico) || numerico === 0) {
    return { icon: Minus, label: "Sem dados", variant: "neutral" as const }
  }
  if (numerico > 0) {
    return { icon: TrendingUp, label: "Em alta", variant: "positive" as const }
  }
  return { icon: TrendingDown, label: "Em baixa", variant: "negative" as const }
}

export function SectionCards({ cards }: SectionCardsProps) {
  // Se não há cards configurados, mostra estado vazio preservando o grid
  const items = cards ?? []

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.length === 0 ? (
        // Placeholder visual quando não há cards configurados no Supabase
        <Card className="@container/card opacity-50">
          <CardHeader>
            <CardDescription>Nenhum card configurado</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              —
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground">
              Configure cards em Administração → Configurações
            </div>
          </CardFooter>
        </Card>
      ) : (
        items.map((item) => {
          const indicator = getIndicator(item.formatado)
          const Icon = indicator.icon

          return (
            <Card key={item.card.id} className="@container/card">
              <CardHeader>
                <CardDescription>{item.card.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {item.formatado}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Icon />
                    {indicator.label}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {indicator.label} <Icon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  {item.coluna?.label ?? "Sem coluna vinculada"}
                </div>
              </CardFooter>
            </Card>
          )
        })
      )}
    </div>
  )
}