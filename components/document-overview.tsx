"use client"

import { useState } from "react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DocumentOverviewProps {
  reviewedCount: number
  totalClauses: number
  onSwitchToReading: () => void
}

export function DocumentOverview({ reviewedCount, totalClauses, onSwitchToReading }: DocumentOverviewProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const insights = [
    {
      id: "attention",
      label: "Needs Attention",
      count: 2,
      color: "var(--risk-high)",
    },
    {
      id: "favorable",
      label: "In Your Favor",
      count: 5,
      color: "var(--risk-low)",
    },
    {
      id: "neutral",
      label: "Standard Terms",
      count: 5,
      color: "var(--muted-foreground)",
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto legal-scroll">
      <div className="max-w-xl mx-auto px-8 py-20">
        <div className="text-center mb-24">
          {/* Document type badge */}
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="text-xs tracking-widest uppercase text-muted-foreground/70">Software License</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/70">12 clauses</span>
          </div>

          {/* Document title */}
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight leading-tight mb-6">
            Analysis Complete
          </h1>

          {/* Subtle divider */}
          <div className="w-12 h-px bg-border mx-auto mb-6" />

          {/* Meta line */}
          <p className="text-sm text-muted-foreground">Reviewed by Howard in 4 seconds</p>
        </div>

        {/* Insights - Clean Cards */}
        <div className="space-y-2 mb-20">
          {insights.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-center justify-between py-4 px-5 rounded-xl transition-all duration-200 cursor-pointer",
                hoveredItem === item.id ? "bg-secondary/60" : "hover:bg-secondary/30",
              )}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground tabular-nums">{item.count}</span>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-muted-foreground/40 transition-all duration-200",
                    hoveredItem === item.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Howard's Summary - Conversational */}
        <div className="mb-20">
          <p className="text-muted-foreground leading-relaxed">
            This is a standard enterprise license. Two areas worth negotiating: the liability cap and indemnification
            terms. Everything else looks reasonable.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">— Howard</p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={onSwitchToReading}
            className="bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-full"
          >
            Begin Review
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground/60 mt-6">
            {reviewedCount} of {totalClauses} clauses reviewed
          </p>
        </div>
      </div>
    </div>
  )
}
