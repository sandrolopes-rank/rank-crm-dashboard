"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatarData } from "@/lib/format"

interface DateCellProps {
  value: string | null
  onUpdate: (value: string | null) => Promise<void>
}

export function DateCell({ value, onUpdate }: DateCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  // Formato para input type="month": YYYY-MM
  const [editValue, setEditValue] = useState(value ? value.slice(0, 7) : "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleBlur = async () => {
    setIsEditing(false)
    // Converte YYYY-MM para YYYY-MM-01 ou null
    let newValue: string | null = null
    if (editValue) {
      newValue = `${editValue}-01`
    }
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
      setEditValue(value ? value.slice(0, 7) : "")
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="month"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 w-36 border-transparent bg-transparent shadow-none focus-visible:border focus-visible:bg-background"
      />
    )
  }

  // Exibe como MM/AAAA
  const displayValue = value ? (() => {
    const [ano, mes] = value.split("-")
    if (!ano || !mes) return value
    return `${mes}/${ano}`
  })() : "—"

  return (
    <span
      onClick={() => {
        setEditValue(value ? value.slice(0, 7) : "")
        setIsEditing(true)
      }}
      className="flex items-center cursor-pointer rounded px-1 py-0.5 tabular-nums hover:bg-muted/50 h-full"
    >
      {displayValue}
    </span>
  )
}