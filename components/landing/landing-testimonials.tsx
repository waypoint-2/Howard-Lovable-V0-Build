const testimonials = [
  {
    quote:
      "I finally understood what I was agreeing to when signing my employment contract. The plain-language explanations made all the difference.",
    author: "Sarah Chen",
    role: "Product Manager",
  },
  {
    quote:
      "As a small business owner, I used to dread reading vendor contracts. Now I can review them in minutes instead of hours.",
    author: "Michael Torres",
    role: "Founder, Horizon Studios",
  },
  {
    quote:
      "This tool has become essential for our legal literacy workshops. It helps people understand their rights without needing a lawyer.",
    author: "Dr. Emily Okafor",
    role: "Legal Aid Director",
  },
]

export function LandingTestimonials() {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">Trusted by thousands</h2>
          <p className="text-muted-foreground">People who finally understand their legal documents.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="bg-background border border-border rounded-lg p-6">
              <blockquote className="text-sm leading-relaxed mb-6">"{testimonial.quote}"</blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
