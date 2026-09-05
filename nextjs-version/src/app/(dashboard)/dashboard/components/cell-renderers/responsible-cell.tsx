"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase"
import { iniciaisDoEmail, usuarioDoEmail } from "@/lib/format"

interface ResponsibleCellProps {
  ownerId: string
  oportunidadeId: string
  onUpdate: (id: string, dados: Record<string, string | number | null>) => Promise<void>
  perfisMap: Record<string, { id: string; email: string; nome: string | null }>
}

export function ResponsibleCell({ ownerId, oportunidadeId, onUpdate, perfisMap }: ResponsibleCellProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Resolve o usuário diretamente do mapa passado pelo Server Component
  // Isso evita N+1 queries e garante que o nome apareça imediatamente
  const currentOwner = perfisMap[ownerId] ?? null

  const displayName = currentOwner?.nome
    ?? usuarioDoEmail(currentOwner?.email)
    ?? (ownerId ? `${ownerId.slice(0, 6)}...` : "—")

  const initials = currentOwner
    ? iniciaisDoEmail(currentOwner.email)
    : (ownerId ? ownerId.slice(0, 2).toUpperCase() : "?")

  if (isEditing) {
    return (
      <Select
        value={ownerId}
        onValueChange={async (newOwnerId) => {
          setIsEditing(false)
          if (newOwnerId !== ownerId) {
            try {
              const supabase = createClient()
              const { error } = await supabase
                .from("oportunidades")
                .update({ owner_id: newOwnerId })
                .eq("id", oportunidadeId)

              if (!error) {
                // Notifica o pai para refetch ou atualização otimista
                await onUpdate(oportunidadeId, { owner_id: newOwnerId })
              }
            } catch (err) {
              console.error("Erro ao atualizar responsável:", err)
            }
          }
        }}
        open={true}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false)
        }}
      >
        <SelectTrigger className="h-8 w-full min-w-[120px]">
          <SelectValue placeholder="Selecionar..." />
        </SelectTrigger>
        <SelectContent>
          {Object.values(perfisMap).map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.nome ?? usuarioDoEmail(user.email) ?? user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 h-full w-full"
      title={currentOwner?.email ?? ownerId}
    >
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="truncate text-sm">{displayName}</span>
    </div>
  )
}