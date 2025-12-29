"use client"

import { useEffect, useState } from "react"

interface Word {
  id: number
  original: string
  simplified: string
  targetX: number
  targetY: number
  rotation: number
  scale: number
  delay: number
}

const legalPhrases = [
  { original: "WHEREAS", simplified: "Because" },
  { original: "the Party of the First Part", simplified: "you" },
  { original: "hereby", simplified: "" },
  { original: "covenants", simplified: "agree" },
  { original: "and agrees", simplified: "" },
  { original: "to indemnify", simplified: "to protect" },
  { original: "and hold harmless", simplified: "from blame" },
  { original: "the Party of the Second Part", simplified: "we" },
  { original: "from any and all", simplified: "from" },
  { original: "claims,", simplified: "claims" },
  { original: "liabilities,", simplified: "" },
  { original: "damages,", simplified: "and damages" },
  { original: "and expenses", simplified: "" },
  { original: "arising out of", simplified: "caused by" },
  { original: "or relating to", simplified: "" },
  { original: "the subject matter hereof", simplified: "this agreement" },
]

const simplifiedSentence = "Because you agree to protect us from claims and damages caused by this agreement."

export function LegalTransformAnimation() {
  const [phase, setPhase] = useState<"legal" | "scramble" | "simplified">("legal")
  const [words, setWords] = useState<Word[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Initialize words with positions
    const initialWords: Word[] = legalPhrases.map((phrase, i) => ({
      id: i,
      original: phrase.original,
      simplified: phrase.simplified,
      targetX: (Math.random() - 0.5) * 400,
      targetY: (Math.random() - 0.5) * 300,
      rotation: (Math.random() - 0.5) * 60,
      scale: 0.6 + Math.random() * 0.6,
      delay: i * 0.05,
    }))
    setWords(initialWords)
    setMounted(true)

    // Animation cycle
    const runCycle = () => {
      setPhase("legal")

      setTimeout(() => {
        setPhase("scramble")
      }, 2500)

      setTimeout(() => {
        setPhase("simplified")
      }, 4500)
    }

    // Start first cycle after a short delay
    const startTimeout = setTimeout(runCycle, 500)

    const interval = setInterval(runCycle, 8000)
    return () => {
      clearInterval(interval)
      clearTimeout(startTimeout)
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Animation container - positioned behind content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-4xl h-80">
          {/* Legal text phase - document style */}
          <div
            className={`
              absolute inset-0 flex flex-col items-center justify-center px-12
              transition-all duration-1000 ease-out
              ${phase === "legal" ? "opacity-100" : "opacity-0 scale-95"}
            `}
          >
            {/* Fake document container */}
            <div className="relative bg-card/40 border border-border/30 rounded-lg p-8 max-w-2xl shadow-sm">
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-center justify-center leading-relaxed">
                {words.map((word) => (
                  <span
                    key={`legal-${word.id}`}
                    className="font-serif text-sm md:text-base text-muted-foreground/50"
                    style={{
                      animationDelay: `${word.delay}s`,
                    }}
                  >
                    {word.original}
                  </span>
                ))}
              </div>
              {/* Document decoration */}
              <div className="absolute top-3 left-3 w-8 h-0.5 bg-muted-foreground/20 rounded" />
              <div className="absolute top-3 right-3 w-4 h-0.5 bg-muted-foreground/20 rounded" />
            </div>
          </div>

          {/* Scramble phase - words exploding outward */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              transition-opacity duration-300
              ${phase === "scramble" ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
          >
            {words.map((word) => (
              <span
                key={`scramble-${word.id}`}
                className="absolute font-serif text-xs md:text-sm text-muted-foreground/60 whitespace-nowrap"
                style={{
                  transform:
                    phase === "scramble"
                      ? `translate(${word.targetX}px, ${word.targetY}px) rotate(${word.rotation}deg) scale(${word.scale})`
                      : "translate(0, 0) rotate(0deg) scale(1)",
                  transition: `all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                  transitionDelay: `${word.delay}s`,
                }}
              >
                {word.original}
              </span>
            ))}

            {/* Animated dots during scramble */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`dot-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-[var(--brand)]/30"
                style={{
                  transform:
                    phase === "scramble"
                      ? `translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 150}px)`
                      : "translate(0, 0)",
                  transition: "all 1s ease-out",
                  transitionDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          {/* Simplified text phase */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center px-8
              transition-all duration-1000 ease-out
              ${phase === "simplified" ? "opacity-100 scale-100" : "opacity-0 scale-105"}
            `}
          >
            <div className="relative bg-[var(--risk-low)]/10 border border-[var(--risk-low)]/20 rounded-lg p-8 max-w-xl">
              <p className="font-sans text-base md:text-lg text-muted-foreground/70 text-center leading-relaxed">
                {simplifiedSentence}
              </p>
              {/* Checkmark decoration */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--risk-low)]/20 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-[var(--risk-low)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soft radial gradient overlay for blending */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, var(--background) 70%)",
        }}
      />

      {/* Phase indicators at bottom */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8">
        <div
          className={`
            flex items-center gap-2 transition-all duration-500
            ${phase === "legal" ? "opacity-80 scale-105" : "opacity-30"}
          `}
        >
          <div className="w-2 h-2 rounded-full bg-[var(--risk-high)]" />
          <span className="text-xs font-medium text-muted-foreground">Complex</span>
        </div>
        <div
          className={`
            flex items-center gap-2 transition-all duration-500
            ${phase === "scramble" ? "opacity-80 scale-105" : "opacity-30"}
          `}
        >
          <div
            className={`w-2 h-2 rounded-full bg-[var(--risk-medium)] ${phase === "scramble" ? "animate-pulse" : ""}`}
          />
          <span className="text-xs font-medium text-muted-foreground">Analyzing</span>
        </div>
        <div
          className={`
            flex items-center gap-2 transition-all duration-500
            ${phase === "simplified" ? "opacity-80 scale-105" : "opacity-30"}
          `}
        >
          <div className="w-2 h-2 rounded-full bg-[var(--risk-low)]" />
          <span className="text-xs font-medium text-muted-foreground">Clear</span>
        </div>
      </div>
    </div>
  )
}
