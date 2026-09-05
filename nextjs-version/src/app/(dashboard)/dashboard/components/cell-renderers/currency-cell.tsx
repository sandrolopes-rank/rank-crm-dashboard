"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatarMoeda } from "@/lib/format"

interface CurrencyCellProps {
  value: number | null
  onUpdate: (value: number | null) => Promise<void>
}

export function CurrencyCell({ value, onUpdate }: CurrencyCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = async () => {
    setIsEditing(false)
    const parsed = parseFloat(editValue.replace(/\./g, "").replace(",", "."))
    const newValue = isNaN(parsed) ? null : parsed
    if (newValue !== value) {
      await onUpdate(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      inputRef.current?.blur()
    }
    if (e.key === "Escape") {
      setEditValue(value?.toString() ?? "")
      setIsEditing(false)
    }
  }

  // Máscara simples: permite apenas números, vírgula e ponto
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Permite dígitos, vírgula e ponto decimal
    if (/^[\d.,]*$/.test(raw)) {
      setEditValue(raw)
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 w-28 text-right border-transparent bg-transparent shadow-none focus-visible:border focus-visible:bg-background"
        placeholder="0,00"
      />
    )
  }

  const displayValue = value != null ? formatarMoeda(value) : "—"

  return (
    <span
      onClick={() => {
        setEditValue(value?.toString() ?? "")
        setIsEditing(true)
      }}
      className="flex items-center cursor-pointer rounded px-1 py-0.5 tabular-nums hover:bg-muted/50 h-full"
    >
      {displayValue}
    </span>
  )
}