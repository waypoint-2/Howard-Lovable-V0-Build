"use client"

import { cn } from "@/lib/utils"

const weeklyData = [
  { day: "Mon", docs: 8, risk: 3 },
  { day: "Tue", docs: 12, risk: 5 },
  { day: "Wed", docs: 6, risk: 2 },
  { day: "Thu", docs: 15, risk: 4 },
  { day: "Fri", docs: 10, risk: 6 },
  { day: "Sat", docs: 3, risk: 1 },
  { day: "Sun", docs: 2, risk: 0 },
]

const maxDocs = Math.max(...weeklyData.map((d) => d.docs))

const riskDistribution = [
  { label: "Low Risk", value: 58, color: "success" },
  { label: "Medium Risk", value: 28, color: "warning" },
  { label: "High Risk", value: 14, color: "risk-high" },
]

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Documents Analyzed Chart */}
      <div className="p-5 md:p-6 rounded-2xl bg-card border border-border/50 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-foreground">Documents Analyzed</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
          </div>
          <select className="text-xs text-muted-foreground bg-accent/50 border-0 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-border">
            <option>This Week</option>
            <option>Last Week</option>
            <option>This Month</option>
          </select>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-40">
          {weeklyData.map((item, i) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center gap-1">
                {/* Risk bar */}
                <div
                  className="w-full max-w-[32px] bg-[var(--risk-high-bg)] rounded-t transition-all duration-500"
                  style={{
                    height: `${(item.risk / maxDocs) * 120}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
                {/* Docs bar */}
                <div
                  className="w-full max-w-[32px] bg-[var(--brand)] rounded-t transition-all duration-500"
                  style={{
                    height: `${(item.docs / maxDocs) * 120}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{item.day}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[var(--brand)]" />
            <span className="text-xs text-muted-foreground">Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[var(--risk-high-bg)]" />
            <span className="text-xs text-muted-foreground">High Risk</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="p-5 md:p-6 rounded-2xl bg-card border border-border/50 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-medium text-foreground">Risk Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Across all documents</p>
          </div>
        </div>

        {/* Donut-like visualization */}
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" />
              {/* Low risk arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--success)"
                strokeWidth="12"
                strokeDasharray={`${58 * 2.51} ${100 * 2.51}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              {/* Medium risk arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--warning)"
                strokeWidth="12"
                strokeDasharray={`${28 * 2.51} ${100 * 2.51}`}
                strokeDashoffset={`${-58 * 2.51}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              {/* High risk arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--risk-high)"
                strokeWidth="12"
                strokeDasharray={`${14 * 2.51} ${100 * 2.51}`}
                strokeDashoffset={`${-86 * 2.51}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-serif font-medium text-foreground">847</span>
              <span className="text-[10px] text-muted-foreground">Clauses</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {riskDistribution.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      item.color === "success" && "bg-[var(--success)]",
                      item.color === "warning" && "bg-[var(--warning)]",
                      item.color === "risk-high" && "bg-[var(--risk-high)]",
                    )}
                  />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
