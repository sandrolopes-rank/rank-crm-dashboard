"use client"

import { useState, useEffect } from "react"
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
}

interface UserProfile {
  id: string
  email: string
  nome: string | null
}

export function ResponsibleCell({ ownerId, oportunidadeId, onUpdate }: ResponsibleCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [currentOwner, setCurrentOwner] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        const supabase = createClient()
        // Busca apenas os campos necessários e limita para performance
        const { data, error } = await supabase
          .from("perfis")
          .select("id, email, nome")
          .eq("status", "ativo")

        if (!error && data) {
          setUsers(data as UserProfile[])
          const owner = data.find((u) => u.id === ownerId) as UserProfile | undefined
          setCurrentOwner(owner ?? null)
        }
      } catch (err) {
        console.error("Erro ao carregar usuários:", err)
      } finally {
        setLoading(false)
      }
    }

    if (ownerId) {
      loadUsers()
    } else {
      setLoading(false)
    }
  }, [ownerId])

  // Fallback robusto: se não encontrar o usuário, mostra parte do ID ou "—"
  // Evita o "? —" genérico que não ajuda o usuário
  const displayName = currentOwner?.nome
    ?? usuarioDoEmail(currentOwner?.email)
    ?? (loading ? "..." : ownerId ? `${ownerId.slice(0, 6)}...` : "—")

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
                const newOwner = users.find((u) => u.id === newOwnerId) ?? null
                setCurrentOwner(newOwner)
                // Notifica o pai sobre a mudança se necessário
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
          {users.map((user) => (
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