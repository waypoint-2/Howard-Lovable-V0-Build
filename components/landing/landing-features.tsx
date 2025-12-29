import { FileText, BookOpen, MessageSquare, Shield } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Side-by-Side View",
    description: "Original legal text and plain-language explanation displayed together. Never lose context.",
  },
  {
    icon: BookOpen,
    title: "Smart Definitions",
    description: "Legal jargon automatically identified and explained in clear, everyday language.",
  },
  {
    icon: MessageSquare,
    title: "Q&A for Each Clause",
    description: "Common questions about each section answered before you even think to ask.",
  },
  {
    icon: Shield,
    title: "Risk Highlights",
    description: "Potentially problematic clauses flagged with clear explanations of what they mean for you.",
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 px-6 bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-serif text-3xl md:text-4xl mb-4 text-balance text-foreground/95">
            Reading legal documents shouldn't require a law degree
          </h2>
          <p className="text-muted-foreground/70 max-w-2xl mx-auto">
            Our translator breaks down complex legal language into clear explanations anyone can understand.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children">
          {features.map((feature) => (
            <div key={feature.title} className="group transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-background border border-border/50 flex items-center justify-center mb-4 group-hover:border-border group-hover:shadow-sm transition-all duration-300">
                <feature.icon className="w-5 h-5 text-foreground/70 group-hover:text-foreground/90 transition-colors duration-300" />
              </div>
              <h3 className="font-medium mb-2 text-foreground/90">{feature.title}</h3>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
