"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative pt-40 pb-32 px-6 min-h-[85vh] flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm text-muted-foreground mb-8 border border-border/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          Now in public beta
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-foreground mb-8 text-balance">
          Legal documents,
          <br />
          finally understood.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground/80 max-w-xl mx-auto leading-relaxed mb-12">
          Transform dense legal contracts into plain-language explanations. See what you're signing before you sign it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 h-12 text-base gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            asChild
          >
            <Link href="/home">
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 h-12 text-base border-border/50 hover:bg-secondary/50 transition-all duration-300 bg-transparent"
          >
            Watch demo
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground/60">
          <span>SOC 2 Compliant</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>256-bit encryption</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Instant analysis</span>
        </div>
      </div>
    </section>
  )
}
