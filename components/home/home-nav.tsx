"use client"

import Link from "next/link"
import { Bell, Settings, HelpCircle, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface User {
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

export function HomeNav() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user as User | null)
      } catch (error) {
        console.error("[v0] Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("[v0] Sign out error:", error)
    }
  }

  const userInitials =
    user?.email
      ?.split("@")[0]
      .substring(0, 2)
      .toUpperCase() || "U"

  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 animate-fade-in">
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2.5 group">
        <span className="font-serif text-xl tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">
          Howard
        </span>
      </Link>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all relative">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--risk-high)]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
          <Settings className="w-[18px] h-[18px]" />
        </button>
        <div className="w-px h-6 bg-border/60 mx-2" />

        {!isLoading && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--info)] flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {userInitials}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground hidden md:block">
                {user?.email?.split("@")[0] || "User"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
