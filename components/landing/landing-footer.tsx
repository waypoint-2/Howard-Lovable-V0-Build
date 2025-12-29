import Link from "next/link"

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Demo", href: "#demo" },
    { label: "Pricing", href: "#pricing" },
    { label: "API", href: "#api" },
  ],
  Resources: [
    { label: "Documentation", href: "#docs" },
    { label: "Blog", href: "#blog" },
    { label: "Legal Glossary", href: "#glossary" },
    { label: "FAQ", href: "#faq" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "Privacy", href: "#privacy" },
    { label: "Terms", href: "#terms" },
  ],
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/landing" className="flex items-center gap-2 mb-4">
              <span className="font-serif text-xl tracking-tight text-foreground">Howard</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Making legal documents understandable for everyone.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2025 Howard. All rights reserved.</p>
          <p className="text-sm text-muted-foreground">Not a substitute for legal advice.</p>
        </div>
      </div>
    </footer>
  )
}
