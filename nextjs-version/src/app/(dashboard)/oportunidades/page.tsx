"use client"

import { usePerfil } from "@/hooks/use-perfil"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OportunidadesPage() {
  const { perfil, loading } = usePerfil()

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Oportunidades</h1>
        <p className="text-muted-foreground">
          Gerencie suas oportunidades comerciais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de Oportunidades</CardTitle>
          <CardDescription>
            A tabela dinâmica será implementada na próxima fase do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Olá, {perfil?.nome ?? perfil?.email?.split("@")[0] ?? "usuário"}.
            Esta página exibirá a tabela de oportunidades com colunas configuráveis,
            cards de métrica e exportação CSV.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}