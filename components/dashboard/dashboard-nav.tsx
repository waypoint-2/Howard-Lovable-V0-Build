"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Bell, Menu, Plus, Sparkles, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardNavProps {
  onMenuToggle: () => void
}

export function DashboardNav({ onMenuToggle }: DashboardNavProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="h-14 md:h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent/60 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-foreground/70" />
          </button>

          <Link href="/landing" className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-tight text-foreground">Howard</span>
            <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-[var(--brand-light)] text-[var(--brand)] rounded hidden sm:block">
              Pro
            </span>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className={cn("relative w-full transition-all duration-200", searchFocused && "scale-[1.02]")}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search documents, clauses..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "w-full h-10 pl-10 pr-4 rounded-xl bg-accent/40 border border-transparent",
                "text-sm text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:border-border focus:bg-card transition-all duration-200",
              )}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/40 bg-background/60 rounded border border-border/50">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden w-9 h-9 text-muted-foreground/60 hover:text-foreground"
          >
            <Search className="w-5 h-5" />
          </Button>

          <Button
            size="sm"
            className="hidden sm:flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Upload</span>
          </Button>

          <span className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--success)]" />
            <span className="text-xs font-medium text-[var(--success)]">AI Ready</span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="relative w-9 h-9 text-muted-foreground/60 hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--risk-high)] rounded-full" />
          </Button>

          <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-accent/60 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--info)] flex items-center justify-center">
              <span className="text-xs font-semibold text-white">JD</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}
