"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { Perfil } from "@/lib/types/perfis"

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarPerfil() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setPerfil(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error || !data) {
        setPerfil(null)
        setLoading(false)
        return
      }

      setPerfil({
        id: data.id,
        email: user.email ?? "",
        nome: data.nome ?? null,
        papel: data.papel as "admin" | "membro",
        status: data.status as "ativo" | "inativo",
        criado_em: data.criado_em ?? data.created_at ?? "",
        atualizado_em: data.atualizado_em ?? data.updated_at ?? null,
      })
      setLoading(false)
    }

    carregarPerfil()
  }, [])

  return { perfil, loading }
}