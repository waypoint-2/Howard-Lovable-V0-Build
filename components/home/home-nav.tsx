"use client"

import Link from "next/link"
import { Bell, Settings, HelpCircle } from "lucide-react"

export function HomeNav() {
  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 animate-fade-in">
      {/* Logo */}
      <Link href="/landing" className="flex items-center gap-2.5 group">
        <span className="font-serif text-xl tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">
          Howard
        </span>
      </Link>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all relative">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--risk-high)]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
          <Settings className="w-[18px] h-[18px]" />
        </button>
        <div className="w-px h-6 bg-border/60 mx-2" />
        <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-accent/50 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--info)] flex items-center justify-center">
            <span className="text-xs font-semibold text-white">SJ</span>
          </div>
          <span className="text-sm font-medium text-foreground hidden md:block">Sarah J.</span>
        </button>
      </div>
    </header>
  )
}
