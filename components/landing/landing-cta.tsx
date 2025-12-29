import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function LandingCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-6 text-balance">
          Stop signing documents you don't understand
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Upload any legal document and get instant plain-language explanations. Free to use, no account required.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 gap-2" asChild>
            <Link href="/">
              Try the translator
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            View documentation
          </Button>
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Document types we support</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Employment Contracts", "NDAs", "Terms of Service", "Lease Agreements", "Software Licenses"].map(
              (type) => (
                <span key={type} className="px-3 py-1 text-sm bg-secondary rounded-full text-secondary-foreground">
                  {type}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
