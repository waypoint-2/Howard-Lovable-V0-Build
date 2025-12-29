import { LandingHero } from "@/components/landing/landing-hero"
import { LandingTransform } from "@/components/landing/landing-transform"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingDemo } from "@/components/landing/landing-demo"
import { LandingTestimonials } from "@/components/landing/landing-testimonials"
import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingNav } from "@/components/landing/landing-nav"

export default function LandingPage() {
  return (
    <div className="bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingTransform />
        <LandingFeatures />
        <LandingDemo />
        <LandingTestimonials />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
