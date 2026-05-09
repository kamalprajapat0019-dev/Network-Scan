"use client"

import { useEffect, useState } from "react"
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
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
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

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const markAsRead = async (id: string, link?: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        if (link) {
          router.push(link)
        }
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      })
      const data = await res.json()
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return `${diffDays}d ago`
    } catch {
      return ""
    }
  }

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
      <aside className="hidden md:flex w-64 flex-col bg-white border-r sticky top-0 h-screen overflow-y-auto">
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
            {/* Notification Bell Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 relative rounded-full">
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                  <Bell className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 md:w-[26rem] p-0 overflow-hidden shadow-xl rounded-xl border border-slate-100">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/70">
                  <span className="font-semibold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAllAsRead()
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[22rem] overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <Bell className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">No notifications yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[15rem]">
                        We'll notify you when system scans, audits, or user events occur.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const TypeIcon =
                        notif.type === "success"
                          ? CheckCircle2
                          : notif.type === "warning" || notif.type === "error"
                          ? AlertTriangle
                          : Info
                      const iconColor =
                        notif.type === "success"
                          ? "text-emerald-600 bg-emerald-50 border-emerald-100/50"
                          : notif.type === "warning" || notif.type === "error"
                          ? "text-rose-600 bg-rose-50 border-rose-100/50"
                          : "text-blue-600 bg-blue-50 border-blue-100/50"

                      return (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id, notif.link)}
                          className={cn(
                            "flex gap-3.5 p-4 cursor-pointer transition-all duration-200 text-left relative",
                            notif.isRead
                              ? "bg-white hover:bg-slate-50/50"
                              : "bg-slate-50/40 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs shadow-sm", iconColor)}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-xs font-semibold text-slate-800 leading-tight", !notif.isRead && "text-slate-900 font-bold")}>
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>
                            <p className={cn("text-xs text-slate-500 mt-1.5 leading-relaxed", !notif.isRead && "text-slate-600 font-medium")}>
                              {notif.message}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="flex items-center shrink-0">
                              <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
                <DropdownMenuItem className="flex items-center gap-2" asChild>
                  <Link href="/profile" className="flex items-center gap-2 w-full cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
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
