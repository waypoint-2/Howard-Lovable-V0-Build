"use client"

import { cn } from "@/lib/utils"
import { FileText, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"

const stats = [
  {
    label: "Total Documents",
    value: "0",
    change: "+0",
    trend: "neutral" as const,
    icon: FileText,
    color: "brand" as const,
  },
  {
    label: "High Risk Clauses",
    value: "0",
    change: "+0",
    trend: "neutral" as const,
    icon: AlertTriangle,
    color: "risk-high" as const,
  },
  {
    label: "Reviewed",
    value: "0",
    change: "+0",
    trend: "neutral" as const,
    icon: CheckCircle2,
    color: "success" as const,
  },
  {
    label: "Pending Review",
    value: "0",
    change: "+0",
    trend: "neutral" as const,
    icon: Clock,
    color: "warning" as const,
  },
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "group relative p-4 md:p-5 rounded-2xl bg-card border border-border/50",
            "hover:border-border hover:shadow-sm transition-all duration-300",
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110",
              stat.color === "brand" && "bg-[var(--brand-light)]",
              stat.color === "risk-high" && "bg-[var(--risk-high-bg)]",
              stat.color === "success" && "bg-[var(--success-bg)]",
              stat.color === "warning" && "bg-[var(--warning-bg)]",
            )}
          >
            <stat.icon
              className={cn(
                "w-5 h-5",
                stat.color === "brand" && "text-[var(--brand)]",
                stat.color === "risk-high" && "text-[var(--risk-high)]",
                stat.color === "success" && "text-[var(--success)]",
                stat.color === "warning" && "text-[var(--warning)]",
              )}
            />
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-serif font-medium text-foreground">{stat.value}</span>
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                stat.trend === "up" && "text-[var(--success)]",
                stat.trend === "down" && "text-[var(--risk-high)]",
                stat.trend === "neutral" && "text-muted-foreground",
              )}
            >
              {stat.trend === "up" && <TrendingUp className="w-3 h-3" />}
              {stat.trend === "down" && <TrendingDown className="w-3 h-3" />}
              {stat.trend === "neutral" && <Minus className="w-3 h-3" />}
              {stat.change}
            </span>
          </div>

          {/* Label */}
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
