"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TextCellProps {
  value: string | null
  onUpdate: (value: string | null) => Promise<void>
}

export function TextCell({ value, onUpdate }: TextCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = async () => {
    setIsEditing(false)
    const trimmed = editValue.trim()
    const newValue = trimmed || null
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
      setEditValue(value ?? "")
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 w-full border-transparent bg-transparent shadow-none focus-visible:border focus-visible:bg-background"
      />
    )
  }

  const displayValue = value ?? "—"

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            onClick={() => {
              setEditValue(value ?? "")
              setIsEditing(true)
            }}
            className="flex items-center truncate cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50 h-full text-left"
          >
            {displayValue}
          </span>
        </TooltipTrigger>
        {value && value.length > 30 && (
          <TooltipContent side="bottom" align="start" className="max-w-xs">
            <p className="whitespace-pre-wrap">{value}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}