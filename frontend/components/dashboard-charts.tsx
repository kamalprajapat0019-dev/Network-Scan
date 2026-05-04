"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { DashboardStats } from "@/lib/types"

interface DashboardChartsProps {
  stats: DashboardStats
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const { monthlyScans, verifiedScans, pendingScans, totalScans } = stats

  const verificationRate = totalScans > 0 ? Math.round((verifiedScans / totalScans) * 100) : 0

  const pieData = [
    { name: "Verified", value: verifiedScans, color: "#10b981" }, // emerald-500
    { name: "Pending", value: pendingScans, color: "#fbbf24" }, // amber-400
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Scans Trend */}
      <Card className="lg:col-span-2 border-none shadow-sm rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Network Scans Trend</CardTitle>
            <CardDescription className="mt-1">Monthly scan activities</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-slate-600">Scans</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyScans.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              No scan data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyScans} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#0f172a", fontWeight: 500 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#024BA0"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#024BA0", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Total Scans"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Verification Rate (Donut Chart) */}
      <Card className="lg:col-span-1 border-none shadow-sm rounded-xl flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-0">
          <CardTitle className="text-lg font-bold text-slate-900">Verification Rate</CardTitle>
          <span className="text-xs font-medium text-primary cursor-pointer hover:underline">Show: All time →</span>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center pt-6 pb-2">
          {totalScans === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-slate-400">
              No data
            </div>
          ) : (
            <div className="relative w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    itemStyle={{ fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-emerald-500">{verificationRate}%</span>
              </div>
            </div>
          )}
          
          <div className="w-full mt-4 space-y-3 px-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
