"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase"
import { chaveCache, lerCache, salvarCache } from "@/lib/cache"
import type { Oportunidade, OportunidadeColuna, FiltroOperador } from "@/lib/types/oportunidades"
import { resolverValoresLinha } from "@/lib/formula"

export type ActiveFilters = Record<string, { operator: FiltroOperador; values: (string | number)[] }>

export interface UseOportunidadesParams {
  colunas: OportunidadeColuna[]
  userId: string
  isAdmin: boolean
  pageSize?: number
  activeFilters?: ActiveFilters
}

export interface UseOportunidadesResult {
  data: Oportunidade[]
  totalCount: number
  isLoading: boolean
  error: string | null
  refetch: () => void
  page: number
  setPage: (page: number) => void
  search: string
  setSearch: (search: string) => void
}

interface CacheEntry {
  data: Oportunidade[]
  totalCount: number
  timestamp: number
}

const CACHE_TTL_MS = 30_000 // 30 segundos

export function useOportunidades({
  colunas,
  userId,
  isAdmin,
  pageSize = 20,
  activeFilters,
}: UseOportunidadesParams): UseOportunidadesResult {
  const [data, setData] = useState<Oportunidade[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  const cacheKey = useMemo(
    () => chaveCache("oportunidades", userId),
    [userId]
  )

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchOportunidades() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Tenta ler do cache primeiro para renderização instantânea
        const cached = lerCache<CacheEntry>(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && page === 0 && !search) {
          setData(cached.data)
          setTotalCount(cached.totalCount)
          setIsLoading(false)
        }

        // Busca real
        let query = supabase
          .from("oportunidades")
          .select("*", { count: "exact" })

        // Se não é admin, filtra apenas as próprias oportunidades
        if (!isAdmin) {
          query = query.eq("owner_id", userId)
        }

        // Busca textual — procura em todos os campos textuais do jsonb "dados"
        if (search.trim()) {
          const termo = search.trim()
          // Busca ILIKE em cada coluna de tipo texto/select via jsonb
          const colunasTexto = colunas.filter((c) => c.tipo === "texto" || c.tipo === "select")
          if (colunasTexto.length > 0) {
            const orConditions = colunasTexto
              .map((c) => `dados->>${c.key}.ilike.%${termo}%`)
              .join(",")
            query = query.or(orConditions)
          } else {
            // Fallback: busca em todos os valores do jsonb
            query = query.ilike("dados::text", `%${termo}%`)
          }
        }

        // Filtros por coluna server-side
        if (activeFilters && Object.keys(activeFilters).length > 0) {
          for (const [colKey, filter] of Object.entries(activeFilters)) {
            const { operator, values } = filter
            const coluna = colunas.find((c) => c.key === colKey)
            if (!coluna) continue

            const jsonPath = `dados->>${colKey}`

            switch (operator) {
              case "eq":
                query = query.eq(jsonPath, values[0])
                break
              case "neq":
                query = query.neq(jsonPath, values[0])
                break
              case "gt":
                query = query.gt(jsonPath, values[0])
                break
              case "gte":
                query = query.gte(jsonPath, values[0])
                break
              case "lt":
                query = query.lt(jsonPath, values[0])
                break
              case "lte":
                query = query.lte(jsonPath, values[0])
                break
              case "contains":
                query = query.ilike(jsonPath, `%${values[0]}%`)
                break
              case "not_contains":
                query = query.not("dados->>" + colKey as any, "ilike", `%${values[0]}%`)
                break
              case "in":
                query = query.in(jsonPath, values)
                break
              case "not_in":
                // Supabase não tem .not.in() direto — usa OR com neq
                for (const v of values) {
                  query = query.neq(jsonPath, v)
                }
                break
              case "is_empty":
                query = query.is(jsonPath, null)
                break
              case "is_not_empty":
                query = query.not(jsonPath as any, "is", null)
                break
              case "mes_atual":
              case "mes_anterior":
              case "mes_proximo":
              case "proximos_meses":
              case "ultimos_meses":
                // Filtros de data relativos — aplicados client-side por complexidade
                // O TanStack Table já filtra localmente como fallback
                break
            }
          }
        }

        // Paginação server-side
        const from = page * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        // Ordenação por created_at desc
        query = query.order("created_at", { ascending: false })

        const { data: rows, error: fetchError, count } = await query

        if (cancelled) return

        if (fetchError) {
          setError(fetchError.message)
          setIsLoading(false)
          return
        }

        const oportunidades = (rows ?? []) as Oportunidade[]

        // Resolve valores calculados para cada linha
        const resolvidas = oportunidades.map((opp) => ({
          ...opp,
          dados: resolverValoresLinha(colunas, opp.dados),
        })) as Oportunidade[]

        setData(resolvidas)
        setTotalCount(count ?? 0)
        setIsLoading(false)

        // Salva no cache apenas a primeira página sem busca
        if (page === 0 && !search) {
          salvarCache<CacheEntry>(cacheKey, {
            data: resolvidas,
            totalCount: count ?? 0,
            timestamp: Date.now(),
          })
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Erro inesperado.")
        setIsLoading(false)
      }
    }

    fetchOportunidades()

    return () => {
      cancelled = true
    }
  }, [colunas, userId, isAdmin, pageSize, page, search, refreshKey, cacheKey, activeFilters])

  return {
    data,
    totalCount,
    isLoading,
    error,
    refetch,
    page,
    setPage,
    search,
    setSearch,
  }
}