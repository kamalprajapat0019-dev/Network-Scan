import { NextResponse } from "next/server"
import { query as mysqlQuery, initializeDatabase } from "@/lib/mysql"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    await requireAuth()
    
    await initializeDatabase()
    const tableName = process.env.MYSQL_TABLE || 'Audit_Scanner'

    // 1. Get total scans
    const totalResult = await mysqlQuery(`SELECT COUNT(*) as count FROM \`${tableName}\``) as any[]
    const totalScans = totalResult?.[0]?.count || 0

    // 2. Get verified vs pending scans
    const verifiedResult = await mysqlQuery(`SELECT COUNT(*) as count FROM \`${tableName}\` WHERE status = 'verified'`) as any[]
    const verifiedScans = verifiedResult?.[0]?.count || 0

    const pendingResult = await mysqlQuery(`SELECT COUNT(*) as count FROM \`${tableName}\` WHERE status = 'pending'`) as any[]
    const pendingScans = pendingResult?.[0]?.count || 0

    // 3. Get average systems detected
    const avgResult = await mysqlQuery(`SELECT AVG(total_systems) as avgSystems FROM \`${tableName}\``) as any[]
    const averageSystems = Math.round(avgResult?.[0]?.avgSystems || 0)

    // 4. Get unique centers scanned
    const uniqueResult = await mysqlQuery(`SELECT COUNT(DISTINCT center_code) as count FROM \`${tableName}\``) as any[]
    const scansByCenter = uniqueResult?.[0]?.count || 0

    // 5. Get recent scans (limit 5)
    const recentRows = await mysqlQuery(`SELECT * FROM \`${tableName}\` ORDER BY scanned_at DESC LIMIT 5`) as any[]
    const recentScans = (recentRows || []).map(scan => {
      let details = {}
      try {
        details = typeof scan.scanDetails === 'string' ? JSON.parse(scan.scanDetails) : (scan.scanDetails || {})
      } catch (err) {
        console.warn("⚠️ Failed to parse scanDetails for scanId:", scan.scanId)
      }
      
      return {
        _id: scan.id?.toString() || scan.scanId,
        scanId: scan.scanId,
        auditorName: scan.auditor_name,
        centerCode: scan.center_code?.toString(),
        centerName: scan.center_name,
        city: scan.city,
        systemCount: scan.total_systems,
        status: scan.status || "pending",
        createdAt: scan.scanned_at,
        scannedAt: scan.scanned_at,
        scanDetails: details
      }
    })

    // 6. Get monthly scan counts for the past 6 months
    const monthlyRows = await mysqlQuery(`
      SELECT YEAR(scanned_at) as year, MONTH(scanned_at) as month, COUNT(*) as count 
      FROM \`${tableName}\` 
      WHERE scanned_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) 
      GROUP BY YEAR(scanned_at), MONTH(scanned_at) 
      ORDER BY year ASC, month ASC
    `) as any[]

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyScans = (monthlyRows || []).map((m) => ({
      month: `${monthNames[m.month - 1]} ${m.year}`,
      count: m.count
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalScans,
        verifiedScans,
        pendingScans,
        averageSystems,
        recentScans,
        scansByCenter,
        monthlyScans,
      },
    })
  } catch (error) {
    console.error("❌ Dashboard MySQL error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
