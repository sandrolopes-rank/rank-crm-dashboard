"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type {
  CardAgregacao,
  FiltroOperador,
  OportunidadeCard,
  OportunidadeCardFiltro,
  OportunidadeColuna,
  OrientacaoBarra,
  TipoVisualizacaoCard,
} from "@/lib/types/oportunidades"
import { OPERADORES_POR_TIPO } from "@/lib/types/oportunidades"
import {
  criarCard,
  atualizarCard,
  excluirCard,
  reordenarCards,
  type DadosCard,
  type DadosFiltro,
} from "../colunas/cards-actions"

const AGREGACOES: { value: CardAgregacao; label: string }[] = [
  { value: "soma", label: "Soma" },
  { value: "media", label: "Média" },
  { value: "contagem", label: "Contagem" },
  { value: "minimo", label: "Mínimo" },
  { value: "maximo", label: "Máximo" },
]

const VISUALIZACOES: { value: TipoVisualizacaoCard; label: string }[] = [
  { value: "numero", label: "Número" },
  { value: "linha", label: "Linha (gráfico)" },
  { value: "barras", label: "Barras" },
  { value: "rosca", label: "Rosca" },
]

const ORIENTACOES: { value: OrientacaoBarra; label: string }[] = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
]

interface CardsManagerProps {
  cards: OportunidadeCard[]
  filtrosPorCard: Record<string, OportunidadeCardFiltro[]>
  colunas: OportunidadeColuna[]
  onRefresh: () => void
}

export function CardsManager({ cards, filtrosPorCard, colunas, onRefresh }: CardsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OportunidadeCard | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [formLabel, setFormLabel] = useState("")
  const [formColunaId, setFormColunaId] = useState("")
  const [formAgregacao, setFormAgregacao] = useState<CardAgregacao>("soma")
  const [formVisualizacao, setFormVisualizacao] = useState<TipoVisualizacaoCard>("numero")
  const [formColunaDataId, setFormColunaDataId] = useState("")
  const [formColunaAgrupamentoId, setFormColunaAgrupamentoId] = useState("")
  const [formOrientacao, setFormOrientacao] = useState<OrientacaoBarra>("vertical")
  const [formFiltros, setFormFiltros] = useState<DadosFiltro[]>([])

  const colunasData = colunas.filter((c) => c.tipo === "data")
  const colunasSelect = colunas.filter((c) => c.tipo === "select")

  const resetForm = () => {
    setFormLabel("")
    setFormColunaId("")
    setFormAgregacao("soma")
    setFormVisualizacao("numero")
    setFormColunaDataId("")
    setFormColunaAgrupamentoId("")
    setFormOrientacao("vertical")
    setFormFiltros([])
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (card: OportunidadeCard) => {
    setEditingId(card.id)
    setFormLabel(card.label)
    setFormColunaId(card.coluna_id)
    setFormAgregacao(card.agregacao)
    setFormVisualizacao(card.tipo_visualizacao)
    setFormColunaDataId(card.coluna_data_id ?? "")
    setFormColunaAgrupamentoId(card.coluna_agrupamento_id ?? "")
    setFormOrientacao(card.orientacao_barra)
    const filtros = filtrosPorCard[card.id] ?? []
    setFormFiltros(filtros.map((f) => ({ colunaId: f.coluna_id, operador: f.operador, valores: f.valores })))
    setShowForm(true)
  }

  const addFiltro = () => {
    const primeiraColuna = colunas[0]
    if (!primeiraColuna) return
    setFormFiltros([...formFiltros, { colunaId: primeiraColuna.id, operador: OPERADORES_POR_TIPO[primeiraColuna.tipo][0], valores: [] }])
  }

  const removeFiltro = (index: number) => {
    setFormFiltros(formFiltros.filter((_, i) => i !== index))
  }

  const updateFiltro = (index: number, field: keyof DadosFiltro, value: unknown) => {
    const next = [...formFiltros]
    if (field === "colunaId") {
      const coluna = colunas.find((c) => c.id === value)
      next[index] = { colunaId: value as string, operador: coluna ? OPERADORES_POR_TIPO[coluna.tipo][0] : "eq", valores: [] }
    } else {
      next[index] = { ...next[index], [field]: value }
    }
    setFormFiltros(next)
  }

  const handleSubmit = () => {
    const dados: DadosCard = {
      colunaId: formColunaId,
      agregacao: formAgregacao,
      label: formLabel,
      filtros: formFiltros,
      tipoVisualizacao: formVisualizacao,
      colunaDataId: formVisualizacao === "linha" ? formColunaDataId || null : null,
      colunaAgrupamentoId: (formVisualizacao === "barras" || formVisualizacao === "rosca") ? formColunaAgrupamentoId || null : null,
      orientacaoBarra: formOrientacao,
    }

    startTransition(async () => {
      const result = editingId
        ? await atualizarCard(editingId, dados)
        : await criarCard(dados)

      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      toast.success(editingId ? "Card atualizado!" : "Card criado!")
      resetForm()
      onRefresh()
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await excluirCard(deleteTarget.id)
      if (!result.ok) {
        toast.error(result.erro)
        return
      }
      toast.success("Card excluído!")
      setDeleteTarget(null)
      onRefresh()
    })
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const ids = [...cards.map((c) => c.id)]
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    startTransition(async () => {
      const result = await reordenarCards(ids)
      if (!result.ok) { toast.error(result.erro); return }
      onRefresh()
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === cards.length - 1) return
    const ids = [...cards.map((c) => c.id)]
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    startTransition(async () => {
      const result = await reordenarCards(ids)
      if (!result.ok) { toast.error(result.erro); return }
      onRefresh()
    })
  }

  const getColunaLabel = (id: string) => colunas.find((c) => c.id === id)?.label ?? id

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cards ({cards.length})</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }} disabled={isPending}>
          <Plus className="size-4 mr-1.5" />
          Novo Card
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium text-sm">{editingId ? "Editar Card" : "Novo Card"}</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Card</Label>
              <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Ex: Receita Total" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Coluna</Label>
              <Select value={formColunaId} onValueChange={setFormColunaId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {colunas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label} ({c.tipo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Agregação</Label>
              <Select value={formAgregacao} onValueChange={(v) => setFormAgregacao(v as CardAgregacao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGREGACOES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Visualização</Label>
              <Select value={formVisualizacao} onValueChange={(v) => setFormVisualizacao(v as TipoVisualizacaoCard)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISUALIZACOES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formVisualizacao === "barras" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Orientação</Label>
                <Select value={formOrientacao} onValueChange={(v) => setFormOrientacao(v as OrientacaoBarra)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORIENTACOES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formVisualizacao === "linha" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Coluna de Data (eixo X)</Label>
              <Select value={formColunaDataId} onValueChange={setFormColunaDataId}>
                <SelectTrigger><SelectValue placeholder="Usar data de referência" /></SelectTrigger>
                <SelectContent>
                  {colunasData.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(formVisualizacao === "barras" || formVisualizacao === "rosca") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Agrupar por (Select)</Label>
              <Select value={formColunaAgrupamentoId} onValueChange={setFormColunaAgrupamentoId}>
                <SelectTrigger><SelectValue placeholder="Por responsável" /></SelectTrigger>
                <SelectContent>
                  {colunasSelect.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Filtros</Label>
              <Button variant="outline" size="sm" onClick={addFiltro} className="h-7 text-xs">
                <Plus className="size-3 mr-1" /> Filtro
              </Button>
            </div>
            {formFiltros.map((filtro, i) => {
              const coluna = colunas.find((c) => c.id === filtro.colunaId)
              const operadores = coluna ? OPERADORES_POR_TIPO[coluna.tipo] : []
              return (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={filtro.colunaId} onValueChange={(v) => updateFiltro(i, "colunaId", v)}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {colunas.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filtro.operador} onValueChange={(v) => updateFiltro(i, "operador", v)}>
                    <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {operadores.map((op) => (
                        <SelectItem key={op} value={op} className="text-xs">{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-xs flex-1"
                    placeholder="Valor..."
                    value={filtro.valores[0]?.toString() ?? ""}
                    onChange={(e) => updateFiltro(i, "valores", [e.target.value])}
                  />
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => removeFiltro(i)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={isPending || !formLabel.trim() || !formColunaId}>
              {isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </Button>
            <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border divide-y">
        {cards.map((card, index) => {
          const filtros = filtrosPorCard[card.id] ?? []
          return (
            <div key={card.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="size-6" onClick={() => handleMoveUp(index)} disabled={index === 0 || isPending}>
                  <ArrowUp className="size-3" />
                </Button>
                <Button variant="ghost" size="icon" className="size-6" onClick={() => handleMoveDown(index)} disabled={index === cards.length - 1 || isPending}>
                  <ArrowDown className="size-3" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{card.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{card.tipo_visualizacao}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {getColunaLabel(card.coluna_id)} · {card.agregacao}
                  {filtros.length > 0 && ` · ${filtros.length} filtro(s)`}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => startEdit(card)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDeleteTarget(card)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
        {cards.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum card configurado. Clique em "Novo Card" para começar.
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir card</AlertDialogTitle>
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