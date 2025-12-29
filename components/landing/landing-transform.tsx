"use client"

import { useEffect, useState, useMemo } from "react"

export function LandingTransform() {
  const [phase, setPhase] = useState<"legal" | "scramble" | "simplified">("legal")

  const legalWords = useMemo(
    () => [
      { text: "Notwithstanding", size: "text-lg" },
      { text: "aforementioned", size: "text-base" },
      { text: "provisions", size: "text-sm" },
      { text: "hereinafter", size: "text-lg" },
      { text: "indemnify", size: "text-base" },
      { text: "perpetuity", size: "text-sm" },
      { text: "whereas", size: "text-base" },
      { text: "thereof", size: "text-sm" },
      { text: "pursuant", size: "text-lg" },
      { text: "jurisdiction", size: "text-base" },
      { text: "liability", size: "text-sm" },
      { text: "covenant", size: "text-base" },
      { text: "warranties", size: "text-lg" },
      { text: "hereunder", size: "text-sm" },
      { text: "stipulations", size: "text-base" },
      { text: "forthwith", size: "text-sm" },
    ],
    [],
  )

  const simplifiedResult = [
    { label: "What you agree to", text: "Standard service terms apply" },
    { label: "Your data", text: "Protected and never sold" },
    { label: "Cancellation", text: "Cancel anytime, no fees" },
  ]

  useEffect(() => {
    const cycle = () => {
      setPhase("legal")
      setTimeout(() => setPhase("scramble"), 3000)
      setTimeout(() => setPhase("simplified"), 5000)
    }

    cycle()
    const interval = setInterval(cycle, 8000)
    return () => clearInterval(interval)
  }, [])

  const getRandomPosition = (index: number) => {
    const seed = index * 137.5
    return {
      x: Math.sin(seed) * 200 + Math.cos(seed * 0.5) * 100,
      y: Math.cos(seed) * 120 + Math.sin(seed * 0.7) * 60,
      rotate: Math.sin(seed * 2) * 60,
      scale: 0.5 + Math.random() * 0.5,
    }
  }

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm font-medium text-[var(--brand)] tracking-wide uppercase">How it works</p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground/95">From legal jargon to clarity</h2>
          <p className="text-muted-foreground/70 max-w-2xl mx-auto">
            Watch complex legal language transform into simple, actionable insights in real-time.
          </p>
        </div>

        {/* Animation container - clearly contained card */}
        <div className="relative h-[450px] md:h-[500px] rounded-2xl border border-border/50 bg-secondary/20 overflow-hidden shadow-lg">
          {/* Phase 1: Legal document */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-700"
            style={{
              opacity: phase === "legal" ? 1 : 0,
              transform: phase === "legal" ? "scale(1)" : "scale(0.95)",
              pointerEvents: phase === "legal" ? "auto" : "none",
            }}
          >
            <div className="relative w-full max-w-lg mx-8 p-8 rounded-xl bg-[var(--paper)] border border-border/60 shadow-lg">
              {/* Document header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
                <div className="w-8 h-8 rounded bg-muted/60 flex items-center justify-center">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80">Legal Agreement</p>
                  <p className="text-xs text-muted-foreground">12 pages of dense legalese</p>
                </div>
              </div>

              {/* Legal words */}
              <div className="flex flex-wrap gap-2 justify-center">
                {legalWords.map((word, i) => (
                  <span
                    key={i}
                    className={`font-serif ${word.size} text-foreground/60 px-2 py-1 rounded bg-muted/30`}
                    style={{
                      opacity: phase === "legal" ? 1 : 0,
                      transition: "opacity 300ms ease",
                      transitionDelay: `${i * 50}ms`,
                    }}
                  >
                    {word.text}
                  </span>
                ))}
              </div>

              {/* Complexity indicator */}
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reading level: Expert</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[var(--risk-high)]/60" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2: Scramble animation */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: phase === "scramble" ? 1 : 0,
              pointerEvents: phase === "scramble" ? "auto" : "none",
            }}
          >
            {/* Flying words */}
            {legalWords.map((word, i) => {
              const pos = getRandomPosition(i)
              return (
                <span
                  key={i}
                  className="absolute top-1/2 left-1/2 font-serif text-foreground/20 whitespace-nowrap text-sm"
                  style={{
                    transform:
                      phase === "scramble"
                        ? `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.rotate}deg) scale(${pos.scale})`
                        : "translate(-50%, -50%) rotate(0deg) scale(1)",
                    transition: "transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transitionDelay: `${i * 40}ms`,
                  }}
                >
                  {word.text}
                </span>
              )
            })}

            {/* Processing indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--brand-light)] border border-[var(--brand)]/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--brand)] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Analyzing document...</p>
            </div>
          </div>

          {/* Phase 3: Simplified result */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-700"
            style={{
              opacity: phase === "simplified" ? 1 : 0,
              transform: phase === "simplified" ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
              pointerEvents: phase === "simplified" ? "auto" : "none",
            }}
          >
            <div className="w-full max-w-lg mx-8 p-8 rounded-xl bg-card border border-[var(--success-border)] shadow-lg">
              {/* Success header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
                <div className="w-8 h-8 rounded-full bg-[var(--success-bg)] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80">Plain-Language Summary</p>
                  <p className="text-xs text-[var(--success)]">Easy to understand</p>
                </div>
              </div>

              {/* Simplified results */}
              <div className="space-y-4">
                {simplifiedResult.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                    style={{
                      opacity: phase === "simplified" ? 1 : 0,
                      transform: phase === "simplified" ? "translateY(0)" : "translateY(10px)",
                      transition: "opacity 500ms ease, transform 500ms ease",
                      transitionDelay: `${i * 100 + 200}ms`,
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-[var(--brand-light)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-[var(--brand)]">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm text-foreground/80 mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reading level */}
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reading level: Everyone</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                  {[2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-muted/40" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Phase indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/40">
            {[
              { key: "legal", label: "Complex", color: "var(--risk-high)" },
              { key: "scramble", label: "Analyzing", color: "var(--brand)" },
              { key: "simplified", label: "Clear", color: "var(--success)" },
            ].map((item, i) => (
              <button
                key={item.key}
                onClick={() => setPhase(item.key as "legal" | "scramble" | "simplified")}
                className="flex items-center gap-2 transition-all duration-300 hover:opacity-80"
                style={{ opacity: phase === item.key ? 1 : 0.5 }}
              >
                {i > 0 && <div className="w-6 h-px bg-border/60 -ml-2 mr-0" />}
                <div
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: phase === item.key ? item.color : "var(--muted)",
                    transform: phase === item.key ? "scale(1.3)" : "scale(1)",
                    boxShadow: phase === item.key ? `0 0 8px ${item.color}40` : "none",
                  }}
                />
                <span className="text-xs font-medium text-foreground/70">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
