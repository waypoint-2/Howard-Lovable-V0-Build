"use client"

import { useState } from "react"
import { DashboardNav } from "./dashboard-nav"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardStats } from "./dashboard-stats"
import { DashboardCharts } from "./dashboard-charts"
import { DashboardDocuments } from "./dashboard-documents"
import { DashboardActivity } from "./dashboard-activity"
import { DashboardRiskOverview } from "./dashboard-risk-overview"

export function DashboardView() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl">
            {/* Header */}
            <div className="animate-fade-in">
              <h1 className="font-serif text-2xl md:text-3xl font-medium text-foreground tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Overview of your document analysis and risk insights
              </p>
            </div>

            {/* Stats Grid */}
            <DashboardStats />

            {/* Charts Row */}
            <DashboardCharts />

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2">
                <DashboardDocuments />
              </div>
              <div className="space-y-4 lg:space-y-6">
                <DashboardRiskOverview />
                <DashboardActivity />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
