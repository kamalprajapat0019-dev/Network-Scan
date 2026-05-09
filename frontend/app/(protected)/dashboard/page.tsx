"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Building2,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Network,
} from "lucide-react"
import type { DashboardStats } from "@/lib/types"
import { DashboardCharts } from "@/components/dashboard-charts"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard")
        const data = await res.json()
        
        if (data.success) {
          const fetchedStats = data.data
          
          setStats(fetchedStats)
        } else {
          setError(data.error || "Failed to fetch dashboard data")
        }
      } catch {
        setError("Failed to fetch dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="bg-pink-50/70 border-none shadow-sm flex flex-col justify-center rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Network className="h-5 w-5 text-pink-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-pink-950">{stats.totalScans}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-pink-900/70">Total Scans</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/70 border-none shadow-sm flex flex-col justify-center rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-amber-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-amber-950">{stats.pendingScans}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-amber-900/70">Pending Scans</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/70 border-none shadow-sm flex flex-col justify-center rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-emerald-950">{stats.verifiedScans}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-emerald-900/70">Verified Scans</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-amber-400 border-none shadow-sm text-white flex flex-col justify-center rounded-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <CardHeader className="pb-1 relative z-10">
            <CardTitle className="text-lg font-medium text-white/90">Centers Scanned</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{stats.scansByCenter} Unique Centers</div>
            <p className="text-sm text-white/80">{stats.averageSystems} Avg Systems/Center</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts
        stats={stats}
      />

      {/* Recent Network Scans List */}
      <Card className="border-none shadow-sm rounded-xl">
        <CardHeader className="bg-white pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900">Recent Network Scans</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" asChild>
              <Link href="/network-scans">View All →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white rounded-b-xl">
          <div className="divide-y divide-slate-100">
            {stats.recentScans.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No scans recorded yet</div>
            ) : (
              stats.recentScans.map((scan) => (
                <div key={scan._id?.toString()} className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-600 shrink-0">
                      {scan.auditorName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{scan.centerName} <span className="text-slate-400 text-sm font-normal ml-2">({scan.centerCode})</span></div>
                      <div className="text-sm text-slate-500 mt-0.5">Auditor: {scan.auditorName} • {scan.city}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-10">
                    <div className="text-right hidden md:block">
                      <div className="font-semibold text-slate-700">{scan.systemsDetected || scan.systemCount} Systems</div>
                      <div className="text-xs text-slate-400 mt-0.5">{scan.scanDetails?.deviceBreakdown?.pcs || 0} PCs, {scan.scanDetails?.deviceBreakdown?.printers || 0} Printers</div>
                    </div>
                    <div className="flex items-center gap-2.5 min-w-[100px]">
                       <span className={`w-2.5 h-2.5 rounded-full ${scan.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                       <span className={`text-sm font-medium ${scan.status === 'verified' ? 'text-emerald-700' : 'text-amber-600'}`}>
                         {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                       </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
