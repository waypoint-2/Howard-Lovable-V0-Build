"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewAnalysisTab } from "./new-analysis-tab"
import { RecentTab } from "./recent-tab"
import { WorkspaceTab } from "./workspace-tab"
import { HomeNav } from "./home-nav"

const greetings = [
  { name: "Sarah", suffix: "Welcome back." },
  { name: "Michael", suffix: "Good to see you." },
  { name: "Emily", suffix: "Ready to analyze." },
  { name: "James", suffix: "Let's get started." },
  { name: "Olivia", suffix: "Welcome back." },
]

export function ProductHome() {
  const [greeting, setGreeting] = useState(greetings[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Pick a random greeting on mount
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    setGreeting(randomGreeting)
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomeNav />

      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-16">
        <div
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full 
            bg-card border border-border/60 shadow-sm
            transition-all duration-500
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
          `}
        >
          <span className="text-sm text-muted-foreground">Pro Plan</span>
          <span className="text-muted-foreground/40">·</span>
          <button className="text-sm font-medium text-[var(--brand)] hover:underline transition-colors">Manage</button>
        </div>

        <div
          className={`
            mt-8 md:mt-12 text-center
            transition-all duration-700 delay-100
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight">
            {greeting.name}, {greeting.suffix}
          </h1>
        </div>

        <div
          className={`
            w-full max-w-4xl mt-10 md:mt-14
            transition-all duration-700 delay-200
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <Tabs defaultValue="recent" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="inline-flex h-12 items-center justify-center rounded-full bg-muted/50 p-1.5 text-muted-foreground border border-border/40">
                <TabsTrigger
                  value="recent"
                  className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Recent
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  New Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="workspace"
                  className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Workspace
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recent" className="mt-0 animate-fade-in">
              <RecentTab />
            </TabsContent>

            <TabsContent value="new" className="mt-0 animate-fade-in">
              <NewAnalysisTab />
            </TabsContent>

            <TabsContent value="workspace" className="mt-0 animate-fade-in">
              <WorkspaceTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
