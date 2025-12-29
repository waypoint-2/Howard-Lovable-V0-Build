"use client"

import { cn } from "@/lib/utils"

interface ReadingModeToggleProps {
  mode: "reading" | "overview"
  onModeChange: (mode: "reading" | "overview") => void
}

export function ReadingModeToggle({ mode, onModeChange }: ReadingModeToggleProps) {
  return (
    <div className="flex bg-secondary/60 rounded-lg p-0.5 shadow-sm">
      <button
        onClick={() => onModeChange("reading")}
        className={cn(
          "px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ease-out",
          mode === "reading"
            ? "bg-background text-foreground/90 shadow-sm"
            : "text-muted-foreground/60 hover:text-muted-foreground",
        )}
      >
        Reading
      </button>
      <button
        onClick={() => onModeChange("overview")}
        className={cn(
          "px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ease-out",
          mode === "overview"
            ? "bg-background text-foreground/90 shadow-sm"
            : "text-muted-foreground/60 hover:text-muted-foreground",
        )}
      >
        Overview
      </button>
    </div>
  )
}
