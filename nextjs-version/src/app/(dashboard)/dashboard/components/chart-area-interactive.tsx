"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import type { PontoSerieTempo } from "@/lib/cards"

interface ChartAreaInteractiveProps {
  /** Série temporal já calculada pelo motor de cards da Fase 3. */
  serieTemporal?: PontoSerieTempo[]
  /** Label do card/gráfico (ex: "Receita Total"). */
  titulo?: string
  /** Label da coluna usada no eixo Y. */
  labelColuna?: string
}

const chartConfig = {
  valor: {
    label: "Valor",
    color: "var(--primary)",
  },
} satisfies ChartConfig

/** Mapeia timeRange do toggle para número de meses retroativos. */
const RANGE_MESES: Record<string, number> = {
  "3m": 3,
  "1m": 1,
  "todos": Infinity,
}

export function ChartAreaInteractive({
  serieTemporal,
  titulo = "Evolução",
  labelColuna = "Valor",
}: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("3m")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("1m")
    }
  }, [isMobile])

  // Atualiza config dinâmica com o label da coluna
  const dynamicConfig = React.useMemo(
    () => ({ ...chartConfig, valor: { ...chartConfig.valor, label: labelColuna } }),
    [labelColuna]
  )

  // Filtra a série temporal pelo período selecionado
  const filteredData = React.useMemo(() => {
    if (!serieTemporal || serieTemporal.length === 0) return []

    const meses = RANGE_MESES[timeRange] ?? 3
    if (meses === Infinity) return serieTemporal

    // Pega os últimos N meses da série (já ordenada por mês)
    return serieTemporal.slice(-meses)
  }, [serieTemporal, timeRange])

  const hasData = filteredData.length > 0

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Evolução mensal
          </span>
          <span className="@[540px]/card:hidden">Mensal</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="3m">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="1m">Último mês</ToggleGroupItem>
            <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3m" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="1m" className="rounded-lg">
                Último mês
              </SelectItem>
              <SelectItem value="todos" className="rounded-lg">
                Todos
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!hasData ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            Sem dados para o período selecionado
          </div>
        ) : (
          <ChartContainer
            config={dynamicConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillValor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-valor)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-valor)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => (
                      <span className="tabular-nums">{value}</span>
                    )}
                  />
                }
              />
              <Area
                dataKey="formatado"
                type="natural"
                fill="url(#fillValor)"
                stroke="var(--color-valor)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
