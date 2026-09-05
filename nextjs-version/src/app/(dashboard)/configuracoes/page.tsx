"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePerfil } from "@/hooks/use-perfil"
import { ehAdmin } from "@/lib/types/perfis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { perfil, loading } = usePerfil()

  useEffect(() => {
    if (!loading && !ehAdmin(perfil)) {
      router.replace("/oportunidades")
    }
  }, [perfil, loading, router])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!ehAdmin(perfil)) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie colunas, cards de métrica e perfis de acesso
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Painel Administrativo</CardTitle>
          <CardDescription>
            As abas de configuração serão implementadas na Fase 7 do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aqui o administrador poderá gerenciar: Gerador de Tabelas (colunas dinâmicas),
            Cards de Métrica e Gráficos, Perfis e Acessos de usuários.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}