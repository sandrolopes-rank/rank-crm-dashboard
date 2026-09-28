"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ColunaConfig, ColunaTipo, OportunidadeColuna, OpcaoSelect } from "@/lib/types/oportunidades"
import {
  criarColuna,
  atualizarColuna,
  excluirColuna,
  reordenarColunas,
  type DadosColuna,
} from "../colunas/actions"

const TIPOS_COLUNA: { value: ColunaTipo; label: string }[] = [
  { value: "texto", label: "Texto" },
  { value: "monetario", label: "Monetário" },
  { value: "select", label: "Select" },
  { value: "data", label: "Data" },
  { value: "calculo", label: "Cálculo" },
]

interface ColunasManagerProps {
  colunas: OportunidadeColuna[]
  onRefresh: () => void
}

export function ColunasManager({ colunas, onRefresh }: ColunasManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OportunidadeColuna | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Estado do formulário
  const [formLabel, setFormLabel] = useState("")
  const [formTipo, setFormTipo] = useState<ColunaTipo>("texto")
  const [formObrigatorio, setFormObrigatorio] = useState(false)
  const [formDataReferencia, setFormDataReferencia] = useState(false)
  const [formFormula, setFormFormula] = useState("")
  const [formOpcoes, setFormOpcoes] = useState<OpcaoSelect[]>([{ id: "1", label: "" }])

  const resetForm = () => {
    setFormLabel("")
    setFormTipo("texto")
    setFormObrigatorio(false)
    setFormDataReferencia(false)
    setFormFormula("")
    setFormOpcoes([{ id: "1", label: "" }])
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (coluna: OportunidadeColuna) => {
    setEditingId(coluna.id)
    setFormLabel(coluna.label)
    setFormTipo(coluna.tipo)
    setFormObrigatorio(coluna.obrigatorio)
    setFormDataReferencia(coluna.eh_data_referencia)
    if (coluna.tipo === "calculo") {
      setFormFormula((coluna.config as { formula?: string }).formula ?? "")
    }
    if (coluna.tipo === "select") {
      const opcoes = (coluna.config as { opcoes?: OpcaoSelect[] }).opcoes ?? []
      setFormOpcoes(opcoes.length > 0 ? opcoes : [{ id: "1", label: "" }])
    }
    setShowForm(true)
  }

  const buildConfig = (): ColunaConfig => {
    switch (formTipo) {
      case "select":
        return { opcoes: formOpcoes.filter((o) => o.label.trim()) } as ColunaConfig
      case "calculo":
        return { formula: formFormula } as ColunaConfig
      default:
        return {} as ColunaConfig
    }
  }

  const handleSubmit = () => {
    const dados: DadosColuna = {
      label: formLabel,
      tipo: formTipo,
      obrigatorio: formObrigatorio,
      config: buildConfig(),
      ehDataReferencia: formDataReferencia,
    }

    startTransition(async () => {
      const result = editingId
        ? await atualizarColuna(editingId, dados)
        : await criarColuna(dados)

      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      toast.success(editingId ? "Coluna atualizada!" : "Coluna criada!")
      resetForm()
      onRefresh()
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await excluirColuna(deleteTarget.id)
      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      toast.success("Coluna excluída!")
      setDeleteTarget(null)
      onRefresh()
    })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const ids = [...colunas.map((c) => c.id)]
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    startTransition(async () => {
      const result = await reordenarColunas(ids)
      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      onRefresh()
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === colunas.length - 1) return
    const ids = [...colunas.map((c) => c.id)]
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    startTransition(async () => {
      const result = await reordenarColunas(ids)
      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      onRefresh()
    })
  }

  const addOpcao = () => {
    setFormOpcoes([...formOpcoes, { id: String(formOpcoes.length + 1), label: "" }])
  }

  const removeOpcao = (index: number) => {
    setFormOpcoes(formOpcoes.filter((_, i) => i !== index))
  }

  const updateOpcao = (index: number, label: string) => {
    const next = [...formOpcoes]
    next[index] = { ...next[index], label }
    setFormOpcoes(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Colunas ({colunas.length})</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }} disabled={isPending}>
          <Plus className="size-4 mr-1.5" />
          Nova Coluna
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium text-sm">{editingId ? "Editar Coluna" : "Nova Coluna"}</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Ex: Valor Atual" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={formTipo} onValueChange={(v) => setFormTipo(v as ColunaTipo)} disabled={!!editingId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_COLUNA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formTipo === "select" && (
            <div className="space-y-2">
              <Label className="text-xs">Opções do Select</Label>
              {formOpcoes.map((opcao, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={opcao.label}
                    onChange={(e) => updateOpcao(i, e.target.value)}
                    placeholder={`Opção ${i + 1}`}
                    className="flex-1"
                  />
                  {formOpcoes.length > 1 && (
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => removeOpcao(i)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOpcao}>
                <Plus className="size-3.5 mr-1" /> Adicionar opção
              </Button>
            </div>
          )}

          {formTipo === "calculo" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Fórmula</Label>
              <Input value={formFormula} onChange={(e) => setFormFormula(e.target.value)} placeholder="Ex: {valor_atual} * {probabilidade}" />
              <p className="text-xs text-muted-foreground">Use {"{chave_da_coluna}"} para referenciar outras colunas.</p>
            </div>
          )}

          {formTipo === "data" && (
            <div className="flex items-center gap-2">
              <Checkbox checked={formDataReferencia} onCheckedChange={(v) => setFormDataReferencia(!!v)} id="data-ref" />
              <Label htmlFor="data-ref" className="text-xs cursor-pointer">Marcar como data de referência (eixo do gráfico)</Label>
            </div>
          )}

          {formTipo !== "calculo" && (
            <div className="flex items-center gap-2">
              <Checkbox checked={formObrigatorio} onCheckedChange={(v) => setFormObrigatorio(!!v)} id="obrigatorio" />
              <Label htmlFor="obrigatorio" className="text-xs cursor-pointer">Campo obrigatório</Label>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={isPending || !formLabel.trim()}>
              {isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </Button>
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border divide-y">
        {colunas.map((coluna, index) => (
          <div key={coluna.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
            <div className="flex flex-col gap-0.5">
              <Button variant="ghost" size="icon" className="size-6" onClick={() => handleMoveUp(index)} disabled={index === 0 || isPending}>
                <ArrowUp className="size-3" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => handleMoveDown(index)} disabled={index === colunas.length - 1 || isPending}>
                <ArrowDown className="size-3" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{coluna.label}</span>
                {coluna.eh_data_referencia && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Data Ref.</span>
                )}
                {coluna.obrigatorio && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Obrigatório</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {coluna.tipo} · {coluna.key}
                {coluna.tipo === "calculo" && ` · ${(coluna.config as { formula?: string }).formula ?? ""}`}
                {coluna.tipo === "select" && ` · ${((coluna.config as { opcoes?: OpcaoSelect[] }).opcoes ?? []).length} opções`}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(coluna)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDeleteTarget(coluna)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {colunas.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma coluna configurada. Clique em "Nova Coluna" para começar.
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.label}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}