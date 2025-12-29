"use client"

import { useState } from "react"
import { Folder, FileText, Plus, ChevronRight, FolderPlus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Matter {
  id: string
  name: string
  documentsCount: number
  lastUpdated: string
  documents: {
    id: string
    title: string
    type: string
  }[]
}

const matters: Matter[] = [
  {
    id: "1",
    name: "Acme Corp Acquisition",
    documentsCount: 12,
    lastUpdated: "Today",
    documents: [
      { id: "1a", title: "Due Diligence Report", type: "Report" },
      { id: "1b", title: "Asset Purchase Agreement", type: "Contract" },
      { id: "1c", title: "IP Assignment Agreement", type: "Contract" },
    ],
  },
  {
    id: "2",
    name: "Series B Financing",
    documentsCount: 8,
    lastUpdated: "Yesterday",
    documents: [
      { id: "2a", title: "Term Sheet", type: "Term Sheet" },
      { id: "2b", title: "Stock Purchase Agreement", type: "Contract" },
    ],
  },
  {
    id: "3",
    name: "Employment Matters",
    documentsCount: 24,
    lastUpdated: "3 days ago",
    documents: [
      { id: "3a", title: "Standard Employment Contract", type: "Template" },
      { id: "3b", title: "Contractor Agreement", type: "Template" },
      { id: "3c", title: "Non-Compete Agreement", type: "Template" },
    ],
  },
  {
    id: "4",
    name: "Vendor Contracts",
    documentsCount: 15,
    lastUpdated: "1 week ago",
    documents: [
      { id: "4a", title: "AWS Service Agreement", type: "SaaS" },
      { id: "4b", title: "Stripe Payment Terms", type: "SaaS" },
    ],
  },
]

export function WorkspaceTab() {
  const [expandedMatter, setExpandedMatter] = useState<string | null>("1")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMatters = matters.filter(
    (matter) =>
      matter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matter.documents.some((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workspace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border/60 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/40 transition-all"
          />
        </div>
        <Button className="rounded-full gap-2 bg-foreground text-background hover:bg-foreground/90">
          <FolderPlus className="w-4 h-4" />
          New Matter
        </Button>
      </div>

      {/* Matters List */}
      <div className="space-y-2">
        {filteredMatters.map((matter, index) => (
          <div key={matter.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
            {/* Matter Header */}
            <button
              onClick={() => setExpandedMatter(expandedMatter === matter.id ? null : matter.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl",
                "bg-card border border-border/40 hover:border-border/80",
                "transition-all duration-200",
                expandedMatter === matter.id && "rounded-b-none border-b-0",
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-accent/60 flex items-center justify-center">
                <Folder className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex-1 text-left">
                <h3 className="font-medium text-foreground">{matter.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {matter.documentsCount} documents · Updated {matter.lastUpdated}
                </p>
              </div>

              <ChevronRight
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  expandedMatter === matter.id && "rotate-90",
                )}
              />
            </button>

            {/* Expanded Documents */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                expandedMatter === matter.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="bg-card border border-t-0 border-border/40 rounded-b-xl px-4 pb-3">
                <div className="border-l-2 border-border/60 ml-5 pl-6 space-y-1 pt-2">
                  {matter.documents.map((doc) => (
                    <button
                      key={doc.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sm text-foreground group-hover:text-[var(--brand)] transition-colors">
                        {doc.title}
                      </span>
                      <span className="text-xs text-muted-foreground/60 px-2 py-0.5 rounded-full bg-accent/40">
                        {doc.type}
                      </span>
                    </button>
                  ))}

                  {/* Add Document Button */}
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left group">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      Add document to matter
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      
    </div>
  )
}
