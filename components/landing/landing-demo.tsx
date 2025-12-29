"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const demoContent = {
  original: `2.1 Grant of License. Subject to the terms and conditions of this Agreement, Licensor hereby grants to Licensee a non-exclusive, non-transferable, limited license to use the Software solely for Licensee's internal business purposes.`,
  translation: `This section gives you permission to use the software, but with important restrictions:

• Non-exclusive: Others can get the same permission
• Non-transferable: You can't give this permission to anyone else  
• Limited: Only for your own business, not for resale or distribution

Think of it like renting an apartment—you can live there, but you can't sublet or sell it.`,
}

export function LandingDemo() {
  const [activePane, setActivePane] = useState<"original" | "translation">("original")

  return (
    <section id="demo" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">See it in action</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dense legal clauses transformed into clear, actionable explanations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Mobile toggle */}
          <div className="flex md:hidden mb-4 p-1 bg-secondary rounded-lg">
            <button
              onClick={() => setActivePane("original")}
              className={cn(
                "flex-1 py-2 px-4 text-sm rounded-md transition-colors",
                activePane === "original" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Original
            </button>
            <button
              onClick={() => setActivePane("translation")}
              className={cn(
                "flex-1 py-2 px-4 text-sm rounded-md transition-colors",
                activePane === "translation" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Plain Language
            </button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden shadow-lg">
            <div className="grid md:grid-cols-2">
              {/* Original pane */}
              <div
                className={cn(
                  "border-b md:border-b-0 md:border-r border-border",
                  activePane !== "original" && "hidden md:block",
                )}
              >
                <div className="px-4 py-3 border-b border-border bg-secondary/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Original Legal Text
                  </span>
                </div>
                <div className="p-6 bg-[var(--paper)] min-h-[280px]">
                  <p className="font-serif text-sm leading-relaxed text-[var(--paper-foreground)]">
                    {demoContent.original}
                  </p>
                </div>
              </div>

              {/* Translation pane */}
              <div className={cn(activePane !== "translation" && "hidden md:block")}>
                <div className="px-4 py-3 border-b border-border bg-secondary/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Plain Language
                  </span>
                </div>
                <div className="p-6 bg-background min-h-[280px]">
                  <p className="text-sm leading-relaxed whitespace-pre-line">{demoContent.translation}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            This is a sample clause from a software license agreement.
          </p>
        </div>
      </div>
    </section>
  )
}
