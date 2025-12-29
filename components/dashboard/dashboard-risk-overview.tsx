"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, Shield, TrendingDown } from "lucide-react"

const riskItems = [
  {
    label: "Indemnification",
    count: 8,
    severity: "high",
    trend: "up",
  },
  {
    label: "Limitation of Liability",
    count: 6,
    severity: "high",
    trend: "down",
  },
  {
    label: "Termination Terms",
    count: 12,
    severity: "medium",
    trend: "neutral",
  },
  {
    label: "IP Assignment",
    count: 4,
    severity: "medium",
    trend: "down",
  },
]

export function DashboardRiskOverview() {
  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in">
      <div className="p-4 md:p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground text-sm">Top Risk Areas</h3>
          <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--success)]">
            <TrendingDown className="w-3 h-3" />
            -12% this week
          </span>
        </div>
      </div>

      <div className="p-3 md:p-4 space-y-3">
        {riskItems.map((item, i) => (
          <div key={item.label} className="flex items-center gap-3" style={{ animationDelay: `${i * 50}ms` }}>
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                item.severity === "high" && "bg-[var(--risk-high-bg)]",
                item.severity === "medium" && "bg-[var(--warning-bg)]",
              )}
            >
              {item.severity === "high" ? (
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--risk-high)]" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-[var(--warning)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                item.severity === "high"
                  ? "bg-[var(--risk-high-bg)] text-[var(--risk-high)]"
                  : "bg-[var(--warning-bg)] text-[var(--warning)]",
              )}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
