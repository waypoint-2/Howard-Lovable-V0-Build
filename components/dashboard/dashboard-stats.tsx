"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { FileText, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface StatData {
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: "brand" | "risk-high" | "success" | "warning"
}

export function DashboardStats() {
  const [stats, setStats] = useState<StatData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Fetch total documents
        const { count: totalDocs } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch analyses with risk levels
        const { data: analyses } = await supabase
          .from("analyses")
          .select("overall_risk, status")
          .eq("user_id", user.id)

        // Count high risk clauses
        const { data: clauses } = await supabase
          .from("clauses")
          .select("risk_level")
          .in(
            "analysis_id",
            analyses?.map((a) => a.id) || []
          )

        const highRiskCount = clauses?.filter((c) => c.risk_level === "high").length || 0
        const reviewedCount = analyses?.filter((a) => a.status === "completed").length || 0
        const pendingCount = analyses?.filter((a) => a.status === "processing").length || 0

        const newStats: StatData[] = [
          {
            label: "Total Documents",
            value: String(totalDocs || 0),
            change: "+0",
            trend: "neutral",
            icon: FileText,
            color: "brand",
          },
          {
            label: "High Risk Clauses",
            value: String(highRiskCount),
            change: "+0",
            trend: "neutral",
            icon: AlertTriangle,
            color: "risk-high",
          },
          {
            label: "Reviewed",
            value: String(reviewedCount),
            change: "+0",
            trend: "neutral",
            icon: CheckCircle2,
            color: "success",
          },
          {
            label: "Pending Review",
            value: String(pendingCount),
            change: "+0",
            trend: "neutral",
            icon: Clock,
            color: "warning",
          },
        ]

        setStats(newStats)
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 md:p-5 rounded-2xl bg-card border border-border/50 animate-pulse"
          >
            <div className="w-10 h-10 rounded-xl bg-muted mb-3" />
            <div className="h-8 bg-muted rounded w-12 mb-2" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

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
