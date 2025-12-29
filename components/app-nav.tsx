"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, ChevronDown, Upload, Download, Share2, ChevronLeft, Sparkles, Menu } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface AppNavProps {
  onMenuToggle?: () => void
}

export function AppNav({ onMenuToggle }: AppNavProps) {
  const [fileMenuOpen, setFileMenuOpen] = useState(false)

  return (
    <header className="h-14 border-b border-border/60 bg-sidebar/80 backdrop-blur-sm flex items-center justify-between px-3 md:px-5 shrink-0 animate-fade-in">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors"
          aria-label="Open clause navigation"
        >
          <Menu className="w-5 h-5 text-foreground/70" />
        </button>

        <Link
          href="/landing"
          className="hidden md:flex w-8 h-8 bg-foreground/90 rounded-full items-center justify-center hover:bg-foreground hover:scale-105 transition-all duration-200"
          aria-label="Back to home"
        >
          <ChevronLeft className="w-4 h-4 text-background" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-serif text-lg tracking-tight text-foreground/90">Howard</span>
          <span className="hidden sm:inline px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-[var(--brand-light)] text-[var(--brand)] rounded">
            Pro
          </span>
        </div>

        <div className="h-4 w-px bg-border/60 hidden md:block" />

        {/* File Menu Dropdown - simplified on mobile */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setFileMenuOpen(!fileMenuOpen)}
            onBlur={() => setTimeout(() => setFileMenuOpen(false), 150)}
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-accent/60 transition-all duration-200"
          >
            <FileText className="w-4 h-4 text-muted-foreground/70" />
            <span className="text-sm text-foreground/80 truncate max-w-[120px] md:max-w-[200px]">
              Software License Agreement
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200",
                fileMenuOpen && "rotate-180",
              )}
            />
          </button>

          <div
            className={cn(
              "absolute top-full left-0 mt-1 w-56 bg-card border border-border/60 rounded-xl shadow-lg p-1.5 z-50",
              "transition-all duration-200 ease-out origin-top",
              fileMenuOpen
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
            )}
          >
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-accent/60 rounded-lg transition-colors duration-150">
              <Upload className="w-4 h-4 text-muted-foreground/60" />
              Upload new document
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-accent/60 rounded-lg transition-colors duration-150">
              <Download className="w-4 h-4 text-muted-foreground/60" />
              Export translations
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-accent/60 rounded-lg transition-colors duration-150">
              <Share2 className="w-4 h-4 text-muted-foreground/60" />
              Share document
            </button>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <span className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[10px] font-medium tracking-wide">
          <Sparkles className="w-3 h-3" />
          AI-Powered
        </span>

        <span className="text-xs text-muted-foreground/50 hidden md:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-subtle-pulse" />
          <span className="text-[var(--success)]">Saved</span>
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex text-muted-foreground/60 hover:text-foreground/80 hover:bg-accent/50 transition-colors duration-200"
        >
          Help
        </Button>

        <div className="w-8 h-8 rounded-full bg-accent/60 flex items-center justify-center hover:ring-2 hover:ring-[var(--brand)]/20 transition-all duration-200">
          <span className="text-xs font-medium text-muted-foreground/70">JD</span>
        </div>
      </div>
    </header>
  )
}
