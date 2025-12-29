"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ArrowRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500 ease-out",
        scrolled
          ? "bg-sidebar/90 backdrop-blur-md border-b border-border/50 shadow-sm"
          : "bg-sidebar border-b border-border/30",
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-3 group">
            <span className="font-serif tracking-tight text-foreground group-hover:text-foreground/80 transition-colors text-3xl">
              Howard
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Product Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("product")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground/70 hover:text-foreground/90 transition-colors duration-200 rounded-lg hover:bg-accent/40">
                Product
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    activeDropdown === "product" && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "absolute top-full left-0 pt-2 transition-all duration-200 ease-out",
                  activeDropdown === "product"
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none",
                )}
              >
                <div className="w-72 bg-card border border-border/50 rounded-xl shadow-xl p-2">
                  <DropdownItem
                    title="Document Translator"
                    description="Convert legal jargon to plain language"
                    href="/"
                  />
                  <DropdownItem title="Clause Library" description="Browse common legal clauses explained" href="#" />
                  <DropdownItem title="API Access" description="Integrate translations into your workflow" href="#" />
                </div>
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown("solutions")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground/70 hover:text-foreground/90 transition-colors duration-200 rounded-lg hover:bg-accent/40">
                Solutions
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    activeDropdown === "solutions" && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "absolute top-full left-0 pt-2 transition-all duration-200 ease-out",
                  activeDropdown === "solutions"
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none",
                )}
              >
                <div className="w-72 bg-card border border-border/50 rounded-xl shadow-xl p-2">
                  <DropdownItem
                    title="For Individuals"
                    description="Understand your contracts and agreements"
                    href="#"
                  />
                  <DropdownItem title="For Businesses" description="Streamline contract review workflows" href="#" />
                  <DropdownItem title="For Legal Teams" description="Client communication tools" href="#" />
                </div>
              </div>
            </div>

            <Link
              href="#pricing"
              className="px-4 py-2 text-sm text-muted-foreground/70 hover:text-foreground/90 transition-colors duration-200 rounded-lg hover:bg-accent/40"
            >
              Pricing
            </Link>

            <Link
              href="#docs"
              className="px-4 py-2 text-sm text-muted-foreground/70 hover:text-foreground/90 transition-colors duration-200 rounded-lg hover:bg-accent/40"
            >
              Documentation
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground/60 hover:text-foreground/80 hover:bg-accent/40 transition-colors duration-200"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              className="bg-foreground/90 text-background hover:bg-foreground gap-1.5 group px-4 rounded-full transition-all duration-200"
            >
              Start Free
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -mr-2 text-muted-foreground/60 hover:text-foreground/80 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden border-t border-border/40 bg-sidebar transition-all duration-300 ease-out overflow-hidden",
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
          <MobileNavItem title="Product" href="#" />
          <MobileNavItem title="Solutions" href="#" />
          <MobileNavItem title="Pricing" href="#pricing" />
          <MobileNavItem title="Documentation" href="#docs" />
          <div className="pt-4 border-t border-border/40 mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-center bg-transparent border-border/50">
              Sign in
            </Button>
            <Button className="w-full justify-center bg-foreground/90 text-background hover:bg-foreground rounded-full">
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function DropdownItem({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-0.5 p-3 rounded-lg hover:bg-accent/50 transition-all duration-150 group"
    >
      <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground/60">{description}</span>
    </Link>
  )
}

function MobileNavItem({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2.5 text-sm text-muted-foreground/70 hover:text-foreground/90 hover:bg-accent/40 rounded-lg transition-colors duration-150"
    >
      {title}
    </Link>
  )
}
