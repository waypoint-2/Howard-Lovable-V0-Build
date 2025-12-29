"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  AlertTriangle,
  Users,
  Settings,
  HelpCircle,
  X,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react"

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", active: true },
  { icon: FileText, label: "Documents", href: "/dashboard/documents", badge: "12" },
  { icon: FolderOpen, label: "Projects", href: "/dashboard/projects" },
  { icon: AlertTriangle, label: "Risk Alerts", href: "/dashboard/alerts", badge: "3", badgeColor: "risk-high" },
  { icon: TrendingUp, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Clock, label: "Recent", href: "/dashboard/recent" },
  { icon: Star, label: "Starred", href: "/dashboard/starred" },
]

const bottomItems = [
  { icon: Users, label: "Team", href: "/dashboard/team" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help & Support", href: "/dashboard/help" },
]

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-border/50 z-50",
          "flex flex-col transition-transform duration-300 ease-out",
          "lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile Header */}
        <div className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-border/50">
          <span className="font-medium text-foreground">Menu</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/60 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  item.active
                    ? "bg-accent/80 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("w-4.5 h-4.5", item.active ? "text-foreground" : "text-muted-foreground/70")}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded-full",
                      item.badgeColor === "risk-high"
                        ? "bg-[var(--risk-high-bg)] text-[var(--risk-high)] border border-[var(--risk-high-border)]"
                        : "bg-accent text-muted-foreground",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border/50" />

          {/* Bottom Items */}
          <div className="space-y-1">
            {bottomItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200"
              >
                <item.icon className="w-4.5 h-4.5 text-muted-foreground/70" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Usage Card */}
        <div className="p-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--brand-light)] to-accent/30 border border-[var(--brand)]/10">
            <p className="text-xs font-medium text-foreground/80">Monthly Usage</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-serif font-medium text-foreground">847</span>
              <span className="text-xs text-muted-foreground mb-1">/ 1,000 pages</span>
            </div>
            <div className="mt-3 h-1.5 bg-background/60 rounded-full overflow-hidden">
              <div className="h-full w-[84.7%] bg-[var(--brand)] rounded-full transition-all duration-500" />
            </div>
            <button className="mt-3 w-full py-2 text-xs font-medium text-[var(--brand)] hover:text-foreground transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
