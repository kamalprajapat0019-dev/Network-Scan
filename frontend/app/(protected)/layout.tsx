"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Users,
  QrCode,
  Menu,
  LogOut,
  User,
  Shield,
  Network,
} from "lucide-react"
import { cn } from "@/lib/utils"

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/centers", label: "Exam Centers", icon: Building2 },
  { href: "/audits", label: "Audit Records", icon: ClipboardCheck },
  { href: "/network-scans", label: "Network Scans", icon: Network },
  { href: "/users", label: "User Management", icon: Users },
]

const auditorNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scanner", label: "QR Scanner", icon: QrCode },
  { href: "/audits", label: "My Audits", icon: ClipboardCheck },
]

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navItems = user.role === "admin" ? adminNavItems : auditorNavItems

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/dashboard" className="flex gap-2 items-center text-primary">
            <img src="/logo.png" alt="Audit Portal Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold tracking-tight text-slate-900 ml-1">Audit Portal</span>
          </Link>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group relative",
                  isActive
                    ? "text-primary"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b h-16 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="md:hidden font-bold flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain" />
              Audit Portal
            </div>
          </div>

          {/* Right side user profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 relative rounded-full">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-slate-50 px-2 rounded-full md:rounded-lg">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold leading-none text-slate-700">{user.name}</span>
                    <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{user.role}</span>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 md:hidden">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
