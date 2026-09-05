"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Oportunidade, OportunidadeColuna, OportunidadeDados } from "@/lib/types/oportunidades"
import { criarOportunidade, atualizarOportunidade } from "@/app/(dashboard)/oportunidades/actions"
import { resolverValoresLinha } from "@/lib/formula"
import { formatarNumero } from "@/lib/format"

interface OportunidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colunas: OportunidadeColuna[]
  oportunidade?: Oportunidade | null
  onSuccess: () => void
}

export function OportunidadeModal({
  open,
  onOpenChange,
  colunas,
  oportunidade,
  onSuccess,
}: OportunidadeModalProps) {
  const [formData, setFormData] = useState<OportunidadeDados>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!oportunidade

  // Colunas editáveis (exclui "calculo")
  const editableColumns = useMemo(
    () => [...colunas].filter((c) => c.tipo !== "calculo").sort((a, b) => a.ordem - b.ordem),
    [colunas]
  )

  // Preenche formulário ao abrir para edição
  useEffect(() => {
    if (open && oportunidade) {
      setFormData({ ...oportunidade.dados })
    } else if (open) {
      // Reset para criação
      const empty: OportunidadeDados = {}
      for (const col of editableColumns) {
        empty[col.key] = null
      }
      setFormData(empty)
    }
    setErrors({})
  }, [open, oportunidade, editableColumns])

  // Preview de cálculos em tempo real
  const resolvedValues = useMemo(() => {
    try {
      return resolverValoresLinha(colunas, formData)
    } catch {
      return {}
    }
  }, [colunas, formData])

  const handleChange = (key: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    // Limpa erro do campo ao editar
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    // Validação client-side básica
    const newErrors: Record<string, string> = {}
    for (const col of editableColumns) {
      if (col.obrigatorio) {
        const val = formData[col.key]
        if (val === null || val === undefined || val === "") {
          newErrors[col.key] = `O campo "${col.label}" é obrigatório.`
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const result = isEditing
        ? await atualizarOportunidade(oportunidade!.id, formData)
        : await criarOportunidade(formData)

      if (!result.ok) {
        toast.error(result.erro)
        setIsSubmitting(false)
        return
      }

      toast.success(isEditing ? "Oportunidade atualizada!" : "Oportunidade criada!")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Oportunidade" : "Nova Oportunidade"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da oportunidade."
              : "Preencha os dados para criar uma nova oportunidade."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {editableColumns.map((coluna) => {
            const value = formData[coluna.key] ?? ""
            const error = errors[coluna.key]

            return (
              <div key={coluna.key} className="grid gap-2">
                <Label htmlFor={`field-${coluna.key}`}>
                  {coluna.label}
                  {coluna.obrigatorio && <span className="text-destructive ml-1">*</span>}
                </Label>

                {coluna.tipo === "select" ? (
                  <Select
                    value={String(value ?? "")}
                    onValueChange={(v) => handleChange(coluna.key, v || null)}
                  >
                    <SelectTrigger id={`field-${coluna.key}`} className={error ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {((coluna.config as { opcoes?: { id: string; label: string }[] })?.opcoes ?? []).map(
                        (opcao) => (
                          <SelectItem key={opcao.id} value={opcao.id}>
                            {opcao.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                ) : coluna.tipo === "data" ? (
                  <Input
                    id={`field-${coluna.key}`}
                    type="date"
                    value={String(value ?? "")}
                    onChange={(e) => handleChange(coluna.key, e.target.value || null)}
                    className={error ? "border-destructive" : ""}
                  />
                ) : coluna.tipo === "monetario" ? (
                  <Input
                    id={`field-${coluna.key}`}
                    type="number"
                    step="0.01"
                    value={value != null ? String(value) : ""}
                    onChange={(e) => {
                      const raw = e.target.value
                      handleChange(coluna.key, raw === "" ? null : parseFloat(raw))
                    }}
                    placeholder="0.00"
                    className={error ? "border-destructive" : ""}
                  />
                ) : (
                  <Input
                    id={`field-${coluna.key}`}
                    type="text"
                    value={String(value ?? "")}
                    onChange={(e) => handleChange(coluna.key, e.target.value || null)}
                    className={error ? "border-destructive" : ""}
                  />
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            )
          })}

          {/* Preview de colunas calculadas */}
          {colunas.some((c) => c.tipo === "calculo") && (
            <div className="mt-4 rounded-lg border p-4 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">Campos Calculados</h4>
              <div className="grid gap-2">
                {colunas
                  .filter((c) => c.tipo === "calculo")
                  .map((coluna) => {
                    const calcValue = resolvedValues[coluna.key]
                    return (
                      <div key={coluna.key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{coluna.label}</span>
                        <span className="italic tabular-nums">
                          {typeof calcValue === "number" ? formatarNumero(calcValue) : "—"}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}