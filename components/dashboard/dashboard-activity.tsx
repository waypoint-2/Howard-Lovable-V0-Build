"use client"

import { cn } from "@/lib/utils"
import { FileText, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "review",
    user: "Sarah Chen",
    action: "completed review of",
    target: "NDA - TechStart",
    time: "10 min ago",
    icon: CheckCircle2,
    color: "success",
  },
  {
    id: 2,
    type: "alert",
    user: "System",
    action: "flagged high-risk clause in",
    target: "Vendor Agreement",
    time: "25 min ago",
    icon: AlertTriangle,
    color: "risk-high",
  },
  {
    id: 3,
    type: "comment",
    user: "Mike Johnson",
    action: "commented on",
    target: "License Agreement",
    time: "1 hour ago",
    icon: MessageSquare,
    color: "brand",
  },
  {
    id: 4,
    type: "upload",
    user: "You",
    action: "uploaded",
    target: "Partnership Draft",
    time: "3 hours ago",
    icon: FileText,
    color: "muted",
  },
]

export function DashboardActivity() {
  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in">
      <div className="p-4 md:p-5 border-b border-border/50">
        <h3 className="font-medium text-foreground text-sm">Recent Activity</h3>
      </div>

      <div className="p-3 md:p-4 space-y-3">
        {activities.map((activity, i) => (
          <div key={activity.id} className="flex items-start gap-3" style={{ animationDelay: `${i * 50}ms` }}>
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                activity.color === "success" && "bg-[var(--success-bg)]",
                activity.color === "risk-high" && "bg-[var(--risk-high-bg)]",
                activity.color === "brand" && "bg-[var(--brand-light)]",
                activity.color === "muted" && "bg-accent",
              )}
            >
              <activity.icon
                className={cn(
                  "w-3.5 h-3.5",
                  activity.color === "success" && "text-[var(--success)]",
                  activity.color === "risk-high" && "text-[var(--risk-high)]",
                  activity.color === "brand" && "text-[var(--brand)]",
                  activity.color === "muted" && "text-muted-foreground",
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground/80 leading-relaxed">
                <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
