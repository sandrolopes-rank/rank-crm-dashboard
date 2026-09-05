"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase"
import { chaveCache, lerCache, salvarCache } from "@/lib/cache"
import type { Oportunidade, OportunidadeColuna } from "@/lib/types/oportunidades"
import { resolverValoresLinha } from "@/lib/formula"

export interface UseOportunidadesParams {
  colunas: OportunidadeColuna[]
  userId: string
  isAdmin: boolean
  pageSize?: number
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
  }, [colunas, userId, isAdmin, pageSize, page, search, refreshKey, cacheKey])

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